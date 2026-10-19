// A Little Light — offline support.
// The page itself is fetched fresh when online (so updates arrive); everything else is
// served from the cache first. Bump VERSION whenever files change.
const VERSION = 'little-light-v6';
const CORE = [
  './', 'index.html', 'style.css?v=6', 'journey.js?v=6', 'content.js?v=6', 'engine.js?v=6', 'audio.js?v=6', 'app.js?v=6', 'panels.js?v=6', 'world.js?v=6',
  'world/kit.js', 'world/town.js', 'world/people.js', 'vendor/three.module.js', 'vendor/three.core.js',
  'assets/neighbors.webp', 'assets/neighborhood.webp', 'icons/icon-192.png', 'manifest.webmanifest'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const page = req.mode === 'navigate';
  if (page) {
    event.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('index.html', copy)); return res; }).catch(() => caches.match('index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok && (url.origin === location.origin || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com'))) {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(req, copy));
    }
    return res;
  })));
});
