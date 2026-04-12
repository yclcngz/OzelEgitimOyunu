window.MAX_LEVEL = 3;

const fruitNames = [
    "muz", "elma", "portakal", "cilek", "kiraz", "nar", "kivi",
    "armut", "ananas", "mandalina", "karpuz", "kayisi", "seftali",
    "kavun", "uzum", "avokado", "incir"
];

const allFruitsData = fruitNames.map(name => ({
    id: name,
    image: `assets/images/meyveler/${name}.png`
}));

// Sesler
const audioInstruction = new Audio('assets/sounds/bulmaca_ses.mp3'); 
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

// Bulmaca için aşama oluşturma (Meyveleri çiftleyerek)
function generateStagesForLevel(levelNumber) {
    const pairsPerStage = levelNumber + 1; // Lvl 1: 2 çift(4 kart), Lvl 2: 3 çift(6 kart)...
    let pool = shuffleArray(allFruitsData);
    let stages = [];

    while (pool.length > 0) {
        let stageFruits = [];
        if (pool.length >= pairsPerStage) {
            stageFruits = pool.splice(0, pairsPerStage);
        } else {
            stageFruits = pool.splice(0, pool.length);
            let fillerPool = shuffleArray(allFruitsData).filter(f => !stageFruits.includes(f));
            let needed = pairsPerStage - stageFruits.length;
            stageFruits = stageFruits.concat(fillerPool.splice(0, needed));
        }

        // Meyveleri kopyalayarak (çiftleyerek) kart listesini oluştur
        let stageCards = [];
        stageFruits.forEach(fruit => {
            stageCards.push({ ...fruit, uniqueId: fruit.id + '_1' }); // 1. Kopya
            stageCards.push({ ...fruit, uniqueId: fruit.id + '_2' }); // 2. Kopya
        });

        stages.push({
            cards: shuffleArray(stageCards) // Çiftlenmiş desteyi karıştır
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

    // Değişkenleri Sıfırla
    hasFlippedCard = false;
    lockBoard = false;
    firstCard = null;
    secondCard = null;
    matchedPairsCount = 0;

    const currentStageData = currentStages[currentStageIndex];

    // Kartları Ekrana Çiz
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

    setTimeout(() => playInstructionAudio(), 500);
}

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return; // Aynı karta çift tıklamayı engelle

    this.classList.add('flipped');

    if (!hasFlippedCard) {
        // İlk tıklama
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    // İkinci tıklama
    secondCard = this;
    checkForMatch();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.id === secondCard.dataset.id;

    if (isMatch) {
        disableCards(); // Eşleşti! Kartları açık bırak
    } else {
        unflipCards();  // Eşleşmedi! Geri döndür
    }
}

function disableCards() {
    // Eşleşen kartların tıklanma özelliğini kaldır
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    
    audioOnay.cloneNode().play();
    matchedPairsCount++;

    resetBoard();

    // Tüm çiftler bulundu mu?
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
    lockBoard = true; // Dönme işlemi bitene kadar diğer kartlara tıklanmasın
    audioDat.cloneNode().play(); // Hata sesi (İsteğe bağlı, istersen bu satırı silebilirsin)

    setTimeout(() => {
        firstCard.classList.remove('flipped');
        secondCard.classList.remove('flipped');
        resetBoard();
    }, 1000); // 1 saniye kartları açık tutup geri kapatır
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

function playInstructionAudio() {
    audioInstruction.currentTime = 0; 
    audioInstruction.play().catch(e => console.log("Otomatik ses engellendi."));
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
        showFinaleVideo(overlay, content, 'meyveler_menu.html');
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

function triggerConfetti() {
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
}

window.onload = () => {
    startLevel(1);
};