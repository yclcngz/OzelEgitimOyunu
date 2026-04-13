const allAnimals = [
    { id: "kedi",    name: "Kedi" },
    { id: "kopek",   name: "Köpek" },
    { id: "kus",     name: "Kuş" },
    { id: "at",      name: "At" },
    { id: "inek",    name: "İnek" },
    { id: "koyun",   name: "Koyun" },
    { id: "maymun",  name: "Maymun" },
    { id: "kurt",    name: "Kurt" },
    { id: "sincap",  name: "Sincap" },
    { id: "tavuk",   name: "Tavuk" },
    { id: "kurbaga", name: "Kurbağa" },
    { id: "esek",    name: "Eşek" }
];

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// 3 dinle aşaması + 12 quiz aşaması = 15 toplam
const listenStages = [
    { type: 'listen', animals: allAnimals.slice(0, 4) },
    { type: 'listen', animals: allAnimals.slice(4, 8) },
    { type: 'listen', animals: allAnimals.slice(8) }
];

const quizStages = shuffleArray([...allAnimals]).map(a => ({ type: 'quiz', correct: a }));
const allStages = [...listenStages, ...quizStages]; // 15 aşama

// Ses dosyaları
const audioOnay = new Audio('assets/sounds/onay.mp3');
const audioDat  = new Audio('assets/sounds/dat.mp3');
const audioLevelComplete = new Audio('assets/sounds/tebrikler_basardin.mp3');
const audioGrandFinale   = new Audio('assets/sounds/basari_fon.mp3');
const FINALE_VIDEO_SRC = 'assets/sounds/oyun_sonlari_tebrik animasyonu.mp4';

let currentStageIdx = 0;
let currentAudio = null;
let currentListenCard = null;
let quizLocked = false;

// --- YARDIMCI ---
function stopCurrentAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio.onended = null;
        currentAudio = null;
    }
}

function playAnimalSoundTimes(animalId, timesLeft) {
    if (timesLeft <= 0) return;
    const audio = new Audio(`assets/sounds/hayvan sesleri/${animalId}_ses.mp3`);
    currentAudio = audio;
    audio.play().catch(() => {});
    audio.onended = () => {
        currentAudio = null;
        if (timesLeft > 1) {
            setTimeout(() => playAnimalSoundTimes(animalId, timesLeft - 1), 500);
        }
    };
}

// --- ANA RENDER ---
function renderStage() {
    stopCurrentAudio();
    if (currentListenCard) { currentListenCard.classList.remove('playing'); currentListenCard = null; }
    quizLocked = false;

    const stage = allStages[currentStageIdx];
    const stageTitle = document.getElementById('stage-title');
    const prevBtn    = document.getElementById('stage-prev');
    const nextBtn    = document.getElementById('stage-next');

    stageTitle.textContent = `Aşama ${currentStageIdx + 1} / ${allStages.length}`;
    prevBtn.style.opacity = currentStageIdx === 0 ? '0.3' : '1';
    prevBtn.disabled = currentStageIdx === 0;
    nextBtn.style.opacity = currentStageIdx === allStages.length - 1 ? '0.3' : '1';
    nextBtn.disabled = currentStageIdx === allStages.length - 1;

    if (stage.type === 'listen') {
        document.getElementById('sounds-grid').classList.remove('hidden');
        document.getElementById('quiz-area').classList.add('hidden');
        renderListenStage(stage);
    } else {
        document.getElementById('sounds-grid').classList.add('hidden');
        document.getElementById('quiz-area').classList.remove('hidden');
        renderQuizStage(stage);
    }
}

