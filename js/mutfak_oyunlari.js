// 7 Mutfak Nesnesi Veritabanı
const kitchenItems = [
    { id: 'tabak', image: 'assets/images/tabak.png', audio: 'assets/sounds/isim_tabak.mp3' },
    { id: 'bardak', image: 'assets/images/bardak.png', audio: 'assets/sounds/isim_bardak.mp3' },
    { id: 'kasik', image: 'assets/images/kasik.png', audio: 'assets/sounds/isim_kasik.mp3' },
    { id: 'catal', image: 'assets/images/catal.png', audio: 'assets/sounds/isim_catal.mp3' },
    { id: 'tencere', image: 'assets/images/tencere.png', audio: 'assets/sounds/isim_tencere.mp3' },
    { id: 'tava', image: 'assets/images/tava.png', audio: 'assets/sounds/isim_tava.mp3' },
    { id: 'ekmek', image: 'assets/images/ekmek.png', audio: 'assets/sounds/isim_ekmek.mp3' }
];

// --- SEVİYE 1 SESLERİ ---
const audioSarki = new Audio('assets/sounds/resime_tikla_sarki.mp3');
const audioKomut = new Audio('assets/sounds/resime_tikla_komut.mp3');

// --- SEVİYE 2 SESLERİ ---
const audioLvl2Sarki = new Audio('assets/sounds/ayni_resimleri_eslestir.mp3'); // YENİ ŞARKI
const audioNesneleriEslestir = new Audio('assets/sounds/nesneleri_eslestir.mp3'); 

// --- ORTAK SESLER ---
const audioOnay = new Audio('assets/sounds/onay.mp3'); 
const audioDat = new Audio('assets/sounds/dat.mp3'); 
const audioLevelComplete = new Audio('assets/sounds/tebrikler_basardin.mp3'); 
const audioGrandFinale = new Audio('assets/sounds/basari_fon.mp3'); 

let currentLevel = 1;

// --- YARDIMCI FONKSİYONLAR ---
function shuffleArray(array) {
    let shuffled = [...array]; 
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; 
    }
    return shuffled;
}

function hideAllBoards() {
    document.getElementById('level1-board').classList.add('hidden');
    document.getElementById('level2-board').classList.add('hidden');
    document.getElementById('level3-board').classList.add('hidden');
    document.getElementById('play-audio-btn').classList.add('hidden');
}

// Seviye değiştiğinde önceki tüm sesleri susturmak için
function stopAllAudio() {
    audioSarki.pause(); audioSarki.currentTime = 0;
    audioKomut.pause(); audioKomut.currentTime = 0;
    audioLvl2Sarki.pause(); audioLvl2Sarki.currentTime = 0; // Seviye 2 şarkısını sustur
    audioNesneleriEslestir.pause(); audioNesneleriEslestir.currentTime = 0;
}

// --- ANA OYUN YÖNETİCİSİ ---
function startLevel(level) {
    currentLevel = level;
    hideAllBoards();
    stopAllAudio(); 

    if (level === 1) renderLevel1();
    else if (level === 2) renderLevel2();
    else if (level === 3) renderLevel3();
}

// ==========================================
// SEVİYE 1: TIKLA VE DİNLE 
// ==========================================
let listenedItemsCount = 0;
let isLevel1Playable = false; 

function renderLevel1() {
    const board = document.getElementById('level1-board');
    const title = document.getElementById('level-title');
    board.innerHTML = '';
    board.classList.remove('hidden');
    title.innerText = "Seviye 1: Tıkla ve Dinle";
    listenedItemsCount = 0;
    isLevel1Playable = false; 

    let shuffledItems = shuffleArray(kitchenItems);

    shuffledItems.forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('fruit-wrapper');

        const imgElement = document.createElement('img');
        imgElement.src = item.image;
        imgElement.decoding = 'async';
        imgElement.classList.add('fruit-item');
        
        imgElement.addEventListener('click', () => {
            if (!isLevel1Playable) return; 

            const itemAudio = new Audio(item.audio);
            itemAudio.play();

            if (!imgElement.classList.contains('listened-item')) {
                imgElement.classList.add('listened-item');
                listenedItemsCount++;

                if (listenedItemsCount === kitchenItems.length) {
                    setTimeout(() => showLevelCompleteCelebration(), 1500);
                }
            } else {
                imgElement.classList.remove('listened-item');
                void imgElement.offsetWidth; 
                imgElement.classList.add('listened-item');
            }
        });

        wrapper.appendChild(imgElement);
        board.appendChild(wrapper);
    });

    audioKomut.play().catch(e => console.log("Otomatik ses engellendi."));
    audioKomut.onended = () => { isLevel1Playable = true; };
}

