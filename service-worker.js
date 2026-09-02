const CACHE_NAME = 'oraculo-v1-0-public-astro-pdf-ai-189';
const APP_SHELL = [
  './',
  './index.html',
  './styles/core-remodel-v1-0-70.css',
  './styles/premium-home-v12.css',
  './styles/tokens.css',
  './styles/v2.css',
  './styles/v2-ritual.css',
  './styles/v2-oraculos.css',
  './styles/visual-performance-polish.css',
  './styles/astro.css',
  /* jsPDF venia de un CDN y el service worker ignora todo lo que no sea
     del propio dominio, asi que sin conexion el PDF caia a un .txt.
     Alojado aqui, funciona offline y no depende de terceros. */
  './assets/vendor/jspdf/jspdf.umd.min.js',
  /* La tipografia de titulos: alojada aqui para que sin conexion los
     titulos no cambien de aspecto al caer al respaldo. */
  './assets/vendor/fonts/fraunces-latin.woff2',
  './assets/vendor/fonts/fraunces-latin-ext.woff2',
  './assets/vendor/astronomy-engine/2.1.19/astronomy.browser.min.js',
  './assets/vendor/astronomy-engine/2.1.19/LICENSE',
  /* La OFL pide expresamente que su texto acompane a la fuente, y la app
     funciona sin conexion: una licencia que no esta en la cache no
     acompana a nada. */
  './assets/vendor/fonts/OFL.txt',
  './js/coreApp-v1-0-firefox.js',
  './js/premium-ui-v12.js',
  './js/v2-shell.js',
  './js/v2-ritual.js',
  './js/v2-grimorio.js',
  './js/v2-voz.js',
  './js/v2-biblioteca.js',
  './js/v2-movil.js',
  './js/i18n.js',
  './js/tarot-content.js',
  './js/tarot/catalogo.js',
  './js/tarot/nombres.js',
  './js/tarot/es.js',
  './js/tarot/en.js',
  './js/tarot/ca.js',
  './js/tarot/fr.js',
  './js/tarot/de.js',
  './js/tarot/zh.js',
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
  './img/avatars/oracle-female-realistic.webp',
  './img/avatars/oracle-female-mouth-medium.webp',
  './img/avatars/oracle-female-mouth-open.webp',
  './img/avatars/oracle-male-realistic.webp',
  './img/avatars/oracle-male-mouth-medium.webp',
  './img/avatars/oracle-male-mouth-open.webp'
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
