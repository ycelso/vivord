package com.vivord.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int REQ_POST_NOTIFICATIONS = 9001;
    private boolean webAudioBlocked = false;

    @Override
    public void load() {
        registerPlugin(RadioNativePlugin.class);
        registerPlugin(RadioAudioFocusPlugin.class);
        super.load();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        requestNotificationPermissionIfNeeded();
        configureWebViewForNativeRadio();
    }

    private void configureWebViewForNativeRadio() {
        if (webAudioBlocked) {
            return;
        }
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) {
            return;
        }
        webAudioBlocked = true;
        final String blockWebAudio = "(function(){"
                + "if(!/\\/radio\\//i.test(location.pathname))return;"
                + "function block(el){if(!el||el.__vivordBlocked)return;"
                + "el.__vivordBlocked=1;el.muted=true;el.volume=0;el.pause();"
                + "el.addEventListener('play',function(e){e.preventDefault();el.pause();},true);"
                + "}"
                + "document.querySelectorAll('audio,video').forEach(block);"
                + "})();";
        webView.evaluateJavascript(blockWebAudio, null);
    }

    @Override
    public void onStart() {
        super.onStart();
        if (!webAudioBlocked) {
            new Handler(Looper.getMainLooper()).postDelayed(this::configureWebViewForNativeRadio, 400);
        }
    }

    @Override
    public void onDestroy() {
        if (isFinishing() && !isChangingConfigurations()) {
            Intent stop = new Intent(this, RadioPlaybackService.class);
            stop.setAction(RadioPlaybackService.ACTION_STOP);
            ContextCompat.startForegroundService(this, stop);
        }
        super.onDestroy();
    }

    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return;
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED) {
            return;
        }
        ActivityCompat.requestPermissions(
                this,
                new String[] { Manifest.permission.POST_NOTIFICATIONS },
                REQ_POST_NOTIFICATIONS
        );
    }
}
