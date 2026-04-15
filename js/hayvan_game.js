window.MAX_LEVEL = 5;

// Türkçe karakter içermeyen standartlaştırılmış 17 Hayvan Listesi
const animalNames = [
    "kedi", "kopek", "kus", "at", "inek", "koyun", "tavsan", "ayi", "aslan", "fil",
    "zebra", "zurafa", "maymun", "kaplan", "kurt", "tilki", "sincap",
    "balik", "tavuk", "esek", "kurbaga"
];

// Hayvanların tam verisini otomatik oluşturan liste
const allAnimalsData = animalNames.map(name => ({
    id: name,
    image: `assets/images/hayvanlar/${name}.webp`,
    audio: `assets/sounds/soru_${name}.mp3`,
    correctAudio: `assets/sounds/dogru_${name}.mp3`,
    wrongAudio: `assets/sounds/isim_${name}.mp3`
}));

// Ortak Sesler
const audioDat = new Audio('assets/sounds/dat.mp3');
const audioConfetti = new Audio('assets/sounds/konfeti.mp3');
const audioLevelComplete = new Audio('assets/sounds/tebrikler_basardin.mp3');
const audioGrandFinale = new Audio('assets/sounds/basari_fon.mp3');
const FINALE_VIDEO_SRC = 'assets/sounds/kutlama.mp4';
let currentQuestionAudio = null;

// Konfeti Fonksiyonu
function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    }
}

// Oyun Durumu Değişkenleri
let currentLevelNumber = 1;
let currentStages = [];
let currentStageIndex = 0;
let isFirstMove = true;

// Görsel sayısına göre grid düzeni ve boyut hesaplar
function calcLayout(n) {
    const isMobile = window.innerWidth <= 600;
    const cols = isMobile ? (n <= 1 ? 1 : 2) : (n <= 4 ? 2 : 3);
    const rows = Math.ceil(n / cols);
    const gap = isMobile ? 16 : 24;
    const availW = window.innerWidth - 60;
    const itemW = (availW - gap * (cols - 1)) / cols;
    const availH = window.innerHeight - 160;
    const itemByH = isMobile ? itemW : (availH - gap * (rows - 1)) / rows;
    const size = Math.floor(Math.min(itemW, itemByH, 260));
    return { size, cols, gap };
}

// Diziyi karıştıran fonksiyon
function shuffleArray(array) {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Belirli bir seviye için aşamaları oluşturan fonksiyon
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

        const targetAnimal = stageAnimals[Math.floor(Math.random() * stageAnimals.length)];

        stages.push({
            target: targetAnimal.id,
            audio: targetAnimal.audio,
            correctAudio: targetAnimal.correctAudio,
            fruits: shuffleArray(stageAnimals)
        });
    }
    return stages;
}

// Yeni Bir Seviyeyi Başlatan Fonksiyon
function startLevel(levelNumber) {
    currentLevelNumber = levelNumber;
    currentStageIndex = 0;
    currentStages = generateStagesForLevel(levelNumber);
    if (levelNumber === 1) isFirstMove = true;
    renderStage();
}

// O Anki Aşamayı Ekrana Çizen Fonksiyon
function renderStage() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';

    const currentStageData = currentStages[currentStageIndex];
    currentQuestionAudio = new Audio(currentStageData.audio);

    const { size, cols, gap } = calcLayout(currentStageData.fruits.length);
    gameBoard.style.display = 'grid';
    gameBoard.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
    gameBoard.style.gap = gap + 'px';
    gameBoard.style.justifyContent = 'center';

    currentStageData.fruits.forEach(animal => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('fruit-wrapper');

        const imgElement = document.createElement('img');
        imgElement.src = animal.image;
        imgElement.decoding = 'async';
        imgElement.classList.add('fruit-item');
        imgElement.id = animal.id;
        imgElement.style.width = size + 'px';
        imgElement.style.height = size + 'px';
        imgElement.style.padding = '10px';
        imgElement.style.boxSizing = 'border-box';

        const crossElement = document.createElement('div');
        crossElement.classList.add('cross-mark');
        crossElement.innerHTML = '❌';

        imgElement.addEventListener('click', () => checkAnswer(animal.id, wrapper));

        wrapper.appendChild(imgElement);
        wrapper.appendChild(crossElement);
        gameBoard.appendChild(wrapper);
    });

    setTimeout(() => {
        playQuestionAudio();
        if (isFirstMove) {
            currentQuestionAudio.onended = () => {
                showHandHint(currentStageData.target);
            };
        }
    }, 500);
}

