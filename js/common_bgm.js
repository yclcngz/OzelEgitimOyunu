document.addEventListener('DOMContentLoaded', () => {
    // Müzik kontrol UI'ı
    const bgmBtn = document.createElement('button');
    bgmBtn.className = 'global-bgm-btn';
    bgmBtn.innerHTML = '🎵 Müzik: Açık';
    document.body.appendChild(bgmBtn);

    const bgmAudio = new Audio('assets/sounds/ortak_oyun_ses.mp3');
    bgmAudio.loop = true;
    bgmAudio.volume = 0.06; // Fısıltı gibi çok daha derinden gelsin
    
    let isMuted = false;

    // --- SES KISMA SİSTEMİ (Audio Ducking) ---
    // Oyundaki herhangi bir komut/dat/onay sesi çaldığında BGM sesini daha da kıs, bitince geri aç.
    const originalAudioPlay = window.Audio.prototype.play;
    window.Audio.prototype.play = function(...args) {
        if (this !== bgmAudio && !isMuted) {
            bgmAudio.volume = 0.01; // Ekranda başka ses varken %1 seviyesine bastır
            const restoreVolume = () => {
                if (!isMuted) {
                    bgmAudio.volume = 0.06; // Çalan ses bitince fısıltıya geri dön
                }
                this.removeEventListener('ended', restoreVolume);
                this.removeEventListener('pause', restoreVolume);
            };
            this.addEventListener('ended', restoreVolume);
            this.addEventListener('pause', restoreVolume);
        }
        return originalAudioPlay.apply(this, args);
    };

    // Tarayıcıların "otomatik çalma" kısıtlamasını aşmak için
    // Ekrana ilk dokunuşta/tıklayışta müziği başlat
    const attemptPlay = () => {
        if(!isMuted) {
            bgmAudio.play().catch(e => {
                console.log("Tarayıcı autoplay engelledi:", e);
            });
        }
        document.removeEventListener('click', attemptPlay);
        document.removeEventListener('touchstart', attemptPlay);
    };

    document.addEventListener('click', attemptPlay);
    document.addEventListener('touchstart', attemptPlay);

    // Müzik Kapat / Aç Butonu
    bgmBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Sayfadaki diğer tıklamaları tetiklemesin
        if (isMuted) {
            // Aç
            bgmAudio.volume = 0.06;
            bgmBtn.innerHTML = '🎵 Müzik: Açık';
            bgmBtn.classList.remove('muted');
            bgmAudio.play().catch(() => {});
            isMuted = false;
        } else {
            // Kapat
            bgmAudio.pause();
            bgmBtn.innerHTML = '🔇 Kapalı';
            bgmBtn.classList.add('muted');
            isMuted = true;
        }
    });

    // --- GELİŞTİRİCİ MENÜSÜ (DEV MENU) ---
    // Eğer bulunduğumuz sayfada 'startLevel' isimli bir oyun başlatma fonksiyonu varsa,
    // Ekrana seviye atlatan gizli/geliştirici test butonlarını ekle.
    setTimeout(() => {
        if (typeof window.startLevel === 'function') {
            const devMenu = document.createElement('div');
            devMenu.className = 'dev-menu';
            devMenu.style.display = 'flex'; // CSS'teki gizliliği aç
            devMenu.innerHTML = `
                <span>Hızlı Geçiş:</span>
                <button onclick="window.startLevel(1)">1</button>
                <button onclick="window.startLevel(2)">2</button>
                <button onclick="window.startLevel(3)">3</button>
                <button onclick="window.startLevel(4)">4</button>
                <button onclick="window.startLevel(5)">5</button>
            `;
            document.body.appendChild(devMenu);
        }
    }, 500); // Oyun kodlarının yüklenip window objesine yerleşmesini azıcık bekle
});
