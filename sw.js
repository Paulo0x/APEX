// ================================================================
// APEX — Service Worker v3 (compatible iOS Safari + Android Chrome)
// ================================================================
// IMPORTANT : changer CACHE_NAME force le navigateur à réinstaller
// le SW et vider l'ancien cache. Toujours incrémenter lors d'un déploiement.
const CACHE_NAME = 'apex-v4';

// Installation : mise en cache de l'app (fetche la NOUVELLE version)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Force le fetch réseau (pas de cache) pour avoir la version fraîche
      return fetch('/?nocache=' + Date.now())
        .then(response => cache.put('/', response))
        .catch(() => cache.addAll(['/']));
    }).catch(() => {})
  );
  // Active immédiatement sans attendre la fermeture des onglets
  self.skipWaiting();
});

// Activation : supprime TOUS les vieux caches (apex-v1, v2, v3...)
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

// Fetch : réseau en priorité (network-first) pour toujours avoir le contenu frais,
// cache en fallback si hors ligne
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Réponse réseau réussie → met à jour le cache et retourne la réponse
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Réseau indisponible → fallback sur le cache (mode hors-ligne)
        return caches.match(e.request).then(cached => {
          return cached || new Response('Hors ligne', { status: 503 });
        });
      })
  );
});
