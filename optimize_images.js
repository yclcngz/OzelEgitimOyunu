const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesDir = path.join(__dirname, 'assets', 'images');
const MIN_SIZE_TO_OPTIMIZE_KB = 500; // Sadece 500 KB'dan büyük dosyaları optimize et

async function optimizeImages() {
    console.log('🖼️ Görsel optimizasyonu başlatılıyor...\n');
    
    try {
        const files = fs.readdirSync(imagesDir);
        let optimizedCount = 0;
        let totalSavedBytes = 0;

        for (const file of files) {
            if (!file.match(/\.(png|jpg|jpeg)$/i)) continue;
            
            const filePath = path.join(imagesDir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.size > MIN_SIZE_TO_OPTIMIZE_KB * 1024) {
                const originalSizeMB = (stats.size / 1024 / 1024).toFixed(2);
                console.log(`⏳ Başladı: ${file} (Boyut: ${originalSizeMB} MB)`);
                
                const tempFilePath = filePath + '.tmp';
                
                // Resmi oku, yeniden boyutlandır (Maks 1080x1080 ama oranları bozmadan) ve sıkıştır
                let pipeline = sharp(filePath).resize({
                    width: 1080,
                    height: 1080,
                    fit: 'inside', // Oranı koru, ekrana sığdır
                    withoutEnlargement: true // Zaten küçükse büyütme
                });

                if (file.toLowerCase().endsWith('.png')) {
                    // PNG için 8-bit palet kullanarak inanılmaz bir sıkıştırma sağlar (renkler çok az değişir)
                    pipeline = pipeline.png({ palette: true, quality: 80, colors: 256, effort: 7 });
                } else {
                    pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
                }

                await pipeline.toFile(tempFilePath);
                
                const newStats = fs.statSync(tempFilePath);
                const newSizeKB = (newStats.size / 1024).toFixed(2);
                
                // Geçici dosyayı orjinali ile değiştir (Windows EPERM hatasına karşı kopyala-sil)
                try {
                    fs.unlinkSync(filePath);
                    fs.renameSync(tempFilePath, filePath);
                } catch (err) {
                    fs.copyFileSync(tempFilePath, filePath);
                    fs.unlinkSync(tempFilePath);
                }
                
                const savedMB = ((stats.size - newStats.size) / 1024 / 1024).toFixed(2);
                totalSavedBytes += (stats.size - newStats.size);
                
                console.log(`✅ Tamamlandı: ${file} -> Yeni Boyut: ${newSizeKB} KB (Kurtarılan: ${savedMB} MB)`);
                optimizedCount++;
            }
        }
        
        const totalSavedMB = (totalSavedBytes / 1024 / 1024).toFixed(2);
        console.log(`\n🎉 İşlem bitti!`);
        console.log(`- Toplam ${optimizedCount} görsel optimize edildi.`);
        console.log(`- Toplam ${totalSavedMB} MB alan tasarrufu sağlandı!`);
        console.log(`\nNot: İleride yeni resimler eklediğinizde sadece terminale 'npm run optimize' yazmanız yeterlidir.`);

    } catch (err) {
        console.error('❌ Hata oluştu:', err);
    }
}

optimizeImages();
