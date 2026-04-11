const carousel = document.getElementById('carousel');
const dots = document.querySelectorAll('.dot');
const titleEl = document.getElementById('carousel-title');
const cards = document.querySelectorAll('.menu-img-btn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

const baseTitle = titleEl ? titleEl.textContent : '';
let currentIndex = 0;

function updateUI(index) {
    currentIndex = index;
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    if (titleEl) {
        titleEl.textContent = cards[index]?.dataset.title || baseTitle;
    }
    if (prevBtn) prevBtn.style.opacity = index === 0 ? '0.3' : '1';
    if (nextBtn) nextBtn.style.opacity = index === cards.length - 1 ? '0.3' : '1';
}

if (carousel) {
    carousel.addEventListener('scroll', () => {
        const index = Math.round(carousel.scrollLeft / carousel.offsetWidth);
        updateUI(index);
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

updateUI(0);

// --- Şarkı Butonu ---
let currentAudio = null;
let currentSongBtn = null;

document.querySelectorAll('.song-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const src = this.dataset.song;

        // Aynı butona tekrar basılınca durdur
        if (currentSongBtn === this && currentAudio && !currentAudio.paused) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            this.classList.remove('playing');
            this.textContent = 'Şarkıyı Dinle';
            currentAudio = null;
            currentSongBtn = null;
            return;
        }

        // Başka bir şarkı çalıyorsa durdur
        if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            if (currentSongBtn) {
                currentSongBtn.classList.remove('playing');
                currentSongBtn.textContent = 'Şarkıyı Dinle';
            }
        }

        currentAudio = new Audio(src);
        currentSongBtn = this;
        this.classList.add('playing');
        this.textContent = 'Çalıyor...';

        currentAudio.play().catch(() => {});
        currentAudio.onended = () => {
            this.classList.remove('playing');
            this.textContent = 'Şarkıyı Dinle';
            currentAudio = null;
            currentSongBtn = null;
        };
    });
});
