// Iron Tide service worker — offline play + installability (#32).
// Strategy: cache-first with background refresh (stale-while-revalidate).
// UPDATE CONVENTION: this is a single-file game with no build step, so whenever
// index.html or any vendored script changes, bump the version suffix below —
// the old cache is deleted on activate and clients pick up the new one.
const CACHE = 'irontide-v10';
const ASSETS = [
  './',
  'manifest.json',
  'vendor/three.min.js',
  'js/terrain.js',
  'vendor/postprocessing/CopyShader.js',
  'vendor/postprocessing/EffectComposer.js',
  'vendor/postprocessing/LuminosityHighPassShader.js',
  'vendor/postprocessing/RenderPass.js',
  'vendor/postprocessing/ShaderPass.js',
  'vendor/postprocessing/UnrealBloomPass.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  // the multiplayer relay is live data — never serve it from cache
  if (u.pathname.endsWith('/play') || u.pathname.endsWith('/servers') || u.pathname.endsWith('/health')) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
        return res;
      }).catch(() => hit);
      return hit || net;   // cached copy immediately, fresh copy for next time
    })
  );
});
