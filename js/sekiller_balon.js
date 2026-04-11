// 8 Temel Şeklin Vektörel (SVG) Kodları Veritabanı
const shapesDatabase = [
    { id: 'kare', label: 'Kare', color: '#e74c3c', svg: '<svg viewBox="0 0 100 100"><rect x="15" y="15" width="70" height="70" fill="currentColor"/></svg>' },
    { id: 'daire', label: 'Daire', color: '#3498db', svg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="currentColor"/></svg>' },
    { id: 'yildiz', label: 'Yıldız', color: '#f1c40f', svg: '<svg viewBox="0 0 100 100"><polygon points="50,10 61,40 92,40 66,58 76,88 50,69 24,88 34,58 8,40 39,40" fill="currentColor"/></svg>' },
    { id: 'ucgen', label: 'Üçgen', color: '#2ecc71', svg: '<svg viewBox="0 0 100 100"><polygon points="50,15 90,85 10,85" fill="currentColor"/></svg>' },
    { id: 'kalp', label: 'Kalp', color: '#e84393', svg: '<svg viewBox="0 0 100 100"><path d="M50,85 C 50,85 10,55 10,30 A 20,20 0 0 1 50,20 A 20,20 0 0 1 90,30 C 90,55 50,85 50,85 Z" fill="currentColor"/></svg>' },
    { id: 'dikdortgen', label: 'Dikdörtgen', color: '#9b59b6', svg: '<svg viewBox="0 0 100 100"><rect x="10" y="30" width="80" height="40" fill="currentColor"/></svg>' },
    { id: 'altigen', label: 'Altıgen', color: '#e67e22', svg: '<svg viewBox="0 0 100 100"><polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="currentColor"/></svg>' },
    { id: 'besgen', label: 'Beşgen', color: '#34495e', svg: '<svg viewBox="0 0 100 100"><polygon points="50,10 95,45 75,90 25,90 5,45" fill="currentColor"/></svg>' }
];

// Sesler
const audioInstruction = new Audio('assets/sounds/sekil_bul_ses.mp3'); 
const audioPop = new Audio('assets/sounds/pat.mp3'); 
const audioDat = new Audio('assets/sounds/dat.mp3'); 
const audioLevelComplete = new Audio('assets/sounds/tebrikler_basardin.mp3'); 
const audioGrandFinale = new Audio('assets/sounds/basari_fon.mp3'); 

let currentLevelNumber = 1; 
let currentTargetShape = null;
let currentScore = 0;
const targetScore = 3; // Seviye atlamak için gereken balon sayısı
let balloonInterval = null; // Balon üretim sayacı
let activeShapes = []; // O seviyede uçacak şekiller havuzu
let spawnRate = 2000; // Balon çıkma hızı (Lvl 1 için yavaş)
let flySpeed = 6; // Balon uçma süresi (Lvl 1 için yavaş)

function shuffleArray(array) {
    let shuffled = [...array]; 
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; 
    }
    return shuffled;
}

function startLevel(levelNumber) {
    // Önceki seviyeden kalan balon üretimini durdur
    if(balloonInterval) clearInterval(balloonInterval);
    
    currentLevelNumber = levelNumber;
    currentScore = 0;
    updateScoreBoard();

    const skyArea = document.getElementById('sky-area');
    skyArea.innerHTML = ''; // Gökyüzünü temizle
    
    document.getElementById('level-title').innerText = `Seviye ${levelNumber}`;

    // Zorluk Ayarı: Seviye arttıkça ekran daha kalabalık ve hızlı olur
    let numWrongShapes = levelNumber; // Lvl 1'de 1 yanlış şekil, Lvl 5'te 5 yanlış şekil
    if(numWrongShapes > 7) numWrongShapes = 7;
    
    spawnRate = 2000 - (levelNumber * 200); // Seviye arttıkça daha sık balon çıkar
    flySpeed = 7 - levelNumber; // Seviye arttıkça saniyeler düşer, balon hızlanır

    // Hedef şekli rastgele seç
    let shuffledDB = shuffleArray(shapesDatabase);
    currentTargetShape = shuffledDB[0];
    
    // Uçacak şekiller havuzunu oluştur (1 Doğru + Seviye kadar Yanlış şekil)
    activeShapes = [currentTargetShape];
    for(let i = 1; i <= numWrongShapes; i++) {
        activeShapes.push(shuffledDB[i]);
    }

    // Hedef Şekli Alt Tarafa Çiz
    const targetContainer = document.getElementById('target-shape-container');
    targetContainer.innerHTML = currentTargetShape.svg;
    targetContainer.style.color = currentTargetShape.color; // Hedef şeklin rengini ayarla

    setTimeout(() => playInstructionAudio(), 500); 

    // Balon Fabrikasını Çalıştır
    balloonInterval = setInterval(createBalloon, Math.max(800, spawnRate));
}

