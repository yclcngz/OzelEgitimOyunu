// ============================================================
//  Noktaları Birleştir Oyunu — v2
//  Sürükleyerek çizme mekaniği
//  Her kenarda 6 nokta, parmak kaldırınca ilerleme korunur
// ============================================================

const SND_BASE = 'assets/sounds/';
const FINALE_VIDEO_SRC = 'assets/sounds/kutlama.mp4';
const SND_ONAY = new Audio('assets/sounds/onay.mp3');

const SNAP = 30; // SVG birimi — nokta yakalama mesafesi

// --- YARDIMCI FONKSİYONLAR ---

function edgeDots(p1, p2, n) {
    // n segment → n nokta (p1 dahil, p2 hariç)
    const pts = [];
    for (let i = 0; i < n; i++) {
        pts.push({
            x: p1.x + (p2.x - p1.x) * i / n,
            y: p1.y + (p2.y - p1.y) * i / n
        });
    }
    return pts;
}

function polyDots(corners, n) {
    // Kapalı çokgen kenarlarına n nokta/kenar yerleştir
    const pts = [];
    for (let i = 0; i < corners.length; i++) {
        const next = corners[(i + 1) % corners.length];
        pts.push(...edgeDots(corners[i], next, n));
    }
    return pts;
}

function circleDots(cx, cy, r, count) {
    const pts = [];
    for (let i = 0; i < count; i++) {
        const a = (i / count) * 2 * Math.PI - Math.PI / 2;
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    return pts;
}

function heartDots(cx, cy, scale, count) {
    // t=π'den başla → alt ucundan çizmeye başlasın
    const pts = [];
    for (let i = 0; i < count; i++) {
        const t = (i / count) * 2 * Math.PI + Math.PI;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        pts.push({ x: cx + x * scale, y: cy - y * scale });
    }
    return pts;
}

function starDots(cx, cy, R, r, points, n) {
    const corners = [];
    for (let i = 0; i < points * 2; i++) {
        const a = (i * Math.PI / points) - Math.PI / 2;
        const rad = i % 2 === 0 ? R : r;
        corners.push({ x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) });
    }
    return polyDots(corners, n);
}

