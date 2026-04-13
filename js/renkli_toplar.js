// 8 Renk verisi
const RENKLER = [
    { id: 'mavi',    hex: '#3498db', highlight: '#74b9e8', label: 'Mavi' },
    { id: 'mor',     hex: '#9b59b6', highlight: '#c084d8', label: 'Mor' },
    { id: 'kirmizi', hex: '#e74c3c', highlight: '#f1948a', label: 'Kırmızı' },
    { id: 'sari',    hex: '#f1c40f', highlight: '#f9e566', label: 'Sarı' },
    { id: 'siyah',   hex: '#2c3e50', highlight: '#566573', label: 'Siyah' },
    { id: 'turuncu', hex: '#e67e22', highlight: '#f0a05a', label: 'Turuncu' },
    { id: 'beyaz',   hex: '#ecf0f1', highlight: '#ffffff', label: 'Beyaz' },
    { id: 'yesil',   hex: '#2ecc71', highlight: '#82e0aa', label: 'Yeşil' }
];

// Ses yolları
const SND_BASE = 'assets/sounds/renkli_toplar/';
const SND_ONAY = new Audio('assets/sounds/onay.mp3');
const SND_DAT  = new Audio('assets/sounds/dat.mp3');
const FINALE_VIDEO_SRC = 'assets/sounds/oyun_sonlari_tebrik animasyonu.mp4';

let commandOrder = [];   // Karışık sıradaki renk ID'leri
let currentIdx   = 0;    // Şu anki komut sırası
let locked       = false; // İşlem sırasında input engelle
let commandAudio = null;

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// --- TOP OLUŞTUR ---
function createBalls() {
    const container = document.getElementById('balls-container');
    container.innerHTML = '';

    RENKLER.forEach(renk => {
        const ball = document.createElement('div');
        ball.classList.add('ball');
        ball.dataset.id = renk.id;

        // 3D gradient efekti
        ball.style.background = `
            radial-gradient(circle at 35% 30%, ${renk.highlight} 0%, ${renk.hex} 55%, color-mix(in srgb, ${renk.hex} 70%, black) 100%)
        `;
        if (renk.id === 'beyaz') {
            ball.style.border = '2px solid #ccc';
        }

        ball.setAttribute('draggable', 'true');
        ball.addEventListener('dragstart', onDragStart);
        addTouchSupport(ball);

        container.appendChild(ball);
    });
}

// --- KOMUT ---
function showCommand(renk) {
    const dot  = document.getElementById('command-color-dot');
    const text = document.getElementById('command-text');

    dot.style.background = renk.hex;
    if (renk.id === 'beyaz') dot.style.border = '2px solid #aaa';
    text.textContent = `${renk.label} topu sepete koy`;
}

function playCommandAudio(renk) {
    if (commandAudio) { commandAudio.pause(); commandAudio.currentTime = 0; }
    commandAudio = new Audio(`${SND_BASE}${renk.id}_topu_koy.mp3`);
    commandAudio.play().catch(() => {});
}

function nextCommand() {
    if (currentIdx >= commandOrder.length) { showGameEnd(); return; }
    locked = false;
    const renk = RENKLER.find(r => r.id === commandOrder[currentIdx]);
    showCommand(renk);
    setTimeout(() => playCommandAudio(renk), 300);
}

// --- DOĞRU TOP ---
function onCorrectDrop(ball) {
    locked = true;
    ball.classList.add('placed');

    SND_ONAY.cloneNode().play();
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

    const basket = document.getElementById('basket-drop');
    basket.classList.add('correct-flash');
    setTimeout(() => basket.classList.remove('correct-flash'), 500);

    currentIdx++;
    setTimeout(nextCommand, 1400);
}

// --- YANLIŞ TOP ---
function onWrongDrop(ball) {
    locked = true;
    SND_DAT.cloneNode().play();
    ball.classList.add('shake');

    // Hata sesi: "Hayır bu top [renk]"
    const wrongId = ball.dataset.id;
    setTimeout(() => {
        const errAudio = new Audio(`${SND_BASE}hayir_${wrongId}.mp3`);
        errAudio.play().catch(() => {});
    }, 300);

    setTimeout(() => {
        ball.classList.remove('shake');
        locked = false;
    }, 900);
}

// --- DRAG EVENTS (Mouse) ---
let draggedBallId = null;

function onDragStart(e) {
    draggedBallId = e.target.dataset.id;
    setTimeout(() => e.target.style.opacity = '0.5', 0);
}

