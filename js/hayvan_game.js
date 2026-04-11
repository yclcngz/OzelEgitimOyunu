// Türkçe karakter içermeyen standartlaştırılmış 17 Hayvan Listesi
const animalNames = [
    "kedi", "kopek", "kus", "at", "inek", "koyun", "tavsan", "ayi", "aslan", "fil",
    "zebra", "zurafa", "maymun", "kaplan", "kurt", "tilki", "sincap"
];

// Hayvanların tam verisini otomatik oluşturan liste
const allAnimalsData = animalNames.map(name => ({
    id: name,
    image: `assets/images/${name}.png`,
    audio: `assets/sounds/soru_${name}.mp3`,
    correctAudio: `assets/sounds/dogru_${name}.mp3`,
    wrongAudio: `assets/sounds/isim_${name}.mp3`
}));

// Ortak Sesler
const audioDat = new Audio('assets/sounds/dat.mp3');
const audioConfetti = new Audio('assets/sounds/konfeti.mp3');
const audioLevelComplete = new Audio('assets/sounds/tebrikler_basardin.mp3');
const audioGrandFinale = new Audio('assets/sounds/basari_fon.mp3');
let currentQuestionAudio = null;

// Oyun Durumu Değişkenleri
let currentLevelNumber = 1;
let currentStages = [];
let currentStageIndex = 0;

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
    renderStage();
}

// O Anki Aşamayı Ekrana Çizen Fonksiyon
function renderStage() {
    const gameBoard = document.getElementById('game-board');
    const levelTitle = document.getElementById('level-title');
    gameBoard.innerHTML = '';

    const currentStageData = currentStages[currentStageIndex];
    levelTitle.innerText = `Seviye ${currentLevelNumber} (Aşama ${currentStageIndex + 1}/${currentStages.length})`;

    currentQuestionAudio = new Audio(currentStageData.audio);

    currentStageData.fruits.forEach(animal => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('fruit-wrapper');

        const imgElement = document.createElement('img');
        imgElement.src = animal.image;
        imgElement.decoding = 'async';
        imgElement.classList.add('fruit-item');
        imgElement.id = animal.id;

        const crossElement = document.createElement('div');
        crossElement.classList.add('cross-mark');
        crossElement.innerHTML = '❌';

        imgElement.addEventListener('click', () => checkAnswer(animal.id, wrapper));

        wrapper.appendChild(imgElement);
        wrapper.appendChild(crossElement);
        gameBoard.appendChild(wrapper);
    });

    setTimeout(() => playQuestionAudio(), 500);
}

function playQuestionAudio() {
    if(currentQuestionAudio) {
        currentQuestionAudio.currentTime = 0;
        currentQuestionAudio.play().catch(error => console.log("Otomatik oynatma engellendi."));
    }
}

document.getElementById('play-audio-btn').addEventListener('click', playQuestionAudio);

// Cevabı Kontrol Eden Fonksiyon
function checkAnswer(clickedId, wrapperElement) {
    const currentStageData = currentStages[currentStageIndex];

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
            }
            cross.classList.remove('show-cross');
        }, 2000);
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

// Konfeti Fonksiyonu
function triggerConfetti() {
    confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 }
    });
}

// Büyük Final İçin Havai Fişek Etkili Sürekli Konfeti
function triggerGrandConfetti() {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

// Sayfa yüklendiğinde Oyunu SEVİYE 1'den başlat
window.onload = () => {
    startLevel(1);
};
