// ============================================================
//  Ulaşım Araçlarını Tanıyalım — Puzzle Oyunu
//  Her araç 4 parçaya (2×2) bölünür, sürükle-bırak ile birleştirilir.
// ============================================================

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

// 2×2 grid: her parçanın CSS background-position değeri
const PIECE_DEFS = [
    { id: 'tl', bgPos: '0% 0%'     },   // Sol Üst
    { id: 'tr', bgPos: '100% 0%'   },   // Sağ Üst
    { id: 'bl', bgPos: '0% 100%'   },   // Sol Alt
    { id: 'br', bgPos: '100% 100%' },   // Sağ Alt
];

let currentVehicleIdx = 0;
let placedCount       = 0;
let locked            = false;
let draggedPieceId    = null;
let showHintOnAudio   = true;   // komut sesi bitince ipucu göster
let currentAudio      = null;
let _touchClone       = null;
let _touchPieceId     = null;

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

// Sırayla ses çalar, hepsi bitince onDone
function playSequential(srcs, onDone) {
    if (!srcs.length) { onDone && onDone(); return; }
    const [first, ...rest] = srcs;
    const a = new Audio(first);
    const next = () => playSequential(rest, onDone);
    a.onended = next;
    a.onerror = next;
    a.play().catch(next);
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

// ---- Araç Render ----

function renderVehicle(idx) {
    currentVehicleIdx = idx;
    placedCount       = 0;
    locked            = false;
    showHintOnAudio   = true;

    const vehicle = VEHICLES[idx];
    const imgSrc  = `assets/images/ulasim/${vehicle.id}.webp`;

    document.getElementById('vehicle-label').textContent = vehicle.label;
    buildProgressBar();

    // Hedef grid: 4 boş slot
    const grid = document.getElementById('target-grid');
    grid.innerHTML = '';
    PIECE_DEFS.forEach(pd => {
        const slot = document.createElement('div');
        slot.classList.add('puzzle-slot');
        slot.dataset.pieceId = pd.id;
        slot.dataset.bgPos   = pd.bgPos;
        slot.dataset.imgSrc  = imgSrc;
        slot.textContent     = '?';

        slot.addEventListener('dragover',  e => { e.preventDefault(); slot.classList.add('drag-over'); });
        slot.addEventListener('dragleave', ()  => slot.classList.remove('drag-over'));
        slot.addEventListener('drop', e => {
            e.preventDefault();
            slot.classList.remove('drag-over');
            onDrop(pd.id, slot, imgSrc, pd.bgPos);
        });

        grid.appendChild(slot);
    });

    // Parça havuzu: karışık 4 parça
    const pool = document.getElementById('pieces-pool');
    pool.innerHTML = '';
    shuffleArray([...PIECE_DEFS]).forEach(pd => {
        pool.appendChild(createPiece(pd, imgSrc));
    });

    // Komut sesini çal
    setTimeout(() => {
        const audio = playAudio(`assets/sounds/ulasim_komut_${vehicle.id}.mp3`);
        audio.onended = () => {
            if (showHintOnAudio) showDragHint();
        };
    }, 400);
}

function createPiece(pd, imgSrc) {
    const piece = document.createElement('div');
    piece.classList.add('puzzle-piece');
    piece.dataset.pieceId = pd.id;
    piece.setAttribute('draggable', 'true');
    piece.style.backgroundImage    = `url('${imgSrc}')`;
    piece.style.backgroundSize     = '200% 200%';
    piece.style.backgroundPosition = pd.bgPos;

    piece.addEventListener('dragstart', () => {
        const hand = document.getElementById('hand-hint');
        if (hand) hand.remove();
        draggedPieceId = pd.id;
        setTimeout(() => { piece.style.opacity = '0.35'; }, 0);
    });
    piece.addEventListener('dragend', () => { piece.style.opacity = ''; });

    addTouchSupport(piece, pd.id, imgSrc);
    return piece;
}

// ---- Sürükle-Bırak ----

function onDrop(slotPieceId, slotEl, imgSrc, bgPos) {
    if (locked || !draggedPieceId) return;
    const droppedId = draggedPieceId;
    draggedPieceId = null;

    if (droppedId === slotPieceId) {
        onCorrect(droppedId, slotEl, imgSrc, bgPos);
    } else {
        onWrong(droppedId);
    }
}

function onCorrect(pieceId, slotEl, imgSrc, bgPos) {
    // Slotu doldur
    slotEl.textContent = '';
    slotEl.classList.add('filled');
    slotEl.style.backgroundImage    = `url('${imgSrc}')`;
    slotEl.style.backgroundSize     = '200% 200%';
    slotEl.style.backgroundPosition = bgPos;
    slotEl.style.pointerEvents      = 'none';

    // Havuzdan parçayı kaldır
    const pool  = document.getElementById('pieces-pool');
    const piece = pool.querySelector(`[data-piece-id="${pieceId}"]`);
    if (piece) {
        piece.style.opacity = '';
        piece.classList.add('placed');
    }

    SND_ONAY.cloneNode().play();

    placedCount++;
    if (placedCount === PIECE_DEFS.length) {
        locked = true;
        setTimeout(onVehicleComplete, 700);
    }
}

function onWrong(pieceId) {
    SND_DAT.cloneNode().play();
    const pool  = document.getElementById('pieces-pool');
    setTimeout(() => {
        const piece = pool.querySelector(`[data-piece-id="${pieceId}"]`);
        if (piece) {
            piece.style.opacity = '';
            piece.classList.add('shake');
            setTimeout(() => {
                piece.classList.remove('shake');
                showDragHint();
            }, 500);
        }
    }, 40);
}

// ---- Dokunma (Touch) Desteği ----

function addTouchSupport(piece, pieceId, imgSrc) {
    piece.addEventListener('touchstart', e => {
        e.preventDefault();
        if (locked || piece.classList.contains('placed')) return;
        const hand = document.getElementById('hand-hint');
        if (hand) hand.remove();
        _touchPieceId = pieceId;
        piece.style.opacity = '0.35';

        _touchClone = piece.cloneNode(true);
        _touchClone.style.cssText = `
            position:fixed; pointer-events:none; opacity:0.85; z-index:9999;
            width:${piece.offsetWidth}px; height:${piece.offsetHeight}px;
            background-image:url('${imgSrc}');
            background-size:200% 200%;
            background-position:${piece.style.backgroundPosition};
            border-radius:10px; border:3px solid #3b82f6;
        `;
        document.body.appendChild(_touchClone);
    }, { passive: false });

    piece.addEventListener('touchmove', e => {
        e.preventDefault();
        if (!_touchClone) return;
        const t = e.touches[0];
        _touchClone.style.left = (t.clientX - _touchClone.offsetWidth  / 2) + 'px';
        _touchClone.style.top  = (t.clientY - _touchClone.offsetHeight / 2) + 'px';

        _touchClone.style.display = 'none';
        const el = document.elementFromPoint(t.clientX, t.clientY);
        _touchClone.style.display = '';

        document.querySelectorAll('.puzzle-slot').forEach(s => s.classList.remove('drag-over'));
        if (el) {
            const slot = el.closest && el.closest('.puzzle-slot');
            if (slot && !slot.classList.contains('filled')) slot.classList.add('drag-over');
        }
    }, { passive: false });

    piece.addEventListener('touchend', ev => {
        if (_touchClone) { _touchClone.remove(); _touchClone = null; }
        document.querySelectorAll('.puzzle-slot').forEach(s => s.classList.remove('drag-over'));
        if (!_touchPieceId) return;
        const pid = _touchPieceId;
        _touchPieceId = null;
        piece.style.opacity = '';
        if (locked || piece.classList.contains('placed')) return;

        const t  = ev.changedTouches[0];
        const el = document.elementFromPoint(t.clientX, t.clientY);
        if (!el) { onWrong(pid); return; }

        const slot = el.closest && el.closest('.puzzle-slot');
        if (slot && !slot.classList.contains('filled')) {
            draggedPieceId = pid;
            onDrop(slot.dataset.pieceId, slot, slot.dataset.imgSrc, slot.dataset.bgPos);
        } else {
            onWrong(pid);
        }
    });
}

// ---- El İpucu Animasyonu ----

function showDragHint() {
    showHintOnAudio = false;
    const existing = document.getElementById('hand-hint');
    if (existing) existing.remove();

    const pool = document.getElementById('pieces-pool');
    const firstPiece = pool.querySelector('.puzzle-piece:not(.placed)');
    if (!firstPiece) return;
    const pieceId = firstPiece.dataset.pieceId;

    const grid = document.getElementById('target-grid');
    const slot  = grid.querySelector(`.puzzle-slot[data-piece-id="${pieceId}"]`);
    if (!slot) return;

    const FONT_SIZE = 72;
    function getCenter(el) {
        const r = el.getBoundingClientRect();
        return {
            x: r.left + r.width  / 2 - FONT_SIZE / 2,
            y: r.top  + r.height * 0.25,
        };
    }

    const src  = getCenter(firstPiece);
    const tgt  = getCenter(slot);
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

    // Ekran dışından parçaya gel
    hand.animate([
        { transform: `translate(${src.x}px,${offY}px)` },
        { transform: `translate(${src.x}px,${src.y}px)` }
    ], { duration: 400, easing: 'ease-out', fill: 'forwards' }).onfinish = () => {

        // Parçaya tıkla (hafif sekme)
        hand.animate([
            { transform: `translate(${src.x}px,${src.y}px)`,      easing: 'ease-in'  },
            { transform: `translate(${src.x}px,${src.y + 20}px)`, easing: 'ease-out' },
            { transform: `translate(${src.x}px,${src.y}px)` }
        ], { duration: 350, fill: 'forwards' }).onfinish = () => {

            setTimeout(() => {
                // Slota sürükle
                hand.animate([
                    { transform: `translate(${src.x}px,${src.y}px)` },
                    { transform: `translate(${tgt.x}px,${tgt.y}px)` }
                ], { duration: 600, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => {

                    // Slota bırak (hafif sekme)
                    hand.animate([
                        { transform: `translate(${tgt.x}px,${tgt.y}px)`,      easing: 'ease-in'  },
                        { transform: `translate(${tgt.x}px,${tgt.y + 20}px)`, easing: 'ease-out' },
                        { transform: `translate(${tgt.x}px,${tgt.y}px)` }
                    ], { duration: 300, fill: 'forwards' }).onfinish = () => {

                        // Ekran dışına git
                        hand.animate([
                            { transform: `translate(${tgt.x}px,${tgt.y}px)` },
                            { transform: `translate(${src.x}px,${offY}px)` }
                        ], { duration: 400, easing: 'ease-in', fill: 'forwards' }).onfinish = () => hand.remove();
                    };
                };
            }, 200);
        };
    };
}

// ---- Araç Tamamlandı ----

function onVehicleComplete() {
    const vehicle = VEHICLES[currentVehicleIdx];

    // Önce araç sesi, ses bitince konfeti + tebrikler
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
