const CACHE_NAME = 'egitim-oyunu-v62';

const CORE_ASSETS = [
  './index.html',
  './meyveler_menu.html',
  './renkler_menu.html',
  './sekiller_menu.html',
  './nesneler_menu.html',
  './hayvanlar_menu.html',
  './meyveleri_taniyalim.html',
  './eslestirme.html',
  './bulmaca.html',
  './renkler_surukle.html',
  './sekiller_balon.html',
  './mutfak_oyunlari.html',
  './giysiler_taniyalim.html',
  './hayvan_sesleri.html',
  './hayvanlari_taniyalim.html',
  './hayvan_bulmaca.html',
  './hayvan_eslestirme.html',
  './renkli_civcivler.html',
  './renkli_toplar.html',
  './noktalari_birlestir.html',
  './yapboz.html',
  './css/style.css',
  './js/carousel.js',
  './js/common_bgm.js',
  './js/sw-register.js',
  './js/meyve_game.js',
  './js/hayvan_game.js',
  './js/hayvan_sesleri.js',
  './js/eslestirme.js',
  './js/bulmaca.js',
  './js/renkler_surukle.js',
  './js/sekiller_balon.js',
  './js/mutfak_oyunlari.js',
  './js/giysi_game.js',
  './js/renkli_civcivler.js',
  './js/renkli_toplar.js',
  './js/noktalari_birlestir.js',
  './js/yapboz.js',
  './js/hayvan_eslestirme.js',
  './js/hayvan_bulmaca.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        CORE_ASSETS.map(url =>
          fetch(new Request(url, { redirect: 'follow' }))
            .then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
            })
            .catch(() => {})
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) {
    event.respondWith(fetch(event.request).catch(() => new Response('')));
    return;
  }

  const url = new URL(event.request.url);

  // JS dosyaları: network-first (her zaman güncel versiyon)
  if (url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Diğer dosyalar: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      const fetchRequest = new Request(event.request, { redirect: 'follow' });

      return fetch(fetchRequest).then(response => {
        if (response.ok && !response.redirected) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => new Response('', { status: 404 }));
    })
  );
});
