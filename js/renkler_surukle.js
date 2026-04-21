// İstediğimiz 8 Rengin Veritabanı (Resim yok, sadece renk kodları var)
const colorsDatabase = [
    { id: 'kirmizi', hex: '#e74c3c', label: 'Kırmızı' },
    { id: 'sari', hex: '#f1c40f', label: 'Sarı' },
    { id: 'mavi', hex: '#3498db', label: 'Mavi' },
    { id: 'siyah', hex: '#2c3e50', label: 'Siyah' }, // Yumuşatılmış siyah/koyu gri
    { id: 'yesil', hex: '#2ecc71', label: 'Yeşil' },
    { id: 'mor', hex: '#9b59b6', label: 'Mor' },
    { id: 'turuncu', hex: '#e67e22', label: 'Turuncu' },
    { id: 'beyaz', hex: '#ffffff', label: 'Beyaz' }
];

// Ses Dosyaları (surukle_ses.mp3'ü klasörüne eklemeyi unutma)
const audioInstruction = new Audio('assets/sounds/surukle_ses.mp3'); 
const audioOnay = new Audio('assets/sounds/onay.mp3'); 
const audioDat = new Audio('assets/sounds/dat.mp3'); 
const audioLevelComplete = new Audio('assets/sounds/tebrikler_basardin.mp3'); 
const audioGrandFinale = new Audio('assets/sounds/basari_fon.mp3');
const FINALE_VIDEO_SRC = 'assets/sounds/kutlama.mp4';

window.MAX_LEVEL = 3;

let currentLevelNumber = 1;
let isFirstMove = true;
let itemsToDrag = 0; // O aşamada atılması gereken toplam kart sayısı
let itemsSuccessfullyDropped = 0; // Doğru atılan kart sayısı
let globalColorPool = [];

// Diziyi karıştıran fonksiyon
function shuffleArray(array) {
    let shuffled = [...array]; 
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; 
    }
    return shuffled;
}

function startLevel(levelNumber) {
    currentLevelNumber = levelNumber;
    if (levelNumber === 1) {
        globalColorPool = shuffleArray(colorsDatabase);
        isFirstMove = true;
    }
    renderStage(levelNumber);
}

// Seviyeyi Ekrana Çizen Fonksiyon
function renderStage(level) {
    const basketsContainer = document.getElementById('baskets-container');
    const draggablesContainer = document.getElementById('draggables-container');
    
    // Eski seviyenin öğelerini temizle
    basketsContainer.innerHTML = ''; 
    draggablesContainer.innerHTML = '';
    itemsSuccessfullyDropped = 0;

    // Zorluk Ayarı ve Havuzdan Renk Çekme (3 Seviyede 8 rengi tamamlama)
    let numColors = 0;
    let selectedColors = [];
    
    if (level === 1) {
        numColors = 2;
        selectedColors = globalColorPool.slice(0, 2);
    } else if (level === 2) {
        numColors = 3;
        selectedColors = globalColorPool.slice(2, 5);
    } else { // level 3 ve üstü
        numColors = 3;
        selectedColors = globalColorPool.slice(5, 8);
    }
    
    // Her sepet için 2'şer adet kart üret (Örn: 2 sepet varsa 4 kart olacak)
    itemsToDrag = numColors * 2; 
    let cardsToCreate = [];
    
    selectedColors.forEach(color => {
        cardsToCreate.push(color);
        cardsToCreate.push(color); // Aynı renkten 2. kart
    });

    cardsToCreate = shuffleArray(cardsToCreate); // Kartları karıştır

    // 1. RENKLİ SEPETLERİ ÇİZ
    selectedColors.forEach(colorData => {
        const dropZone = document.createElement('div');
        dropZone.classList.add('color-basket');
        dropZone.dataset.color = colorData.id;
        
        // CSS'teki sınır rengini dinamik olarak ata
        dropZone.style.borderColor = colorData.id === 'beyaz' ? '#adb5bd' : colorData.hex;

        // Sepetin içine rengin adını yaz (okuma farkındalığı için)
        dropZone.innerText = colorData.label;
        dropZone.style.color = colorData.id === 'beyaz' ? '#666' : colorData.hex;

        // Sürükle-Bırak olaylarını dinle
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);

        basketsContainer.appendChild(dropZone);
    });

    // 2. RENKLİ KARTLARI ÇİZ
    cardsToCreate.forEach((colorData, index) => {
        const dragItem = document.createElement('div');
        dragItem.classList.add('color-card');
        dragItem.dataset.color = colorData.id;
        dragItem.dataset.unique = index; 
        
        // Kartın arka plan rengini dinamik olarak ata
        dragItem.style.backgroundColor = colorData.hex; 
        
        dragItem.setAttribute('draggable', true);
        dragItem.addEventListener('dragstart', handleDragStart);
        addTouchSupport(dragItem);

        draggablesContainer.appendChild(dragItem);
    });

    // Sesi seviye başında çal
    setTimeout(() => {
        playInstructionAudio();
        if (isFirstMove) {
            audioInstruction.onended = () => {
                audioInstruction.onended = null;
                showDragHintForCards();
            };
        }
    }, 500);
}

