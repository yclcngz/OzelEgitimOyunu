// ============================================================
//  Yapboz Oyunu
//  5 geometrik şekil, her şekil parçalara bölünmüş.
//  Sürükle-bırak ile parçaları doğru slota yerleştir.
//  Koordinatlar 260x260 viewBox içindir.
// ============================================================

const SND_BASE = 'assets/sounds/yapboz/';
const FINALE_VIDEO_SRC = 'assets/sounds/oyun_sonlari_tebrik animasyonu.mp4';
const SND_ONAY = new Audio('assets/sounds/onay.mp3');
const SND_DAT  = new Audio('assets/sounds/dat.mp3');

// Her şekil: pieces dizisi { id, path (SVG path) }
// path hem hedef slot hem parça SVG için kullanılır.
const SHAPES = [
    {
        id: 'ucgen', label: 'Üçgen', color: '#f59e0b',
        completionAudio: 'ucgen_tamam.mp3',
        pieces: [
            { id: 'p1', path: 'M130,20 L240,230 L130,230 Z', label: 'Sağ' },
            { id: 'p2', path: 'M130,20 L130,230 L20,230 Z',  label: 'Sol' }
        ]
    },
    {
        id: 'kare', label: 'Kare', color: '#3b82f6',
        completionAudio: 'kare_tamam.mp3',
        pieces: [
            { id: 'p1', path: 'M30,30 L230,30 L230,130 L30,130 Z', label: 'Üst' },
            { id: 'p2', path: 'M30,130 L230,130 L230,230 L30,230 Z', label: 'Alt' },
        ]
    },
    {
        id: 'kalp', label: 'Kalp', color: '#ec4899',
        completionAudio: 'kalp_tamam.mp3',
        pieces: [
            // Sol yarım kalp
            { id: 'p1', path: 'M130,220 C60,170 10,120 10,80 C10,45 40,20 75,20 C100,20 120,35 130,55 L130,220 Z', label: 'Sol' },
            // Sağ yarım kalp
            { id: 'p2', path: 'M130,220 C200,170 250,120 250,80 C250,45 220,20 185,20 C160,20 140,35 130,55 L130,220 Z', label: 'Sağ' }
        ]
    },
    {
        id: 'yildiz', label: 'Yıldız', color: '#eab308',
        completionAudio: 'yildiz_tamam.mp3',
        // Yıldızı 2 parçaya böl: üst 3 köşe + alt 2 köşe (merkez dahil)
        pieces: (function() {
            function starPoint(i, outer) {
                const angle = (i * Math.PI / 5) - Math.PI / 2;
                const r = outer ? 120 : 50;
                return { x: Math.round(130 + r * Math.cos(angle)), y: Math.round(130 + r * Math.sin(angle)) };
            }
            // 5 dış köşe + 5 iç köşe alternatif
            const pts = [];
            for (let i = 0; i < 10; i++) {
                pts.push(starPoint(i, i % 2 === 0));
            }
            const all = pts.map(p => `${p.x},${p.y}`).join(' ');
            // Üst yarı (köşe 0,1,2,3,4 + iç noktalar)
            const topPath = `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y} L${pts[2].x},${pts[2].y} L${pts[3].x},${pts[3].y} L${pts[4].x},${pts[4].y} L${pts[5].x},${pts[5].y} L130,130 L${pts[9].x},${pts[9].y} Z`;
            const botPath = `M${pts[5].x},${pts[5].y} L${pts[6].x},${pts[6].y} L${pts[7].x},${pts[7].y} L${pts[8].x},${pts[8].y} L${pts[9].x},${pts[9].y} L130,130 Z`;
            return [
                { id: 'p1', path: topPath, label: 'Üst' },
                { id: 'p2', path: botPath, label: 'Alt' }
            ];
        })()
    },
    {
        id: 'daire', label: 'Daire', color: '#22c55e',
        completionAudio: 'daire_tamam.mp3',
        pieces: [
            // Sol yarım daire
            { id: 'p1', path: 'M130,20 A110,110 0 0,0 130,240 Z', label: 'Sol' },
            // Sağ yarım daire
            { id: 'p2', path: 'M130,20 A110,110 0 0,1 130,240 Z', label: 'Sağ' }
        ]
    }
];

