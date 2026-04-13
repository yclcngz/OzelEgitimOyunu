const CACHE_NAME = 'egitim-oyunu-v18';

const CORE_ASSETS = [
  './index.html',
  './meyveler_menu.html',
  './renkler_menu.html',
  './sekiller_menu.html',
  './nesneler_menu.html',
  './meyveleri_taniyalim.html',
  './eslestirme.html',
  './bulmaca.html',
  './renkler_surukle.html',
  './sekiller_balon.html',
  './mutfak_oyunlari.html',
  './css/style.css',
  './js/game.js',
  './js/eslestirme.js',
  './js/bulmaca.js',
  './js/renkler_surukle.js',
  './js/sekiller_balon.js',
  './js/mutfak_oyunlari.js',
  './js/sw-register.js'
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
