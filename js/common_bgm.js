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

    // --- YANLIŞ CEVAP SESİ (Web Audio — çocuk dostu yumuşak boing) ---
    window.playWrongAnswerSound = function() {
        if (!isMuted) bgmAudio.volume = 0.01;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            setTimeout(() => { if (!isMuted) bgmAudio.volume = 0.06; }, 700);
            return;
        }
        const ctx = new AudioCtx();
        function playNote(t, f1, f2, dur) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f1, t);
            osc.frequency.exponentialRampToValueAtTime(f2, t + dur);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.38, t + 0.03);
            g.gain.exponentialRampToValueAtTime(0.001, t + dur);
            osc.start(t); osc.stop(t + dur);
        }
        playNote(ctx.currentTime,        550, 300, 0.28);
        playNote(ctx.currentTime + 0.22, 450, 250, 0.32);
        setTimeout(() => {
            if (!isMuted) bgmAudio.volume = 0.06;
            ctx.close().catch(() => {});
        }, 700);
    };

    // Capacitor Event'lerini yükle ve başlat
    const capScript = document.createElement('script');
    capScript.src = 'js/capacitor_events.bundle.js';
    capScript.onload = () => {
        if (window.CapEvents && window.CapEvents.initCapacitorEvents) {
            window.CapEvents.initCapacitorEvents(bgmAudio, () => isMuted);
        }
    };
    document.body.appendChild(capScript);
});
