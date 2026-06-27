package com.vivord.app;

import android.content.Intent;
import android.os.Handler;
import android.os.Looper;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "RadioNative")
public class RadioNativePlugin extends Plugin {

    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    public void load() {
        super.load();
        RadioPlaybackService.setStateListener(new RadioPlaybackService.StateListener() {
            @Override
            public void onStarted() {
                notifySimple("started");
            }

            @Override
            public void onPaused() {
                notifySimple("paused");
            }

            @Override
            public void onExternalPause() {
                JSObject data = new JSObject();
                data.put("event", "externalPause");
                notifyListeners("radioEvent", data);
            }

            @Override
            public void onError(String message) {
                JSObject data = new JSObject();
                data.put("event", "error");
                data.put("message", message);
                notifyListeners("radioEvent", data);
            }
        });
    }

    private void notifySimple(String event) {
        JSObject data = new JSObject();
        data.put("event", event);
        notifyListeners("radioEvent", data);
    }

    private void sendAction(String action) {
        Intent intent = new Intent(getContext(), RadioPlaybackService.class);
        intent.setAction(action);
        ContextCompat.startForegroundService(getContext(), intent);
    }

    private void sendPlayIntent(String url, String referer, String title, String artist) {
        Intent intent = new Intent(getContext(), RadioPlaybackService.class);
        intent.setAction(RadioPlaybackService.ACTION_PLAY);
        intent.putExtra(RadioPlaybackService.EXTRA_URL, url);
        intent.putExtra(RadioPlaybackService.EXTRA_REFERER, referer != null ? referer : "");
        intent.putExtra(RadioPlaybackService.EXTRA_TITLE, title);
        intent.putExtra(RadioPlaybackService.EXTRA_ARTIST, artist);
        ContextCompat.startForegroundService(getContext(), intent);
    }

    private RadioPlaybackService service() {
        return RadioPlaybackService.getInstance();
    }

    @PluginMethod
    public void play(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("URL requerida");
            return;
        }
        String referer = call.getString("referer", "");
        String title = call.getString("title", "VivoRD Radio");
        String artist = call.getString("artist", "En vivo");
        sendPlayIntent(url, referer, title, artist);
        mainHandler.postDelayed(() -> {
            RadioPlaybackService svc = service();
            if (svc != null) {
                call.resolve();
            } else {
                call.resolve();
            }
        }, 300);
    }

    @PluginMethod
    public void pause(PluginCall call) {
        mainHandler.post(() -> {
            RadioPlaybackService svc = service();
            if (svc != null) {
                svc.pause();
            } else {
                sendAction(RadioPlaybackService.ACTION_PAUSE);
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void resume(PluginCall call) {
        mainHandler.post(() -> {
            RadioPlaybackService svc = service();
            if (svc != null) {
                svc.resume();
            } else {
                sendAction(RadioPlaybackService.ACTION_RESUME);
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        mainHandler.post(() -> {
            RadioPlaybackService svc = service();
            if (svc != null) {
                svc.stopPlayback();
            } else {
                sendAction(RadioPlaybackService.ACTION_STOP);
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void setVolume(PluginCall call) {
        Float volume = call.getFloat("value", 1.0f);
        final float vol = volume != null ? volume : 1.0f;
        mainHandler.post(() -> {
            RadioPlaybackService svc = service();
            if (svc != null) {
                svc.setVolume(vol);
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void isPlaying(PluginCall call) {
        RadioPlaybackService svc = service();
        JSObject ret = new JSObject();
        ret.put("playing", svc != null && svc.isPlaying());
        call.resolve(ret);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        RadioPlaybackService svc = service();
        JSObject ret = new JSObject();
        if (svc == null) {
            ret.put("playing", false);
            ret.put("url", "");
            ret.put("referer", "");
        } else {
            ret.put("playing", svc.isPlaying());
            ret.put("url", svc.getCurrentStreamUrl());
            ret.put("referer", svc.getCurrentStreamReferer());
        }
        call.resolve(ret);
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        RadioPlaybackService svc = service();
        if (svc != null) {
            svc.onAppForeground();
        }
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
    }
}
