/* ============================================
   PASTEF — Service Worker
   Compatible : Chrome, Safari iOS 16+, Firefox, Samsung Browser
   ============================================ */

const CACHE_VERSION = 'pastef-v6';

// Fichiers critiques — mis en cache obligatoirement
const CACHE_CORE = [
  './index.html',
  './styles.css',
  './js/data.js',
  './js/app.js',
  './js/audio.js',
  './js/supabase-config.js',
  './manifest.json',
  './assets/logo.jpg',
  './assets/logo-192.png',
  './assets/logo-512.png',
  './assets/couverture.png',
  './assets/pattern.png'
];

// Fichiers optionnels — on essaie, mais l'échec ne bloque pas l'install
// (ex: Google Fonts peut échouer si l'utilisateur est hors-ligne au 1er chargement)
const CACHE_OPTIONAL = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

// ============================================
// INSTALL
// ============================================
self.addEventListener('install', event => {
  console.log('[SW] Installation v6');
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async cache => {

      // 1) Fichiers critiques — SANS cache:'reload' (incompatible Safari)
      await cache.addAll(CACHE_CORE);
      console.log('[SW] Fichiers core mis en cache');

      // 2) Fichiers optionnels — on ignore les erreurs
      for (const url of CACHE_OPTIONAL) {
        try {
          await cache.add(new Request(url, { mode: 'no-cors' }));
        } catch (e) {
          console.warn('[SW] Optionnel non mis en cache (ignoré) :', url);
        }
      }

    })
    // Sur Safari, skipWaiting() ici peut causer des problèmes
    // On laisse le contrôleur gérer via le message SKIP_WAITING
  );
});

// ============================================
// ACTIVATE — Nettoyage des anciens caches
// ============================================
self.addEventListener('activate', event => {
  console.log('[SW] Activation v6');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => {
            console.log('[SW] Suppression ancien cache :', key);
            return caches.delete(key);
          })
      ))
      .then(() => {
        // clients.claim() : prendre le contrôle immédiatement
        // Compatible tous navigateurs y compris Safari iOS 16.4+
        return self.clients.claim();
      })
  );
});

// ============================================
// FETCH — Stratégie cache-first avec fallback réseau
// ============================================
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1) Appels Supabase → toujours réseau, jamais en cache
  if (url.hostname.endsWith('.supabase.co')) return;

  // 2) Requêtes non-GET → réseau direct
  if (event.request.method !== 'GET') return;

  // 3) Requêtes de navigation (chargement de page)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 4) Tout le reste → cache d'abord, réseau en repli
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Mise à jour en arrière-plan (stale-while-revalidate)
        fetch(event.request)
          .then(fresh => {
            if (fresh && fresh.ok) {
              caches.open(CACHE_VERSION)
                .then(cache => cache.put(event.request, fresh));
            }
          })
          .catch(() => {});
        return cached;
      }

      // Pas en cache → fetch et mise en cache si succès
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_VERSION)
          .then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // Hors-ligne et pas en cache → rien à faire
        console.warn('[SW] Ressource non disponible hors-ligne :', event.request.url);
      });
    })
  );
});

// ============================================
// MESSAGE — Mise à jour forcée depuis l'app
// ============================================
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING reçu → activation immédiate');
    self.skipWaiting();
  }
});