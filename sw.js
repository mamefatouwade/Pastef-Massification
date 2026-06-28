/* ============================================
   PASTEF — Service Worker
   Permet le fonctionnement hors-ligne complet
   ============================================ */

const CACHE_VERSION = 'pastef-v4';
const CACHE_FILES = [
  './',
  './index.html',
  './styles.css',
  './js/data.js',
  './js/app.js',
  './js/audio.js',
  './js/supabase-config.js',
  './manifest.json',
  './assets/logo.jpg',
  './assets/couverture.png',
  './assets/pattern.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

// INSTALL — Mise en cache des fichiers
self.addEventListener('install', event => {
  console.log('[SW] Installation');
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => {
        console.log('[SW] Mise en cache des fichiers');
        return cache.addAll(CACHE_FILES.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Échec mise en cache', err))
  );
});

// ACTIVATE — Nettoyage des anciens caches
self.addEventListener('activate', event => {
  console.log('[SW] Activation');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_VERSION).map(key => {
          console.log('[SW] Suppression ancien cache', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH — Stratégie de mise en cache
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ne jamais mettre en cache les appels à Supabase (toujours réseau)
  if (url.hostname.endsWith('.supabase.co')) {
    return; // Laisse passer la requête réseau normale
  }

  // Méthode non-GET → réseau direct
  if (event.request.method !== 'GET') {
    return;
  }

  // Stratégie : Cache d'abord, réseau en repli
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Mise à jour en arrière-plan
        fetch(event.request)
          .then(fresh => {
            if (fresh && fresh.ok) {
              caches.open(CACHE_VERSION).then(cache => cache.put(event.request, fresh));
            }
          })
          .catch(() => {});
        return cached;
      }

      // Pas en cache → fetch et cache
      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Hors-ligne et pas en cache → on retourne la page d'accueil pour les navigations
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});

// MESSAGE — Permet de forcer une mise à jour depuis l'app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
