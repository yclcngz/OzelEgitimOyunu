// Tüm Audio nesnelerini takip et — arka planda hepsini durdur
(function() {
    const _allAudios = new Set();
    const _OrigAudio = window.Audio;
    function TrackedAudio(...args) {
        const a = new _OrigAudio(...args);
        _allAudios.add(a);
        return a;
    }
    TrackedAudio.prototype = _OrigAudio.prototype;
    window.Audio = TrackedAudio;

    function pauseAll() {
        _allAudios.forEach(a => { try { a.pause(); } catch(e) {} });
        document.querySelectorAll('video').forEach(v => { try { v.pause(); } catch(e) {} });
    }
    function resumeAll() {
        // Sadece BGM devam eder — oyun sesleri zaten kullanıcı etkileşimiyle çalışır
    }

    document.addEventListener('visibilitychange', () => { if (document.hidden) pauseAll(); });
    window.addEventListener('blur', pauseAll);
    // Capacitor/Cordova: arka plana geçince tetiklenen native DOM eventi
    document.addEventListener('pause', pauseAll);

    // Capacitor App plugin — DOMContentLoaded'da bridge hazır olduğundan emin ol
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Capacitor?.Plugins?.App) {
            window.Capacitor.Plugins.App.addListener('appStateChange', ({ isActive }) => {
                if (!isActive) pauseAll();
            });
        }
    });

    window._pauseAllAudio = pauseAll;
})();

// Android geri tuşu — çift basış ile çıkış
(function() {
    let backPressedOnce = false;
    let toastEl = null;

    window.history.pushState({ backGuard: true }, '');

    window.addEventListener('popstate', function() {
        if (backPressedOnce) {
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
                window.Capacitor.Plugins.App.exitApp();
            }
            return;
        }
        backPressedOnce = true;
        window.history.pushState({ backGuard: true }, '');

        if (toastEl) toastEl.remove();
        toastEl = document.createElement('div');
        toastEl.textContent = 'Çıkmak için tekrar basın';
        toastEl.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.82);color:#fff;padding:13px 28px;border-radius:30px;font-size:1.05rem;z-index:99999;pointer-events:none;';
        document.body.appendChild(toastEl);

        setTimeout(() => {
            backPressedOnce = false;
            if (toastEl) { toastEl.remove(); toastEl = null; }
        }, 2000);
    });
})();

// Kutlama videosunu önceden yükle — oyun bitince play butonu görünmesin
(function() {
    const preVid = document.createElement('video');
    preVid.src = 'assets/sounds/kutlama.mp4';
    preVid.preload = 'auto';
    preVid.style.cssText = 'display:none;position:absolute;width:0;height:0';
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(preVid));
})();

document.addEventListener('DOMContentLoaded', () => {
    // --- Müzik Kontrol Butonu ---
    const bgmBtn = document.createElement('button');
    bgmBtn.id = 'global-bgm-btn';

    const slot = document.getElementById('bgm-btn-slot');
    if (slot) {
        bgmBtn.className = 'inline-bgm-btn';
        slot.appendChild(bgmBtn);
    } else {
        bgmBtn.className = 'global-bgm-btn';
        document.body.appendChild(bgmBtn);
    }

    const bgmSrc = (typeof window.BGM_SRC !== 'undefined') ? window.BGM_SRC : 'assets/sounds/ortak_oyun_ses.mp3';
    const bgmAudio = new Audio(bgmSrc);
    bgmAudio.loop = true;
    bgmAudio.volume = 0.06;

    // Sessiz tercihi oturumda kalıcı
    let isMuted = sessionStorage.getItem('bgmMuted') === '1';
    bgmBtn.innerHTML = isMuted ? '🔇 Kapalı' : '🎵 Müzik';
    if (isMuted) bgmBtn.classList.add('muted');

    function tryPlay() {
        if (!isMuted) bgmAudio.play().catch(() => {});
    }

    // --- Splash ekranı varken butonu gizle ---
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen && !splashScreen.classList.contains('hidden')) {
        bgmBtn.style.display = 'none';

        // Splash kapanınca butonu göster ve müziği başlat
        const splashObserver = new MutationObserver(() => {
            if (splashScreen.classList.contains('hidden')) {
                bgmBtn.style.display = '';
                tryPlay();
                splashObserver.disconnect();
            }
        });
        splashObserver.observe(splashScreen, { attributes: true, attributeFilter: ['class'] });
    } else {
        // Splash yok (alt menü sayfaları) — hemen çalmayı dene
        tryPlay();
        // Autoplay engellendiyse ilk etkileşimde başlat
        const onFirstInteraction = () => {
            tryPlay();
            document.removeEventListener('click', onFirstInteraction);
            document.removeEventListener('touchstart', onFirstInteraction);
        };
        document.addEventListener('click', onFirstInteraction);
        document.addEventListener('touchstart', onFirstInteraction);
    }

    // --- SES KISMA SİSTEMİ (Audio Ducking) ---
    const originalAudioPlay = window.Audio.prototype.play;
    window.Audio.prototype.play = function(...args) {
        if (this !== bgmAudio && !isMuted) {
            bgmAudio.volume = 0.01;
            const restoreVolume = () => {
                if (!isMuted) bgmAudio.volume = 0.06;
                this.removeEventListener('ended', restoreVolume);
                this.removeEventListener('pause', restoreVolume);
            };
            this.addEventListener('ended', restoreVolume);
            this.addEventListener('pause', restoreVolume);
        }
        return originalAudioPlay.apply(this, args);
    };

    // Müzik Kapat / Aç
    bgmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isMuted) {
            bgmAudio.volume = 0.06;
            bgmBtn.innerHTML = '🎵 Müzik';
            bgmBtn.classList.remove('muted');
            bgmAudio.play().catch(() => {});
            isMuted = false;
            sessionStorage.removeItem('bgmMuted');
        } else {
            bgmAudio.pause();
            bgmBtn.innerHTML = '🔇 Kapalı';
            bgmBtn.classList.add('muted');
            isMuted = true;
            sessionStorage.setItem('bgmMuted', '1');
        }
    });
});