function makeSVGEl(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

// --- ŞEKILLER ---
// viewBox: 0 0 400 400

const SHAPES = [
    {
        id: 'ucgen', label: 'Üçgen', color: '#f59e0b',
        completionAudio: 'ucgen_tamam.mp3',
        // 3 köşe × 6 nokta/kenar = 18 nokta
        dots: polyDots([{ x: 200, y: 25 }, { x: 375, y: 365 }, { x: 25, y: 365 }], 6)
    },
    {
        id: 'kare', label: 'Kare', color: '#3b82f6',
        completionAudio: 'kare_tamam.mp3',
        // 4 köşe × 6 nokta/kenar = 24 nokta
        dots: polyDots([{ x: 40, y: 40 }, { x: 360, y: 40 }, { x: 360, y: 360 }, { x: 40, y: 360 }], 6)
    },
    {
        id: 'daire', label: 'Daire', color: '#22c55e',
        completionAudio: 'daire_tamam.mp3',
        // Çember üzerinde 20 nokta
        dots: circleDots(200, 200, 165, 20)
    },
    {
        id: 'kalp', label: 'Kalp', color: '#ec4899',
        completionAudio: 'kalp_tamam.mp3',
        // Kalp parametrik eğrisinden 24 nokta
        dots: heartDots(200, 195, 11, 24)
    },
    {
        id: 'yildiz', label: 'Yıldız', color: '#eab308',
        completionAudio: 'yildiz_tamam.mp3',
        // 5 köşeli yıldız, 10 kenar × 3 nokta/kenar = 30 nokta
        dots: starDots(200, 200, 165, 65, 5, 3)
    }
];

// --- OYUN DURUMU ---
let currentShapeIdx = 0;
let nextDotIdx = 0;
let isDragging = false;
let connectedPts = [];
let dotEls = [];
let drawnPath = null;
let cursorLine = null;
let instructionAudio = null;
let isFirstShape = true;

const svg = document.getElementById('game-svg');

// --- SES ---
function playAudio(src) {
    if (instructionAudio) { instructionAudio.pause(); instructionAudio = null; }
    instructionAudio = new Audio(src);
    instructionAudio.play().catch(() => {});
    return instructionAudio;
}

// --- İLERLEME ÇUBUĞU ---
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
    nextDotIdx = 0;
    isDragging = false;
    connectedPts = [];
    dotEls = [];

    const shape = SHAPES[idx];
    document.getElementById('shape-label').textContent = shape.label;
    buildProgressBar();
    svg.innerHTML = '';

    // 1. Rehber şekil — arka planda soluk kesikli çizgi
    const guide = makeSVGEl('polygon');
    guide.setAttribute('points', shape.dots.map(d => `${d.x},${d.y}`).join(' '));
    guide.setAttribute('fill', 'none');
    guide.setAttribute('stroke', 'rgba(180,180,200,0.35)');
    guide.setAttribute('stroke-width', '7');
    guide.setAttribute('stroke-dasharray', '12 7');
    guide.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(guide);

    // 2. Şekil dolgusu (tamamlanınca görünür)
    const fillEl = makeSVGEl('polygon');
    fillEl.setAttribute('points', shape.dots.map(d => `${d.x},${d.y}`).join(' '));
    fillEl.setAttribute('fill', shape.color);
    fillEl.setAttribute('opacity', '0');
    fillEl.id = 'shape-fill-el';
    svg.appendChild(fillEl);

    // 3. Çizilen yol (büyüyen çizgi)
    drawnPath = makeSVGEl('polyline');
    drawnPath.setAttribute('fill', 'none');
    drawnPath.setAttribute('stroke', shape.color);
    drawnPath.setAttribute('stroke-width', '10');
    drawnPath.setAttribute('stroke-linecap', 'round');
    drawnPath.setAttribute('stroke-linejoin', 'round');
    drawnPath.setAttribute('points', '');
    svg.appendChild(drawnPath);

    // 4. Lastik bant — parmak ile son nokta arası
    cursorLine = makeSVGEl('line');
    cursorLine.setAttribute('stroke', shape.color);
    cursorLine.setAttribute('stroke-width', '5');
    cursorLine.setAttribute('stroke-dasharray', '8 5');
    cursorLine.setAttribute('opacity', '0.5');
    cursorLine.setAttribute('stroke-linecap', 'round');
    cursorLine.style.display = 'none';
    svg.appendChild(cursorLine);

    // 5. Noktalar
    shape.dots.forEach((d, i) => {
        const circle = makeSVGEl('circle');
        circle.setAttribute('cx', d.x);
        circle.setAttribute('cy', d.y);
        circle.setAttribute('r', '11');
        circle.setAttribute('fill', '#dde3ed');
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '2');
        svg.appendChild(circle);

        // Numara: sadece 1. nokta ve her 5'inciye
        if (i === 0 || (i + 1) % 5 === 0) {
            const text = makeSVGEl('text');
            text.setAttribute('x', d.x);
            text.setAttribute('y', d.y);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'central');
            text.setAttribute('font-size', '10');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('fill', '#475569');
            text.setAttribute('pointer-events', 'none');
            text.textContent = i + 1;
            svg.appendChild(text);
        }

        dotEls.push({ circle, x: d.x, y: d.y });
    });

    // İlk noktayı parlat
    highlightNextDot();

    // Komut sesi
    setTimeout(() => {
        const a = playAudio(`${SND_BASE}komut.mp3`);
        if (isFirstShape) {
            a.onended = () => showDrawHint();
        }
    }, 400);
}

function highlightNextDot() {
    if (nextDotIdx >= dotEls.length) return;
    const el = dotEls[nextDotIdx];
    el.circle.setAttribute('fill', '#94a3b8');
    el.circle.setAttribute('r', '15');
    el.circle.classList.add('pulse-dot');
}

