const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const targetFolder = process.argv[2] || 'mutfak';
const dir = path.join(__dirname, 'assets', 'images', targetFolder);

async function padSquare() {
    if (!fs.existsSync(dir)) {
        console.error("Klasör bulunamadı:", dir);
        return;
    }
    
    console.log(`🖼️ [${targetFolder}] Klasöründeki resimler kare formatına (1:1) dönüştürülüyor...`);
    const files = fs.readdirSync(dir);
    let count = 0;
    
    for (const f of files) {
        if (!f.match(/\.(png|jpg|jpeg)$/i)) continue;
        const filePath = path.join(dir, f);
        const tempPath = filePath + '.tmp';
        
        try {
            const metadata = await sharp(filePath).metadata();
            const maxDim = Math.max(metadata.width, metadata.height);
            
            // Eğer resim halihazırda tam bir kare ise işlem yapma
            if (metadata.width === metadata.height) {
                console.log(`⏭️ Zaten kare: ${f}`);
                continue;
            }
            
            await sharp(filePath)
                .resize(maxDim, maxDim, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 } // Saydam dolgu
                })
                .toFile(tempPath);
                
            fs.copyFileSync(tempPath, filePath);
            fs.unlinkSync(tempPath);
            console.log(`✅ Kare Yapıldı: ${f} (${metadata.width}x${metadata.height} -> ${maxDim}x${maxDim})`);
            count++;
        } catch (err) {
            console.log(`❌ Hata (${f}):`, err.message);
        }
    }
    console.log(`🎉 İşlem tamam! Toplam ${count} adet resim 1:1 formatına getirildi.`);
}

padSquare();
