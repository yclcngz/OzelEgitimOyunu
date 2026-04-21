window.MAX_LEVEL = 3;

// 7 Mutfak Nesnesi Veritabanı
const kitchenItems = [
    { id: 'tabak', image: 'assets/images/mutfak/tabak.png', audio: 'assets/sounds/isim_tabak.mp3' },
    { id: 'bardak', image: 'assets/images/mutfak/bardak.png', audio: 'assets/sounds/isim_bardak.mp3' },
    { id: 'kasik', image: 'assets/images/mutfak/kasik.png', audio: 'assets/sounds/isim_kasik.mp3' },
    { id: 'catal', image: 'assets/images/mutfak/catal.png', audio: 'assets/sounds/isim_catal.mp3' },
    { id: 'tencere', image: 'assets/images/mutfak/tencere.png', audio: 'assets/sounds/isim_tencere.mp3' },
    { id: 'tava', image: 'assets/images/mutfak/tava.png', audio: 'assets/sounds/isim_tava.mp3' },
    { id: 'ekmek', image: 'assets/images/mutfak/ekmek.png', audio: 'assets/sounds/isim_ekmek.mp3' }
];

// --- SEVİYE 1 SESLERİ ---
const audioSarki = new Audio('assets/sounds/resime_tikla_sarki.mp3');
const audioKomut = new Audio('assets/sounds/resime_tikla_komut.mp3');

// --- SEVİYE 2 SESLERİ ---
const audioLvl2Sarki = new Audio('assets/sounds/ayni_resimleri_eslestir.mp3');
const audioNesneleriEslestir = new Audio('assets/sounds/nesneleri_eslestir.mp3');

// --- SEVİYE 3 SESLERİ ---
const audioLvl3Komut = new Audio('assets/sounds/ayni_nesneleri_bulalım_komut.mp3');

// --- ORTAK SESLER ---
const audioOnay = new Audio('assets/sounds/onay.mp3');
const audioDat = new Audio('assets/sounds/dat.mp3');
const audioLevelComplete = new Audio('assets/sounds/tebrikler_basardin.mp3');
const audioGrandFinale = new Audio('assets/sounds/basari_fon.mp3');
const FINALE_VIDEO_SRC = 'assets/sounds/kutlama.mp4';

let currentLevel = 1;
let isFirstMove = true;

