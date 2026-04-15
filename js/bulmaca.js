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
const FINALE_VIDEO_SRC = 'assets/sounds/kutlama.mp4';

let currentLevelNumber = 1;
let currentStages = [];
let currentStageIndex = 0;
let isFirstMove = true;

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
    if (levelNumber === 1) isFirstMove = true;
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

    setTimeout(() => {
        playInstructionAudio();
        if (isFirstMove) {
            audioInstruction.onended = () => {
                audioInstruction.onended = null;
                showCardHint(3);
            };
        }
    }, 500);
}

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return; // Aynı karta çift tıklamayı engelle

    const existingHand = document.getElementById('hand-hint');
    if (existingHand) existingHand.remove();

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
    lockBoard = true;
    audioDat.cloneNode().play();

    setTimeout(() => {
        firstCard.classList.remove('flipped');
        secondCard.classList.remove('flipped');
        resetBoard();
        showCardHint(1);
    }, 1000);
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

function showCardHint(totalRounds = 1) {
    isFirstMove = false;

    const existing = document.getElementById('hand-hint');
    if (existing) existing.remove();

    const cards = [...document.querySelectorAll('.memory-card:not(.flipped)')];
    if (cards.length < 2) return;

    // Eşleşen çifti bul
    let card1 = null, card2 = null;
    for (let i = 0; i < cards.length; i++) {
        const match = cards.find((c, idx) => idx !== i && c.dataset.id === cards[i].dataset.id);
        if (match) { card1 = cards[i]; card2 = match; break; }
    }
    if (!card1 || !card2) return;

    const FONT_SIZE = 72;
    const offScreenY = window.innerHeight + 100;

    function getPos(el) {
        const rect = el.getBoundingClientRect();
        return {
            x:    rect.left + rect.width / 2 - FONT_SIZE / 2,
            tapY: rect.top + rect.height * 0.3,
            restY: rect.top + rect.height * 0.3 + 90
        };
    }

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
        transform: translate(0px, ${offScreenY}px);
        will-change: transform;
        filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.4));
    `;
    document.body.appendChild(hand);

    let round = 0;

    function startRound() {
        if (round >= totalRounds) { hand.remove(); return; }
        round++;

        const p1 = getPos(card1);
        const p2 = getPos(card2);

        // 1) Kart1'e giriş
        hand.animate([
            { transform: `translate(${p1.x}px, ${offScreenY}px)` },
            { transform: `translate(${p1.x}px, ${p1.restY}px)` }
        ], { duration: 400, easing: 'ease-out', fill: 'forwards' }).onfinish = () => {

            // 2) Kart1'e dokun
            hand.animate([
                { transform: `translate(${p1.x}px, ${p1.restY}px)`, easing: 'cubic-bezier(0.4,0,1,1)' },
                { transform: `translate(${p1.x}px, ${p1.tapY}px)`,  easing: 'cubic-bezier(0,0,0.6,1)' },
                { transform: `translate(${p1.x}px, ${p1.restY}px)` }
            ], { duration: 500, fill: 'forwards' }).onfinish = () => {

                setTimeout(() => {
                    // 3) Kart2'ye kaydır
                    hand.animate([
                        { transform: `translate(${p1.x}px, ${p1.restY}px)` },
                        { transform: `translate(${p2.x}px, ${p2.restY}px)` }
                    ], { duration: 500, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => {

                        // 4) Kart2'ye dokun
                        hand.animate([
                            { transform: `translate(${p2.x}px, ${p2.restY}px)`, easing: 'cubic-bezier(0.4,0,1,1)' },
                            { transform: `translate(${p2.x}px, ${p2.tapY}px)`,  easing: 'cubic-bezier(0,0,0.6,1)' },
                            { transform: `translate(${p2.x}px, ${p2.restY}px)` }
                        ], { duration: 500, fill: 'forwards' }).onfinish = () => {

                            // 5) Çıkış → sonraki tur veya bitir
                            setTimeout(() => {
                                hand.animate([
                                    { transform: `translate(${p2.x}px, ${p2.restY}px)` },
                                    { transform: `translate(${p2.x}px, ${offScreenY}px)` }
                                ], { duration: 350, easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
                                    if (round < totalRounds) setTimeout(startRound, 300);
                                    else hand.remove();
                                };
                            }, 280);
                        };
                    };
                }, 200);
            };
        };
    }

    startRound();
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
        showFinaleVideo(overlay, content, 'meyveler_menu.html#2');
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