window.MAX_LEVEL = 5;

// Türkçe karakter içermeyen standartlaştırılmış 17 Meyve Listesi
const fruitNames = [
    "muz", "elma", "portakal", "cilek", "kiraz", "nar", "kivi",
    "armut", "ananas", "mandalina", "karpuz", "kayisi", "seftali",
    "kavun", "uzum", "avokado", "incir"
];

// Meyvelerin tam verisini otomatik oluşturan liste
const allFruitsData = fruitNames.map(name => ({
    id: name,
    image: `assets/images/meyveler/${name}.png`,
    audio: `assets/sounds/soru_${name}.mp3`,
    correctAudio: `assets/sounds/dogru_${name}.mp3`,
    wrongAudio: `assets/sounds/isim_${name}.mp3`
}));

// Ortak Sesler
const audioDat = new Audio('assets/sounds/dat.mp3');
const audioConfetti = new Audio('assets/sounds/konfeti.mp3');
const audioLevelComplete = new Audio('assets/sounds/tebrikler_basardin.mp3');
const audioGrandFinale = new Audio('assets/sounds/basari_fon.mp3');
const FINALE_VIDEO_SRC = 'assets/sounds/oyun_sonlari_tebrik animasyonu.mp4';
let currentQuestionAudio = null;



// Oyun Durumu Değişkenleri
let currentLevelNumber = 1;
let currentStages = [];
let currentStageIndex = 0;

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

        const targetFruit = stageFruits[Math.floor(Math.random() * stageFruits.length)];

        stages.push({
            target: targetFruit.id,
            audio: targetFruit.audio,
            correctAudio: targetFruit.correctAudio,
            fruits: shuffleArray(stageFruits)
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

function calcLayout(n) {
    const cols = 2;
    const rows = Math.ceil(n / cols);
    const gap = 12;
    const availW = window.innerWidth - 48;
    const availH = window.innerHeight - 90;
    const itemW = (availW - gap * (cols - 1)) / cols;
    const itemH = (availH - gap * (rows - 1)) / rows;
    const size = Math.floor(Math.min(itemW, itemH, 280));
    return { size, cols, gap };
}

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

    currentStageData.fruits.forEach(fruit => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('fruit-wrapper');

        const imgElement = document.createElement('img');
        imgElement.src = fruit.image;
        imgElement.decoding = 'async';
        imgElement.classList.add('fruit-item');
        imgElement.id = fruit.id;
        imgElement.style.width = size + 'px';
        imgElement.style.height = size + 'px';
        imgElement.style.padding = '10px';
        imgElement.style.boxSizing = 'border-box';

        const crossElement = document.createElement('div');
        crossElement.classList.add('cross-mark');
        crossElement.innerHTML = '❌';

        imgElement.addEventListener('click', () => checkAnswer(fruit.id, wrapper));

        wrapper.appendChild(imgElement);
        wrapper.appendChild(crossElement);
        gameBoard.appendChild(wrapper);
    });

    setTimeout(() => playQuestionAudio(), 500);
}

function playQuestionAudio() {
    if (currentQuestionAudio) {
        currentQuestionAudio.currentTime = 0;
        currentQuestionAudio.play().catch(() => {});
    }
}

document.getElementById('play-audio-btn').addEventListener('click', playQuestionAudio);

function checkAnswer(clickedId, wrapperElement) {
    const currentStageData = currentStages[currentStageIndex];

    if (currentQuestionAudio) {
        currentQuestionAudio.pause();
        currentQuestionAudio.currentTime = 0;
    }

    if (clickedId === currentStageData.target) {
        audioConfetti.play();
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

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
        audioDat.play();

        const cross = wrapperElement.querySelector('.cross-mark');
        cross.classList.add('show-cross');

        const img = wrapperElement.querySelector('.fruit-item');
        img.classList.add('shake');
        setTimeout(() => img.classList.remove('shake'), 500);

        const clickedFruitData = currentStageData.fruits.find(fruit => fruit.id === clickedId);

        setTimeout(() => {
            if (clickedFruitData && clickedFruitData.wrongAudio) {
                const specificWrongAudio = new Audio(clickedFruitData.wrongAudio);
                specificWrongAudio.play();
            }
            cross.classList.remove('show-cross');
        }, 2000);
    }
}

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
        showFinaleVideo(overlay, content, 'meyveler_menu.html');
    }
}

function showFinaleVideo(overlay, content, menuUrl) {
    content.innerHTML = `
        <video id="finale-video" src="${FINALE_VIDEO_SRC}" autoplay playsinline
               style="position:fixed;top:0;left:0;width:100vw;height:100vh;object-fit:cover;z-index:101;"></video>
    `;
    content.className = 'celebration-content';
    content.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;';
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
