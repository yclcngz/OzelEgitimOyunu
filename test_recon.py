# -*- coding: utf-8 -*-
import sys
import io
import re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.path.insert(0, r"C:\Users\kalem\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\site-packages")

from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"

def clean(text, maxlen=120):
    return re.sub(r'\s+', ' ', text).strip()[:maxlen]

all_issues = []

def test_page(browser, name, url):
    pg = browser.new_page(viewport={"width": 390, "height": 844})
    page_errors = []
    console_errs = []
    pg.on("pageerror", lambda err: page_errors.append(str(err)))
    pg.on("console", lambda msg: console_errs.append(msg.text) if msg.type == "error" else None)

    try:
        pg.goto(url, timeout=20000, wait_until="domcontentloaded")
        # Kisa bekleme - JS calissin
        pg.wait_for_timeout(2000)

        title = pg.title()
        body = clean(pg.inner_text("body"), 150)
        imgs = pg.locator("img").count()
        btns = pg.locator("button").count()
        inputs = pg.locator("input").count()

        # Kritik elementleri kontrol et
        has_back = pg.locator("a.back-btn-carousel, .back-btn, a[href*='menu']").count() > 0
        has_game = pg.locator(".game-container, .game-board, #game, canvas, .draggables-container").count() > 0

        status = "OK"
        issues = []
        if page_errors:
            status = "JS-HATA"
            issues.extend(page_errors[:2])
        if console_errs:
            issues.extend(["CONSOLE: " + e[:80] for e in console_errs[:2]])

        # Broken image kontrolü
        broken_imgs = pg.eval_on_selector_all("img", """
            imgs => imgs.filter(i => !i.complete || i.naturalWidth === 0)
                        .map(i => i.src.split('/').pop())
        """)
        if broken_imgs:
            issues.append(f"KIRIK RESIM: {broken_imgs[:5]}")

        fname = r"C:\Users\kalem\AppData\Local\Temp\ss_" + name + ".png"
        pg.screenshot(path=fname, full_page=True)

        print(f"\n  [{status}] {name}")
        print(f"         Baslik: {repr(title)}")
        print(f"         Icerik: {repr(body[:100])}")
        print(f"         img:{imgs}  btn:{btns}  input:{inputs}  back:{has_back}  game:{has_game}")
        if broken_imgs:
            print(f"         KIRIK RESIMLER: {broken_imgs[:8]}")
        if issues:
            for iss in issues:
                print(f"         SORUN: {iss[:120]}")
            all_issues.append((name, issues))

        return True
    except Exception as e:
        print(f"\n  [EXCEPTION] {name}: {str(e)[:150]}")
        all_issues.append((name, [str(e)[:100]]))
        return False
    finally:
        pg.close()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # Ana sayfa
    pg = browser.new_page(viewport={"width": 390, "height": 844})
    pg.goto(BASE, wait_until="domcontentloaded")
    pg.wait_for_timeout(2000)
    pg.screenshot(path=r"C:\Users\kalem\AppData\Local\Temp\ss_index.png", full_page=True)

    # Kategori kartlarini kontrol et
    cards = pg.eval_on_selector_all("a.menu-img-btn", """
        els => els.map(e => ({
            title: e.getAttribute('data-title'),
            href: e.getAttribute('href'),
            hasImg: e.querySelector('img') !== null,
            imgSrc: e.querySelector('img')?.src?.split('/').pop(),
            imgLoaded: e.querySelector('img')?.complete && e.querySelector('img')?.naturalWidth > 0
        }))
    """)
    print("=== ANA SAYFA KATEGORI KARTLARI ===")
    for c in cards:
        ok = "OK" if c['imgLoaded'] else "KIRIK-RESIM"
        print(f"  [{ok}] {c['title']:15} -> {c['href']:30} img:{c['imgSrc']}")

    pg.close()

    # Tum oyun sayfalarini test et
    pages = [
        ("hayvanlar_menu",       f"{BASE}/hayvanlar_menu.html"),
        ("hayvanlari_taniyalim", f"{BASE}/hayvanlari_taniyalim.html"),
        ("renkler_menu",         f"{BASE}/renkler_menu.html"),
        ("renkler_surukle",      f"{BASE}/renkler_surukle.html"),
        ("sekiller_menu",        f"{BASE}/sekiller_menu.html"),
        ("sekiller_balon",       f"{BASE}/sekiller_balon.html"),
        ("meyveler_menu",        f"{BASE}/meyveler_menu.html"),
        ("meyveleri_taniyalim",  f"{BASE}/meyveleri_taniyalim.html"),
        ("nesneler_menu",        f"{BASE}/nesneler_menu.html"),
        ("yapboz",               f"{BASE}/yapboz.html"),
        ("bulmaca",              f"{BASE}/bulmaca.html"),
        ("eslestirme",           f"{BASE}/eslestirme.html"),
        ("hayvan_sesleri",       f"{BASE}/hayvan_sesleri.html"),
        ("hayvan_bulmaca",       f"{BASE}/hayvan_bulmaca.html"),
        ("hayvan_eslestirme",    f"{BASE}/hayvan_eslestirme.html"),
        ("noktalari_birlestir",  f"{BASE}/noktalari_birlestir.html"),
        ("mutfak_oyunlari",      f"{BASE}/mutfak_oyunlari.html"),
        ("giysiler_taniyalim",   f"{BASE}/giysiler_taniyalim.html"),
        ("ulasim_taniyalim",     f"{BASE}/ulasim_taniyalim.html"),
        ("renkli_civcivler",     f"{BASE}/renkli_civcivler.html"),
        ("renkli_toplar",        f"{BASE}/renkli_toplar.html"),
    ]

    print(f"\n=== SAYFA TESTLERI ({len(pages)} sayfa) ===")
    for name, url in pages:
        test_page(browser, name, url)

    browser.close()

    print("\n" + "="*50)
    print(f"OZET: {len(all_issues)} sayfada sorun bulundu")
    for name, issues in all_issues:
        print(f"  {name}: {issues[0][:80]}")
    print("\nSSler: C:\\Users\\kalem\\AppData\\Local\\Temp\\ss_*.png")
    print("TAMAMLANDI")
