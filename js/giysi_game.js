window.MAX_LEVEL = 3;

// 16 Giysi Veritabanı
const clothingItems = [
    { id: 'terlik',        name: 'Terlik',         image: 'assets/images/giysiler/terlik.webp',        audio: 'assets/sounds/isim_terlik.mp3' },
    { id: 'eldiven',       name: 'Eldiven',         image: 'assets/images/giysiler/eldiven.webp',       audio: 'assets/sounds/isim_eldiven.mp3' },
    { id: 'ceket',         name: 'Ceket',           image: 'assets/images/giysiler/ceket.webp',         audio: 'assets/sounds/isim_ceket.mp3' },
    { id: 'sort',          name: 'Şort',            image: 'assets/images/giysiler/sort.webp',          audio: 'assets/sounds/isim_sort.mp3' },
    { id: 'mont',          name: 'Mont',            image: 'assets/images/giysiler/mont.webp',          audio: 'assets/sounds/isim_mont.mp3' },
    { id: 'corap',         name: 'Çorap',           image: 'assets/images/giysiler/corap.webp',         audio: 'assets/sounds/isim_corap.mp3' },
    { id: 'spor_ayakkabi', name: 'Spor Ayakkabı',   image: 'assets/images/giysiler/spor_ayakkabi.webp', audio: 'assets/sounds/isim_spor_ayakkabi.mp3' },
    { id: 'bot',           name: 'Bot',             image: 'assets/images/giysiler/bot.webp',           audio: 'assets/sounds/isim_bot.mp3' },
    { id: 'pantolon',      name: 'Pantolon',        image: 'assets/images/giysiler/pantolon.webp',      audio: 'assets/sounds/isim_pantolon.mp3' },
    { id: 'atki_bere',     name: 'Atkı ve Bere',    image: 'assets/images/giysiler/atki_bere.webp',     audio: 'assets/sounds/isim_atki_bere.mp3' },
    { id: 'etek',          name: 'Etek',            image: 'assets/images/giysiler/etek.webp',          audio: 'assets/sounds/isim_etek.mp3' },
    { id: 'gomlek',        name: 'Gömlek',          image: 'assets/images/giysiler/gomlek.webp',        audio: 'assets/sounds/isim_gomlek.mp3' },
    { id: 'sapka',         name: 'Şapka',           image: 'assets/images/giysiler/sapka.webp',         audio: 'assets/sounds/isim_sapka.mp3' },
    { id: 'atlet',         name: 'Atlet',           image: 'assets/images/giysiler/atlet.webp',         audio: 'assets/sounds/isim_atlet.mp3' },
    { id: 'tisort',        name: 'Tişört',          image: 'assets/images/giysiler/tisort.webp',        audio: 'assets/sounds/isim_tisort.mp3' },
    { id: 'kazak',         name: 'Kazak',           image: 'assets/images/giysiler/kazak.webp',         audio: 'assets/sounds/isim_kazak.mp3' }
];

// --- SEVİYE 1 SESLERİ ---
const audioKomut = new Audio('assets/sounds/giysiler_komut.mp3');

// --- SEVİYE 2 SESLERİ ---
const audioEslestirKomut = new Audio('assets/sounds/giysiler_eslestir_komut.mp3');

// --- SEVİYE 3 SESLERİ ---
const audioHafizaKomut = new Audio('assets/sounds/giysiler_hafiza_komut.mp3');

// --- ORTAK SESLER ---
const audioOnay = new Audio('assets/sounds/onay.mp3');
const audioDat  = new Audio('assets/sounds/dat.mp3');
const audioLevelComplete = new Audio('assets/sounds/tebrikler_basardin.mp3');
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

