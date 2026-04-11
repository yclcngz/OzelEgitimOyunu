const fruitNames = [
    "muz", "elma", "portakal", "cilek", "kiraz", "nar", "kivi",
    "armut", "ananas", "mandalina", "karpuz", "kayisi", "seftali",
    "kavun", "uzum", "avokado", "incir"
];

const allFruitsData = fruitNames.map(name => ({
    id: name,
    image: `assets/images/${name}.png`
}));

// Ses Dosyaları
const audioInstruction = new Audio('assets/sounds/eslestir.mp3'); 
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
let matchedPairsCount = 0; // O aşamada kaç çift eşleştirildi
let isProcessing = false; // Animasyon sürerken tıklamayı engellemek için

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
    currentLevelNumber = levelNumber;
    currentStageIndex = 0;
    currentStages = generateStagesForLevel(levelNumber);
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

    setTimeout(() => playInstructionAudio(), 500);
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
    // Zaten eşleşmişse veya animasyon oynuyorsa işlem yapma
    if (imgElement.classList.contains('matched-fruit') || isProcessing) return;

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
        audioOnay.play();
        
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
        audioDat.play();

        const crossL = currentLeft.wrap.querySelector('.cross-mark');
        const crossR = currentRight.wrap.querySelector('.cross-mark');
        crossL.classList.add('show-cross');
        crossR.classList.add('show-cross');

        currentLeft.img.classList.add('shake');
        currentRight.img.classList.add('shake');

        // Tam 1 saniye bekle, sonra çarpıları ve seçimi kaldırıp oyuncuya tekrar deneme hakkı ver
        setTimeout(() => {
            currentLeft.img.classList.remove('shake', 'selected-fruit');
            currentRight.img.classList.remove('shake', 'selected-fruit');
            crossL.classList.remove('show-cross');
            crossR.classList.remove('show-cross');
            
            isProcessing = false; // Kilidi aç, oyuncu tekrar deneyebilsin
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
        // --- NORMAL SEVİYE SONU (1, 2, 3, 4) ---
        content.innerHTML = '🤩👏'; 
        content.className = 'celebration-content'; // Eski class'ı koru
        audioLevelComplete.play();
        triggerConfetti();

        audioLevelComplete.onended = () => {
            overlay.classList.add('hidden');
            startLevel(currentLevelNumber + 1);
        };
   // ... (Fonksiyonun üst kısmı aynı kalıyor) ...
    } else {
        // --- BÜYÜK FİNAL (SEVİYE 5 SONU) ---
        
        // --- DEĞİŞİKLİK BURADA: Emojiyi silip GIF ekliyoruz ---
        // content.innerHTML = '🏆'; // Eski kupa emojisi satırını sildik veya yorum satırı yaptık.
        
        // Yerine senin GIF dosyanı içeren <img> etiketini koyuyoruz.
        content.innerHTML = '<img src="assets/images/tebrikler.gif" alt="Tebrikler" class="final-gif">';
        
        // Class ismini de CSS'te yazdığımız yeni isme göre güncelliyoruz.
        content.className = 'celebration-content'; // Ana kapsayıcı class'ı
        
        // ... (Müzik ve Konfeti kısımları aynen kalıyor) ...
        audioGrandFinale.play(); // Coşkulu zafer müziğini çal
        triggerGrandConfetti(); // 5 saniyelik sürekli havai fişek konfetisi başlat

        // Şov bittikten sonra ana menüye yönlendir
        setTimeout(() => {
            overlay.classList.add('hidden');
            // Hangi oyundaysak onun menüsüne döner
            if(window.location.pathname.includes('eslestirme')) {
                window.location.href = 'meyveler_menu.html';
            } else {
                window.location.href = 'index.html'; // Veya meyveler_menu.html yapabilirsin
            }
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
    const duration = 5 * 1000; // 5 saniye boyunca sürecek
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
        // Ekranın iki farklı köşesinden sürekli patlat
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}