// --- DOKUNMATIK EKRAN DESTEĞİ (TOUCH) ---
let _touchClone = null;

function addTouchSupport(dragItem) {
    dragItem.addEventListener('touchstart', e => {
        e.preventDefault();
        const existingHand = document.getElementById('hand-hint');
        if (existingHand) existingHand.remove();
        dragItem.style.opacity = '0.5';

        // Parmak altında sürüklenen görsel kopya
        _touchClone = dragItem.cloneNode(true);
        _touchClone.style.cssText = `
            position: fixed; pointer-events: none; opacity: 0.8; z-index: 9999;
            width: ${dragItem.offsetWidth}px; height: ${dragItem.offsetHeight}px;
            border-radius: 14px;
        `;
        document.body.appendChild(_touchClone);
    }, { passive: false });

    dragItem.addEventListener('touchmove', e => {
        e.preventDefault();
        if (!_touchClone) return;
        const t = e.touches[0];
        _touchClone.style.left = (t.clientX - _touchClone.offsetWidth / 2) + 'px';
        _touchClone.style.top  = (t.clientY - _touchClone.offsetHeight / 2) + 'px';

        // Altındaki sepeti vurgula
        _touchClone.style.display = 'none';
        const el = document.elementFromPoint(t.clientX, t.clientY);
        _touchClone.style.display = '';
        document.querySelectorAll('.color-basket').forEach(b => {
            b.classList.remove('drag-over');
            b.style.backgroundColor = 'rgba(255,255,255,0.6)';
        });
        if (el && el.classList.contains('color-basket')) {
            el.classList.add('drag-over');
            const hex = colorsDatabase.find(c => c.id === el.dataset.color)?.hex;
            if (hex) el.style.backgroundColor = hex + '33';
        }
    }, { passive: false });

    dragItem.addEventListener('touchend', ev => {
        if (_touchClone) { _touchClone.remove(); _touchClone = null; }
        dragItem.style.opacity = '1';

        const t = ev.changedTouches[0];
        document.querySelectorAll('.color-basket').forEach(b => {
            b.classList.remove('drag-over');
            b.style.backgroundColor = 'rgba(255,255,255,0.6)';
        });

        // Parmağın altındaki sepeti bul
        const el = document.elementFromPoint(t.clientX, t.clientY);
        if (!el || !el.classList.contains('color-basket')) return;

        const draggedColor  = dragItem.dataset.color;
        const basketColor   = el.dataset.color;

        if (draggedColor === basketColor) {
            audioOnay.cloneNode().play();
            triggerConfettiMini();
            dragItem.classList.add('hidden-drag');
            itemsSuccessfullyDropped++;
            if (itemsSuccessfullyDropped === itemsToDrag) {
                setTimeout(() => {
                    if (currentLevelNumber < 3) showLevelCompleteCelebration();
                    else showGrandFinaleCelebration();
                }, 1000);
            }
        } else {
            new Audio('assets/sounds/dat.mp3').play().catch(() => {});
            dragItem.classList.add('shake');
            setTimeout(() => {
                dragItem.classList.remove('shake');
                showDragHintForCards();
            }, 500);
        }
    });
}

// --- SÜRÜKLE BIRAK MOTORU (DRAG & DROP) ---

function handleDragStart(e) {
    const existingHand = document.getElementById('hand-hint');
    if (existingHand) existingHand.remove();
    e.dataTransfer.setData('color', e.target.dataset.color);
    e.dataTransfer.setData('uniqueId', e.target.dataset.unique);
    setTimeout(() => e.target.style.opacity = '0.5', 0);
}

function handleDragOver(e) {
    e.preventDefault(); // Varsayılan davranışı engelle (Bırakmaya izin vermek için şart)
    e.currentTarget.classList.add('drag-over');
    
    // Sepetin üzerine gelince arka planını hafifçe o renge boya
    const basketColorHex = colorsDatabase.find(c => c.id === e.currentTarget.dataset.color).hex;
    e.currentTarget.style.backgroundColor = basketColorHex + '33'; // '33' hex transparanlığıdır
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)'; // Eski haline döndür
}

function handleDrop(e) {
    e.preventDefault();
    const basket = e.currentTarget;
    basket.classList.remove('drag-over');
    basket.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';

    // Hafızadan sürüklenen kartın verilerini çek
    const draggedColor = e.dataTransfer.getData('color');
    const draggedUniqueId = e.dataTransfer.getData('uniqueId');
    const basketColor = basket.dataset.color;

    const draggedElement = document.querySelector(`.color-card[data-unique='${draggedUniqueId}']`);
    draggedElement.style.opacity = '1'; // Saydamlığı düzelt

    if (draggedColor === basketColor) {
        // --- DOĞRU SEPET ---
        audioOnay.cloneNode().play();
        triggerConfettiMini();
        
        // Kartı görünmez yap (sanki sepetin içine girmiş gibi)
        draggedElement.classList.add('hidden-drag');
        itemsSuccessfullyDropped++;

        // Tüm kartlar bitti mi kontrol et
        if (itemsSuccessfullyDropped === itemsToDrag) {
            setTimeout(() => {
                if (currentLevelNumber < 3) {
                    showLevelCompleteCelebration();
                } else {
                    showGrandFinaleCelebration();
                }
            }, 1000);
        }
    } else {
        // --- YANLIŞ SEPET ---
        audioDat.currentTime = 0;
        audioDat.play().catch(() => {});
        draggedElement.classList.add('shake');
        setTimeout(() => {
            draggedElement.classList.remove('shake');
            showDragHintForCards();
        }, 500);
    }
}

