const allAnimals = [
    { id: "kedi",    name: "Kedi" },
    { id: "kopek",   name: "Köpek" },
    { id: "kus",     name: "Kuş" },
    { id: "at",      name: "At" },
    { id: "inek",    name: "İnek" },
    { id: "koyun",   name: "Koyun" },
    { id: "maymun",  name: "Maymun" },
    { id: "kurt",    name: "Kurt" },
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

// Dinle aşamaları: 17 hayvanı 4'lü gruplara böl
const listenStages = [];
for (let i = 0; i < allAnimals.length; i += 4) {
    listenStages.push({ type: 'listen', animals: allAnimals.slice(i, i + 4) });
}

// Quiz aşamaları: her hayvan için 1 quiz (karışık sıra)
const quizStages = shuffleArray([...allAnimals]).map(a => ({ type: 'quiz', correct: a }));

const allStages = [...listenStages, ...quizStages];

// Ses dosyaları
const audioOnay = new Audio('assets/sounds/onay.mp3');
const audioDat  = new Audio('assets/sounds/dat.mp3');
const audioGrandFinale = new Audio('assets/sounds/basari_fon.mp3');
const FINALE_VIDEO_SRC = 'assets/sounds/kutlama.mp4';

let currentStageIdx = 0;
let currentAudio = null;
let currentListenCard = null;
let quizLocked = false;
let isFirstListen = true;
let isFirstQuiz = true;

// --- YARDIMCI ---
function stopCurrentAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio.onended = null;
        currentAudio = null;
    }
}

function playAnimalSoundTimes(animalId, timesLeft, onComplete) {
    if (timesLeft <= 0) { if (onComplete) onComplete(); return; }
    const audio = new Audio(`assets/sounds/hayvan sesleri/${animalId}_ses.mp3`);
    currentAudio = audio;
    audio.play().catch(() => {});
    audio.onended = () => {
        currentAudio = null;
        if (timesLeft > 1) {
            setTimeout(() => playAnimalSoundTimes(animalId, timesLeft - 1, onComplete), 500);
        } else {
            if (onComplete) onComplete();
        }
    };
}

// --- ANA RENDER ---
function renderStage() {
    stopCurrentAudio();
    if (currentListenCard) { currentListenCard.classList.remove('playing'); currentListenCard = null; }
    quizLocked = false;
    const existingHand = document.getElementById('hand-hint');
    if (existingHand) existingHand.remove();

    const stage = allStages[currentStageIdx];

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

// Kare boyut hesaplama için yardımcı
function calcListenSize(n) {
    const cols = n <= 1 ? 1 : 2;
    const rows = Math.ceil(n / cols);
    const gap = 16;
    const availW = Math.min(window.innerWidth - 60, 700);
    const availH = window.innerHeight - 180;
    const itemByW = (availW - gap * (cols - 1)) / cols;
    const itemByH = (availH - gap * (rows - 1)) / rows;
    const size = Math.floor(Math.min(itemByW, itemByH, 220));
    return { size, cols, gap };
}

// --- DİNLE AŞAMASI ---
function renderListenStage(stage) {
    const grid = document.getElementById('sounds-grid');
    grid.innerHTML = '';

    const n = stage.animals.length;
    const { size, cols, gap } = calcListenSize(n);

    grid.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
    grid.style.gap = gap + 'px';

    const imgSize = Math.floor(size * 0.62);

    // Komut sesini çal
    setTimeout(() => {
        const cmdAudio = new Audio('assets/sounds/hayvan_sesleri_komut.mp3');
        cmdAudio.play().catch(() => { if (isFirstListen) showListenHint(); });
        if (isFirstListen) {
            cmdAudio.onended = () => showListenHint();
        }
    }, 500);

    let listenedCount = 0;

    stage.animals.forEach(animal => {
        const card = document.createElement('div');
        card.classList.add('animal-sound-card');
        card.style.width = size + 'px';
        card.style.height = size + 'px';
        card.innerHTML = `
            <img src="assets/images/hayvanlar/${animal.id}.webp" alt="${animal.name}" style="width:${imgSize}px;height:${imgSize}px;">
            <div class="animal-name">${animal.name}</div>
            <div class="sound-icon">🔊</div>
        `;

        card.addEventListener('click', () => {
            const existingHand = document.getElementById('hand-hint');
            if (existingHand) existingHand.remove();

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

            if (!card.dataset.listened) {
                card.dataset.listened = '1';
                card.classList.add('listened');
                listenedCount++;
                if (listenedCount === stage.animals.length) {
                    setTimeout(() => {
                        currentStageIdx++;
                        if (currentStageIdx < allStages.length) {
                            renderStage();
                        } else {
                            showCelebration();
                        }
                    }, 1200);
                }
            }
        });

        grid.appendChild(card);
    });
}

// --- QUIZ AŞAMASI ---
function renderQuizStage(stage) {
    const grid = document.getElementById('choices-grid');
    grid.innerHTML = '';

    const wrong   = shuffleArray(allAnimals.filter(a => a.id !== stage.correct.id)).slice(0, 3);
    const choices = shuffleArray([stage.correct, ...wrong]);

    // 2×2 kare grid için boyut hesapla
    const cols = 2;
    const rows = 2;
    const gap = 14;
    const availW = Math.min(window.innerWidth - 48, 560);
    const availH = window.innerHeight - 200;
    const cardByW = Math.floor((availW - gap) / cols);
    const cardByH = Math.floor((availH - gap) / rows);
    const cardSize = Math.min(cardByW, cardByH, 240);
    const imgSize  = Math.floor(cardSize * 0.72);

    grid.style.gridTemplateColumns = `repeat(${cols}, ${cardSize}px)`;
    grid.style.gap = gap + 'px';
    grid.style.maxWidth = 'none';

    choices.forEach(animal => {
        const card = document.createElement('div');
        card.classList.add('choice-card');
        card.style.width = cardSize + 'px';
        card.style.minHeight = cardSize + 'px';
        card.innerHTML = `
            <img src="assets/images/hayvanlar/${animal.id}.webp" alt="${animal.name}" style="width:${imgSize}px;height:${imgSize}px;">
            <div class="cross-mark">❌</div>
        `;
        card.addEventListener('click', () => handleChoice(animal, stage.correct, card));
        grid.appendChild(card);
    });

    // Soru sesi: kimin_sesi.mp3 → hayvan sesi x3
    const cmdAudio = new Audio('assets/sounds/kimin_sesi.mp3');
    const afterCmd = () => {
        if (isFirstQuiz) {
            playAnimalSoundTimes(stage.correct.id, 3, () => showQuizHint(stage.correct.id, 3));
        } else {
            playAnimalSoundTimes(stage.correct.id, 3);
        }
    };
    cmdAudio.play().catch(afterCmd);
    cmdAudio.onended = afterCmd;
}

// --- ŞIIK SEÇİMİ ---
function handleChoice(chosen, correct, card) {
    if (quizLocked) return;
    const existingHand = document.getElementById('hand-hint');
    if (existingHand) existingHand.remove();

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
            showQuizHint(correct.id, 1);
        }, 1000);
    }
}