// --- DİNLE AŞAMASI ---
function renderListenStage(stage) {
    const grid = document.getElementById('sounds-grid');
    grid.innerHTML = '';

    // Komut sesini çal
    setTimeout(() => {
        const cmdAudio = new Audio('assets/sounds/hayvan_sesleri_komut.mp3');
        cmdAudio.play().catch(() => {});
    }, 500);

    stage.animals.forEach(animal => {
        const card = document.createElement('div');
        card.classList.add('animal-sound-card');
        card.innerHTML = `
            <img src="assets/images/hayvanlar/${animal.id}.webp" alt="${animal.name}">
            <div class="animal-name">${animal.name}</div>
            <div class="sound-icon">🔊</div>
        `;

        card.addEventListener('click', () => {
            if (currentListenCard === card && currentAudio && !currentAudio.paused) {
                stopCurrentAudio();
                card.classList.remove('playing');
                currentListenCard = null;
                return;
            }
            stopCurrentAudio();
            if (currentListenCard) currentListenCard.classList.remove('playing');

            const audio = new Audio(`assets/sounds/hayvan sesleri/${animal.id}_ses.mp3`);
            currentAudio = audio;
            currentListenCard = card;
            card.classList.add('playing');
            audio.play().catch(() => {});
            audio.onended = () => {
                card.classList.remove('playing');
                currentAudio = null;
                currentListenCard = null;
            };
        });

        grid.appendChild(card);
    });
}

// --- QUIZ AŞAMASI ---
function renderQuizStage(stage) {
    const grid = document.getElementById('choices-grid');
    grid.innerHTML = '';

    const wrong   = shuffleArray(allAnimals.filter(a => a.id !== stage.correct.id)).slice(0, 2);
    const choices = shuffleArray([stage.correct, ...wrong]);

    choices.forEach(animal => {
        const card = document.createElement('div');
        card.classList.add('choice-card');
        card.innerHTML = `
            <img src="assets/images/hayvanlar/${animal.id}.webp" alt="${animal.name}">
            <div class="choice-name">${animal.name}</div>
            <div class="cross-mark">❌</div>
        `;
        card.addEventListener('click', () => handleChoice(animal, stage.correct, card));
        grid.appendChild(card);
    });

        // Soru komutu → hayvan sesi x3
    const cmdAudio = new Audio('assets/sounds/kimin_sesi.mp3');
    cmdAudio.play().catch(() => playAnimalSoundTimes(stage.correct.id, 3));
    cmdAudio.onended = () => playAnimalSoundTimes(stage.correct.id, 3);
}

// --- ŞIIK SEÇİMİ ---
function handleChoice(chosen, correct, card) {
    if (quizLocked) return;

    if (chosen.id === correct.id) {
        quizLocked = true;
        stopCurrentAudio();
        card.classList.add('correct');
        audioOnay.currentTime = 0;
        audioOnay.cloneNode().play();
        triggerConfetti();

        setTimeout(() => {
            card.classList.remove('correct');
            currentStageIdx++;
            if (currentStageIdx < allStages.length) {
                renderStage();
            } else {
                showCelebration();
            }
        }, 1500);

    } else {
        quizLocked = true;
        card.classList.add('wrong');
        audioDat.currentTime = 0;
        audioDat.cloneNode().play();

        setTimeout(() => {
            card.classList.remove('wrong');
            quizLocked = false;
        }, 1000);
    }
}

// --- TEKRAR DİNLE ---
document.getElementById('replay-btn').addEventListener('click', () => {
    const stage = allStages[currentStageIdx];
    if (stage.type === 'quiz') {
        stopCurrentAudio();
        playAnimalSoundTimes(stage.correct.id, 3);
    }
});

// --- NAVİGASYON ---
document.getElementById('stage-prev').addEventListener('click', () => {
    if (currentStageIdx > 0) { currentStageIdx--; renderStage(); }
});

document.getElementById('stage-next').addEventListener('click', () => {
    if (currentStageIdx < allStages.length - 1) { currentStageIdx++; renderStage(); }
});

// --- KUTLAMA ---
function showCelebration() {
    const overlay = document.getElementById('celebration-overlay');
    const content = overlay.querySelector('.celebration-content');
    overlay.classList.remove('hidden');
    showFinaleVideo(overlay, content, 'hayvanlar_menu.html');
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

// --- BAŞLAT ---
renderStage();