// --- YARDIMCI FONKSİYONLAR ---
function shuffleArray(array) {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function calcLayout(n) {
    const cols = 2;
    const gap = 20;
    const availW = Math.min(window.innerWidth - 64, 900);
    const rows = Math.ceil(n / cols);
    const availH = window.innerHeight - 200;
    const itemByW = (availW - gap * (cols - 1)) / cols;
    const itemByH = (availH - gap * (rows - 1)) / rows;
    const size = Math.floor(Math.min(itemByW, itemByH, 240));
    return { size, cols, gap };
}

function hideAllBoards() {
    document.getElementById('level1-board').classList.add('hidden');
    document.getElementById('level2-board').classList.add('hidden');
    document.getElementById('level3-board').classList.add('hidden');
}

function stopAllAudio() {
    audioSarki.pause(); audioSarki.currentTime = 0;
    audioKomut.pause(); audioKomut.currentTime = 0;
    audioLvl2Sarki.pause(); audioLvl2Sarki.currentTime = 0;
    audioNesneleriEslestir.pause(); audioNesneleriEslestir.currentTime = 0;
    audioLvl3Komut.pause(); audioLvl3Komut.currentTime = 0;
}

// --- ANA OYUN YÖNETİCİSİ ---
function startLevel(level) {
    currentLevel = level;
    hideAllBoards();
    stopAllAudio();
    isFirstMove = true;

    if (level === 1) renderLevel1();
    else if (level === 2) renderLevel2();
    else if (level === 3) renderLevel3();
}

// ==========================================
// SEVİYE 1: TIKLA VE DİNLE (Sub-stage sistemi)
// ==========================================
let listenedItemsCount = 0;
let isLevel1Playable = false;
let level1SubStages = [];
let level1CurrentSubStage = 0;
let currentItemAudio = null;

function renderLevel1() {
    const board = document.getElementById('level1-board');
    board.innerHTML = '';
    board.classList.remove('hidden');

    listenedItemsCount = 0;
    isLevel1Playable = false;

    const shuffledItems = shuffleArray(kitchenItems);
    // 7 nesneyi 2 sub-stage'e böl: [4] + [3]
    level1SubStages = [shuffledItems.slice(0, 4), shuffledItems.slice(4)];
    level1CurrentSubStage = 0;

    renderLevel1SubStage();

    audioKomut.play().catch(() => console.log("Ses engellendi."));
    audioKomut.onended = () => {
        isLevel1Playable = true;
        if (isFirstMove) showClickHintLevel1();
    };

    document.getElementById('play-audio-btn').onclick = () => {
        audioKomut.currentTime = 0;
        audioKomut.play();
    };
}

function renderLevel1SubStage() {
    const board = document.getElementById('level1-board');
    board.innerHTML = '';
    listenedItemsCount = 0;

    if (level1CurrentSubStage > 0) {
        isLevel1Playable = true;
    }

    const items = level1SubStages[level1CurrentSubStage];
    const { size, cols, gap } = calcLayout(items.length);

    board.style.display = 'grid';
    board.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
    board.style.gap = gap + 'px';
    board.style.justifyContent = 'center';

    items.forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('fruit-wrapper');

        const imgElement = document.createElement('img');
        imgElement.src = item.image;
        imgElement.decoding = 'async';
        imgElement.classList.add('fruit-item');
        imgElement.style.width = size + 'px';
        imgElement.style.height = size + 'px';
        imgElement.style.padding = '10px';
        imgElement.style.boxSizing = 'border-box';

        imgElement.addEventListener('click', () => {
            if (!isLevel1Playable || (currentItemAudio && !currentItemAudio.ended)) return;
            const existingHand = document.getElementById('hand-hint');
            if (existingHand) existingHand.remove();

            currentItemAudio = new Audio(item.audio);
            currentItemAudio.play();

            if (!imgElement.classList.contains('listened-item')) {
                imgElement.classList.add('listened-item');
                listenedItemsCount++;

                if (listenedItemsCount === items.length) {
                    setTimeout(() => {
                        level1CurrentSubStage++;
                        if (level1CurrentSubStage < level1SubStages.length) {
                            renderLevel1SubStage();
                        } else {
                            showLevelCompleteCelebration();
                        }
                    }, 1500);
                }
            } else {
                imgElement.classList.remove('listened-item');
                void imgElement.offsetWidth;
                imgElement.classList.add('listened-item');
            }
        });

        wrapper.appendChild(imgElement);
        board.appendChild(wrapper);
    });
}

// ==========================================
// SEVİYE 2: İKİ AŞAMALI EŞLEŞTİRME
// ==========================================
let selectedLeft = null;
let selectedRight = null;
let matchedPairsLvl2 = 0;
let isProcessing = false;
let isLevel2Playable = false;

let currentStageLvl2 = 1;
let lvl2ItemsStage1 = [];
let lvl2ItemsStage2 = [];
let totalPairsCurrentStage = 0;
let currentLevel2ImgSize = 160;

function calcLevel2ImgSize(n) {
    const gap = 12;
    const availH = window.innerHeight - 160;
    const imgH = Math.floor((availH - gap * (n - 1)) / n);
    const availW = (window.innerWidth - 48) / 2 - gap * 2;
    return Math.min(imgH, Math.floor(availW), 200);
}

function renderLevel2() {
    const board = document.getElementById('level2-board');
    const audioBtn = document.getElementById('play-audio-btn');

    board.classList.remove('hidden');

    const shuffledAll = shuffleArray(kitchenItems);
    lvl2ItemsStage1 = shuffledAll.slice(0, 3);
    lvl2ItemsStage2 = shuffledAll.slice(3);

    currentStageLvl2 = 1;
    renderLevel2Stage(currentStageLvl2);

    audioBtn.onclick = () => { audioNesneleriEslestir.currentTime = 0; audioNesneleriEslestir.play(); };
}