// --- EL İPUCU FONKSİYONLARI ---
function _showHandHintOnElement(targetEl, totalTaps, onDone) {
    const existing = document.getElementById('hand-hint');
    if (existing) existing.remove();

    const rect = targetEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const tapTop  = rect.top + rect.height * 0.3;
    const restTop = tapTop + 90;
    const offScreenTop = window.innerHeight + 100;
    const FONT_SIZE = 72;

    const hand = document.createElement('div');
    hand.id = 'hand-hint';
    hand.innerHTML = '👆';
    hand.style.cssText = `
        position: fixed; font-size: ${FONT_SIZE}px; pointer-events: none;
        z-index: 9999; left: ${centerX - FONT_SIZE / 2}px; top: 0px;
        transform: translateY(${offScreenTop}px); will-change: transform;
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
            ], { duration: 400, easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
                hand.remove();
                if (onDone) onDone();
            };
            return;
        }
        tapCount++;
        hand.animate([
            { transform: `translateY(${restTop}px)`, easing: 'cubic-bezier(0.4,0,1,1)' },
            { transform: `translateY(${tapTop}px)`,  easing: 'cubic-bezier(0,0,0.6,1)' },
            { transform: `translateY(${restTop}px)` }
        ], { duration: 550, fill: 'forwards' }).onfinish = () => setTimeout(doTap, 280);
    }
}

function showListenHint() {
    isFirstListen = false;
    const cards = [...document.querySelectorAll('#sounds-grid .animal-sound-card')];
    if (!cards.length) return;
    _showHandHintOnElement(cards[0], 3);
}

function showQuizHint(correctId, totalTaps) {
    isFirstQuiz = false;
    const cards = [...document.querySelectorAll('#choices-grid .choice-card')];
    const target = cards.find(c => c.querySelector('img') && c.querySelector('img').src.includes(correctId));
    if (!target) return;
    _showHandHintOnElement(target, totalTaps);
}

// --- TEKRAR DİNLE ---
document.getElementById('replay-btn').addEventListener('click', () => {
    const stage = allStages[currentStageIdx];
    if (stage.type === 'quiz') {
        stopCurrentAudio();
        playAnimalSoundTimes(stage.correct.id, 3);
    } else {
        stopCurrentAudio();
        const cmd = new Audio('assets/sounds/hayvan_sesleri_komut.mp3');
        cmd.play().catch(() => {});
    }
});

// --- KUTLAMA ---
function showCelebration() {
    const overlay = document.getElementById('celebration-overlay');
    const content = overlay.querySelector('.celebration-content');
    overlay.classList.remove('hidden');
    showFinaleVideo(overlay, content, 'hayvanlar_menu.html#3');
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
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
}

// --- BAŞLAT ---
renderStage();
