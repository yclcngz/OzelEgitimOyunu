/**
 * Build script: www/ klasörüne tüm web dosyalarını kopyalar.
 * - Kök dizindeki tüm .html dosyalarını otomatik bulur (listeye eklemek gerekmez)
 * - Her build'de SW cache versiyonunu otomatik artırır
 * Kullanım: node build.js
 */
const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const DEST = path.join(__dirname, 'www');
const SW_PATH = path.join(SRC, 'sw.js');

const DIRS = ['css', 'js', 'assets'];

// --- SW versiyonunu otomatik artır ---
function bumpSwVersion() {
  let content = fs.readFileSync(SW_PATH, 'utf8');
  const match = content.match(/CACHE_NAME\s*=\s*'egitim-oyunu-v(\d+)'/);
  if (match) {
    const newVersion = parseInt(match[1]) + 1;
    content = content.replace(
      /CACHE_NAME\s*=\s*'egitim-oyunu-v\d+'/,
      `CACHE_NAME = 'egitim-oyunu-v${newVersion}'`
    );
    fs.writeFileSync(SW_PATH, content, 'utf8');
    return newVersion;
  }
  return null;
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      copyFile(s, d);
    }
  }
}

// --- SW versiyonunu artır ---
const newVersion = bumpSwVersion();
if (newVersion) {
  console.log(`✓ SW cache versiyonu → v${newVersion}`);
}

// --- www/ klasörünü oluştur ---
fs.mkdirSync(DEST, { recursive: true });

// --- Kök dizindeki tüm .html dosyalarını otomatik kopyala ---
const htmlFiles = fs.readdirSync(SRC).filter(f => f.endsWith('.html'));
htmlFiles.forEach(f => copyFile(path.join(SRC, f), path.join(DEST, f)));

// --- manifest.json ve sw.js kopyala ---
['manifest.json', 'sw.js'].forEach(f => {
  if (fs.existsSync(path.join(SRC, f))) {
    copyFile(path.join(SRC, f), path.join(DEST, f));
  }
});

// --- css, js, assets klasörlerini kopyala ---
DIRS.forEach(d => copyDir(path.join(SRC, d), path.join(DEST, d)));

console.log(`✓ ${htmlFiles.length} HTML dosyası kopyalandı: ${htmlFiles.join(', ')}`);
console.log('✓ www/ klasörü hazır.');