function renderLevel2Stage(stage) {
    const leftCol = document.getElementById('left-column');
    const rightCol = document.getElementById('right-column');

    leftCol.innerHTML = '';
    rightCol.innerHTML = '';
    matchedPairsLvl2 = 0;
    selectedLeft = null;
    selectedRight = null;
    isProcessing = false;
    isLevel2Playable = false;

    const currentItems = stage === 1 ? lvl2ItemsStage1 : lvl2ItemsStage2;
    totalPairsCurrentStage = currentItems.length;
    currentLevel2ImgSize = calcLevel2ImgSize(currentItems.length);

    const leftItems = shuffleArray(currentItems);
    const rightItems = shuffleArray(currentItems);

    leftItems.forEach(item => createMatchItem(item, 'left', leftCol, currentLevel2ImgSize));
    rightItems.forEach(item => createMatchItem(item, 'right', rightCol, currentLevel2ImgSize));

    audioNesneleriEslestir.play().catch(() => console.log("Ses engellendi"));
    audioNesneleriEslestir.onended = () => {
        isLevel2Playable = true;
        if (isFirstMove) showMatchHintLevel2();
    };
}

function createMatchItem(item, side, parent, imgSize) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('fruit-wrapper');
    const img = document.createElement('img');
    img.src = item.image;
    img.decoding = 'async';
    img.classList.add('fruit-item');
    img.dataset.id = item.id;
    img.dataset.side = side;

    img.style.width = imgSize + 'px';
    img.style.height = imgSize + 'px';
    img.style.objectFit = 'contain';

    const cross = document.createElement('div');
    cross.classList.add('cross-mark');
    cross.innerHTML = '❌';

    img.addEventListener('click', () => handleMatchClick(img, wrapper));

    wrapper.appendChild(img);
    wrapper.appendChild(cross);
    parent.appendChild(wrapper);
}

function handleMatchClick(img, wrap) {
    if (!isLevel2Playable || img.classList.contains('matched-fruit') || isProcessing) return;
    const existingHand = document.getElementById('hand-hint');
    if (existingHand) existingHand.remove();

    if (img.dataset.side === 'left') {
        if (selectedLeft) selectedLeft.img.classList.remove('selected-fruit');
        selectedLeft = { img, wrap, id: img.dataset.id };
    } else {
        if (selectedRight) selectedRight.img.classList.remove('selected-fruit');
        selectedRight = { img, wrap, id: img.dataset.id };
    }
    img.classList.add('selected-fruit');

    if (selectedLeft && selectedRight) checkMatchLvl2();
}

function checkMatchLvl2() {
    isProcessing = true;
    const curL = selectedLeft, curR = selectedRight;
    selectedLeft = null; selectedRight = null;

    if (curL.id === curR.id) {
        audioOnay.cloneNode().play();
        curL.img.className = 'fruit-item matched-fruit';
        curR.img.className = 'fruit-item matched-fruit';

        matchedPairsLvl2++;

        if (matchedPairsLvl2 === totalPairsCurrentStage) {
            setTimeout(() => {
                if (currentStageLvl2 === 1) {
                    currentStageLvl2 = 2;
                    renderLevel2Stage(2);
                } else {
                    showLevelCompleteCelebration();
                }
            }, 1000);
        } else {
            isProcessing = false;
        }
    } else {
        new Audio('assets/sounds/dat.mp3').play().catch(() => {});
        curL.wrap.querySelector('.cross-mark').classList.add('show-cross');
        curR.wrap.querySelector('.cross-mark').classList.add('show-cross');
        curL.img.classList.add('shake'); curR.img.classList.add('shake');

        setTimeout(() => {
            curL.img.classList.remove('shake', 'selected-fruit');
            curR.img.classList.remove('shake', 'selected-fruit');
            curL.wrap.querySelector('.cross-mark').classList.remove('show-cross');
            curR.wrap.querySelector('.cross-mark').classList.remove('show-cross');
            isProcessing = false;
            showMatchHintLevel2();
        }, 1000);
    }
}

