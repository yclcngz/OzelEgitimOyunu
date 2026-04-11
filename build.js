/**
 * Build script: www/ klasörüne tüm web dosyalarını kopyalar.
 * Kullanım: node build.js
 */
const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const DEST = path.join(__dirname, 'www');

const INCLUDE = [
  'index.html', 'meyveler_menu.html', 'renkler_menu.html',
  'sekiller_menu.html', 'nesneler_menu.html', 'meyveleri_taniyalim.html',
  'eslestirme.html', 'bulmaca.html', 'renkler_surukle.html',
  'sekiller_balon.html', 'mutfak_oyunlari.html',
  'manifest.json', 'sw.js'
];

const DIRS = ['css', 'js', 'assets'];

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

// Temizle ve yeniden oluştur
if (fs.existsSync(DEST)) fs.rmSync(DEST, { recursive: true });
fs.mkdirSync(DEST);

// Tekil dosyaları kopyala
INCLUDE.forEach(f => copyFile(path.join(SRC, f), path.join(DEST, f)));

// Klasörleri kopyala
DIRS.forEach(d => copyDir(path.join(SRC, d), path.join(DEST, d)));

console.log('✓ www/ klasörü hazır. Şimdi "npx cap sync" çalıştırabilirsiniz.');