let currentShapeIdx = 0;
let placedCount = 0;
let locked = false;
let draggedPieceId = null;
let _touchClone = null;
let _touchPieceEl = null;
let instructionAudio = null;

const targetSvg = document.getElementById('target-svg');
const pool = document.getElementById('pieces-pool');

function playAudio(src) {
    if (instructionAudio) { instructionAudio.pause(); instructionAudio = null; }
    instructionAudio = new Audio(src);
    instructionAudio.play().catch(() => {});
    return instructionAudio;
}

function buildProgressBar() {
    const bar = document.getElementById('progress-bar');
    bar.innerHTML = '';
    SHAPES.forEach((s, i) => {
        const d = document.createElement('div');
        d.classList.add('prog-dot');
        if (i < currentShapeIdx) d.classList.add('done');
        if (i === currentShapeIdx) d.classList.add('active');
        bar.appendChild(d);
    });
}

// --- ŞEKİL RENDER ---
function renderShape(idx) {
    currentShapeIdx = idx;
    placedCount = 0;
    locked = false;
    const shape = SHAPES[idx];

    document.getElementById('shape-label').textContent = shape.label;
    buildProgressBar();

    // Hedef SVG: slot'ları göster
    targetSvg.innerHTML = '';
    shape.pieces.forEach(piece => {
        const slotEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        slotEl.setAttribute('d', piece.path);
        slotEl.classList.add('slot');
        slotEl.dataset.pieceId = piece.id;
        slotEl.style.setProperty('--piece-color', shape.color);
        slotEl.addEventListener('dragover', e => { e.preventDefault(); slotEl.style.opacity = '0.7'; });
        slotEl.addEventListener('dragleave', () => { slotEl.style.opacity = ''; });
        slotEl.addEventListener('drop', e => { e.preventDefault(); slotEl.style.opacity = ''; onDropSlot(piece.id, slotEl); });
        targetSvg.appendChild(slotEl);
    });

    // Parça havuzu
    pool.innerHTML = '';
    const shuffled = shuffleArray([...shape.pieces]);
    shuffled.forEach(piece => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('piece-wrapper');
        wrapper.dataset.pieceId = piece.id;
        wrapper.setAttribute('draggable', 'true');

        // Mini SVG her parça için
        const size = 90;
        wrapper.innerHTML = `
            <svg class="piece-svg" width="${size}" height="${size}" viewBox="0 0 260 260">
                <path d="${piece.path}" fill="${shape.color}" stroke="white" stroke-width="4" stroke-linejoin="round"/>
            </svg>
        `;

        wrapper.addEventListener('dragstart', e => {
            draggedPieceId = piece.id;
            setTimeout(() => wrapper.style.opacity = '0.5', 0);
        });
        wrapper.addEventListener('dragend', () => { wrapper.style.opacity = '1'; });
        addTouchSupport(wrapper, piece.id);

        pool.appendChild(wrapper);
    });

    // Komut sesi
    setTimeout(() => playAudio(`${SND_BASE}yapboz_komut.mp3`), 400);
}

// --- SLOT'A BIRAK ---
function onDropSlot(slotPieceId, slotEl) {
    if (locked) return;
    if (!draggedPieceId) return;

    if (draggedPieceId === slotPieceId) {
        onCorrectPlace(slotPieceId, slotEl);
    } else {
        onWrongPlace(draggedPieceId);
    }
    draggedPieceId = null;
}