// --- SVG KOORDİNAT DÖNÜŞÜMÜ ---
function svgPoint(clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    return {
        x: (clientX - rect.left) * (400 / rect.width),
        y: (clientY - rect.top) * (400 / rect.height)
    };
}

function getEvtPt(e) {
    const src = e.touches ? e.touches[0] : e;
    return svgPoint(src.clientX, src.clientY);
}

// --- DOKUNMA / FARE OLAYLARI ---
svg.addEventListener('touchstart', e => {
    e.preventDefault();
    const existingHand = document.getElementById('hand-hint');
    if (existingHand) existingHand.remove();
    isDragging = true;
    handlePoint(getEvtPt(e));
}, { passive: false });

svg.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!isDragging) return;
    const pt = getEvtPt(e);
    handlePoint(pt);
    updateCursorLine(pt);
}, { passive: false });

svg.addEventListener('touchend', e => {
    e.preventDefault();
    isDragging = false;
    hideCursorLine();
}, { passive: false });

svg.addEventListener('mousedown', e => {
    const existingHand = document.getElementById('hand-hint');
    if (existingHand) existingHand.remove();
    isDragging = true;
    handlePoint(getEvtPt(e));
});
svg.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const pt = getEvtPt(e);
    handlePoint(pt);
    updateCursorLine(pt);
});
svg.addEventListener('mouseup', () => {
    isDragging = false;
    hideCursorLine();
});

// --- NOKTA KONTROLÜ ---
function handlePoint(pt) {
    const shape = SHAPES[currentShapeIdx];
    if (nextDotIdx >= shape.dots.length) return;
    const dot = shape.dots[nextDotIdx];
    if (Math.hypot(pt.x - dot.x, pt.y - dot.y) <= SNAP) {
        connectDot();
    }
}

// --- NOKTA BAĞLA ---
function connectDot() {
    const shape = SHAPES[currentShapeIdx];
    const dot = shape.dots[nextDotIdx];
    const el = dotEls[nextDotIdx];

    el.circle.classList.remove('pulse-dot');
    el.circle.setAttribute('fill', shape.color);
    el.circle.setAttribute('r', '9');
    el.circle.setAttribute('stroke', 'rgba(255,255,255,0.6)');

    connectedPts.push(`${dot.x},${dot.y}`);
    drawnPath.setAttribute('points', connectedPts.join(' '));

    nextDotIdx++;

    if (nextDotIdx >= shape.dots.length) {
        onShapeComplete();
    } else {
        highlightNextDot();
    }
}

// --- LASTİK BANT ---
function updateCursorLine(pt) {
    if (nextDotIdx === 0 || !cursorLine) return;
    const last = SHAPES[currentShapeIdx].dots[nextDotIdx - 1];
    cursorLine.setAttribute('x1', last.x);
    cursorLine.setAttribute('y1', last.y);
    cursorLine.setAttribute('x2', pt.x);
    cursorLine.setAttribute('y2', pt.y);
    cursorLine.style.display = '';
}

function hideCursorLine() {
    if (cursorLine) cursorLine.style.display = 'none';
}

// --- ŞEKIL TAMAMLANDI ---
function onShapeComplete() {
    hideCursorLine();
    const shape = SHAPES[currentShapeIdx];

    // Kapatma: son noktadan ilk noktaya
    connectedPts.push(`${shape.dots[0].x},${shape.dots[0].y}`);
    drawnPath.setAttribute('points', connectedPts.join(' '));

    setTimeout(() => {
        const fillEl = document.getElementById('shape-fill-el');
        if (fillEl) {
            fillEl.style.transition = 'opacity 0.5s';
            fillEl.setAttribute('opacity', '0.28');
        }
        SND_ONAY.cloneNode().play();
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });

        setTimeout(() => {
            const audio = playAudio(`${SND_BASE}${shape.completionAudio}`);
            audio.onended = () => setTimeout(goNextShape, 600);
            audio.onerror = () => setTimeout(goNextShape, 1500);
        }, 400);
    }, 300);
}

