const fruitNames = [
    "muz", "elma", "portakal", "cilek", "kiraz", "nar", "kivi",
    "armut", "ananas", "mandalina", "karpuz", "kayisi", "seftali",
    "kavun", "uzum", "avokado", "incir"
];

const allFruitsData = fruitNames.map(name => ({
    id: name,
    image: `assets/images/meyveler/${name}.png`
}));

// Ses Dosyaları
const audioInstruction = new Audio('assets/sounds/eslestir.mp3'); 
const audioOnay = new Audio('assets/sounds/onay.mp3'); 
const audioDat = new Audio('assets/sounds/dat.mp3'); 
const audioLevelComplete = new Audio('assets/sounds/tebrikler_basardin.mp3'); 
const audioGrandFinale = new Audio('assets/sounds/basari_fon.mp3');
const FINALE_VIDEO_SRC = 'assets/sounds/oyun_sonlari_tebrik animasyonu.mp4';

let currentLevelNumber = 1;
let currentStages = [];
let currentStageIndex = 0;

// Eşleştirme için tutulan değişkenler
let selectedLeft = null;
let selectedRight = null;
let matchedPairsCount = 0; // O aşamada kaç çift eşleştirildi
let isProcessing = false; // Animasyon sürerken tıklamayı engellemek için
let isFirstMove = true;

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
    let pool = shuffleArray(allFruitsData);
    let stages = [];

    while (pool.length > 0) {
        let stageFruits = [];
        if (pool.length >= itemsPerStage) {
            stageFruits = pool.splice(0, itemsPerStage);
        } else {
            stageFruits = pool.splice(0, pool.length);
            let fillerPool = shuffleArray(allFruitsData).filter(f => !stageFruits.includes(f));
            let needed = itemsPerStage - stageFruits.length;
            stageFruits = stageFruits.concat(fillerPool.splice(0, needed));
        }

        stages.push({
            fruits: stageFruits
        });
    }
    return stages;
}

function startLevel(levelNumber) {
    if (levelNumber > 4) levelNumber = 4;
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

    // Sol ve sağ sütunlar için meyveleri karıştırarak diziler oluştur
    const leftFruits = shuffleArray(currentStageData.fruits);
    const rightFruits = shuffleArray(currentStageData.fruits); // Sağ taraf farklı sıralamada olsun

    // Sol Sütunu Çiz
    leftFruits.forEach(fruit => createFruitElement(fruit, 'left', leftColumn));
    
    // Sağ Sütunu Çiz
    rightFruits.forEach(fruit => createFruitElement(fruit, 'right', rightColumn));

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

function createFruitElement(fruit, side, parentElement) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('fruit-wrapper');

    const imgElement = document.createElement('img');
    imgElement.src = fruit.image;
    imgElement.decoding = 'async';
    imgElement.classList.add('fruit-item');
    imgElement.dataset.id = fruit.id;
    imgElement.dataset.side = side;

    const crossElement = document.createElement('div');
    crossElement.classList.add('cross-mark');
    crossElement.innerHTML = '❌'; 

    imgElement.addEventListener('click', () => handleFruitClick(imgElement, wrapper));

    wrapper.appendChild(imgElement);
    wrapper.appendChild(crossElement);
    parentElement.appendChild(wrapper);
}

function handleFruitClick(imgElement, wrapper) {
    if (imgElement.classList.contains('matched-fruit') || isProcessing) return;

    // El animasyonu varsa kaldır
    const existingHand = document.getElementById('hand-hint');
    if (existingHand) existingHand.remove();

    const side = imgElement.dataset.side;

    // Aynı taraftan başka bir şey seçilirse seçimi ona kaydır
    if (side === 'left') {
        if (selectedLeft) selectedLeft.img.classList.remove('selected-fruit');
        selectedLeft = { img: imgElement, wrap: wrapper, id: imgElement.dataset.id };
        imgElement.classList.add('selected-fruit');
    } else {
        if (selectedRight) selectedRight.img.classList.remove('selected-fruit');
        selectedRight = { img: imgElement, wrap: wrapper, id: imgElement.dataset.id };
        imgElement.classList.add('selected-fruit');
    }

    // Her iki taraftan da seçim yapıldıysa kontrol et
    if (selectedLeft && selectedRight) {
        checkMatch();
    }
}

