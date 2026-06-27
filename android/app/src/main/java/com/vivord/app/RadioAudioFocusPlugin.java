package com.vivord.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.AudioPlaybackConfiguration;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.lang.reflect.Method;
import java.util.List;

@CapacitorPlugin(name = "RadioAudioFocus")
public class RadioAudioFocusPlugin extends Plugin implements AudioManager.OnAudioFocusChangeListener {

    private static final long POLL_MS = 800;

    private AudioManager audioManager;
    private AudioFocusRequest focusRequest;
    private boolean hasFocus = false;
    private boolean monitoring = false;
    private boolean competingNotified = false;
    private AudioManager.AudioPlaybackCallback playbackCallback;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Runnable pollRunnable = new Runnable() {
        @Override
        public void run() {
            if (!monitoring) {
                return;
            }
            evaluateCompetingAudio();
            mainHandler.postDelayed(this, POLL_MS);
        }
    };

    private AudioManager getAudioManager() {
        if (audioManager == null) {
            audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        }
        return audioManager;
    }

    private boolean isMediaUsage(AudioAttributes attrs) {
        if (attrs == null) {
            return true;
        }
        int usage = attrs.getUsage();
        return usage == AudioAttributes.USAGE_MEDIA
                || usage == AudioAttributes.USAGE_GAME
                || usage == AudioAttributes.USAGE_UNKNOWN;
    }

    private boolean isConfigPlaying(AudioPlaybackConfiguration config) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                Method isActive = AudioPlaybackConfiguration.class.getMethod("isActive");
                return (boolean) isActive.invoke(config);
            } catch (Exception ignored) {
                return true;
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            try {
                Method getPlayerState = AudioPlaybackConfiguration.class.getMethod("getPlayerState");
                int state = (int) getPlayerState.invoke(config);
                Class<?> cls = AudioPlaybackConfiguration.class;
                int started = cls.getField("PLAYER_STATE_STARTED").getInt(null);
                return state == started;
            } catch (Exception ignored) {
                return true;
            }
        }
        return true;
    }

    private int configClientUid(AudioPlaybackConfiguration config) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                Method getClientUid = AudioPlaybackConfiguration.class.getMethod("getClientUid");
                return (int) getClientUid.invoke(config);
            } catch (Exception ignored) {
                return -1;
            }
        }
        return -1;
    }

    private boolean detectCompetingAudio() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return false;
        }
        AudioManager am = getAudioManager();
        if (am == null) {
            return false;
        }

        List<AudioPlaybackConfiguration> configs = am.getActivePlaybackConfigurations();
        int myUid = getContext().getApplicationInfo().uid;
        int otherActiveMedia = 0;
        int ourActiveMedia = 0;

        for (AudioPlaybackConfiguration config : configs) {
            if (!isConfigPlaying(config)) {
                continue;
            }
            if (!isMediaUsage(config.getAudioAttributes())) {
                continue;
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                int uid = configClientUid(config);
                if (uid == myUid) {
                    ourActiveMedia++;
                } else if (uid > 0) {
                    otherActiveMedia++;
                }
            } else {
                otherActiveMedia++;
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            return otherActiveMedia > 0;
        }
        return otherActiveMedia > 1;
    }

    private void evaluateCompetingAudio() {
        if (!monitoring) {
            return;
        }
        if (detectCompetingAudio()) {
            if (!competingNotified) {
                competingNotified = true;
                notifyFocusEvent("otherMedia");
            }
        } else {
            competingNotified = false;
        }
    }

    private void ensurePlaybackCallback() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || playbackCallback != null) {
            return;
        }
        playbackCallback = new AudioManager.AudioPlaybackCallback() {
            @Override
            public void onPlaybackConfigChanged(List<AudioPlaybackConfiguration> configs) {
                if (!monitoring) {
                    return;
                }
                mainHandler.post(RadioAudioFocusPlugin.this::evaluateCompetingAudio);
            }
        };
        getAudioManager().registerAudioPlaybackCallback(playbackCallback, mainHandler);
    }

    private void startPolling() {
        mainHandler.removeCallbacks(pollRunnable);
        mainHandler.post(pollRunnable);
    }

    private void stopPolling() {
        mainHandler.removeCallbacks(pollRunnable);
    }

    private int requestFocusInternal() {
        AudioManager am = getAudioManager();
        if (am == null) {
            return AudioManager.AUDIOFOCUS_REQUEST_FAILED;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (focusRequest == null) {
                AudioAttributes attrs = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build();
                focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                        .setAudioAttributes(attrs)
                        .setOnAudioFocusChangeListener(this)
                        .setAcceptsDelayedFocusGain(true)
                        .setWillPauseWhenDucked(true)
                        .build();
            }
            return am.requestAudioFocus(focusRequest);
        }
        return am.requestAudioFocus(
                this,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN
        );
    }

    @PluginMethod
    public void request(PluginCall call) {
        int result = requestFocusInternal();
        hasFocus = result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        call.resolve();
    }

    @PluginMethod
    public void abandon(PluginCall call) {
        releaseFocus();
        call.resolve();
    }

    @PluginMethod
    public void startMonitoring(PluginCall call) {
        monitoring = true;
        competingNotified = false;
        ensurePlaybackCallback();
        startPolling();
        call.resolve();
    }

    @PluginMethod
    public void stopMonitoring(PluginCall call) {
        monitoring = false;
        competingNotified = false;
        stopPolling();
        call.resolve();
    }

    @PluginMethod
    public void probeCompetingAudio(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("competing", monitoring && detectCompetingAudio());
        call.resolve(ret);
    }

    private void releaseFocus() {
        AudioManager am = getAudioManager();
        if (am == null || !hasFocus) {
            hasFocus = false;
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && focusRequest != null) {
            am.abandonAudioFocusRequest(focusRequest);
        } else {
            am.abandonAudioFocus(this);
        }
        hasFocus = false;
    }

    private void notifyFocusEvent(String type) {
        JSObject payload = new JSObject();
        payload.put("type", type);
        notifyListeners("focusChange", payload);
    }

    @Override
    public void onAudioFocusChange(int focusChange) {
        switch (focusChange) {
            case AudioManager.AUDIOFOCUS_GAIN:
                hasFocus = true;
                competingNotified = false;
                notifyFocusEvent("gain");
                break;
            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK:
                mainHandler.post(() -> {
                    if (detectCompetingAudio()) {
                        competingNotified = true;
                        notifyFocusEvent("otherMedia");
                    } else {
                        notifyFocusEvent("lossTransient");
                    }
                });
                break;
            case AudioManager.AUDIOFOCUS_LOSS:
            default:
                hasFocus = false;
                competingNotified = true;
                releaseFocus();
                notifyFocusEvent("loss");
                break;
        }
    }

    @Override
    protected void handleOnDestroy() {
        monitoring = false;
        stopPolling();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && playbackCallback != null && audioManager != null) {
            audioManager.unregisterAudioPlaybackCallback(playbackCallback);
            playbackCallback = null;
        }
        releaseFocus();
        super.handleOnDestroy();
    }
}