// ==========================================
// SEVİYE 3: HAFIZA (KART BULMACA)
// ==========================================
let hasFlippedCard = false, lockBoard = false;
let firstCard, secondCard, matchedPairsLvl3 = 0;
let level3SubStages = [], level3CurrentSubStage = 0;

function calcLevel3CardSize() {
    const gap = 12;
    const cols = 2, rows = 3;
    const availW = window.innerWidth - 48;
    const availH = window.innerHeight - 160;
    const cardByW = Math.floor((availW - gap) / cols);
    const cardByH = Math.floor((availH - gap * 2) / rows);
    return { size: Math.min(cardByW, cardByH, 200), cols, gap };
}

function renderLevel3() {
    const board = document.getElementById('level3-board');
    board.classList.remove('hidden');

    audioLvl3Komut.currentTime = 0;
    audioLvl3Komut.play().catch(() => console.log('Ses engellendi.'));
    audioLvl3Komut.onended = () => {
        if (isFirstMove) showCardHintLevel3();
    };

    // Play butonuna bas → komutu tekrar çal
    document.getElementById('play-audio-btn').onclick = () => {
        audioLvl3Komut.currentTime = 0;
        audioLvl3Komut.play();
    };

    // 7 eşyayı 3'lü gruplara böl: [3, 3, 3] — son grup 1 yeni + 2 dolgu
    const shuffled = shuffleArray(kitchenItems);
    level3SubStages = [
        shuffled.slice(0, 3),
        shuffled.slice(3, 6),
        [shuffled[6], shuffled[0], shuffled[1]]
    ];
    level3CurrentSubStage = 0;

    renderLevel3SubStage();
}

function renderLevel3SubStage() {
    const board = document.getElementById('level3-board');
    board.innerHTML = '';

    hasFlippedCard = false; lockBoard = false;
    firstCard = null; secondCard = null; matchedPairsLvl3 = 0;

    const subItems = level3SubStages[level3CurrentSubStage];
    const { size, cols, gap } = calcLevel3CardSize();

    board.style.display = 'grid';
    board.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
    board.style.gap = gap + 'px';
    board.style.justifyContent = 'center';

    let cardsArray = [];
    subItems.forEach(item => { cardsArray.push(item); cardsArray.push(item); });

    shuffleArray(cardsArray).forEach(item => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.id = item.id;
        card.style.width = size + 'px';
        card.style.height = size + 'px';

        const imgS = Math.floor(size * 0.65);
        card.innerHTML = `
            <div class="memory-card-inner">
                <div class="memory-card-front"><img src="${item.image}" style="width:${imgS}px;height:${imgS}px;object-fit:contain;"></div>
                <div class="memory-card-back">?</div>
            </div>
        `;
        card.addEventListener('click', flipCard);
        board.appendChild(card);
    });
}

