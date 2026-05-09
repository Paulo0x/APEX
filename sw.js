// ================================================================
// APEX — Service Worker v7
// Network-first strict + suppression agressive des vieux caches
// ================================================================
const CACHE_NAME = 'apex-v7';

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-180.png',
];

// Installation : skipWaiting immédiat
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn('[SW] Cache partiel:', err))
    )
  );
});

// Activation : vide TOUS les anciens caches + prend le contrôle immédiatement
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        console.log('[SW] Suppression cache:', k);
        return caches.delete(k); // supprime TOUS les caches, y compris apex-v7 pour repartir propre
      }))
    ).then(() => self.clients.claim())
  );
});

// Fetch : réseau EN PRIORITÉ, cache seulement si hors ligne
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request, { cache: 'no-store' }) // force le bypass du cache HTTP
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(e.request).then(cached =>
          cached || new Response('Hors ligne — reconnecte-toi pour charger APEX.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          })
        )
      )
  );
});
