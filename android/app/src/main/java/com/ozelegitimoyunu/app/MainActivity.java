package com.ozelegitimoyunu.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebSettings settings = getBridge().getWebView().getSettings();
        settings.setMediaPlaybackRequiresUserGesture(false);
    }

    @Override
    public void onPause() {
        super.onPause();
        getBridge().getWebView().post(() ->
            getBridge().getWebView().evaluateJavascript(
                "if(typeof window._pauseAllAudio === 'function') window._pauseAllAudio();", null)
        );
    }
}
