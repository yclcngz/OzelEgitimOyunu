const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = './assets/images';
let totalBefore = 0;
let totalAfter = 0;
let count = 0;

function getAllPngs(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllPngs(filePath));
        } else if (file.toLowerCase().endsWith('.png')) {
            results.push(filePath);
        }
    });
    return results;
}

async function compressAll() {
    const pngs = getAllPngs(IMAGES_DIR);
    console.log(`${pngs.length} PNG dosyası bulundu.`);

    for (const filePath of pngs) {
        const sizeBefore = fs.statSync(filePath).size;
        totalBefore += sizeBefore;

        try {
            const compressed = await sharp(filePath)
                .png({ quality: 80, compressionLevel: 9, palette: false })
                .toBuffer();

            // Sadece küçüldüyse yaz
            if (compressed.length < sizeBefore) {
                fs.writeFileSync(filePath, compressed);
                totalAfter += compressed.length;
                const saved = ((sizeBefore - compressed.length) / sizeBefore * 100).toFixed(1);
                console.log(`✓ ${path.basename(filePath)}: ${(sizeBefore/1024/1024).toFixed(2)}MB → ${(compressed.length/1024/1024).toFixed(2)}MB (-%${saved})`);
            } else {
                totalAfter += sizeBefore;
                console.log(`- ${path.basename(filePath)}: zaten optimize (${(sizeBefore/1024/1024).toFixed(2)}MB)`);
            }
            count++;
        } catch (e) {
            console.error(`HATA: ${filePath}: ${e.message}`);
            totalAfter += sizeBefore;
        }
    }

    console.log(`\n=== SONUÇ ===`);
    console.log(`Toplam: ${(totalBefore/1024/1024).toFixed(1)}MB → ${(totalAfter/1024/1024).toFixed(1)}MB`);
    console.log(`Kazanım: ${((totalBefore - totalAfter)/1024/1024).toFixed(1)}MB (%${((totalBefore-totalAfter)/totalBefore*100).toFixed(1)})`);
}

compressAll();
