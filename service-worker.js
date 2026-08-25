const CACHE_NAME = 'oraculo-v1-0-public-v2-shell-18';
const APP_SHELL = [
  './',
  './index.html',
  './styles/core-remodel-v1-0-70.css',
  './styles/premium-home-v12.css',
  './styles/tokens.css',
  './styles/v2.css',
  './js/coreApp-v1-0-firefox.js',
  './js/premium-ui-v12.js',
  './js/v2-shell.js',
  './js/i18n.js',
  './js/data.js',
  './js/config.js',
  './grabovoi_db.json',
  './manifest.json',
  './privacy.html',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon.svg',
  './docs/manual_usuario_oraculo_mistico_v1_0.pdf',
  './img/tarot-shuffle-hero.svg',
  './img/rune-pouch.svg',
  './assets/premium/aurora-shell.svg',
  './assets/premium/card-back-premium.svg',
  './assets/premium/constellation-panel.svg',
  './assets/premium/dashboard-band.svg',
  './assets/premium/executive-constellation.svg',
  './assets/premium/gallery-lattice.svg',
  './assets/premium/lux-grid.svg',
  './assets/premium/moon-divider.svg',
  './assets/premium/mystic-bg.svg',
  './assets/premium/native-engine-grid.svg',
  './assets/premium/premium-sigil.svg',
  './assets/premium/ritual-mat.svg',
  './assets/premium/tarot-frame.svg',
  './assets/premium/tarot-table.svg',
  './img/avatars/oracle-female-realistic.png',
  './img/avatars/oracle-female-mouth-medium.png',
  './img/avatars/oracle-female-mouth-open.png',
  './img/avatars/oracle-male-realistic.png',
  './img/avatars/oracle-male-mouth-medium.png',
  './img/avatars/oracle-male-mouth-open.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML, JS and CSS so GitHub Pages updates are seen immediately.
  const isFreshAsset = event.request.mode === 'navigate' || /\.(html|js|css|json)$/i.test(url.pathname);

  if (isFreshAsset) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (!response || !response.ok) return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => {
          if (cached) return cached;
          return event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error();
        }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request).then(response => {
        if (!response || !response.ok) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
  );
});
