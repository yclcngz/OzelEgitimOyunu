// ============================================================
//  Ulaşım Araçlarını Tanıyalım
//  Üstte boş slotlar, altta karışık parçalar — sürükle-bırak
// ============================================================

window.MAX_LEVEL = 1;

const FINALE_VIDEO_SRC = 'assets/sounds/kutlama.mp4';
const SND_ONAY = new Audio('assets/sounds/onay.mp3');
const SND_DAT  = new Audio('assets/sounds/dat.mp3');

const VEHICLES = [
    { id: 'otobus',   label: 'Otobüs'   },
    { id: 'taksi',    label: 'Taksi'     },
    { id: 'tren',     label: 'Tren'      },
    { id: 'bisiklet', label: 'Bisiklet'  },
    { id: 'gemi',     label: 'Gemi'      },
    { id: 'ucak',     label: 'Uçak'      },
];

// Her slotun konumu ve hangi parçanın oraya ait olduğu
const SLOTS = [
    { id: 'tl', bgPos: '0% 0%'     },
    { id: 'tr', bgPos: '100% 0%'   },
    { id: 'bl', bgPos: '0% 100%'   },
    { id: 'br', bgPos: '100% 100%' },
];
const BGPOS = { tl: '0% 0%', tr: '100% 0%', bl: '0% 100%', br: '100% 100%' };

let currentVehicleIdx = 0;
let currentAudio      = null;
let placedCount       = 0;
let locked            = false;

// Sürükle state
let dragPieceEl       = null;
let dragPieceRect     = null;
let dragGhost         = null;
let dragStartX        = 0;
let dragStartY        = 0;

// ---- Yardımcılar ----

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function playAudio(src) {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    currentAudio = new Audio(src);
    currentAudio.play().catch(() => {});
    return currentAudio;
}

function buildProgressBar() {
    const bar = document.getElementById('progress-bar');
    bar.innerHTML = '';
    VEHICLES.forEach((v, i) => {
        const d = document.createElement('div');
        d.classList.add('prog-dot');
        if (i < currentVehicleIdx) d.classList.add('done');
        if (i === currentVehicleIdx) d.classList.add('active');
        bar.appendChild(d);
    });
}

// ---- Render ----

function renderVehicle(idx) {
    currentVehicleIdx = idx;
    placedCount       = 0;
    locked            = false;

    const vehicle = VEHICLES[idx];
    const imgSrc  = `assets/images/ulasim/${vehicle.id}.webp`;

    document.getElementById('vehicle-label').textContent = vehicle.label;
    buildProgressBar();

    // Slotları oluştur (sabit sıra: tl tr bl br)
    const slotGrid = document.getElementById('slot-grid');
    slotGrid.innerHTML = '';
    SLOTS.forEach(slot => {
        const el = document.createElement('div');
        el.classList.add('puzzle-slot');
        el.dataset.slot = slot.id;

        // Soluk rehber görsel
        const hint = document.createElement('div');
        hint.classList.add('slot-hint');
        hint.style.backgroundImage    = `url('${imgSrc}')`;
        hint.style.backgroundPosition = slot.bgPos;
        el.appendChild(hint);

        slotGrid.appendChild(el);
    });

    // Karışık parçaları tepside oluştur
    const shuffled = shuffleArray(['tl', 'tr', 'bl', 'br']);
    const tray = document.getElementById('piece-tray');
    tray.innerHTML = '';
    shuffled.forEach(pieceId => {
        const el = document.createElement('div');
        el.classList.add('puzzle-piece');
        el.dataset.piece = pieceId;
        el.style.backgroundImage    = `url('${imgSrc}')`;
        el.style.backgroundPosition = BGPOS[pieceId];
        el.addEventListener('pointerdown', (e) => onDragStart(e, el));
        tray.appendChild(el);
    });

    // Komut sesi
    setTimeout(() => {
        const audio = playAudio(`assets/sounds/ulasim_komut_${vehicle.id}.mp3`);
        audio.onended = () => showDragHint();
    }, 400);
}

// ---- Sürükle-Bırak ----