function onCorrectPlace(pieceId, slotEl) {
    // Slot'u doldur
    slotEl.classList.add('filled');
    slotEl.style.pointerEvents = 'none';

    // Havuzdan parçayı kaldır
    const wrapper = pool.querySelector(`[data-piece-id="${pieceId}"]`);
    if (wrapper) wrapper.classList.add('placed');

    SND_ONAY.cloneNode().play();
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });

    placedCount++;
    const shape = SHAPES[currentShapeIdx];

    if (placedCount === shape.pieces.length) {
        locked = true;
        setTimeout(() => {
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
            const audio = playAudio(`${SND_BASE}${shape.completionAudio}`);
            audio.onended = () => {
                setTimeout(() => {
                    currentShapeIdx++;
                    if (currentShapeIdx < SHAPES.length) {
                        renderShape(currentShapeIdx);
                    } else {
                        showGameEnd();
                    }
                }, 600);
            };
            audio.onerror = () => {
                setTimeout(() => {
                    currentShapeIdx++;
                    if (currentShapeIdx < SHAPES.length) renderShape(currentShapeIdx);
                    else showGameEnd();
                }, 1500);
            };
        }, 500);
    }
}

function onWrongPlace(pieceId) {
    SND_DAT.cloneNode().play();
    const wrapper = pool.querySelector(`[data-piece-id="${pieceId}"]`);
    if (wrapper) {
        wrapper.classList.add('shake');
        wrapper.style.opacity = '1';
        setTimeout(() => wrapper.classList.remove('shake'), 500);
    }
}

// --- TOUCH ---
function addTouchSupport(wrapper, pieceId) {
    wrapper.addEventListener('touchstart', e => {
        e.preventDefault();
        if (locked || wrapper.classList.contains('placed')) return;
        _touchPieceEl = wrapper;
        wrapper.style.opacity = '0.5';

        _touchClone = wrapper.cloneNode(true);
        _touchClone.style.cssText = `
            position:fixed; pointer-events:none; opacity:0.85; z-index:9999;
            width:${wrapper.offsetWidth}px; height:${wrapper.offsetHeight}px;
        `;
        document.body.appendChild(_touchClone);
    }, { passive: false });

    wrapper.addEventListener('touchmove', e => {
        e.preventDefault();
        if (!_touchClone) return;
        const t = e.touches[0];
        _touchClone.style.left = (t.clientX - _touchClone.offsetWidth / 2) + 'px';
        _touchClone.style.top  = (t.clientY - _touchClone.offsetHeight / 2) + 'px';

        _touchClone.style.display = 'none';
        const el = document.elementFromPoint(t.clientX, t.clientY);
        _touchClone.style.display = '';

        targetSvg.querySelectorAll('.slot').forEach(s => s.style.opacity = '');
        if (el) {
            const slot = el.closest ? el.closest('.slot') : null;
            if (slot) slot.style.opacity = '0.7';
        }
    }, { passive: false });

    wrapper.addEventListener('touchend', ev => {
        if (_touchClone) { _touchClone.remove(); _touchClone = null; }
        targetSvg.querySelectorAll('.slot').forEach(s => s.style.opacity = '');
        if (!_touchPieceEl) return;
        const w = _touchPieceEl;
        _touchPieceEl = null;
        w.style.opacity = '1';
        if (locked || w.classList.contains('placed')) return;

        const t = ev.changedTouches[0];
        _touchClone = null;
        const el = document.elementFromPoint(t.clientX, t.clientY);
        if (!el) return;

        const slot = el.closest ? el.closest('.slot') : null;
        if (slot) {
            draggedPieceId = pieceId;
            onDropSlot(slot.dataset.pieceId, slot);
        } else {
            onWrongPlace(pieceId);
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
                <button class="back-to-menu-btn" onclick="window.location.href='sekiller_menu.html'">⬅ Menüye Dön</button>
            </div>
        `;
    }
    vid.onended = showButtons;
    vid.onerror = showButtons;
}

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Tekrar sesi
document.getElementById('replay-btn').addEventListener('click', () => {
    playAudio(`${SND_BASE}yapboz_komut.mp3`);
});

// BAŞLAT
renderShape(0);
