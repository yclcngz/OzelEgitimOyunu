window.MAX_LEVEL = 3;

const animalNames = [
    "kedi", "kopek", "kus", "at", "inek", "koyun", "tavsan", "ayi", "aslan", "fil",
    "zebra", "zurafa", "maymun", "kaplan", "kurt", "tilki", "sincap"
];

const allAnimalsData = animalNames.map(name => ({
    id: name,
    image: `assets/images/hayvanlar/${name}.webp`
}));

// Sesler
const audioInstruction = new Audio('assets/sounds/hayvan_bulmaca.mp3');
const audioOnay = new Audio('assets/sounds/onay.mp3');
const audioDat = new Audio('assets/sounds/dat.mp3');
const audioLevelComplete = new Audio('assets/sounds/tebrikler_basardin.mp3');
const audioGrandFinale = new Audio('assets/sounds/basari_fon.mp3');
const FINALE_VIDEO_SRC = 'assets/sounds/oyun_sonlari_tebrik animasyonu.mp4';

let currentLevelNumber = 1;
let currentStages = [];
let currentStageIndex = 0;

// Hafıza Oyunu Değişkenleri
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let matchedPairsCount = 0;

function shuffleArray(array) {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Bulmaca için aşama oluşturma (Hayvanları çiftleyerek)
function generateStagesForLevel(levelNumber) {
    const pairsPerStage = levelNumber + 1;
    let pool = shuffleArray(allAnimalsData);
    let stages = [];

    while (pool.length > 0) {
        let stageAnimals = [];
        if (pool.length >= pairsPerStage) {
            stageAnimals = pool.splice(0, pairsPerStage);
        } else {
            stageAnimals = pool.splice(0, pool.length);
            let fillerPool = shuffleArray(allAnimalsData).filter(a => !stageAnimals.includes(a));
            let needed = pairsPerStage - stageAnimals.length;
            stageAnimals = stageAnimals.concat(fillerPool.splice(0, needed));
        }

        let stageCards = [];
        stageAnimals.forEach(animal => {
            stageCards.push({ ...animal, uniqueId: animal.id + '_1' });
            stageCards.push({ ...animal, uniqueId: animal.id + '_2' });
        });

        stages.push({
            cards: shuffleArray(stageCards)
        });
    }
    return stages;
}

function startLevel(levelNumber) {
    currentLevelNumber = levelNumber;
    currentStageIndex = 0;
    currentStages = generateStagesForLevel(levelNumber);
    renderStage();
}

function renderStage() {
    const memoryBoard = document.getElementById('memory-board');
    memoryBoard.innerHTML = '';

    hasFlippedCard = false;
    lockBoard = false;
    firstCard = null;
    secondCard = null;
    matchedPairsCount = 0;

    const currentStageData = currentStages[currentStageIndex];

    currentStageData.cards.forEach(cardData => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('memory-card');
        cardElement.dataset.id = cardData.id;

        cardElement.innerHTML = `
            <div class="memory-card-inner">
                <div class="memory-card-front">
                    <img src="${cardData.image}" alt="${cardData.id}">
                </div>
                <div class="memory-card-back">?</div>
            </div>
        `;

        cardElement.addEventListener('click', flipCard);
        memoryBoard.appendChild(cardElement);
    });

    if (currentStageIndex === 0) {
        setTimeout(() => playInstructionAudio(), 500);
    }
}

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    this.classList.add('flipped');

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    checkForMatch();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.id === secondCard.dataset.id;

    if (isMatch) {
        disableCards();
    } else {
        unflipCards();
    }
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);

    audioOnay.cloneNode().play();
    matchedPairsCount++;

    resetBoard();

    const totalPairs = currentStages[currentStageIndex].cards.length / 2;
    if (matchedPairsCount === totalPairs) {
        setTimeout(() => {
            currentStageIndex++;
            if (currentStageIndex < currentStages.length) {
                renderStage();
            } else {
                showLevelCompleteCelebration();
            }
        }, 1000);
    }
}

function unflipCards() {
    lockBoard = true;
    audioDat.cloneNode().play();

    setTimeout(() => {
        firstCard.classList.remove('flipped');
        secondCard.classList.remove('flipped');
        resetBoard();
    }, 1000);
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

function playInstructionAudio() {
    audioInstruction.currentTime = 0;
    audioInstruction.play().catch(() => console.log("Otomatik ses engellendi."));
}

document.getElementById('play-audio-btn').addEventListener('click', playInstructionAudio);

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
        showFinaleVideo(overlay, content, 'hayvanlar_menu.html');
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

window.onload = () => {
    startLevel(1);
};