function onDragStart(e, pieceEl) {
    if (locked) return;
    e.preventDefault();

    const hand = document.getElementById('hand-hint');
    if (hand) hand.remove();

    dragPieceEl   = pieceEl;
    dragStartX    = e.clientX;
    dragStartY    = e.clientY;
    dragPieceRect = pieceEl.getBoundingClientRect();

    // Ghost oluştur
    dragGhost = document.createElement('div');
    dragGhost.style.cssText = `
        position: fixed;
        width: ${dragPieceRect.width}px;
        height: ${dragPieceRect.height}px;
        left: ${dragPieceRect.left}px;
        top: ${dragPieceRect.top}px;
        background-image: ${pieceEl.style.backgroundImage};
        background-size: 200% 200%;
        background-position: ${pieceEl.style.backgroundPosition};
        background-repeat: no-repeat;
        border-radius: 10px;
        border: 3px solid #fbbf24;
        box-shadow: 0 8px 28px rgba(0,0,0,0.5);
        pointer-events: none;
        z-index: 9999;
        opacity: 0.93;
        transform: scale(1.08);
        transform-origin: center;
    `;
    document.body.appendChild(dragGhost);

    pieceEl.style.opacity = '0.25';

    document.addEventListener('pointermove', onDragMove, { passive: false });
    document.addEventListener('pointerup',   onDragEnd);
    document.addEventListener('pointercancel', onDragCancel);
}

function onDragMove(e) {
    if (!dragGhost) return;
    e.preventDefault();
    dragGhost.style.left = `${dragPieceRect.left + (e.clientX - dragStartX)}px`;
    dragGhost.style.top  = `${dragPieceRect.top  + (e.clientY - dragStartY)}px`;
}

function onDragEnd(e) {
    cleanupListeners();
    if (!dragPieceEl) return;

    // Ghost'u geçici gizle, altındaki elementi bul
    dragGhost.style.display = 'none';
    const target = document.elementFromPoint(e.clientX, e.clientY);
    dragGhost.style.display = '';

    const slotEl = target?.closest('.puzzle-slot');

    if (slotEl && !slotEl.classList.contains('filled')) {
        const slotId  = slotEl.dataset.slot;
        const pieceId = dragPieceEl.dataset.piece;

        if (slotId === pieceId) {
            placeInSlot(slotEl, dragPieceEl);
            return;
        } else {
            SND_DAT.currentTime = 0;
            SND_DAT.play().catch(() => {});
        }
    }

    bounceBack();
}

function onDragCancel() {
    cleanupListeners();
    bounceBack();
}

function cleanupListeners() {
    document.removeEventListener('pointermove', onDragMove);
    document.removeEventListener('pointerup',   onDragEnd);
    document.removeEventListener('pointercancel', onDragCancel);
}