function goNextShape() {
    currentShapeIdx++;
    if (currentShapeIdx < SHAPES.length) {
        renderShape(currentShapeIdx);
    } else {
        showGameEnd();
    }
}

// --- OYUN SONU ---
function showGameEnd() {
    const overlay = document.getElementById('celebration-overlay');
    const content = overlay.querySelector('.celebration-content');
    overlay.classList.remove('hidden');
    content.innerHTML = `
        <video id="finale-video" src="${FINALE_VIDEO_SRC}" autoplay playsinline
               style="position:fixed;top:0;left:0;width:100vw;height:100vh;object-fit:cover;z-index:101;"></video>`;
    content.className = 'celebration-content';
    content.style.cssText = 'width:100%;height:100%;';
    const vid = content.querySelector('#finale-video');
    function showButtons() {
        vid.remove();
        content.style.cssText = '';
        content.innerHTML = `
            <div class="end-game-buttons">
                <button class="play-again-btn" onclick="location.reload()">🔄 Tekrar Oyna</button>
                <button class="back-to-menu-btn" onclick="window.location.href='sekiller_menu.html#1'">⬅ Menüye Dön</button>
            </div>`;
    }
    vid.onended = showButtons;
    vid.onerror = showButtons;
}

function showDrawHint() {
    isFirstShape = false;

    const existing = document.getElementById('hand-hint');
    if (existing) existing.remove();

    if (dotEls.length < 3) return;

    const FONT_SIZE = 64;
    const svgRect = svg.getBoundingClientRect();
    const scaleX = svgRect.width / 400;
    const scaleY = svgRect.height / 400;

    // İlk 4 noktanın ekran konumları (el parmak ucu için offset)
    const count = Math.min(4, dotEls.length);
    const screenDots = dotEls.slice(0, count).map(d => ({
        x: svgRect.left + d.x * scaleX - FONT_SIZE / 2,
        y: svgRect.top  + d.y * scaleY - FONT_SIZE * 0.8
    }));

    const offScreenY = window.innerHeight + 100;
    const startDot = screenDots[0];

    const hand = document.createElement('div');
    hand.id = 'hand-hint';
    hand.innerHTML = '👆';
    hand.style.cssText = `
        position: fixed; font-size: ${FONT_SIZE}px; pointer-events: none;
        z-index: 9999; left: 0px; top: 0px;
        transform: translate(${startDot.x}px, ${offScreenY}px);
        will-change: transform; filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.4));
    `;
    document.body.appendChild(hand);

    // Alttan ilk noktaya gel
    hand.animate([
        { transform: `translate(${startDot.x}px, ${offScreenY}px)` },
        { transform: `translate(${startDot.x}px, ${startDot.y}px)` }
    ], { duration: 450, easing: 'ease-out', fill: 'forwards' }).onfinish = () => {

        // Noktalar arası sürekli hareket (çizim simülasyonu)
        const keyframes = screenDots.map((d, i) => ({
            transform: `translate(${d.x}px, ${d.y}px)`,
            offset: i / (screenDots.length - 1)
        }));

        hand.animate(keyframes, {
            duration: 1400,
            easing: 'linear',
            fill: 'forwards'
        }).onfinish = () => {
            const lastDot = screenDots[screenDots.length - 1];
            hand.animate([
                { transform: `translate(${lastDot.x}px, ${lastDot.y}px)` },
                { transform: `translate(${startDot.x}px, ${offScreenY}px)` }
            ], { duration: 400, easing: 'ease-in', fill: 'forwards' }).onfinish = () => hand.remove();
        };
    };
}

// --- TEKRAR SES ---
document.getElementById('replay-btn').addEventListener('click', () => {
    playAudio(`${SND_BASE}komut.mp3`);
});

// --- BAŞLAT ---
renderShape(0);
