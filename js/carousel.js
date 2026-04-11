const carousel = document.getElementById('carousel');
const dots = document.querySelectorAll('.dot');
const titleEl = document.getElementById('carousel-title');
const cards = document.querySelectorAll('.menu-img-btn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

const baseTitle = titleEl ? titleEl.textContent : '';
let currentIndex = 0;
let lastPlayedIndex = -1;

// --- Şarkı Oynatma Mantığı ---
let currentAudio = null;
let currentSongBtn = null;

function stopAllSongs() {
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    if (currentSongBtn) {
        currentSongBtn.classList.remove('playing');
        currentSongBtn.textContent = 'DİNLE';
    }
    currentAudio = null;
    currentSongBtn = null;
}

function playSongBtn(btn) {
    if (currentSongBtn === btn && currentAudio && !currentAudio.paused) {
        return; // Zaten bu şarkı çalıyorsa devam etsin
    }
    
    stopAllSongs();

    const src = btn.dataset.song;
    if (!src) return;

    currentAudio = new Audio(src);
    currentSongBtn = btn;
    btn.classList.add('playing');
    btn.textContent = 'ÇALIYOR';

    const playPromise = currentAudio.play();
    if (playPromise !== undefined) {
        playPromise.catch(e => {
            console.log("Tarayıcı otomatik oynatmayı engelledi, kullanıcı etkileşimi bekleniyor.");
            btn.classList.remove('playing');
            btn.textContent = 'DİNLE';
            currentAudio = null;
            currentSongBtn = null;
        });
    }
    
    currentAudio.onended = () => {
        btn.classList.remove('playing');
        btn.textContent = 'DİNLE';
        currentAudio = null;
        currentSongBtn = null;
    };
}

// --- UI Güncelleme ---
function updateUI(index) {
    currentIndex = index;
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    if (titleEl) {
        titleEl.textContent = cards[index]?.dataset.title || baseTitle;
    }
    if (prevBtn) prevBtn.style.opacity = index === 0 ? '0.3' : '1';
    if (nextBtn) nextBtn.style.opacity = index === cards.length - 1 ? '0.3' : '1';

    // Yeni menüye geçildiğinde otomatik şarkı başlat
    if (index !== lastPlayedIndex) {
        lastPlayedIndex = index;
        const currentCard = cards[index];
        if (currentCard) {
            const songBtn = currentCard.querySelector('.song-btn');
            if (songBtn) {
                playSongBtn(songBtn);
            } else {
                stopAllSongs();
            }
        }
    }
}

if (carousel) {
    carousel.addEventListener('scroll', () => {
        // Kaydırma bitmeye yaklaştığında index'i güncelle
        const index = Math.round(carousel.scrollLeft / carousel.offsetWidth);
        if (index !== currentIndex) {
            updateUI(index);
        }
    });
}

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            carousel.scrollTo({ left: (currentIndex - 1) * carousel.offsetWidth, behavior: 'smooth' });
        }
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        if (currentIndex < cards.length - 1) {
            carousel.scrollTo({ left: (currentIndex + 1) * carousel.offsetWidth, behavior: 'smooth' });
        }
    });
}

dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
        carousel.scrollTo({ left: i * carousel.offsetWidth, behavior: 'smooth' });
    });
});

document.querySelectorAll('.song-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (currentSongBtn === this && currentAudio && !currentAudio.paused) {
            stopAllSongs(); // Aynı butona basarsa durdur
        } else {
            playSongBtn(this); // Oynat
        }
    });
});

// Tarayıcı kısıtlamalarına karşı yedek: Ekrana ilk dokunmada eğer ilk şarkı çalmadıysa başlat
document.addEventListener('click', () => {
    if (lastPlayedIndex === 0 && currentAudio === null) {
        const firstCard = cards[0];
        if (firstCard) {
            const firstBtn = firstCard.querySelector('.song-btn');
            if (firstBtn) playSongBtn(firstBtn);
        }
    }
}, { once: true });

// İlk açılışta 1. slaytı aktifleştir (otomatik müziği tetikler)
updateUI(0);
