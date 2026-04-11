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

let currentLevelNumber = 1; 
let itemsToDrag = 0; // O aşamada atılması gereken toplam kart sayısı
let itemsSuccessfullyDropped = 0; // Doğru atılan kart sayısı

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
    renderStage(levelNumber);
}

// Seviyeyi Ekrana Çizen Fonksiyon
function renderStage(level) {
    const basketsContainer = document.getElementById('baskets-container');
    const draggablesContainer = document.getElementById('draggables-container');
    const levelTitle = document.getElementById('level-title');
    
    // Eski seviyenin öğelerini temizle
    basketsContainer.innerHTML = ''; 
    draggablesContainer.innerHTML = '';
    itemsSuccessfullyDropped = 0;

    levelTitle.innerText = `Seviye ${level}`;

    // Zorluk Ayarı: Lvl 1: 2 renk, Lvl 2: 3 renk ... Lvl 5: 6 renk
    let numColors = level + 1; 
    if(numColors > 8) numColors = 8; 

    // Havuzdan bu seviye için rastgele renkler seç
    let selectedColors = shuffleArray(colorsDatabase).slice(0, numColors);
    
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
    setTimeout(() => playInstructionAudio(), 500); 
}

// --- DOKUNMATIK EKRAN DESTEĞİ (TOUCH) ---
let _touchClone = null;

function addTouchSupport(dragItem) {
    dragItem.addEventListener('touchstart', e => {
        e.preventDefault();
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
                    if (currentLevelNumber < 5) showLevelCompleteCelebration();
                    else showGrandFinaleCelebration();
                }, 1000);
            }
        } else {
            audioDat.cloneNode().play();
            dragItem.classList.add('shake');
            setTimeout(() => dragItem.classList.remove('shake'), 500);
        }
    });
}

// --- SÜRÜKLE BIRAK MOTORU (DRAG & DROP) ---

function handleDragStart(e) {
    // Sürüklenen kartın rengini ve kimliğini hafızaya al
    e.dataTransfer.setData('color', e.target.dataset.color);
    e.dataTransfer.setData('uniqueId', e.target.dataset.unique);
    // Sürüklerken orijinal kartı hafif saydam yap
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
                if (currentLevelNumber < 5) {
                    showLevelCompleteCelebration();
                } else {
                    showGrandFinaleCelebration();
                }
            }, 1000);
        }
    } else {
        // --- YANLIŞ SEPET ---
        audioDat.play();
        draggedElement.classList.add('shake');
        setTimeout(() => draggedElement.classList.remove('shake'), 500);
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
    audioLevelComplete.play();
    
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });

    audioLevelComplete.onended = () => {
        overlay.classList.add('hidden');
        startLevel(currentLevelNumber + 1);
    };
}

function showGrandFinaleCelebration() {
    const overlay = document.getElementById('celebration-overlay');
    const content = overlay.querySelector('.celebration-content');
    
    overlay.classList.remove('hidden');
    content.innerHTML = '<img src="assets/images/tebrikler.gif" alt="Tebrikler" class="final-gif">';
    content.className = 'celebration-content'; 
    
    audioGrandFinale.play(); 
    triggerGrandConfetti(); 

    setTimeout(() => {
        content.innerHTML += `
            <div class="end-game-buttons">
                <button class="play-again-btn" onclick="location.reload()">🔄 Tekrar Oyna</button>
                <button class="back-to-menu-btn" onclick="window.location.href='renkler_menu.html'">⬅ Menüye Dön</button>
            </div>
        `;
    }, 6000); 
}

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

// Sayfa yüklendiğinde Lvl 1'den başla
window.onload = () => {
    startLevel(1); 
};