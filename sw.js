// ================================================================
// APEX — Service Worker v4 (compatible iOS Safari + Android Chrome)
// ================================================================
// IMPORTANT : changer CACHE_NAME force le navigateur à réinstaller
// le SW et vider l'ancien cache. Incrémenter à chaque déploiement.
const CACHE_NAME = 'apex-v5';

// Fichiers à mettre en cache lors de l'installation
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-180.png',
  '/icons/icon-167.png',
  '/icons/icon-152.png',
  '/icons/icon-120.png',
  '/icons/icon-any.png',
];

// Installation : met en cache tous les assets de l'app
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // addAll fetch chaque URL et la met en cache
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => console.warn('[SW] Cache partiel:', err))
  );
  // Active immédiatement sans attendre la fermeture des onglets
  self.skipWaiting();
});

// Activation : supprime TOUS les vieux caches (apex-v1, v2, v3, v4...)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[SW] Suppression ancien cache:', k);
        return caches.delete(k);
      })
    ))
  );
  // Prend le contrôle de tous les onglets ouverts immédiatement
  self.clients.claim();
});

// Fetch : network-first (réseau en priorité pour les mises à jour),
// cache en fallback si hors ligne
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Réponse réseau OK → met à jour le cache et retourne la réponse
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Réseau indisponible → fallback sur le cache (mode hors-ligne)
        return caches.match(e.request).then(cached => {
          return cached || new Response('Hors ligne — Ouvre APEX avec une connexion au moins une fois.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
  );
});
