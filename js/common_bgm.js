document.addEventListener('DOMContentLoaded', () => {
    // --- Müzik Kontrol Butonu ---
    const bgmBtn = document.createElement('button');
    bgmBtn.id = 'global-bgm-btn';
    bgmBtn.innerHTML = '🎵 Müzik';

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
    
    let isMuted = false;

    // --- Splash ekranı varken butonu gizle ---
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen && !splashScreen.classList.contains('hidden')) {
        bgmBtn.style.display = 'none';

        // Splash kapanınca butonu göster
        const splashObserver = new MutationObserver(() => {
            if (splashScreen.classList.contains('hidden')) {
                bgmBtn.style.display = '';
                splashObserver.disconnect();
            }
        });
        splashObserver.observe(splashScreen, { attributes: true, attributeFilter: ['class'] });
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

    // İlk dokunuşta müziği başlat (tarayıcı autoplay kısıtlaması)
    const attemptPlay = () => {
        if (!isMuted) {
            bgmAudio.play().catch(e => console.log("Autoplay engellendi:", e));
        }
        document.removeEventListener('click', attemptPlay);
        document.removeEventListener('touchstart', attemptPlay);
    };
    document.addEventListener('click', attemptPlay);
    document.addEventListener('touchstart', attemptPlay);

    // Müzik Kapat / Aç
    bgmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isMuted) {
            bgmAudio.volume = 0.06;
            bgmBtn.innerHTML = '🎵 Müzik';
            bgmBtn.classList.remove('muted');
            bgmAudio.play().catch(() => {});
            isMuted = false;
        } else {
            bgmAudio.pause();
            bgmBtn.innerHTML = '🔇 Kapalı';
            bgmBtn.classList.add('muted');
            isMuted = true;
        }
    });

    // --- GELİŞTİRİCİ MENÜSÜ ---
    setTimeout(() => {
        if (typeof window.startLevel === 'function') {
            const devMenu = document.createElement('div');
            devMenu.className = 'dev-menu';
            devMenu.style.display = 'flex';
            let maxOptions = window.MAX_LEVEL || 5;
            let buttonsHtml = '';
            for (let i = 1; i <= maxOptions; i++) {
                buttonsHtml += `<button onclick="window.startLevel(${i})">${i}</button>`;
            }
            devMenu.innerHTML = `<span>Hızlı Geçiş:</span> ${buttonsHtml}`;
            document.body.appendChild(devMenu);
        }
    }, 500);
});
