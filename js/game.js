// Türkçe karakter içermeyen standartlaştırılmış 17 Meyve Listesi
const fruitNames = [
    "muz", "elma", "portakal", "cilek", "kiraz", "nar", "kivi",
    "armut", "ananas", "mandalina", "karpuz", "kayisi", "seftali",
    "kavun", "uzum", "avokado", "incir"
];

// Meyvelerin tam verisini otomatik oluşturan liste
const allFruitsData = fruitNames.map(name => ({
    id: name,
    image: `assets/images/${name}.png`,
    audio: `assets/sounds/soru_${name}.mp3`,
    correctAudio: `assets/sounds/dogru_${name}.mp3`,
    wrongAudio: `assets/sounds/isim_${name}.mp3`
}));

// Ortak Sesler
const audioDat = new Audio('assets/sounds/dat.mp3'); 
const audioConfetti = new Audio('assets/sounds/konfeti.mp3'); 
const audioLevelComplete = new Audio('assets/sounds/tebrikler_basardin.mp3'); // YENİ: Kutlama sesi
const audioGrandFinale = new Audio('assets/sounds/basari_fon.mp3');
let currentQuestionAudio = null; 

// Oyun Durumu Değişkenleri
let currentLevelNumber = 1; // 1'den 5'e kadar
let currentStages = [];     // O anki seviyenin tüm aşamaları
let currentStageIndex = 0;  // O anki seviyede kaçıncı aşamadayız

// Diziyi karıştıran fonksiyon
function shuffleArray(array) {
    let shuffled = [...array]; 
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; 
    }
    return shuffled;
}

// Belirli bir seviye için aşamaları (grupları) oluşturan AKILLI FONKSİYON
function generateStagesForLevel(levelNumber) {
    // Seviye 1'de 2 nesne, Seviye 2'de 3 nesne ... Seviye 5'te 6 nesne
    const itemsPerStage = levelNumber + 1; 
    
    // Meyve havuzunu karıştır
    let pool = shuffleArray(allFruitsData);
    let stages = [];

    while (pool.length > 0) {
        let stageFruits = [];
        
        // Havuzda yeterince meyve varsa al
        if (pool.length >= itemsPerStage) {
            stageFruits = pool.splice(0, itemsPerStage);
        } else {
            // Sonda az meyve kaldıysa (örn: 17 meyve 2'ye bölünürse en sona 1 artar)
            // Kalanı al, üstünü daha önce sorulmuşlardan rastgele tamamla
            stageFruits = pool.splice(0, pool.length);
            
            // Bu aşamada zaten olan meyveleri dışarıda bırakıp diğerlerinden seç
            let fillerPool = shuffleArray(allFruitsData).filter(f => !stageFruits.includes(f));
            let needed = itemsPerStage - stageFruits.length;
            stageFruits = stageFruits.concat(fillerPool.splice(0, needed));
        }

        // Bu aşamanın doğru cevabını (hedef meyveyi) rastgele seç
        const targetFruit = stageFruits[Math.floor(Math.random() * stageFruits.length)];

        // Aşamayı listeye ekle (eklerken meyvelerin yerini tekrar karıştır)
        stages.push({
            target: targetFruit.id,
            audio: targetFruit.audio,
            correctAudio: targetFruit.correctAudio,
            fruits: shuffleArray(stageFruits)
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

// Görsel sayısına göre grid düzeni ve boyut hesaplar
function calcLayout(n) {
    const cols = n <= 2 ? 2 : n <= 4 ? 2 : 3;
    const rows = Math.ceil(n / cols);
    const gap = 12;
    const availW = window.innerWidth - 48;
    const availH = window.innerHeight - 90; // header + audio-btn + padding
    const itemW = (availW - gap * (cols - 1)) / cols;
    const itemH = (availH - gap * (rows - 1)) / rows;
    const size = Math.floor(Math.min(itemW, itemH, 280));
    return { size, cols, gap };
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
                // Aşamayı (Stage) 1 artır
                currentStageIndex++; 
                
                if (currentStageIndex < currentStages.length) {
                    // Aynı seviyede sıradaki aşamaya geç
                    renderStage(); 
                } else {
                    // --- SEVİYE BİTTİ (KUTLAMA EKRANI) ---
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

// Seviye Sonu ve Büyük Final Kutlama Fonksiyonu
function showLevelCompleteCelebration() {
    const overlay = document.getElementById('celebration-overlay');
    const content = overlay.querySelector('.celebration-content');
    
    overlay.classList.remove('hidden');

    if (currentLevelNumber < 5) {
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

// Sayfa yüklendiğinde Oyunu SEVİYE 1'den başlat
window.onload = () => {
    startLevel(1); 
};