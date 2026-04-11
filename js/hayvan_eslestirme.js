const animalNames = [
    "kedi", "kopek", "kus", "at", "inek", "koyun", "tavsan", "ayi", "aslan", "fil",
    "zebra", "zurafa", "maymun", "kaplan", "kurt", "tilki", "sincap"
];

const allAnimalsData = animalNames.map(name => ({
    id: name,
    image: `assets/images/${name}.png`
}));

// Ses Dosyaları
const audioInstruction = new Audio('assets/sounds/hayvan_eslestirme.mp3');
const audioOnay = new Audio('assets/sounds/onay.mp3');
const audioDat = new Audio('assets/sounds/dat.mp3');
const audioLevelComplete = new Audio('assets/sounds/tebrikler_basardin.mp3');
const audioGrandFinale = new Audio('assets/sounds/basari_fon.mp3');

let currentLevelNumber = 1;
let currentStages = [];
let currentStageIndex = 0;

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
    currentLevelNumber = levelNumber;
    currentStageIndex = 0;
    currentStages = generateStagesForLevel(levelNumber);
    renderStage();
}

function renderStage() {
    const leftColumn = document.getElementById('left-column');
    const rightColumn = document.getElementById('right-column');
    const levelTitle = document.getElementById('level-title');

    leftColumn.innerHTML = '';
    rightColumn.innerHTML = '';
    selectedLeft = null;
    selectedRight = null;
    matchedPairsCount = 0;
    isProcessing = false;

    const currentStageData = currentStages[currentStageIndex];
    levelTitle.innerText = `Seviye ${currentLevelNumber} (Aşama ${currentStageIndex + 1}/${currentStages.length})`;

    const leftAnimals = shuffleArray(currentStageData.fruits);
    const rightAnimals = shuffleArray(currentStageData.fruits);

    leftAnimals.forEach(animal => createAnimalElement(animal, 'left', leftColumn));
    rightAnimals.forEach(animal => createAnimalElement(animal, 'right', rightColumn));

    if (currentStageIndex === 0) {
        setTimeout(() => playInstructionAudio(), 500);
    }
}

function createAnimalElement(animal, side, parentElement) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('fruit-wrapper');

    const imgElement = document.createElement('img');
    imgElement.src = animal.image;
    imgElement.decoding = 'async';
    imgElement.classList.add('fruit-item');
    imgElement.dataset.id = animal.id;
    imgElement.dataset.side = side;

    const crossElement = document.createElement('div');
    crossElement.classList.add('cross-mark');
    crossElement.innerHTML = '❌';

    imgElement.addEventListener('click', () => handleAnimalClick(imgElement, wrapper));

    wrapper.appendChild(imgElement);
    wrapper.appendChild(crossElement);
    parentElement.appendChild(wrapper);
}

function handleAnimalClick(imgElement, wrapper) {
    if (imgElement.classList.contains('matched-fruit') || isProcessing) return;

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
        audioOnay.play();

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
        audioDat.play();

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

    if (currentLevelNumber < 5) {
        content.innerHTML = '🤩👏';
        content.className = 'celebration-content';
        audioLevelComplete.play();
        triggerConfetti();

        audioLevelComplete.onended = () => {
            overlay.classList.add('hidden');
            startLevel(currentLevelNumber + 1);
        };
    } else {
        content.innerHTML = '<img src="assets/images/tebrikler.gif" alt="Tebrikler" class="final-gif">';
        content.className = 'celebration-content';

        audioGrandFinale.play();
        triggerGrandConfetti();

        setTimeout(() => {
            overlay.classList.add('hidden');
            window.location.href = 'hayvanlar_menu.html';
        }, 6000);
    }
}

function triggerConfetti() {
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
}

window.onload = () => {
    startLevel(1);
};

// Büyük Final İçin Havai Fişek Etkili Sürekli Konfeti
function triggerGrandConfetti() {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    function randomInRange(min, max) { return Math.random() * (max - min) + min; }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}