function flipCard() {
    if (lockBoard || this === firstCard) return;
    const existingHand = document.getElementById('hand-hint');
    if (existingHand) existingHand.remove();
    this.classList.add('flipped');

    if (!hasFlippedCard) {
        hasFlippedCard = true; firstCard = this; return;
    }
    secondCard = this;

    if (firstCard.dataset.id === secondCard.dataset.id) {
        firstCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('click', flipCard);
        audioOnay.cloneNode().play();
        matchedPairsLvl3++;
        resetBoard();

        const totalPairs = level3SubStages[level3CurrentSubStage].length;
        if (matchedPairsLvl3 === totalPairs) {
            setTimeout(() => {
                level3CurrentSubStage++;
                if (level3CurrentSubStage < level3SubStages.length) {
                    renderLevel3SubStage();
                } else {
                    showLevelCompleteCelebration();
                }
            }, 1000);
        }
    } else {
        lockBoard = true;
        new Audio('assets/sounds/dat.mp3').play().catch(() => {});
        setTimeout(() => {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            resetBoard();
            showCardHintLevel3();
        }, 1000);
    }
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

// ==========================================
// EL İPUCU FONKSİYONLARI
// ==========================================

function _removeHandHint() {
    const h = document.getElementById('hand-hint');
    if (h) h.remove();
}

function _handHintOnElement(targetEl, totalTaps, onDone) {
    isFirstMove = false;
    _removeHandHint();

    const rect = targetEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const tapTop  = rect.top + rect.height * 0.3;
    const restTop = tapTop + 90;
    const offScreenTop = window.innerHeight + 100;
    const FONT_SIZE = 72;

    const hand = document.createElement('div');
    hand.id = 'hand-hint';
    hand.innerHTML = '👆';
    hand.style.cssText = `
        position: fixed; font-size: ${FONT_SIZE}px; pointer-events: none;
        z-index: 9999; left: ${centerX - FONT_SIZE / 2}px; top: 0px;
        transform: translateY(${offScreenTop}px); will-change: transform;
        filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.4));
    `;
    document.body.appendChild(hand);

    let tapCount = 0;
    hand.animate([
        { transform: `translateY(${offScreenTop}px)` },
        { transform: `translateY(${restTop}px)` }
    ], { duration: 450, easing: 'ease-out', fill: 'forwards' }).onfinish = doTap;

    function doTap() {
        if (tapCount >= totalTaps) {
            hand.animate([
                { transform: `translateY(${restTop}px)` },
                { transform: `translateY(${offScreenTop}px)` }
            ], { duration: 400, easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
                hand.remove();
                if (onDone) onDone();
            };
            return;
        }
        tapCount++;
        hand.animate([
            { transform: `translateY(${restTop}px)`, easing: 'cubic-bezier(0.4,0,1,1)' },
            { transform: `translateY(${tapTop}px)`,  easing: 'cubic-bezier(0,0,0.6,1)' },
            { transform: `translateY(${restTop}px)` }
        ], { duration: 550, fill: 'forwards' }).onfinish = () => setTimeout(doTap, 280);
    }
}

// SEVİYE 1: İlk resme tıkla göster
function showClickHintLevel1() {
    const items = [...document.querySelectorAll('#level1-board .fruit-item:not(.listened-item)')];
    if (!items.length) return;
    _handHintOnElement(items[0], 3);
}

// SEVİYE 2: Sol→Sağ eşleştirme göster
function showMatchHintLevel2() {
    isFirstMove = false;
    const leftImgs  = [...document.querySelectorAll('#left-column .fruit-item:not(.matched-fruit)')];
    if (!leftImgs.length) return;
    const leftImg  = leftImgs[0];
    const targetId = leftImg.dataset.id;
    const rightImgs = [...document.querySelectorAll('#right-column .fruit-item:not(.matched-fruit)')];
    const rightImg  = rightImgs.find(img => img.dataset.id === targetId);
    if (!rightImg) return;

    _removeHandHint();
    const FONT_SIZE = 72;

    function getPos(el) {
        const rect = el.getBoundingClientRect();
        return { x: rect.left + rect.width / 2 - FONT_SIZE / 2, tapY: rect.top + rect.height * 0.3, restY: rect.top + rect.height * 0.3 + 90 };
    }

    const left  = getPos(leftImg);
    const right = getPos(rightImg);
    const offScreenY = window.innerHeight + 100;

    const hand = document.createElement('div');
    hand.id = 'hand-hint';
    hand.innerHTML = '👆';
    hand.style.cssText = `
        position: fixed; font-size: ${FONT_SIZE}px; pointer-events: none;
        z-index: 9999; left: 0px; top: 0px;
        transform: translate(${left.x}px, ${offScreenY}px); will-change: transform;
        filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.4));
    `;
    document.body.appendChild(hand);

    hand.animate([
        { transform: `translate(${left.x}px, ${offScreenY}px)` },
        { transform: `translate(${left.x}px, ${left.restY}px)` }
    ], { duration: 400, easing: 'ease-out', fill: 'forwards' }).onfinish = () => {
        hand.animate([
            { transform: `translate(${left.x}px, ${left.restY}px)`, easing: 'cubic-bezier(0.4,0,1,1)' },
            { transform: `translate(${left.x}px, ${left.tapY}px)`,  easing: 'cubic-bezier(0,0,0.6,1)' },
            { transform: `translate(${left.x}px, ${left.restY}px)` }
        ], { duration: 500, fill: 'forwards' }).onfinish = () => {
            setTimeout(() => {
                hand.animate([
                    { transform: `translate(${left.x}px, ${left.restY}px)` },
                    { transform: `translate(${right.x}px, ${right.restY}px)` }
                ], { duration: 380, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => {
                    hand.animate([
                        { transform: `translate(${right.x}px, ${right.restY}px)`, easing: 'cubic-bezier(0.4,0,1,1)' },
                        { transform: `translate(${right.x}px, ${right.tapY}px)`,  easing: 'cubic-bezier(0,0,0.6,1)' },
                        { transform: `translate(${right.x}px, ${right.restY}px)` }
                    ], { duration: 500, fill: 'forwards' }).onfinish = () => {
                        hand.animate([
                            { transform: `translate(${right.x}px, ${right.restY}px)` },
                            { transform: `translate(${left.x}px, ${offScreenY}px)` }
                        ], { duration: 380, easing: 'ease-in', fill: 'forwards' }).onfinish = () => hand.remove();
                    };
                };
            }, 220);
        };
    };
}

// SEVİYE 3: Kart çevir göster
function showCardHintLevel3() {
    const cards = [...document.querySelectorAll('#level3-board .memory-card:not(.flipped)')];
    if (!cards.length) return;
    _handHintOnElement(cards[0], 3);
}

// ==========================================
// KUTLAMA VE GEÇİŞ SİSTEMİ
// ==========================================
function showLevelCompleteCelebration() {
    const overlay = document.getElementById('celebration-overlay');
    const content = overlay.querySelector('.celebration-content');
    overlay.classList.remove('hidden');

    if (currentLevel < 3) {
        content.innerHTML = '🤩👏';
        content.className = 'celebration-content';
        const advanceLevel = () => {
            audioLevelComplete.onended = null;
            overlay.classList.add('hidden');
            startLevel(currentLevel + 1);
        };
        audioLevelComplete.onended = advanceLevel;
        audioLevelComplete.currentTime = 0;
        audioLevelComplete.play().catch(() => setTimeout(advanceLevel, 500));
    } else {
        showFinaleVideo(overlay, content, 'nesneler_menu.html');
    }
}

function showFinaleVideo(overlay, content, menuUrl) {
    content.innerHTML = `
        <video id="finale-video" src="${FINALE_VIDEO_SRC}" autoplay playsinline
               style="position:fixed;top:0;left:0;width:100vw;height:100vh;object-fit:cover;z-index:101;"></video>
    `;
    content.className = 'celebration-content';
    content.style.cssText = 'width:100%;height:100%;';
    const vid = content.querySelector('#finale-video');
    vid.onended = () => {
        vid.remove();
        content.style.cssText = '';
        content.innerHTML = `
            <div class="end-game-buttons">
                <button class="play-again-btn" onclick="location.reload()">🔄 Tekrar Oyna</button>
                <button class="back-to-menu-btn" onclick="window.location.href='${menuUrl}'">⬅ Menüye Dön</button>
            </div>
        `;
    };
    vid.onerror = () => {
        content.style.cssText = '';
        content.innerHTML = `
            <div class="end-game-buttons">
                <button class="play-again-btn" onclick="location.reload()">🔄 Tekrar Oyna</button>
                <button class="back-to-menu-btn" onclick="window.location.href='${menuUrl}'">⬅ Menüye Dön</button>
            </div>
        `;
    };
}

window.onload = () => startLevel(1);