// Gökyüzüne Balon Salan Fonksiyon
function createBalloon() {
    const skyArea = document.getElementById('sky-area');
    
    // Havuzdan rastgele bir şekil seç (Bazen doğru, bazen yanlış gelir)
    const randomShape = activeShapes[Math.floor(Math.random() * activeShapes.length)];
    
    const balloon = document.createElement('div');
    balloon.classList.add('flying-shape');
    balloon.dataset.id = randomShape.id;
    
    // Şekli ve rengini ata
    balloon.innerHTML = randomShape.svg;
    balloon.style.color = randomShape.color;
    
    // Soldan sağa rastgele bir yatay konuma yerleştir (0% ile 85% arası)
    const randomLeft = Math.floor(Math.random() * 85);
    balloon.style.left = `${randomLeft}%`;
    
    // Seviyeye göre uçuş hızını ayarla
    balloon.style.animation = `floatUp ${flySpeed}s linear forwards`;

    // Balona tıklama olayını ekle
    balloon.addEventListener('click', () => handleBalloonClick(balloon));

    // Animasyon bitince (gökyüzünden çıkınca) balonu hafızadan sil ki oyun kasmasın
    balloon.addEventListener('animationend', () => {
        balloon.remove();
    });

    skyArea.appendChild(balloon);
}

// Balona Tıklanınca Çalışan Fonksiyon
function handleBalloonClick(balloonElement) {
    const clickedId = balloonElement.dataset.id;

    if (clickedId === currentTargetShape.id) {
        // --- DOĞRU BALON PATLATILDI ---
        audioPop.currentTime = 0;
        audioPop.play();
        
        balloonElement.classList.add('popped'); // CSS ile büyüyüp kaybolma efekti
        currentScore++;
        updateScoreBoard();

        // Hedef skora ulaşıldıysa seviye biter
        if (currentScore === targetScore) {
            clearInterval(balloonInterval); // Yeni balon üretimini durdur
            
            // Ekrandaki tüm kalan balonları yavaşça sil
            document.querySelectorAll('.flying-shape').forEach(b => b.style.opacity = '0');

            setTimeout(() => {
                if (currentLevelNumber < 5) {
                    showLevelCompleteCelebration();
                } else {
                    showGrandFinaleCelebration();
                }
            }, 1000);
        }
    } else {
        // --- YANLIŞ BALONA TIKLANDI ---
        audioDat.play();
        // İsteğe bağlı: Yanlış balonu kırmızı renge boyayıp hızlıca düşürebiliriz veya sadece sallayabiliriz
        balloonElement.style.animationPlayState = 'paused'; // Uçuşu anlık durdur
        balloonElement.classList.add('shake');
        
        setTimeout(() => {
            balloonElement.classList.remove('shake');
            balloonElement.style.animationPlayState = 'running'; // Uçuşa devam
        }, 500);
    }
}

function updateScoreBoard() {
    document.getElementById('score-board').innerText = `Patlatılan: ${currentScore} / ${targetScore}`;
}

function playInstructionAudio() {
    audioInstruction.currentTime = 0; 
    audioInstruction.play().catch(e => console.log("Ses engellendi."));
}

document.getElementById('play-audio-btn').addEventListener('click', playInstructionAudio);

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
        overlay.classList.add('hidden');
        window.location.href = 'sekiller_menu.html';
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

window.onload = () => {
    startLevel(1); 
};