function splitIntoSubStages(items, perStage) {
    const stages = [];
    for (let i = 0; i < items.length; i += perStage) {
        stages.push(items.slice(i, i + perStage));
    }
    // Son grup çok küçükse (1 öğe) öncekiyle birleştir
    if (stages.length > 1 && stages[stages.length - 1].length < 2) {
        const last = stages.pop();
        stages[stages.length - 1] = [...stages[stages.length - 1], ...last];
    }
    return stages;
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
    audioKomut.pause();         audioKomut.currentTime = 0;
    audioEslestirKomut.pause(); audioEslestirKomut.currentTime = 0;
    audioHafizaKomut.pause();   audioHafizaKomut.currentTime = 0;
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
// SEVİYE 1: TIKLA VE DİNLE
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

    // 16 giysyi 4'lü 4 gruba böl
    const shuffled = shuffleArray(clothingItems);
    level1SubStages = splitIntoSubStages(shuffled, 4);
    level1CurrentSubStage = 0;

    renderLevel1SubStage();

    audioKomut.play().catch(() => {});
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

    if (level1CurrentSubStage > 0) isLevel1Playable = true;

    const items = level1SubStages[level1CurrentSubStage];
    const { size, cols, gap } = calcLayout(items.length);

    board.style.display = 'grid';
    board.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
    board.style.gap = gap + 'px';
    board.style.justifyContent = 'center';

    items.forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('fruit-wrapper');

        const imgEl = document.createElement('img');
        imgEl.src = item.image;
        imgEl.decoding = 'async';
        imgEl.classList.add('fruit-item');
        imgEl.style.width  = size + 'px';
        imgEl.style.height = size + 'px';
        imgEl.style.padding = '10px';
        imgEl.style.boxSizing = 'border-box';

        imgEl.addEventListener('click', () => {
            if (!isLevel1Playable || (currentItemAudio && !currentItemAudio.ended)) return;
            const existingHand = document.getElementById('hand-hint');
            if (existingHand) existingHand.remove();

            currentItemAudio = new Audio(item.audio);
            currentItemAudio.play();

            if (!imgEl.classList.contains('listened-item')) {
                imgEl.classList.add('listened-item');
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
                imgEl.classList.remove('listened-item');
                void imgEl.offsetWidth;
                imgEl.classList.add('listened-item');
            }
        });

        wrapper.appendChild(imgEl);
        board.appendChild(wrapper);
    });
}

// ==========================================
// SEVİYE 2: EŞLEŞTİRME (4 aşama × 4 öğe)
// ==========================================
let selectedLeft = null;
let selectedRight = null;
let matchedPairsLvl2 = 0;
let isProcessing = false;
let isLevel2Playable = false;
let currentStageLvl2 = 0;
let lvl2Stages = [];
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
    board.classList.remove('hidden');

    const shuffled = shuffleArray(clothingItems);
    lvl2Stages = splitIntoSubStages(shuffled, 3);
    currentStageLvl2 = 0;

    renderLevel2Stage();

    document.getElementById('play-audio-btn').onclick = () => {
        audioEslestirKomut.currentTime = 0;
        audioEslestirKomut.play();
    };
}

