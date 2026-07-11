/* Service worker minimal : pré-cache du shell applicatif, stratégie cache-first.
   Incrémenter CACHE_VERSION à chaque mise à jour des fichiers du site. */
const CACHE_VERSION = 'droidex-v6';
const SHELL = [
  './',
  'index.html',
  'styles.css',
  'i18n.js',
  'data.js',
  'app.js',
  'config.js',
  'sync.js',
  'vendor/pocketbase.umd.js',
  'manifest.json',
  'fonts/chakra-petch-500.woff2',
  'fonts/chakra-petch-600.woff2',
  'fonts/chakra-petch-700.woff2',
  'fonts/ibm-plex-sans-var.woff2',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // ne jamais intercepter l'API de synchronisation ni tout autre domaine
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached =>
      cached ||
      fetch(e.request).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, copy));
        }
        return res;
      })
    ).catch(() => caches.match('index.html'))
  );
});
