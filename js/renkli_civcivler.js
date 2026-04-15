window.MAX_LEVEL = 3;

const civcivData = [
    { id: "beyaz",   name: "Beyaz Civciv",   image: "assets/images/renkli civcivler/beyaz_civciv.png" },
    { id: "kirmizi", name: "Kırmızı Civciv", image: "assets/images/renkli civcivler/kirmizi_civciv.png" },
    { id: "mavi",    name: "Mavi Civciv",    image: "assets/images/renkli civcivler/mavi_civciv.png" },
    { id: "mor",     name: "Mor Civciv",     image: "assets/images/renkli civcivler/mor_civciv.png" },
    { id: "sari",    name: "Sarı Civciv",    image: "assets/images/renkli civcivler/sari_civciv.png" },
    { id: "siyah",   name: "Siyah Civciv",   image: "assets/images/renkli civcivler/siyah_civciv.png" },
    { id: "turuncu", name: "Turuncu Civciv", image: "assets/images/renkli civcivler/turuncu_civciv.png" },
    { id: "yesil",   name: "Yeşil Civciv",   image: "assets/images/renkli civcivler/yesil_civciv.png" }
];

const audioInstruction = new Audio('assets/sounds/renkli_civcivler_eslestirme.mp3');
const audioOnay = new Audio('assets/sounds/onay.mp3');
const audioDat  = new Audio('assets/sounds/dat.mp3');
const audioLevelComplete = new Audio('assets/sounds/tebrikler_basardin.mp3');
const FINALE_VIDEO_SRC = 'assets/sounds/kutlama.mp4';

let currentLevelNumber = 1;
let currentStages = [];
let currentStageIndex = 0;
let isFirstMove = true;
let selectedLeft = null;
let selectedRight = null;
let matchedPairsCount = 0;
let isProcessing = false;

function shuffleArray(array) {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function generateStagesForLevel(levelNumber) {
    const itemsPerStage = levelNumber + 1;
    let pool = shuffleArray(civcivData);
    let stages = [];

    while (pool.length > 0) {
        let stageCivcivs = [];
        if (pool.length >= itemsPerStage) {
            stageCivcivs = pool.splice(0, itemsPerStage);
        } else {
            stageCivcivs = pool.splice(0, pool.length);
            let fillerPool = shuffleArray(civcivData).filter(c => !stageCivcivs.includes(c));
            let needed = itemsPerStage - stageCivcivs.length;
            stageCivcivs = stageCivcivs.concat(fillerPool.splice(0, needed));
        }
        stages.push({ fruits: stageCivcivs });
    }
    return stages;
}

function startLevel(levelNumber) {
    if (levelNumber > 3) levelNumber = 3;
    currentLevelNumber = levelNumber;
    currentStageIndex = 0;
    currentStages = generateStagesForLevel(levelNumber);
    if (levelNumber === 1) isFirstMove = true;
    renderStage();
}

function renderStage() {
    const leftColumn = document.getElementById('left-column');
    const rightColumn = document.getElementById('right-column');

    leftColumn.innerHTML = '';
    rightColumn.innerHTML = '';
    selectedLeft = null;
    selectedRight = null;
    matchedPairsCount = 0;
    isProcessing = false;

    const currentStageData = currentStages[currentStageIndex];
    const leftCivcivs = shuffleArray(currentStageData.fruits);
    const rightCivcivs = shuffleArray(currentStageData.fruits);

    leftCivcivs.forEach(c => createCivcivElement(c, 'left', leftColumn));
    rightCivcivs.forEach(c => createCivcivElement(c, 'right', rightColumn));

    setTimeout(() => {
        playInstructionAudio();
        if (isFirstMove) {
            audioInstruction.onended = () => {
                audioInstruction.onended = null;
                showMatchHint(3);
            };
        }
    }, 500);
}

function createCivcivElement(civciv, side, parentElement) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('fruit-wrapper');

    const imgElement = document.createElement('img');
    imgElement.src = civciv.image;
    imgElement.decoding = 'async';
    imgElement.classList.add('fruit-item');
    imgElement.dataset.id = civciv.id;
    imgElement.dataset.side = side;

    const crossElement = document.createElement('div');
    crossElement.classList.add('cross-mark');
    crossElement.innerHTML = '❌';

    imgElement.addEventListener('click', () => handleCivcivClick(imgElement, wrapper));

    wrapper.appendChild(imgElement);
    wrapper.appendChild(crossElement);
    parentElement.appendChild(wrapper);
}