function renderLevel2Stage() {
    const leftCol  = document.getElementById('left-column');
    const rightCol = document.getElementById('right-column');

    leftCol.innerHTML  = '';
    rightCol.innerHTML = '';
    matchedPairsLvl2 = 0;
    selectedLeft = null;
    selectedRight = null;
    isProcessing = false;
    isLevel2Playable = false;

    const currentItems = lvl2Stages[currentStageLvl2];
    totalPairsCurrentStage = currentItems.length;
    currentLevel2ImgSize = calcLevel2ImgSize(currentItems.length);

    const leftItems  = shuffleArray(currentItems);
    const rightItems = shuffleArray(currentItems);

    leftItems.forEach(item  => createMatchItem(item, 'left',  leftCol,  currentLevel2ImgSize));
    rightItems.forEach(item => createMatchItem(item, 'right', rightCol, currentLevel2ImgSize));

    audioEslestirKomut.play().catch(() => {});
    audioEslestirKomut.onended = () => {
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
    img.dataset.id   = item.id;
    img.dataset.side = side;
    img.style.width  = imgSize + 'px';
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
                currentStageLvl2++;
                if (currentStageLvl2 < lvl2Stages.length) {
                    renderLevel2Stage();
                } else {
                    showLevelCompleteCelebration();
                }
            }, 1000);
        } else {
            isProcessing = false;
        }
    } else {
        audioDat.cloneNode().play();
        curL.wrap.querySelector('.cross-mark').classList.add('show-cross');
        curR.wrap.querySelector('.cross-mark').classList.add('show-cross');
        curL.img.classList.add('shake');
        curR.img.classList.add('shake');

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
// SEVİYE 3: HAFIZA KARTLARI (4 aşama × 4 çift = 2×4 grid)
// ==========================================
let hasFlippedCard = false, lockBoard = false;
let firstCard, secondCard, matchedPairsLvl3 = 0;
let level3SubStages = [], level3CurrentSubStage = 0;
let isHintActive = false, hintCardA = null, hintCardB = null;

function calcLevel3CardSize() {
    const gap  = 12;
    const cols = 2, rows = 3;
    const availW = window.innerWidth  - 48;
    const availH = window.innerHeight - 160;
    const cardByW = Math.floor((availW - gap) / cols);
    const cardByH = Math.floor((availH - gap * (rows - 1)) / rows);
    return { size: Math.min(cardByW, cardByH, 200), cols, gap };
}

function renderLevel3() {
    const board = document.getElementById('level3-board');
    board.classList.remove('hidden');

    audioHafizaKomut.currentTime = 0;
    audioHafizaKomut.play().catch(() => {});
    audioHafizaKomut.onended = () => {
        if (isFirstMove) showCardHintLevel3();
    };

    document.getElementById('play-audio-btn').onclick = () => {
        audioHafizaKomut.currentTime = 0;
        audioHafizaKomut.play();
    };

    // 16 giysyi 3'lü gruplara böl — her grup bir sub-stage (3 çift = 6 kart)
    const shuffled = shuffleArray(clothingItems);
    level3SubStages = splitIntoSubStages(shuffled, 3);
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

    const imgS = Math.floor(size * 0.65);
    shuffleArray(cardsArray).forEach(item => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.id = item.id;
        card.style.width  = size + 'px';
        card.style.height = size + 'px';
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
    const existingHand = document.getElementById('hand-hint');
    if (existingHand) {
        // Hint'i iptal et, hint'in açtığı kartları kapat
        isHintActive = false;
        existingHand.remove();
        if (hintCardA) { hintCardA.classList.remove('flipped'); hintCardA = null; }
        if (hintCardB) { hintCardB.classList.remove('flipped'); hintCardB = null; }
        lockBoard = false;
    }
    if (lockBoard || this === firstCard) return;
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
        audioDat.cloneNode().play();
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

function showClickHintLevel1() {
    const items = [...document.querySelectorAll('#level1-board .fruit-item:not(.listened-item)')];
    if (!items.length) return;
    _handHintOnElement(items[0], 3);
}

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
        return {
            x:     rect.left + rect.width / 2 - FONT_SIZE / 2,
            tapY:  rect.top  + rect.height * 0.3,
            restY: rect.top  + rect.height * 0.3 + 90
        };
    }

    const left       = getPos(leftImg);
    const right      = getPos(rightImg);
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

function showCardHintLevel3(totalRounds = 3) {
    isFirstMove = false;
    isHintActive = true;
    lockBoard = true;

    const existing = document.getElementById('hand-hint');
    if (existing) existing.remove();

    const unflipped = [...document.querySelectorAll('#level3-board .memory-card:not(.flipped)')];
    if (unflipped.length < 2) { isHintActive = false; lockBoard = false; return; }

    const cardA = unflipped[0];
    const targetId = cardA.dataset.id;
    const cardB = unflipped.find((c, i) => i > 0 && c.dataset.id === targetId);
    if (!cardB) { isHintActive = false; lockBoard = false; return; }

    hintCardA = cardA;
    hintCardB = cardB;

    const FONT_SIZE = 72;

    function getPos(el) {
        const rect = el.getBoundingClientRect();
        return {
            x:     rect.left + rect.width  / 2 - FONT_SIZE / 2,
            tapY:  rect.top  + rect.height * 0.3,
            restY: rect.top  + rect.height * 0.3 + 90
        };
    }

    const posA = getPos(cardA);
    const posB = getPos(cardB);
    const offScreenY = window.innerHeight + 100;

    const hand = document.createElement('div');
    hand.id = 'hand-hint';
    hand.innerHTML = '👆';
    hand.style.cssText = `
        position: fixed;
        font-size: ${FONT_SIZE}px;
        pointer-events: none;
        z-index: 9999;
        left: 0px;
        top: 0px;
        transform: translate(${posA.x}px, ${offScreenY}px);
        will-change: transform;
        filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.4));
    `;
    document.body.appendChild(hand);

    let round = 0;

    function doRound() {
        if (!isHintActive) return;
        round++;

        hand.animate([
            { transform: `translate(${posA.x}px, ${offScreenY}px)` },
            { transform: `translate(${posA.x}px, ${posA.restY}px)` }
        ], { duration: 400, easing: 'ease-out', fill: 'forwards' }).onfinish = () => {
            if (!isHintActive) return;

            hand.animate([
                { transform: `translate(${posA.x}px, ${posA.restY}px)`, easing: 'cubic-bezier(0.4,0,1,1)' },
                { transform: `translate(${posA.x}px, ${posA.tapY}px)`,  easing: 'cubic-bezier(0,0,0.6,1)' },
                { transform: `translate(${posA.x}px, ${posA.restY}px)` }
            ], { duration: 500, fill: 'forwards' }).onfinish = () => {
                if (!isHintActive) return;

                cardA.classList.add('flipped');

                setTimeout(() => {
                    if (!isHintActive) return;
                    hand.animate([
                        { transform: `translate(${posA.x}px, ${posA.restY}px)` },
                        { transform: `translate(${posB.x}px, ${posB.restY}px)` }
                    ], { duration: 380, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => {
                        if (!isHintActive) return;

                        hand.animate([
                            { transform: `translate(${posB.x}px, ${posB.restY}px)`, easing: 'cubic-bezier(0.4,0,1,1)' },
                            { transform: `translate(${posB.x}px, ${posB.tapY}px)`,  easing: 'cubic-bezier(0,0,0.6,1)' },
                            { transform: `translate(${posB.x}px, ${posB.restY}px)` }
                        ], { duration: 500, fill: 'forwards' }).onfinish = () => {
                            if (!isHintActive) return;

                            cardB.classList.add('flipped');

                            setTimeout(() => {
                                if (!isHintActive) return;
                                cardA.classList.remove('flipped');
                                cardB.classList.remove('flipped');

                                hand.animate([
                                    { transform: `translate(${posB.x}px, ${posB.restY}px)` },
                                    { transform: `translate(${posA.x}px, ${offScreenY}px)` }
                                ], { duration: 380, easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
                                    if (!isHintActive) return;
                                    if (round < totalRounds) {
                                        setTimeout(doRound, 250);
                                    } else {
                                        hand.remove();
                                        isHintActive = false;
                                        lockBoard = false;
                                        hintCardA = null;
                                        hintCardB = null;
                                    }
                                };
                            }, 800);
                        };
                    };
                }, 150);
            };
        };
    }

    doRound();
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
        audioLevelComplete.play();
        audioLevelComplete.onended = () => {
            overlay.classList.add('hidden');
            startLevel(currentLevel + 1);
        };
    } else {
        showFinaleVideo(overlay, content, 'nesneler_menu.html#1');
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
