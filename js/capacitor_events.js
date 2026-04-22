import { App } from '@capacitor/app';

export function initCapacitorEvents(bgmAudio, isMutedGetter) {
    // Arka plan olaylari (appStateChange)
    App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
            // Arka plana alındı: Müziği ve sesleri duraklat
            if (bgmAudio && !bgmAudio.paused) {
                bgmAudio.pause();
                bgmAudio.dataset.wasPlaying = 'true'; // Ön plana gelince geri başlatmak için işaretle
            }
        } else {
            // Ön plana alındı: Müzik çalıyorsa devam et
            if (bgmAudio && bgmAudio.dataset.wasPlaying === 'true') {
                if (!isMutedGetter()) {
                    bgmAudio.play().catch(() => {});
                }
                bgmAudio.dataset.wasPlaying = 'false';
            }
        }
    });

    // Geri tuşu olayları (backButton)
    let backPressedTime = 0;
    App.addListener('backButton', () => {
        const path = window.location.pathname;
        const isMainMenu = path.endsWith('index.html') || path === '/' || path.endsWith('/www/');

        if (isMainMenu) {
            const now = Date.now();
            if (now - backPressedTime < 2000) {
                App.exitApp();
            } else {
                backPressedTime = now;
                showToast('Çıkmak için tekrar basın');
            }
        } else {
            // Alt menülerde ise doğal olarak geri git
            window.history.back();
        }
    });
}

function showToast(msg) {
    const t = document.createElement('div');
    t.innerText = msg;
    t.style.cssText = 'position:fixed;bottom:10%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:white;padding:10px 20px;border-radius:20px;z-index:9999;font-size:16px;font-family:sans-serif;pointer-events:none;text-align:center;white-space:nowrap;';
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.transition = 'opacity 0.5s';
        t.style.opacity = '0';
        setTimeout(() => t.remove(), 500);
    }, 2000);
}