// ==========================================
// SEVİYE 2: İKİ AŞAMALI EŞLEŞTİRME 
// ==========================================
let selectedLeft = null;
let selectedRight = null;
let matchedPairsLvl2 = 0;
let isProcessing = false;
let isLevel2Playable = false; // YENİ: SEVİYE 2 KİLİT SİSTEMİ

let currentStageLvl2 = 1;
let lvl2ItemsStage1 = [];
let lvl2ItemsStage2 = [];
let totalPairsCurrentStage = 0;

function renderLevel2() {
    const board = document.getElementById('level2-board');
    const audioBtn = document.getElementById('play-audio-btn');
    
    board.classList.remove('hidden');
    audioBtn.classList.remove('hidden');
    
    let shuffledAll = shuffleArray(kitchenItems);
    lvl2ItemsStage1 = shuffledAll.slice(0, 4); 
    lvl2ItemsStage2 = shuffledAll.slice(4, 7); 
    
    currentStageLvl2 = 1; 
    renderLevel2Stage(currentStageLvl2);

    audioBtn.onclick = () => { audioNesneleriEslestir.currentTime = 0; audioNesneleriEslestir.play(); };
}

function renderLevel2Stage(stage) {
    const leftCol = document.getElementById('left-column');
    const rightCol = document.getElementById('right-column');
    const title = document.getElementById('level-title');
    
    title.innerText = `Seviye 2: Eşleştirme (Aşama ${stage}/2)`;
    leftCol.innerHTML = '';
    rightCol.innerHTML = '';
    matchedPairsLvl2 = 0;
    selectedLeft = null;
    selectedRight = null;
    isProcessing = false;
    isLevel2Playable = false; // ŞARKI BİTENE KADAR EKRANI KİLİTLE

    let currentItems = stage === 1 ? lvl2ItemsStage1 : lvl2ItemsStage2;
    totalPairsCurrentStage = currentItems.length; 

    const leftItems = shuffleArray(currentItems);
    const rightItems = shuffleArray(currentItems);

    leftItems.forEach(item => createMatchItem(item, 'left', leftCol));
    rightItems.forEach(item => createMatchItem(item, 'right', rightCol));

    // --- YENİ SES VE KİLİT SIRALAMASI ---
    if (stage === 1) {
        // 1. Aşama: Komut -> Kilit Açılır
        audioNesneleriEslestir.play().catch(e => console.log("Ses engellendi"));
        audioNesneleriEslestir.onended = () => {
            isLevel2Playable = true;
        };
    } else {
        // 2. Aşama: Şarkı yok, sadece Komut -> Kilit Açılır (Çocuğu sıkmamak için)
        audioNesneleriEslestir.play();
        audioNesneleriEslestir.onended = () => {
            isLevel2Playable = true;
        };
    }
}

function createMatchItem(item, side, parent) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('fruit-wrapper');
    const img = document.createElement('img');
    img.src = item.image;
    img.decoding = 'async';
    img.classList.add('fruit-item');
    img.dataset.id = item.id;
    img.dataset.side = side;
    
    // 200px kocaman ve tıklaması kolay boyut!
    img.style.width = '200px'; 
    img.style.height = '200px'; 
    img.style.objectFit = 'contain';

    const cross = document.createElement('div');
    cross.classList.add('cross-mark');
    cross.innerHTML = '❌';

    img.addEventListener('click', () => handleMatchClick(img, wrapper));

    wrapper.appendChild(img);
    wrapper.appendChild(cross);
    parent.appendChild(wrapper);
}

function handleMatchClick(img, wrap) {
    // YENİ: Kilitliyse tıklamaları engelle
    if (!isLevel2Playable || img.classList.contains('matched-fruit') || isProcessing) return;

    if (img.dataset.side === 'left') {
        if (selectedLeft) selectedLeft.img.classList.remove('selected-fruit');
        selectedLeft = { img, wrap, id: img.dataset.id };
    } else {
        if (selectedRight) selectedRight.img.classList.remove('selected-fruit');
        selectedRight = { img, wrap, id: img.dataset.id };
    }
    img.classList.add('selected-fruit');

    if (selectedLeft && selectedRight) checkMatchLvl2();
}