function handleCivcivClick(imgElement, wrapper) {
    if (imgElement.classList.contains('matched-fruit') || isProcessing) return;

    const existingHand = document.getElementById('hand-hint');
    if (existingHand) existingHand.remove();

    const side = imgElement.dataset.side;

    if (side === 'left') {
        if (selectedLeft) selectedLeft.img.classList.remove('selected-fruit');
        selectedLeft = { img: imgElement, wrap: wrapper, id: imgElement.dataset.id };
        imgElement.classList.add('selected-fruit');
    } else {
        if (selectedRight) selectedRight.img.classList.remove('selected-fruit');
        selectedRight = { img: imgElement, wrap: wrapper, id: imgElement.dataset.id };
        imgElement.classList.add('selected-fruit');
    }

    if (selectedLeft && selectedRight) {
        checkMatch();
    }
}

function checkMatch() {
    isProcessing = true;

    const currentLeft = selectedLeft;
    const currentRight = selectedRight;
    selectedLeft = null;
    selectedRight = null;

    if (currentLeft.id === currentRight.id) {
        audioOnay.cloneNode().play();
        currentLeft.img.classList.remove('selected-fruit');
        currentRight.img.classList.remove('selected-fruit');
        currentLeft.img.classList.add('matched-fruit');
        currentRight.img.classList.add('matched-fruit');

        if (typeof confetti === 'function') {
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        }

        matchedPairsCount++;

        if (matchedPairsCount === currentStages[currentStageIndex].fruits.length) {
            setTimeout(() => {
                currentStageIndex++;
                if (currentStageIndex < currentStages.length) {
                    renderStage();
                } else {
                    showLevelCompleteCelebration();
                }
            }, 1000);
        } else {
            isProcessing = false;
        }
    } else {
        audioDat.cloneNode().play();

        const crossL = currentLeft.wrap.querySelector('.cross-mark');
        const crossR = currentRight.wrap.querySelector('.cross-mark');
        crossL.classList.add('show-cross');
        crossR.classList.add('show-cross');

        currentLeft.img.classList.add('shake');
        currentRight.img.classList.add('shake');

        setTimeout(() => {
            currentLeft.img.classList.remove('shake', 'selected-fruit');
            currentRight.img.classList.remove('shake', 'selected-fruit');
            crossL.classList.remove('show-cross');
            crossR.classList.remove('show-cross');
            isProcessing = false;
            showMatchHint(1);
        }, 1000);
    }
}

function playInstructionAudio() {
    audioInstruction.currentTime = 0;
    audioInstruction.play().catch(() => {});
}

document.getElementById('play-audio-btn').addEventListener('click', playInstructionAudio);

function showMatchHint(totalRounds) {
    const leftImgs = [...document.querySelectorAll('#left-column .fruit-item:not(.matched-fruit)')];
    if (!leftImgs.length) return;
    const leftImg = leftImgs[0];
    const targetId = leftImg.dataset.id;
    const rightImgs = [...document.querySelectorAll('#right-column .fruit-item:not(.matched-fruit)')];
    const rightImg = rightImgs.find(img => img.dataset.id === targetId);
    if (!rightImg) return;
    showHandHint(leftImg, rightImg, totalRounds);
}

function showHandHint(leftEl, rightEl, totalRounds) {
    isFirstMove = false;

    const existing = document.getElementById('hand-hint');
    if (existing) existing.remove();

    const FONT_SIZE = 72;

    function getPos(el) {
        const rect = el.getBoundingClientRect();
        return { x: rect.left + rect.width / 2 - FONT_SIZE / 2, tapY: rect.top + rect.height * 0.3, restY: rect.top + rect.height * 0.3 + 90 };
    }

    const left  = getPos(leftEl);
    const right = getPos(rightEl);
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
        transform: translate(${left.x}px, ${offScreenY}px);
        will-change: transform;
        filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.4));
    `;
    document.body.appendChild(hand);

    let round = 0;

    function doRound() {
        round++;

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
                            ], { duration: 380, easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
                                if (round < totalRounds) {
                                    setTimeout(doRound, 250);
                                } else {
                                    hand.remove();
                                }
                            };
                        };
                    };
                }, 220);
            };
        };
    }

    doRound();
}

function showLevelCompleteCelebration() {
    const overlay = document.getElementById('celebration-overlay');
    const content = overlay.querySelector('.celebration-content');
    overlay.classList.remove('hidden');

    if (currentLevelNumber < 3) {
        content.innerHTML = '🤩👏';
        content.className = 'celebration-content';
        audioLevelComplete.play();
        audioLevelComplete.onended = () => {
            overlay.classList.add('hidden');
            startLevel(currentLevelNumber + 1);
        };
    } else {
        showFinaleVideo(overlay, content, 'renkler_menu.html#2');
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

// Tüm civciv görsellerini önceden yükle, sonra oyunu başlat
let loadedCount = 0;
const totalImages = civcivData.length;

civcivData.forEach(c => {
    const img = new Image();
    img.onload = img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalImages) startLevel(1);
    };
    img.src = c.image;
});
