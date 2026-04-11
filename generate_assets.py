"""
Hayvanlar kategorisi için resim ve ses dosyaları üretir.
- 17 hayvan PNG (1024x1024, emoji, beyaz arka plan)
- 17 x 3 = 51 MP3 (gTTS ile Türkçe sesler)
"""

from PIL import Image, ImageDraw, ImageFont
from gtts import gTTS
import os
import time

IMAGES_DIR = "assets/images"
SOUNDS_DIR = "assets/sounds"
FONT_PATH = "C:/Windows/Fonts/seguiemj.ttf"

# Hayvan adı → (dosya_ismi, emoji, Türkçe_isim)
ANIMALS = [
    ("kedi",    "🐱", "Kedi"),
    ("kopek",   "🐶", "Köpek"),
    ("kus",     "🐦", "Kuş"),
    ("at",      "🐴", "At"),
    ("inek",    "🐮", "İnek"),
    ("koyun",   "🐑", "Koyun"),
    ("tavsan",  "🐰", "Tavşan"),
    ("ayi",     "🐻", "Ayı"),
    ("aslan",   "🦁", "Aslan"),
    ("fil",     "🐘", "Fil"),
    ("zebra",   "🦓", "Zebra"),
    ("zurafa",  "🦒", "Zürafa"),
    ("maymun",  "🐵", "Maymun"),
    ("kaplan",  "🐯", "Kaplan"),
    ("kurt",    "🐺", "Kurt"),
    ("tilki",   "🦊", "Tilki"),
    ("sincap",  "🐿️", "Sincap"),
]

# Mevcut oyundaki arka plan rengi ile aynı
BG_COLOR = (248, 249, 249, 255)
IMG_SIZE  = 1024
EMOJI_SIZE = 800


def generate_images():
    print("\n=== RESİMLER ÜRETILIYOR ===")
    font = ImageFont.truetype(FONT_PATH, EMOJI_SIZE)

    for file_name, emoji, turkish_name in ANIMALS:
        out_path = os.path.join(IMAGES_DIR, f"{file_name}.png")
        if os.path.exists(out_path):
            print(f"  [ATLA] {file_name}.png zaten var")
            continue

        img = Image.new("RGBA", (IMG_SIZE, IMG_SIZE), BG_COLOR)
        draw = ImageDraw.Draw(img)

        # Emojinin boyutunu ölç, ortala
        bbox = draw.textbbox((0, 0), emoji, font=font, embedded_color=True)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        x = (IMG_SIZE - w) // 2 - bbox[0]
        y = (IMG_SIZE - h) // 2 - bbox[1]

        draw.text((x, y), emoji, font=font, embedded_color=True)

        # RGBA → P (palette) mode - orijinal format ile aynı
        final = img.convert("RGB").convert("P", dither=Image.Dither.NONE)
        final.save(out_path, optimize=True)
        print(f"  [OK] {file_name}.png  ({turkish_name})")


def generate_audio():
    print("\n=== SES DOSYALARI ÜRETILIYOR ===")

    audio_templates = {
        "soru":  lambda name: f"{name}'i bul!",
        "dogru": lambda name: f"Aferin! Bu bir {name}!",
        "isim":  lambda name: name,
    }

    for file_name, emoji, turkish_name in ANIMALS:
        for prefix, text_fn in audio_templates.items():
            out_path = os.path.join(SOUNDS_DIR, f"{prefix}_{file_name}.mp3")
            if os.path.exists(out_path):
                print(f"  [ATLA] {prefix}_{file_name}.mp3 zaten var")
                continue

            text = text_fn(turkish_name)
            try:
                tts = gTTS(text=text, lang="tr", slow=False)
                tts.save(out_path)
                print(f"  [OK] {prefix}_{file_name}.mp3  → \"{text}\"")
                time.sleep(0.3)  # Google TTS rate limit
            except Exception as e:
                print(f"  [HATA] {prefix}_{file_name}.mp3: {e}")
                time.sleep(2)


if __name__ == "__main__":
    generate_images()
    generate_audio()
    print("\n=== TAMAMLANDI ===")
