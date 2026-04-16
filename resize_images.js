const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Boyut kuralları: hangi klasör/dosya max kaç px olacak
const rules = [
    { pattern: /renkli civcivler\/.*\.png$/i, maxSize: 512 },
    { pattern: /hayvanlar\/.*\.png$/i, maxSize: 600 },  // zaten 600, dokunma
    { pattern: /(noktalari birlestir|renkli toplar|yapboz|renkli civcivler oyunu).*\.png$/i, maxSize: 800 },
];

function getMaxSize(filePath) {
    const normalized = filePath.replace(/\\/g, '/');
    for (const rule of rules) {
        if (rule.pattern.test(normalized)) return rule.maxSize;
    }
    return null; // dokunma
}

function getAllPngs(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fp = path.join(dir, file);
        const stat = fs.statSync(fp);
        if (stat.isDirectory()) results = results.concat(getAllPngs(fp));
        else if (file.toLowerCase().endsWith('.png')) results.push(fp);
    });
    return results;
}

async function resizeAll() {
    const pngs = getAllPngs('./assets/images');
    let totalBefore = 0, totalAfter = 0;

    for (const filePath of pngs) {
        const maxSize = getMaxSize(filePath);
        if (!maxSize) continue;

        const meta = await sharp(filePath).metadata();
        const sizeBefore = fs.statSync(filePath).size;
        totalBefore += sizeBefore;

        if (meta.width <= maxSize && meta.height <= maxSize) {
            totalAfter += sizeBefore;
            console.log(`- ${path.basename(filePath)}: zaten ${meta.width}x${meta.height}, atlandı`);
            continue;
        }

        const resized = await sharp(filePath)
            .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
            .png({ quality: 85, compressionLevel: 9 })
            .toBuffer();

        fs.writeFileSync(filePath, resized);
        totalAfter += resized.length;
        console.log(`✓ ${path.basename(filePath)}: ${meta.width}x${meta.height} ${(sizeBefore/1024/1024).toFixed(2)}MB → ${maxSize}px ${(resized.length/1024/1024).toFixed(2)}MB`);
    }

    console.log(`\n=== SONUÇ ===`);
    console.log(`Kazanım: ${((totalBefore-totalAfter)/1024/1024).toFixed(1)}MB`);
}

resizeAll();
