const VERSION = '1.2.1';
const CACHE = `adorachord-${VERSION}`;

// Assets locales (obligatorios)
const STATIC_ASSETS = [
  '/adorachord/',
  '/adorachord/index.html',
  '/adorachord/manifest.json',
  '/adorachord/icon-192.png',
  '/adorachord/icon-512.png',
  '/adorachord/pwa-init.js'
];

// URLs externas que intentaremos cachear
const EXTERNAL_URLS = [
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// ════════════════════════════════════════════════════════
// INSTALL — Guardar assets en caché
// ════════════════════════════════════════════════════════
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // 1. Cachear assets locales (obligatorio)
      return cache.addAll(STATIC_ASSETS)
        .then(() => {
          console.log('✓ Assets locales cacheados');
          
          // 2. Intentar cachear URLs externas (no-blocking)
          EXTERNAL_URLS.forEach(url => {
            cache.add(url)
              .then(() => console.log(`✓ Cacheado: ${url}`))
              .catch(err => console.log(`⚠ No se pudo cachear ${url}`));
          });
        })
        .catch(err => {
          console.error('✗ Error cacheando assets:', err);
          throw err;
        });
    })
  );
  self.skipWaiting();
});

// ════════════════════════════════════════════════════════
// ACTIVATE — limpiar cachés viejas
// ════════════════════════════════════════════════════════
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      const deleteOldCaches = keys
        .filter(k => k !== CACHE && k.startsWith('adorachord-'))
        .map(k => {
          console.log(`🗑 Eliminando caché antigua: ${k}`);
          return caches.delete(k);
        });
      
      return Promise.all(deleteOldCaches);
    })
  );
  self.clients.claim();
});

// ════════════════════════════════════════════════════════
// FETCH — Network-first con fallback a caché
// ════════════════════════════════════════════════════════
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // No interceptar requests a Supabase (siempre necesitan red fresca)
  if (url.includes('supabase.co') ||
      url.includes('itunes.apple.com') ||
      url.includes('drive.google.com') ||
      url.includes('googleusercontent.com')) {
    return;
  }

  // Fuentes y CDN — caché primero
  if (url.includes('fonts.googleapis.com') || url.includes('cdn.jsdelivr.net')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
    return;
  }

  // Navigations: network-first con fallback a caché
  if (e.request.mode === 'navigate' || url.endsWith('index.html') || url.endsWith('/adorachord/')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => {
          console.log(`⚠ Offline - fallback para: ${url}`);
          return caches.match(e.request).then(c => c || caches.match('/adorachord/index.html'));
        })
    );
    return;
  }

  // Otros recursos: network-first con caché
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        return caches.match(e.request)
          .then(c => c || new Response('Sin conexión', { status: 503 }));
      })
  );
});

// ════════════════════════════════════════════════════════
// MESSAGE
// ════════════════════════════════════════════════════════
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