function checkMatchLvl2() {
    isProcessing = true;
    const curL = selectedLeft, curR = selectedRight;
    selectedLeft = null; selectedRight = null;

    if (curL.id === curR.id) {
        audioOnay.play();
        curL.img.className = 'fruit-item matched-fruit';
        curR.img.className = 'fruit-item matched-fruit';
        
        // Eşleşince boyut bozulmasın diye 200px korundu
        curL.img.style.width = '200px'; curR.img.style.width = '200px';
        curL.img.style.height = '200px'; curR.img.style.height = '200px';
        
        matchedPairsLvl2++;
        
        if (matchedPairsLvl2 === totalPairsCurrentStage) {
            setTimeout(() => {
                if (currentStageLvl2 === 1) {
                    currentStageLvl2 = 2;
                    renderLevel2Stage(2);
                } else {
                    showLevelCompleteCelebration();
                }
            }, 1000);
        } else {
            isProcessing = false;
        }
    } else {
        audioDat.play();
        curL.wrap.querySelector('.cross-mark').classList.add('show-cross');
        curR.wrap.querySelector('.cross-mark').classList.add('show-cross');
        curL.img.classList.add('shake'); curR.img.classList.add('shake');

        setTimeout(() => {
            curL.img.classList.remove('shake', 'selected-fruit');
            curR.img.classList.remove('shake', 'selected-fruit');
            curL.wrap.querySelector('.cross-mark').classList.remove('show-cross');
            curR.wrap.querySelector('.cross-mark').classList.remove('show-cross');
            isProcessing = false;
        }, 1000);
    }
}

// ==========================================
// SEVİYE 3: HAFIZA (KART BULMACA)
// ==========================================
let hasFlippedCard = false, lockBoard = false;
let firstCard, secondCard, matchedPairsLvl3 = 0;

function renderLevel3() {
    const board = document.getElementById('level3-board');
    const title = document.getElementById('level-title');
    board.classList.remove('hidden');
    board.innerHTML = '';
    title.innerText = "Seviye 3: Hafıza Bulmacası";
    
    hasFlippedCard = false; lockBoard = false;
    firstCard = null; secondCard = null; matchedPairsLvl3 = 0;

    let cardsArray = [];
    kitchenItems.forEach(item => {
        cardsArray.push(item);
        cardsArray.push(item);
    });
    
    let shuffledCards = shuffleArray(cardsArray);

    shuffledCards.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.id = item.id;
        card.style.width = '110px'; card.style.height = '110px';

        card.innerHTML = `
            <div class="memory-card-inner">
                <div class="memory-card-front"><img src="${item.image}"></div>
                <div class="memory-card-back">?</div>
            </div>
        `;
        card.addEventListener('click', flipCard);
        board.appendChild(card);
    });
}

function flipCard() {
    if (lockBoard || this === firstCard) return;
    this.classList.add('flipped');

    if (!hasFlippedCard) {
        hasFlippedCard = true; firstCard = this; return;
    }
    secondCard = this;
    
    if (firstCard.dataset.id === secondCard.dataset.id) {
        firstCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('click', flipCard);
        audioOnay.play();
        matchedPairsLvl3++;
        resetBoard();

        if (matchedPairsLvl3 === kitchenItems.length) {
            setTimeout(() => showLevelCompleteCelebration(), 1000);
        }
    } else {
        lockBoard = true;
        audioDat.play();
        setTimeout(() => {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            resetBoard();
        }, 1000);
    }
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

// ==========================================
// KUTLAMA VE GEÇİŞ SİSTEMİ
// ==========================================
function showLevelCompleteCelebration() {
    const overlay = document.getElementById('celebration-overlay');
    const content = overlay.querySelector('.celebration-content');
    overlay.classList.remove('hidden');

    if (currentLevel < 3) {
        content.innerHTML = '🤩👏'; 
        content.className = 'celebration-content';
        audioLevelComplete.play();
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });

        audioLevelComplete.onended = () => {
            overlay.classList.add('hidden');
            startLevel(currentLevel + 1); 
        };
    } else {
        content.innerHTML = '<img src="assets/images/tebrikler.gif" alt="Tebrikler" class="final-gif">';
        content.className = 'celebration-content'; 
        audioGrandFinale.play(); 
        triggerGrandConfetti(); 

        setTimeout(() => {
            overlay.classList.add('hidden');
            window.location.href = 'nesneler_menu.html';
        }, 6000); 
    }
}

function triggerGrandConfetti() {
    const duration = 5 * 1000;
    const end = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
    function r(min, max) { return Math.random() * (max - min) + min; }
    const interval = setInterval(() => {
        if (Date.now() > end) return clearInterval(interval);
        confetti(Object.assign({}, defaults, { particleCount: 50, origin: { x: r(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount: 50, origin: { x: r(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

window.onload = () => startLevel(1);