const carousel = document.getElementById('carousel');
const dots = document.querySelectorAll('.dot');
const titleEl = document.getElementById('carousel-title');
const cards = document.querySelectorAll('.menu-img-btn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

const baseTitle = titleEl ? titleEl.textContent : '';
let currentIndex = 0;
let lastPlayedIndex = -1;

// --- Kaydırma Ses Efekti ---
const SWIPE_SFX_SRC = 'assets/sounds/gecis_ses_efektt.mp3';
const TAP_SFX_SRC   = 'assets/sounds/tiklama_ses_efekt.mp3';
let sfxReady = false;
let sfxBuffer = null;
let tapSfxReady = false;
let tapSfxBuffer = null;
let audioCtx = null;

// AudioContext'i ilk kullanıcı etkileşiminde hazırla
function initAudioCtx() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Kaydırma sesi
    fetch(SWIPE_SFX_SRC)
        .then(r => r.arrayBuffer())
        .then(buf => audioCtx.decodeAudioData(buf))
        .then(decoded => { sfxBuffer = decoded; sfxReady = true; })
        .catch(() => { sfxReady = false; });

    // Tıklama sesi
    fetch(TAP_SFX_SRC)
        .then(r => r.arrayBuffer())
        .then(buf => audioCtx.decodeAudioData(buf))
        .then(decoded => { tapSfxBuffer = decoded; tapSfxReady = true; })
        .catch(() => { tapSfxReady = false; });
}

function playSwipeSfx() {
    if (!sfxReady || !sfxBuffer || !audioCtx) return;
    if (!carousel || carousel.dataset.sfx !== 'true') return;
    try {
        const source = audioCtx.createBufferSource();
        source.buffer = sfxBuffer;
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0.45;
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start(0);
    } catch(e) {}
}

function playTapSfx() {
    if (!tapSfxReady || !tapSfxBuffer || !audioCtx) return;
    if (!carousel || carousel.dataset.sfx !== 'true') return;
    try {
        const source = audioCtx.createBufferSource();
        source.buffer = tapSfxBuffer;
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0.7;
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start(0);
    } catch(e) {}
}

document.addEventListener('click', initAudioCtx, { once: true });
document.addEventListener('touchstart', initAudioCtx, { once: true });

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
    if (currentSongBtn === btn && currentAudio && !currentAudio.paused) return;
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

// --- Kart Geçiş Animasyonu ---
const ANIM_CLASSES = ['card-anim-enter-right','card-anim-enter-left','card-anim-exit-right','card-anim-exit-left'];

function clearAnimations(card) {
    card.classList.remove(...ANIM_CLASSES);
}

function animateCardTransition(oldIndex, newIndex) {
    const goingRight = newIndex > oldIndex;
    cards.forEach((card, i) => {
        clearAnimations(card);
        if (i === newIndex) {
            void card.offsetWidth;
            card.classList.add(goingRight ? 'card-anim-enter-right' : 'card-anim-enter-left');
        } else if (i === oldIndex) {
            void card.offsetWidth;
            card.classList.add(goingRight ? 'card-anim-exit-left' : 'card-anim-exit-right');
            setTimeout(() => clearAnimations(card), 320);
        }
    });
}

// --- UI Güncelleme ---
function updateUI(index, animate = false, playSfx = false) {
    const oldIndex = currentIndex;
    currentIndex = index;
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    if (titleEl) titleEl.textContent = cards[index]?.dataset.title || baseTitle;
    if (prevBtn) prevBtn.style.opacity = index === 0 ? '0.3' : '1';
    if (nextBtn) nextBtn.style.opacity = index === cards.length - 1 ? '0.3' : '1';

    if (animate && oldIndex !== index) animateCardTransition(oldIndex, index);
    if (playSfx && oldIndex !== index) playSwipeSfx();

    if (index !== lastPlayedIndex) {
        lastPlayedIndex = index;
        const currentCard = cards[index];
        if (currentCard) {
            const songBtn = currentCard.querySelector('.song-btn');
            if (songBtn) playSongBtn(songBtn);
            else stopAllSongs();
        }
    }
}

// --- Parmakla kaydırmada ses: dokunuşta hemen çal ---
let touchStartX = 0;
let sfxFiredThisSwipe = false;
if (carousel) {
    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        sfxFiredThisSwipe = false;
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
        if (!sfxFiredThisSwipe) {
            const dx = e.touches[0].clientX - touchStartX;
            if (Math.abs(dx) > 12) { // 12px eşiği geçince sesi hemen çal
                playSwipeSfx();
                sfxFiredThisSwipe = true;
            }
        }
    }, { passive: true });
}

// --- Scroll ile UI güncelleme (ses yok, sadece index takibi) ---
let scrollTimer = null;
if (carousel) {
    carousel.addEventListener('scroll', () => {
        const index = Math.round(carousel.scrollLeft / carousel.offsetWidth);
        if (index !== currentIndex) {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                updateUI(index, false, false);
            }, 80);
        }
    });
}

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            carousel.scrollTo({ left: newIndex * carousel.offsetWidth, behavior: 'smooth' });
            updateUI(newIndex, true, true);
        }
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        if (currentIndex < cards.length - 1) {
            const newIndex = currentIndex + 1;
            carousel.scrollTo({ left: newIndex * carousel.offsetWidth, behavior: 'smooth' });
            updateUI(newIndex, true, true);
        }
    });
}

dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
        carousel.scrollTo({ left: i * carousel.offsetWidth, behavior: 'smooth' });
        updateUI(i, true, true);
    });
});

document.querySelectorAll('.song-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (currentSongBtn === this && currentAudio && !currentAudio.paused) stopAllSongs();
        else playSongBtn(this);
    });
});

// --- Sayfa geçiş efekti (karta tıklayınca) ---
document.querySelectorAll('a.menu-img-btn').forEach(link => {
    link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        e.preventDefault();
        playTapSfx();
        const overlay = document.createElement('div');
        overlay.className = 'page-transition-overlay';
        document.body.appendChild(overlay);
        this.style.transition = 'transform 0.22s ease, opacity 0.22s ease';
        this.style.transform = 'scale(0.95)';
        this.style.opacity = '0.7';
        setTimeout(() => { window.location.href = href; }, 320);
    });
});

// Tarayıcı yedek: Ekrana ilk dokunmada şarkıyı başlat
document.addEventListener('click', () => {
    if (lastPlayedIndex === 0 && currentAudio === null) {
        const firstCard = cards[0];
        if (firstCard) {
            const firstBtn = firstCard.querySelector('.song-btn');
            if (firstBtn) playSongBtn(firstBtn);
        }
    }
}, { once: true });

// URL hash varsa o karta git (örn. meyveler_menu.html#1)
const _hashIdx = parseInt(window.location.hash.slice(1));
const startIndex = (!isNaN(_hashIdx) && _hashIdx > 0 && _hashIdx < cards.length) ? _hashIdx : 0;
updateUI(startIndex);
if (startIndex > 0) {
    requestAnimationFrame(() => {
        if (carousel) carousel.scrollLeft = startIndex * carousel.offsetWidth;
    });
}