function playQuestionAudio() {
    if(currentQuestionAudio) {
        currentQuestionAudio.currentTime = 0;
        currentQuestionAudio.play().catch(() => console.log("Otomatik oynatma engellendi."));
    }
}

document.getElementById('play-audio-btn').addEventListener('click', playQuestionAudio);

// Cevabı Kontrol Eden Fonksiyon
function checkAnswer(clickedId, wrapperElement) {
    const currentStageData = currentStages[currentStageIndex];

    // El animasyonu varsa kaldır
    const existingHand = document.getElementById('hand-hint');
    if (existingHand) existingHand.remove();

    if(currentQuestionAudio) {
        currentQuestionAudio.pause();
        currentQuestionAudio.currentTime = 0;
    }

    if (clickedId === currentStageData.target) {
        // --- DOĞRU CEVAP ---
        audioConfetti.play();
        triggerConfetti();

        setTimeout(() => {
            const specificCorrectAudio = new Audio(currentStageData.correctAudio);
            specificCorrectAudio.play();

            specificCorrectAudio.onended = () => {
                currentStageIndex++;

                if (currentStageIndex < currentStages.length) {
                    renderStage();
                } else {
                    showLevelCompleteCelebration();
                }
            };
        }, 2000);

    } else {
        // --- YANLIŞ CEVAP ---
        audioDat.play();

        const cross = wrapperElement.querySelector('.cross-mark');
        cross.classList.add('show-cross');

        const img = wrapperElement.querySelector('.fruit-item');
        img.classList.add('shake');
        setTimeout(() => img.classList.remove('shake'), 500);

        const clickedAnimalData = currentStageData.fruits.find(animal => animal.id === clickedId);

        setTimeout(() => {
            if (clickedAnimalData && clickedAnimalData.wrongAudio) {
                const specificWrongAudio = new Audio(clickedAnimalData.wrongAudio);
                specificWrongAudio.play();
                specificWrongAudio.onended = () => showHandHint(currentStageData.target, 1);
            } else {
                showHandHint(currentStageData.target, 1);
            }
            cross.classList.remove('show-cross');
        }, 2000);
    }
}

function showHandHint(targetId, totalTaps = 3) {
    isFirstMove = false;
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    const existing = document.getElementById('hand-hint');
    if (existing) existing.remove();

    const rect = targetEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const tapTop = rect.top + rect.height * 0.3;
    const restTop = tapTop + 90;
    const offScreenTop = window.innerHeight + 100;
    const FONT_SIZE = 72;

    const hand = document.createElement('div');
    hand.id = 'hand-hint';
    hand.innerHTML = '👆';
    hand.style.cssText = `
        position: fixed;
        font-size: ${FONT_SIZE}px;
        pointer-events: none;
        z-index: 9999;
        left: ${centerX - FONT_SIZE / 2}px;
        top: 0px;
        transform: translateY(${offScreenTop}px);
        will-change: transform;
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
            ], { duration: 400, easing: 'ease-in', fill: 'forwards' }).onfinish = () => hand.remove();
            return;
        }
        tapCount++;
        hand.animate([
            { transform: `translateY(${restTop}px)`, easing: 'cubic-bezier(0.4,0,1,1)' },
            { transform: `translateY(${tapTop}px)`,  easing: 'cubic-bezier(0,0,0.6,1)' },
            { transform: `translateY(${restTop}px)` }
        ], { duration: 550, fill: 'forwards' }).onfinish = () => {
            setTimeout(doTap, 280);
        };
    }
}

// Seviye Sonu ve Büyük Final Kutlama Fonksiyonu
function showLevelCompleteCelebration() {
    const overlay = document.getElementById('celebration-overlay');
    const content = overlay.querySelector('.celebration-content');

    overlay.classList.remove('hidden');

    if (currentLevelNumber < 5) {
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

// Sayfa yüklendiğinde Oyunu SEVİYE 1'den başlat
window.onload = () => {
    startLevel(1);
};