function checkMatch() {
    isProcessing = true; // Kontrol bitene kadar yeni tıklamaları engelle

    // Zamanlayıcı (setTimeout) içinde hata almamak için seçilenleri geçici hafızaya alıyoruz
    const currentLeft = selectedLeft;
    const currentRight = selectedRight;

    // Seçim hafızasını hemen sıfırla ki sonraki tıklamalar için sistem hazır olsun
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

        // Bu aşamadaki tüm meyveler eşleşti mi?
        if (matchedPairsCount === currentStages[currentStageIndex].fruits.length) {
            setTimeout(() => {
                currentStageIndex++; // Sonraki aşamaya geç
                if (currentStageIndex < currentStages.length) {
                    renderStage(); // Aynı seviyenin diğer aşamasını çiz
                } else {
                    showLevelCompleteCelebration(); // Seviye bittiyse kutlama ekranını aç
                }
            }, 1000); // Tüm eşleşmeler bitince 1 saniye bekle ve geç
        } else {
            isProcessing = false; // Aşama henüz bitmedi, diğer eşleşmeler için kilidi aç
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
    audioInstruction.play().catch(error => console.log("Otomatik oynatma engellendi."));
}

document.getElementById('play-audio-btn').addEventListener('click', playInstructionAudio);

// Seviye Sonu ve Büyük Final Kutlama Fonksiyonu
function showLevelCompleteCelebration() {
    const overlay = document.getElementById('celebration-overlay');
    const content = overlay.querySelector('.celebration-content');

    overlay.classList.remove('hidden');

    if (currentLevelNumber < 4) {
        content.innerHTML = '🤩👏';
        content.className = 'celebration-content';
        audioLevelComplete.play();

        audioLevelComplete.onended = () => {
            overlay.classList.add('hidden');
            startLevel(currentLevelNumber + 1);
        };
    } else {
        showFinaleVideo(overlay, content, 'meyveler_menu.html#1');
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

function showMatchHint(totalRounds) {
    // Eşleşmemiş ilk sol meyveyi bul
    const leftImgs = [...document.querySelectorAll('#left-column .fruit-item:not(.matched-fruit)')];
    if (!leftImgs.length) return;
    const leftImg = leftImgs[0];
    const targetId = leftImg.dataset.id;

    // Sağ tarafta eşini bul
    const rightImgs = [...document.querySelectorAll('#right-column .fruit-item:not(.matched-fruit)')];
    const rightImg = rightImgs.find(img => img.dataset.id === targetId);
    if (!rightImg) return;

    showHandHint(leftImg, rightImg, totalRounds);
}

function showHandHint(leftEl, rightEl, totalRounds) {
    isFirstMove = false;

    // Önceki animasyon varsa kaldır
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

        // 1. Alttan sol meyveye gel
        hand.animate([
            { transform: `translate(${left.x}px, ${offScreenY}px)` },
            { transform: `translate(${left.x}px, ${left.restY}px)` }
        ], { duration: 400, easing: 'ease-out', fill: 'forwards' }).onfinish = () => {

            // 2. Sol meyveye tıkla
            hand.animate([
                { transform: `translate(${left.x}px, ${left.restY}px)`, easing: 'cubic-bezier(0.4,0,1,1)' },
                { transform: `translate(${left.x}px, ${left.tapY}px)`,  easing: 'cubic-bezier(0,0,0.6,1)' },
                { transform: `translate(${left.x}px, ${left.restY}px)` }
            ], { duration: 500, fill: 'forwards' }).onfinish = () => {

                // 3. Sağ meyveye kaydır
                setTimeout(() => {
                    hand.animate([
                        { transform: `translate(${left.x}px, ${left.restY}px)` },
                        { transform: `translate(${right.x}px, ${right.restY}px)` }
                    ], { duration: 380, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => {

                        // 4. Sağ meyveye tıkla
                        hand.animate([
                            { transform: `translate(${right.x}px, ${right.restY}px)`, easing: 'cubic-bezier(0.4,0,1,1)' },
                            { transform: `translate(${right.x}px, ${right.tapY}px)`,  easing: 'cubic-bezier(0,0,0.6,1)' },
                            { transform: `translate(${right.x}px, ${right.restY}px)` }
                        ], { duration: 500, fill: 'forwards' }).onfinish = () => {

                            // 5. Aşağı çekil
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

window.onload = () => {
    startLevel(1);
};