// --- SES VE KUTLAMA SİSTEMLERİ ---

function playInstructionAudio() {
    audioInstruction.currentTime = 0; 
    audioInstruction.play().catch(e => console.log("Otomatik ses engellendi."));
}

document.getElementById('play-audio-btn').addEventListener('click', playInstructionAudio);

function triggerConfettiMini() {
    confetti({ particleCount: 50, spread: 40, origin: { y: 0.6 } });
}

function showLevelCompleteCelebration() {
    const overlay = document.getElementById('celebration-overlay');
    const content = overlay.querySelector('.celebration-content');

    overlay.classList.remove('hidden');
    content.innerHTML = '🤩👏';
    content.className = 'celebration-content';
    const advanceLevel = () => {
        audioLevelComplete.onended = null;
        overlay.classList.add('hidden');
        startLevel(currentLevelNumber + 1);
    };
    audioLevelComplete.onended = advanceLevel;
    audioLevelComplete.currentTime = 0;
    audioLevelComplete.play().catch(() => setTimeout(advanceLevel, 500));
}

function showGrandFinaleCelebration() {
    const overlay = document.getElementById('celebration-overlay');
    const content = overlay.querySelector('.celebration-content');
    overlay.classList.remove('hidden');
    showFinaleVideo(overlay, content, 'renkler_menu.html');
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

function showDragHintForCards() {
    const cards = [...document.querySelectorAll('.color-card:not(.hidden-drag)')];
    if (!cards.length) return;
    const firstCard = cards[0];
    const basketId = firstCard.dataset.color;
    const basket = document.querySelector(`.color-basket[data-color="${basketId}"]`);
    if (!basket) return;
    showDragHint(firstCard, basket, 2);
}

function showDragHint(sourceEl, targetEl, totalRounds = 2) {
    isFirstMove = false;

    const existing = document.getElementById('hand-hint');
    if (existing) existing.remove();

    const FONT_SIZE = 72;

    function getPos(el) {
        const rect = el.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2 - FONT_SIZE / 2,
            y: rect.top + rect.height * 0.3
        };
    }

    const src = getPos(sourceEl);
    const tgt = getPos(targetEl);
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
        transform: translate(${src.x}px, ${offScreenY}px);
        will-change: transform;
        filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.4));
    `;
    document.body.appendChild(hand);

    let round = 0;

    function doRound() {
        round++;

        // 1. Alttan kaynağa gel
        hand.animate([
            { transform: `translate(${src.x}px, ${offScreenY}px)` },
            { transform: `translate(${src.x}px, ${src.y}px)` }
        ], { duration: 400, easing: 'ease-out', fill: 'forwards' }).onfinish = () => {

            // 2. Kısaca bas (seç)
            hand.animate([
                { transform: `translate(${src.x}px, ${src.y}px)`, easing: 'ease-in' },
                { transform: `translate(${src.x}px, ${src.y + 20}px)`, easing: 'ease-out' },
                { transform: `translate(${src.x}px, ${src.y}px)` }
            ], { duration: 350, fill: 'forwards' }).onfinish = () => {

                setTimeout(() => {
                    // 3. Hedefe sürükle
                    hand.animate([
                        { transform: `translate(${src.x}px, ${src.y}px)` },
                        { transform: `translate(${tgt.x}px, ${tgt.y}px)` }
                    ], { duration: 500, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => {

                        // 4. Bırak
                        hand.animate([
                            { transform: `translate(${tgt.x}px, ${tgt.y}px)`, easing: 'ease-in' },
                            { transform: `translate(${tgt.x}px, ${tgt.y + 20}px)`, easing: 'ease-out' },
                            { transform: `translate(${tgt.x}px, ${tgt.y}px)` }
                        ], { duration: 300, fill: 'forwards' }).onfinish = () => {

                            // 5. Çekil
                            hand.animate([
                                { transform: `translate(${tgt.x}px, ${tgt.y}px)` },
                                { transform: `translate(${src.x}px, ${offScreenY}px)` }
                            ], { duration: 400, easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
                                if (round < totalRounds) {
                                    setTimeout(doRound, 300);
                                } else {
                                    hand.remove();
                                }
                            };
                        };
                    };
                }, 200);
            };
        };
    }

    doRound();
}

// Sayfa yüklendiğinde Lvl 1'den başla
window.onload = () => {
    startLevel(1);
};