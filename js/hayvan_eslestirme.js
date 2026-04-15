window.MAX_LEVEL = 3;

const animalNames = [
    "kedi", "kopek", "kus", "at", "inek", "koyun", "tavsan", "ayi", "aslan", "fil",
    "zebra", "zurafa", "maymun", "kaplan", "kurt", "tilki", "sincap",
    "balik", "tavuk", "esek", "kurbaga"
];

const allAnimalsData = animalNames.map(name => ({
    id: name,
    image: `assets/images/hayvanlar/${name}.webp`
}));

// Ses Dosyaları
const audioInstruction = new Audio('assets/sounds/hayvan_eslestirme.mp3');
const audioOnay = new Audio('assets/sounds/onay.mp3');
const audioDat = new Audio('assets/sounds/dat.mp3');
const audioLevelComplete = new Audio('assets/sounds/tebrikler_basardin.mp3');
const audioGrandFinale = new Audio('assets/sounds/basari_fon.mp3');
const FINALE_VIDEO_SRC = 'assets/sounds/kutlama.mp4';

let currentLevelNumber = 1;
let currentStages = [];
let currentStageIndex = 0;
let isFirstMove = true;

// Eşleştirme için tutulan değişkenler
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
    let pool = shuffleArray(allAnimalsData);
    let stages = [];

    while (pool.length > 0) {
        let stageAnimals = [];
        if (pool.length >= itemsPerStage) {
            stageAnimals = pool.splice(0, itemsPerStage);
        } else {
            stageAnimals = pool.splice(0, pool.length);
            let fillerPool = shuffleArray(allAnimalsData).filter(a => !stageAnimals.includes(a));
            let needed = itemsPerStage - stageAnimals.length;
            stageAnimals = stageAnimals.concat(fillerPool.splice(0, needed));
        }

        stages.push({
            fruits: stageAnimals
        });
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

    const leftAnimals = shuffleArray(currentStageData.fruits);
    const rightAnimals = shuffleArray(currentStageData.fruits);

    leftAnimals.forEach(animal => createAnimalElement(animal, 'left', leftColumn));
    rightAnimals.forEach(animal => createAnimalElement(animal, 'right', rightColumn));

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

function createAnimalElement(animal, side, parentElement) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('fruit-wrapper');

    // 3D flip yapısı: card-inner > card-front (img) + card-back (arka yüz)
    const cardInner = document.createElement('div');
    cardInner.classList.add('card-inner');

    const cardFront = document.createElement('div');
    cardFront.classList.add('card-front');

    const imgElement = document.createElement('img');
    imgElement.src = animal.image;
    imgElement.decoding = 'async';
    imgElement.classList.add('fruit-item');
    imgElement.dataset.id = animal.id;
    imgElement.dataset.side = side;
    cardFront.appendChild(imgElement);

    const cardBack = document.createElement('div');
    cardBack.classList.add('card-back');
    cardBack.innerHTML = '🐾';

    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);
    wrapper.appendChild(cardInner);

    const crossElement = document.createElement('div');
    crossElement.classList.add('cross-mark');
    crossElement.innerHTML = '❌';
    wrapper.appendChild(crossElement);

    imgElement.addEventListener('click', () => handleAnimalClick(imgElement, wrapper));
    parentElement.appendChild(wrapper);
}

function handleAnimalClick(imgElement, wrapper) {
    if (imgElement.classList.contains('matched-fruit') || isProcessing) return;

    // El animasyonu varsa kaldır
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
        // --- DOĞRU EŞLEŞTİRME ---
        audioOnay.cloneNode().play();

        currentLeft.img.classList.remove('selected-fruit');
        currentRight.img.classList.remove('selected-fruit');

        currentLeft.img.classList.add('matched-fruit');
        currentRight.img.classList.add('matched-fruit');

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
        // --- YANLIŞ EŞLEŞTİRME ---
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
    audioInstruction.play().catch(() => console.log("Otomatik oynatma engellendi."));
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

// Kartı Y ekseninde 360° döndürür; orta geçişte arka yüz görünür
function flipCardOnce(imgEl, onComplete) {
    const cardInner = imgEl ? imgEl.closest('.card-inner') : null;
    if (!cardInner) { onComplete && onComplete(); return; }

    // 0° → 180° (arka yüzü göster)
    cardInner.animate(
        [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }],
        { duration: 280, easing: 'ease-in' }
    ).onfinish = () => {
        // 180° → 360° (ön yüze geri dön = kapalı form)
        cardInner.animate(
            [{ transform: 'rotateY(180deg)' }, { transform: 'rotateY(360deg)' }],
            { duration: 280, easing: 'ease-out' }
        ).onfinish = () => {
            onComplete && onComplete();
        };
    };
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

                // Sol kart flip: açılır (hayvan görünür) → kapanır
                flipCardOnce(leftEl, () => {
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

                                // Sağ kart flip: açılır (aynı hayvan görünür) → kapanır
                                flipCardOnce(rightEl, () => {
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
                                });
                            };
                        };
                    }, 150);
                });
            };
        };
    }

    doRound();
}

// Seviye Sonu ve Büyük Final Kutlama Fonksiyonu
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
        showFinaleVideo(overlay, content, 'hayvanlar_menu.html#1');
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
