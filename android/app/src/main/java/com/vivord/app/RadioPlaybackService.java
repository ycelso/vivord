package com.vivord.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.media.app.NotificationCompat.MediaStyle;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.exoplayer.DefaultLoadControl;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.session.DefaultMediaNotificationProvider;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;

import java.util.HashMap;
import java.util.Map;

/**
 * Servicio de radio (Media3 MediaSessionService).
 * Independiente del WebView: segundo plano, pantalla bloqueada, Doze.
 */
public class RadioPlaybackService extends MediaSessionService
        implements AudioManager.OnAudioFocusChangeListener {

    public static final String ACTION_PLAY = "com.vivord.app.radio.PLAY";
    public static final String ACTION_PAUSE = "com.vivord.app.radio.PAUSE";
    public static final String ACTION_RESUME = "com.vivord.app.radio.RESUME";
    public static final String ACTION_STOP = "com.vivord.app.radio.STOP";

    public static final String EXTRA_URL = "url";
    public static final String EXTRA_REFERER = "referer";
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_ARTIST = "artist";

    private static final String CHANNEL_ID = "vivord_radio_playback";
    private static final int NOTIFICATION_ID = 2001;

    private static RadioPlaybackService instance;
    private static StateListener stateListener;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private MediaSession mediaSession;
    private ExoPlayer player;
    private AudioManager audioManager;
    private AudioFocusRequest focusRequest;
    private PowerManager.WakeLock playbackWakeLock;

    private boolean sessionRegistered = false;
    private boolean hasAudioFocus = false;
    private boolean suppressTransportCallback = false;
    private boolean pausedByExternalApp = false;
    private boolean pausedByTransientFocus = false;
    private boolean userPaused = false;
    private float userVolume = 1f;

    // Estado del player cacheado para consultarlo de forma segura desde otros
    // hilos (p. ej. el puente de Capacitor). ExoPlayer solo puede leerse en su
    // hilo de aplicacion, asi que estos valores se actualizan desde el listener.
    private volatile int lastPlaybackState = Player.STATE_IDLE;
    private volatile boolean lastPlayWhenReady = false;

    private String lastUrl = "";
    private String lastReferer = "";
    private String currentTitle = "VivoRD Radio";
    private String currentArtist = "En vivo";

    private static final long WATCHDOG_MS = 12_000L;
    private static final long STALL_MS = 20_000L;
    private static final long FOREGROUND_FOCUS_GRACE_MS = 2_500L;
    private long lastProgressMs = 0;
    private long foregroundGraceUntilMs = 0;

    public interface StateListener {
        void onStarted();

        void onPaused();

        void onExternalPause();

        void onError(String message);
    }

    private final Runnable watchdogRunnable = new Runnable() {
        @Override
        public void run() {
            if (!shouldKeepAlive()) {
                mainHandler.postDelayed(this, WATCHDOG_MS);
                return;
            }
            long now = System.currentTimeMillis();
            if (player != null && player.getPlayWhenReady()) {
                int state = player.getPlaybackState();
                boolean stalled = state == Player.STATE_BUFFERING
                        && lastProgressMs > 0
                        && now - lastProgressMs > STALL_MS;
                boolean idle = state == Player.STATE_IDLE || state == Player.STATE_ENDED;
                if (stalled || idle) {
                    reconnectStream("watchdog");
                }
            }
            mainHandler.postDelayed(this, WATCHDOG_MS);
        }
    };

    public static RadioPlaybackService getInstance() {
        return instance;
    }

    public static void setStateListener(StateListener listener) {
        stateListener = listener;
        if (listener != null && instance != null && instance.isPlaying()) {
            listener.onStarted();
        }
    }

    @Override
    public void onCreate() {
        ensureNotificationChannel();
        setMediaNotificationProvider(
                new DefaultMediaNotificationProvider.Builder(this)
                        .setChannelId(CHANNEL_ID)
                        .build()
        );
        super.onCreate();
        instance = this;
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        ensurePlayerAndSession();
        mainHandler.post(watchdogRunnable);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        super.onStartCommand(intent, flags, startId);
        ensurePlayerAndSession();
        String action = intent != null ? intent.getAction() : null;
        if (!ACTION_STOP.equals(action)) {
            enterForegroundWithNotification();
        }
        if (action != null) {
            handleAction(intent);
        }
        return START_STICKY;
    }

    @Override
    public void onUpdateNotification(
            @NonNull MediaSession session,
            boolean startInForegroundRequired
    ) {
        super.onUpdateNotification(session, startInForegroundRequired);
    }

    private void handleAction(Intent intent) {
        String action = intent.getAction();
        if (ACTION_PLAY.equals(action)) {
            play(
                    intent.getStringExtra(EXTRA_URL),
                    intent.getStringExtra(EXTRA_REFERER),
                    intent.getStringExtra(EXTRA_TITLE),
                    intent.getStringExtra(EXTRA_ARTIST)
            );
        } else if (ACTION_PAUSE.equals(action)) {
            pause();
        } else if (ACTION_RESUME.equals(action)) {
            resume();
        } else if (ACTION_STOP.equals(action)) {
            stopPlayback();
        }
    }

    @Nullable
    @Override
    public MediaSession onGetSession(@NonNull MediaSession.ControllerInfo controllerInfo) {
        return mediaSession;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // Usuario cerró la app desde recientes: detener radio, no relanzar servicio.
        stopPlayback();
        super.onTaskRemoved(rootIntent);
    }

    private void ensureNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                getString(R.string.radio_notification_channel),
                NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setDescription(getString(R.string.radio_notification_channel_desc));
        channel.setShowBadge(false);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm != null) {
            nm.createNotificationChannel(channel);
        }
    }

    private PendingIntent servicePendingIntent(String action, int requestCode) {
        Intent intent = new Intent(this, RadioPlaybackService.class);
        intent.setAction(action);
        return PendingIntent.getService(
                this,
                requestCode,
                intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );
    }

    private Notification buildPlaybackNotification() {
        boolean playing = isPlaying();

        PendingIntent openApp = PendingIntent.getActivity(
                this,
                0,
                new Intent(this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(currentTitle)
                .setContentText(currentArtist)
                .setSmallIcon(R.drawable.ic_radio_notification)
                .setContentIntent(openApp)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOnlyAlertOnce(true)
                .setOngoing(playing || shouldKeepAlive());

        if (playing) {
            builder.addAction(
                    android.R.drawable.ic_media_pause,
                    getString(R.string.radio_notification_pause),
                    servicePendingIntent(ACTION_PAUSE, 1)
            );
        } else {
            builder.addAction(
                    android.R.drawable.ic_media_play,
                    getString(R.string.radio_notification_play),
                    servicePendingIntent(ACTION_RESUME, 2)
            );
        }
        builder.addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                getString(R.string.radio_notification_stop),
                servicePendingIntent(ACTION_STOP, 3)
        );

        if (mediaSession != null) {
            MediaStyle style = new MediaStyle()
                    .setMediaSession(mediaSession.getSessionCompatToken())
                    .setShowActionsInCompactView(0, 1);
            builder.setStyle(style);
        }

        return builder.build();
    }

    private void enterForegroundWithNotification() {
        Notification notification = buildPlaybackNotification();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            );
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm != null) {
            nm.notify(NOTIFICATION_ID, notification);
        }
    }

    private void refreshNotification() {
        Notification notification = buildPlaybackNotification();
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm != null) {
            nm.notify(NOTIFICATION_ID, notification);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            );
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void acquirePlaybackWakeLock() {
        if (playbackWakeLock == null) {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            playbackWakeLock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "VivoRD:RadioPlayback"
            );
            playbackWakeLock.setReferenceCounted(false);
        }
        if (!playbackWakeLock.isHeld()) {
            playbackWakeLock.acquire(4 * 60 * 60 * 1000L);
        }
    }

    private void releasePlaybackWakeLock() {
        if (playbackWakeLock != null && playbackWakeLock.isHeld()) {
            playbackWakeLock.release();
        }
    }

    private void clearForegroundNotification() {
        releasePlaybackWakeLock();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm != null) {
            nm.cancel(NOTIFICATION_ID);
        }
    }

    private void ensurePlayerAndSession() {
        if (player != null) {
            return;
        }
        androidx.media3.common.AudioAttributes attrs =
                new androidx.media3.common.AudioAttributes.Builder()
                        .setUsage(C.USAGE_MEDIA)
                        .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
                        .build();

        DefaultLoadControl loadControl = new DefaultLoadControl.Builder()
                .setBufferDurationsMs(60_000, 120_000, 2_500, 5_000)
                .build();

        player = new ExoPlayer.Builder(this)
                .setWakeMode(C.WAKE_MODE_NETWORK)
                .setLoadControl(loadControl)
                .build();
        player.setAudioAttributes(attrs, false);

        PendingIntent openApp = PendingIntent.getActivity(
                this,
                0,
                new Intent(this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        mediaSession = new MediaSession.Builder(this, player)
                .setSessionActivity(openApp)
                .build();

        if (!sessionRegistered) {
            addSession(mediaSession);
            sessionRegistered = true;
        }

        player.addListener(new Player.Listener() {
            @Override
            public void onPlaybackStateChanged(int playbackState) {
                lastPlaybackState = playbackState;
                if (playbackState == Player.STATE_READY && player.getPlayWhenReady()) {
                    lastProgressMs = System.currentTimeMillis();
                }
            }

            @Override
            public void onIsPlayingChanged(boolean isPlaying) {
                if (isPlaying) {
                    lastProgressMs = System.currentTimeMillis();
                    acquirePlaybackWakeLock();
                } else if (userPaused || pausedByExternalApp || pausedByTransientFocus) {
                    releasePlaybackWakeLock();
                }
                refreshNotification();
            }

            @Override
            public void onPlayWhenReadyChanged(boolean playWhenReady, int reason) {
                lastPlayWhenReady = playWhenReady;
                handleTransportChange(playWhenReady, reason);
            }

            @Override
            public void onPlayerError(PlaybackException error) {
                if (pausedByExternalApp || pausedByTransientFocus || userPaused) {
                    return;
                }
                if (stateListener != null) {
                    stateListener.onError(
                            error.getMessage() != null ? error.getMessage() : "Stream no disponible"
                    );
                }
                mainHandler.postDelayed(() -> reconnectStream("error"), 2_000L);
            }
        });
    }

    private boolean shouldKeepAlive() {
        return player != null
                && player.getPlayWhenReady()
                && !userPaused
                && !pausedByExternalApp
                && !pausedByTransientFocus;
    }

    private void handleTransportChange(boolean playWhenReady, int reason) {
        if (suppressTransportCallback || player == null) {
            return;
        }
        if (reason != Player.PLAY_WHEN_READY_CHANGE_REASON_USER_REQUEST) {
            return;
        }
        if (playWhenReady) {
            userPaused = false;
            pausedByExternalApp = false;
            pausedByTransientFocus = false;
            requestAudioFocus();
            if (stateListener != null) {
                stateListener.onStarted();
            }
            return;
        }
        userPaused = true;
        pausedByExternalApp = false;
        pausedByTransientFocus = false;
        abandonAudioFocus();
        if (stateListener != null) {
            stateListener.onPaused();
        }
    }

    private boolean requestAudioFocus() {
        if (audioManager == null) {
            return false;
        }
        int result;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (focusRequest == null) {
                AudioAttributes attrs = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build();
                focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                        .setAudioAttributes(attrs)
                        .setOnAudioFocusChangeListener(this, mainHandler)
                        .setAcceptsDelayedFocusGain(true)
                        .setWillPauseWhenDucked(false)
                        .build();
            }
            result = audioManager.requestAudioFocus(focusRequest);
        } else {
            result = audioManager.requestAudioFocus(
                    this,
                    AudioManager.STREAM_MUSIC,
                    AudioManager.AUDIOFOCUS_GAIN
            );
        }
        hasAudioFocus = result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        return hasAudioFocus;
    }

    private void abandonAudioFocus() {
        if (audioManager == null || !hasAudioFocus) {
            hasAudioFocus = false;
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && focusRequest != null) {
            audioManager.abandonAudioFocusRequest(focusRequest);
        } else {
            audioManager.abandonAudioFocus(this);
        }
        hasAudioFocus = false;
    }

    public void onAppForeground() {
        foregroundGraceUntilMs = System.currentTimeMillis() + FOREGROUND_FOCUS_GRACE_MS;
        maintainPlaybackOnForeground();
    }

    public void maintainPlaybackOnForeground() {
        if (userPaused || pausedByExternalApp || pausedByTransientFocus || lastUrl.isEmpty()) {
            return;
        }
        ensurePlayerAndSession();
        requestAudioFocus();
        if (player == null) {
            return;
        }
        int state = player.getPlaybackState();
        if (state == Player.STATE_IDLE || state == Player.STATE_ENDED) {
            prepareAndPlay(lastUrl, lastReferer);
        } else if (!player.getPlayWhenReady()) {
            player.setPlayWhenReady(true);
            player.play();
            lastProgressMs = System.currentTimeMillis();
        }
        if (stateListener != null && isPlaying()) {
            stateListener.onStarted();
        }
    }

    @Override
    public void onAudioFocusChange(int focusChange) {
        if (userPaused) {
            return;
        }
        if (pausedByExternalApp && focusChange != AudioManager.AUDIOFOCUS_GAIN) {
            return;
        }
        if (focusChange == AudioManager.AUDIOFOCUS_LOSS
                && System.currentTimeMillis() < foregroundGraceUntilMs) {
            return;
        }
        switch (focusChange) {
            case AudioManager.AUDIOFOCUS_LOSS:
                // Otra app toma el foco de forma permanente (YouTube, Spotify, etc.).
                haltForExternalApp();
                break;
            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
                // Llamada, asistente de voz, etc.: pausar y reanudar al recuperar GAIN.
                haltForTransientFocus();
                break;
            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK:
                if (player != null) {
                    player.setVolume(userVolume * 0.25f);
                }
                break;
            case AudioManager.AUDIOFOCUS_GAIN:
                if (player != null) {
                    player.setVolume(userVolume);
                }
                if (pausedByTransientFocus) {
                    resumeAfterTransientFocus();
                }
                break;
            default:
                break;
        }
    }

    private void haltForExternalApp() {
        if (pausedByExternalApp) {
            return;
        }
        pausedByExternalApp = true;
        pausedByTransientFocus = false;
        userPaused = false;
        lockPlaybackOff();
        abandonAudioFocus();
        releasePlaybackWakeLock();
        refreshNotification();
        if (stateListener != null) {
            stateListener.onExternalPause();
        }
    }

    private void haltForTransientFocus() {
        if (pausedByTransientFocus || pausedByExternalApp || userPaused) {
            return;
        }
        pausedByTransientFocus = true;
        lockPlaybackOff();
        releasePlaybackWakeLock();
        refreshNotification();
    }

    private void resumeAfterTransientFocus() {
        pausedByTransientFocus = false;
        if (userPaused || pausedByExternalApp || lastUrl.isEmpty()) {
            return;
        }
        if (!requestAudioFocus()) {
            pausedByExternalApp = true;
            if (stateListener != null) {
                stateListener.onExternalPause();
            }
            return;
        }
        ensurePlayerAndSession();
        if (player == null) {
            return;
        }
        player.setVolume(userVolume);
        int state = player.getPlaybackState();
        if (state == Player.STATE_IDLE || state == Player.STATE_ENDED) {
            prepareAndPlay(lastUrl, lastReferer);
        } else {
            suppressTransportCallback = true;
            player.setPlayWhenReady(true);
            player.play();
            lastPlayWhenReady = true;
            suppressTransportCallback = false;
            lastProgressMs = System.currentTimeMillis();
        }
        acquirePlaybackWakeLock();
        enterForegroundWithNotification();
        refreshNotification();
        if (stateListener != null) {
            stateListener.onStarted();
        }
    }

    private void lockPlaybackOff() {
        if (player == null) {
            return;
        }
        suppressTransportCallback = true;
        player.setPlayWhenReady(false);
        player.pause();
        suppressTransportCallback = false;
    }

    private DefaultHttpDataSource.Factory buildHttpFactory(String referer) {
        DefaultHttpDataSource.Factory httpFactory = new DefaultHttpDataSource.Factory()
                .setUserAgent(
                        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 "
                                + "(KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
                )
                .setAllowCrossProtocolRedirects(true)
                .setConnectTimeoutMs(20_000)
                .setReadTimeoutMs(60_000);

        if (referer != null && !referer.isEmpty()) {
            Map<String, String> headers = new HashMap<>();
            headers.put("Referer", referer);
            headers.put("Icy-MetaData", "1");
            headers.put("Connection", "keep-alive");
            httpFactory.setDefaultRequestProperties(headers);
        }
        return httpFactory;
    }

    private void prepareAndPlay(String url, String referer) {
        ensurePlayerAndSession();
        DefaultMediaSourceFactory sourceFactory =
                new DefaultMediaSourceFactory(buildHttpFactory(referer));
        MediaItem item = new MediaItem.Builder()
                .setUri(url)
                .setMediaMetadata(
                        new MediaMetadata.Builder()
                                .setTitle(currentTitle)
                                .setArtist(currentArtist)
                                .build()
                )
                .build();
        player.setMediaSource(sourceFactory.createMediaSource(item));
        player.prepare();
        player.setVolume(userVolume);
        player.setPlayWhenReady(true);
        player.play();
        lastProgressMs = System.currentTimeMillis();
    }

    private void reconnectStream(String reason) {
        if (userPaused || pausedByExternalApp || pausedByTransientFocus || lastUrl.isEmpty()) {
            return;
        }
        requestAudioFocus();
        prepareAndPlay(lastUrl, lastReferer);
    }

    public void play(String url, String referer, String title, String artist) {
        if (url == null || url.isEmpty()) {
            return;
        }
        ensurePlayerAndSession();
        enterForegroundWithNotification();
        acquirePlaybackWakeLock();
        String nextReferer = referer != null ? referer : "";
        currentTitle = title != null && !title.isEmpty() ? title : "VivoRD Radio";
        currentArtist = artist != null && !artist.isEmpty() ? artist : "En vivo";

        boolean sameStream = url.equals(lastUrl) && nextReferer.equals(lastReferer);
        if (sameStream && isPlaying()) {
            return;
        }
        if (sameStream && player != null && !userPaused && !pausedByExternalApp && !pausedByTransientFocus) {
            int state = player.getPlaybackState();
            if (state != Player.STATE_IDLE && state != Player.STATE_ENDED) {
                userPaused = false;
                pausedByExternalApp = false;
                pausedByTransientFocus = false;
                requestAudioFocus();
                player.setVolume(userVolume);
                suppressTransportCallback = true;
                player.setPlayWhenReady(true);
                player.play();
                suppressTransportCallback = false;
                lastProgressMs = System.currentTimeMillis();
                if (stateListener != null) {
                    stateListener.onStarted();
                }
                return;
            }
        }

        lastUrl = url;
        lastReferer = nextReferer;
        userPaused = false;
        pausedByExternalApp = false;
        pausedByTransientFocus = false;

        requestAudioFocus();
        prepareAndPlay(url, lastReferer);

        if (stateListener != null) {
            stateListener.onStarted();
        }
    }

    public void pause() {
        userPaused = true;
        pausedByExternalApp = false;
        pausedByTransientFocus = false;
        lockPlaybackOff();
        abandonAudioFocus();
        releasePlaybackWakeLock();
        refreshNotification();
        if (stateListener != null) {
            stateListener.onPaused();
        }
    }

    public void resume() {
        userPaused = false;
        pausedByExternalApp = false;
        pausedByTransientFocus = false;
        if (player == null) {
            ensurePlayerAndSession();
        }
        enterForegroundWithNotification();
        if (!requestAudioFocus()) {
            pausedByExternalApp = true;
            if (stateListener != null) {
                stateListener.onExternalPause();
            }
            return;
        }
        player.setVolume(userVolume);
        int state = player.getPlaybackState();
        if ((state == Player.STATE_IDLE || state == Player.STATE_ENDED) && !lastUrl.isEmpty()) {
            prepareAndPlay(lastUrl, lastReferer);
        } else {
            suppressTransportCallback = true;
            player.setPlayWhenReady(true);
            player.play();
            suppressTransportCallback = false;
            lastProgressMs = System.currentTimeMillis();
        }
        acquirePlaybackWakeLock();
        refreshNotification();
        if (stateListener != null) {
            stateListener.onStarted();
        }
    }

    public void stopPlayback() {
        userPaused = true;
        pausedByExternalApp = false;
        pausedByTransientFocus = false;
        abandonAudioFocus();
        if (player != null) {
            lockPlaybackOff();
            player.stop();
            player.clearMediaItems();
        }
        clearForegroundNotification();
        stopSelf();
        if (stateListener != null) {
            stateListener.onPaused();
        }
    }

    public void setVolume(float volume) {
        userVolume = Math.max(0f, Math.min(1f, volume));
        if (player != null && !pausedByExternalApp && !pausedByTransientFocus && !userPaused) {
            player.setVolume(userVolume);
        }
    }

    public String getCurrentStreamUrl() {
        return lastUrl != null ? lastUrl : "";
    }

    public String getCurrentStreamReferer() {
        return lastReferer != null ? lastReferer : "";
    }

    // Seguro para llamarse desde cualquier hilo: usa estado cacheado en lugar
    // de acceder a ExoPlayer fuera de su hilo de aplicacion.
    public boolean isPlaying() {
        if (pausedByExternalApp || pausedByTransientFocus || userPaused || !lastPlayWhenReady) {
            return false;
        }
        int state = lastPlaybackState;
        return state == Player.STATE_READY || state == Player.STATE_BUFFERING;
    }

    @Override
    public void onDestroy() {
        mainHandler.removeCallbacks(watchdogRunnable);
        releasePlaybackWakeLock();
        abandonAudioFocus();
        if (mediaSession != null) {
            mediaSession.release();
            mediaSession = null;
        }
        if (player != null) {
            player.release();
            player = null;
        }
        if (instance == this) {
            instance = null;
        }
        super.onDestroy();
    }
}