document.addEventListener('dragend', e => {
    if (e.target.classList.contains('ball')) e.target.style.opacity = '1';
});

const basket = document.getElementById('basket-drop');

basket.addEventListener('dragover', e => {
    e.preventDefault();
    basket.classList.add('drag-over');
});

basket.addEventListener('dragleave', () => basket.classList.remove('drag-over'));

basket.addEventListener('drop', e => {
    e.preventDefault();
    basket.classList.remove('drag-over');
    if (locked) return;

    const ball = document.querySelector(`.ball[data-id="${draggedBallId}"]`);
    if (!ball || ball.classList.contains('placed')) return;
    ball.style.opacity = '1';

    const expected = commandOrder[currentIdx];
    if (draggedBallId === expected) {
        onCorrectDrop(ball);
    } else {
        onWrongDrop(ball);
    }
});

// --- TOUCH EVENTS ---
let _clone = null;
let _activeBall = null;

function addTouchSupport(ball) {
    ball.addEventListener('touchstart', e => {
        e.preventDefault();
        if (locked || ball.classList.contains('placed')) return;
        _activeBall = ball;
        ball.style.opacity = '0.5';

        _clone = ball.cloneNode(true);
        _clone.style.cssText = `
            position:fixed; pointer-events:none; opacity:0.85; z-index:9999;
            width:${ball.offsetWidth}px; height:${ball.offsetHeight}px;
            border-radius:50%; transform:scale(1.1);
        `;
        document.body.appendChild(_clone);
    }, { passive: false });

    ball.addEventListener('touchmove', e => {
        e.preventDefault();
        if (!_clone) return;
        const t = e.touches[0];
        _clone.style.left = (t.clientX - _clone.offsetWidth / 2) + 'px';
        _clone.style.top  = (t.clientY - _clone.offsetHeight / 2) + 'px';

        // Sepet üzerindeyse vurgula
        _clone.style.display = 'none';
        const el = document.elementFromPoint(t.clientX, t.clientY);
        _clone.style.display = '';
        basket.classList.toggle('drag-over', el === basket || basket.contains(el));
    }, { passive: false });

    ball.addEventListener('touchend', ev => {
        if (_clone) { _clone.remove(); _clone = null; }
        basket.classList.remove('drag-over');
        if (!_activeBall) return;
        const b = _activeBall;
        _activeBall = null;
        b.style.opacity = '1';
        if (locked || b.classList.contains('placed')) return;

        const t = ev.changedTouches[0];
        const el = document.elementFromPoint(t.clientX, t.clientY);
        if (el === basket || basket.contains(el)) {
            const expected = commandOrder[currentIdx];
            if (b.dataset.id === expected) {
                onCorrectDrop(b);
            } else {
                onWrongDrop(b);
            }
        }
    });
}

// --- OYUN SONU ---
function showGameEnd() {
    const overlay = document.getElementById('celebration-overlay');
    const content = overlay.querySelector('.celebration-content');
    overlay.classList.remove('hidden');

    content.innerHTML = `
        <video id="finale-video" src="${FINALE_VIDEO_SRC}" autoplay playsinline
               style="position:fixed;top:0;left:0;width:100vw;height:100vh;object-fit:cover;z-index:101;"></video>
    `;
    content.className = 'celebration-content';
    content.style.cssText = 'width:100%;height:100%;';

    const vid = content.querySelector('#finale-video');
    function showButtons() {
        vid.remove();
        content.style.cssText = '';
        content.innerHTML = `
            <div class="end-game-buttons">
                <button class="play-again-btn" onclick="location.reload()">🔄 Tekrar Oyna</button>
                <button class="back-to-menu-btn" onclick="window.location.href='renkler_menu.html'">⬅ Menüye Dön</button>
            </div>
        `;
    }
    vid.onended = showButtons;
    vid.onerror = showButtons;
}

// --- TEKRAR DİNLE ---
document.getElementById('replay-btn').addEventListener('click', () => {
    if (currentIdx < commandOrder.length) {
        const renk = RENKLER.find(r => r.id === commandOrder[currentIdx]);
        if (renk) playCommandAudio(renk);
    }
});

// --- BAŞLAT ---
function initGame() {
    commandOrder = shuffleArray(RENKLER.map(r => r.id));
    currentIdx = 0;
    locked = false;
    createBalls();
    nextCommand();
}

initGame();