function bounceBack() {
    if (!dragGhost) { resetDrag(); return; }
    const fromLeft = parseFloat(dragGhost.style.left);
    const fromTop  = parseFloat(dragGhost.style.top);

    dragGhost.animate([
        { left: `${fromLeft}px`, top: `${fromTop}px` },
        { left: `${dragPieceRect.left}px`, top: `${dragPieceRect.top}px` }
    ], { duration: 240, easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
        if (dragGhost) { dragGhost.remove(); dragGhost = null; }
        if (dragPieceEl) { dragPieceEl.style.opacity = ''; dragPieceEl = null; }
    };
}

function placeInSlot(slotEl, pieceEl) {
    const slotRect   = slotEl.getBoundingClientRect();
    const fromLeft   = parseFloat(dragGhost.style.left);
    const fromTop    = parseFloat(dragGhost.style.top);
    const fromWidth  = parseFloat(dragGhost.style.width);
    const fromHeight = parseFloat(dragGhost.style.height);

    // Ghost'u slota doğru animasyonla götür
    dragGhost.animate([
        { left: `${fromLeft}px`,    top: `${fromTop}px`,    width: `${fromWidth}px`,   height: `${fromHeight}px`  },
        { left: `${slotRect.left}px`, top: `${slotRect.top}px`, width: `${slotRect.width}px`, height: `${slotRect.height}px` }
    ], { duration: 220, easing: 'ease-out', fill: 'forwards' }).onfinish = () => {
        dragGhost.remove();
        dragGhost = null;

        // Slotu doldur
        slotEl.classList.add('filled');
        slotEl.querySelector('.slot-hint').style.backgroundImage = pieceEl.style.backgroundImage;

        // Snap animasyonu
        slotEl.animate([
            { transform: 'scale(0.88)' },
            { transform: 'scale(1.06)' },
            { transform: 'scale(1)' }
        ], { duration: 280, easing: 'ease-out' });

        // Tray parçasını gizle
        pieceEl.classList.add('placed');
        dragPieceEl = null;

        SND_ONAY.currentTime = 0;
        SND_ONAY.play().catch(() => {});

        placedCount++;
        if (placedCount === 4) {
            locked = true;
            const hand = document.getElementById('hand-hint');
            if (hand) hand.remove();
            setTimeout(onVehicleComplete, 700);
        }
    };
}

function resetDrag() {
    if (dragPieceEl) { dragPieceEl.style.opacity = ''; dragPieceEl = null; }
    dragGhost = null;
}

// ---- El İpucu ----

function showDragHint() {
    const existing = document.getElementById('hand-hint');
    if (existing) existing.remove();
    if (locked) return;

    // İlk boş slotu ve eşleşen tray parçasını bul
    const emptySlot = document.querySelector('.puzzle-slot:not(.filled)');
    if (!emptySlot) return;
    const slotId    = emptySlot.dataset.slot;
    const pieceEl   = document.querySelector(`.puzzle-piece[data-piece="${slotId}"]:not(.placed)`);
    if (!pieceEl) return;

    const FONT_SIZE = 72;
    function center(el) {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2 - FONT_SIZE / 2, y: r.top + r.height / 2 - FONT_SIZE / 2 };
    }

    const src  = center(pieceEl);
    const tgt  = center(emptySlot);
    const offY = window.innerHeight + 100;

    const hand = document.createElement('div');
    hand.id = 'hand-hint';
    hand.innerHTML = '👆';
    hand.style.cssText = `
        position:fixed; font-size:${FONT_SIZE}px; pointer-events:none; z-index:9999;
        left:0; top:0; transform:translate(${src.x}px,${offY}px);
        will-change:transform; filter:drop-shadow(2px 4px 6px rgba(0,0,0,.4));
    `;
    document.body.appendChild(hand);

    hand.animate([
        { transform: `translate(${src.x}px,${offY}px)` },
        { transform: `translate(${src.x}px,${src.y}px)` }
    ], { duration: 400, easing: 'ease-out', fill: 'forwards' }).onfinish = () => {
        hand.animate([
            { transform: `translate(${src.x}px,${src.y}px) scale(1)` },
            { transform: `translate(${src.x}px,${src.y}px) scale(0.8)` }
        ], { duration: 180, fill: 'forwards' }).onfinish = () => {
            hand.animate([
                { transform: `translate(${src.x}px,${src.y}px) scale(0.8)` },
                { transform: `translate(${tgt.x}px,${tgt.y}px) scale(0.8)` }
            ], { duration: 550, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => {
                hand.animate([
                    { transform: `translate(${tgt.x}px,${tgt.y}px) scale(0.8)` },
                    { transform: `translate(${tgt.x}px,${tgt.y}px) scale(1)` }
                ], { duration: 180, fill: 'forwards' }).onfinish = () => {
                    setTimeout(() => {
                        hand.animate([
                            { transform: `translate(${tgt.x}px,${tgt.y}px)` },
                            { transform: `translate(${src.x}px,${offY}px)` }
                        ], { duration: 380, easing: 'ease-in', fill: 'forwards' }).onfinish = () => hand.remove();
                    }, 300);
                };
            };
        };
    };
}

// ---- Araç Tamamlandı ----

function onVehicleComplete() {
    const vehicle = VEHICLES[currentVehicleIdx];
    const vehicleAudio = new Audio(`assets/sounds/ulasim_ses_${vehicle.id}.mp3`);

    function popConfetti() {
        new Audio('assets/sounds/pat.mp3').play().catch(() => {});
        confetti({ particleCount: 150, spread: 110, origin: { y: 0.5 } });
    }

    function afterVehicleSound() {
        const next = currentVehicleIdx + 1;
        popConfetti();
        setTimeout(popConfetti, 450);
        setTimeout(() => {
            popConfetti();
            setTimeout(() => {
                if (next < VEHICLES.length) {
                    renderVehicle(next);
                } else {
                    showGameEnd();
                }
            }, 2000);
        }, 900);
    }

    vehicleAudio.onended = afterVehicleSound;
    vehicleAudio.onerror = afterVehicleSound;
    vehicleAudio.play().catch(afterVehicleSound);
}

// ---- Oyun Sonu ----

function showGameEnd() {
    const overlay = document.getElementById('celebration-overlay');
    const content = overlay.querySelector('.celebration-content');
    overlay.classList.remove('hidden');

    content.innerHTML = `
        <video id="finale-video" src="${FINALE_VIDEO_SRC}" autoplay playsinline
               style="position:fixed;top:0;left:0;width:100vw;height:100vh;object-fit:cover;z-index:101;"></video>
    `;
    content.className  = 'celebration-content';
    content.style.cssText = 'width:100%;height:100%;';

    const vid = content.querySelector('#finale-video');
    function showButtons() {
        vid.remove();
        content.style.cssText = '';
        content.innerHTML = `
            <div class="end-game-buttons">
                <button class="play-again-btn"   onclick="location.reload()">🔄 Tekrar Oyna</button>
                <button class="back-to-menu-btn" onclick="window.location.href='nesneler_menu.html#2'">⬅ Menüye Dön</button>
            </div>
        `;
    }
    vid.onended = showButtons;
    vid.onerror = showButtons;
}

// ---- Başlat ----

window.onload = () => renderVehicle(0);
