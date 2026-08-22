// S-WINDs service worker — simple offline support, not a full precache pipeline.
// Vite build assets are hashed per build, so instead of a static precache list
// we cache the app shell on first load and cache-as-you-go for static assets.

const CACHE_VERSION = 'swinds-v1';
const APP_SHELL = ['/', '/manifest.json', '/favicon.svg'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // never cache the API — live weather/fleet/auth data must always be fresh.
  // let those requests go straight to the network untouched.
  if (request.url.includes('/api/')) return;

  // only handle GET requests, same-origin, http(s) — ignore everything else (sockets, etc.)
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;

  // page navigations: network-first, fall back to the cached shell when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

  // static assets (JS/CSS/images/icons): cache-first, then go to network and store the result
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => cached); // offline and not cached — nothing we can do for this asset
    })
  );
});