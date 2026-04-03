const VERSION = '1.0.0';
const CACHE = `adorachord-${VERSION}`;

// Assets locales (obligatorios)
const ASSETS = [
  '/',
  '/index.html'
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
      // 1. Cachear assets locales (obligatorio - la instalación depende de esto)
      cache.addAll(ASSETS)
        .then(() => {
          console.log('✓ Assets locales cacheados');
          
          // 2. Intentar cachear URLs externas (no-blocking)
          EXTERNAL_URLS.forEach(url => {
            cache.add(url)
              .then(() => console.log(`✓ Cacheado: ${url}`))
              .catch(err => console.log(`⚠ No se pudo cachear ${url}:`, err));
          });
        })
        .catch(err => {
          console.error('✗ Error cacheando assets locales:', err);
          throw err; // Fallar la instalación si falta index.html
        });
      
      return Promise.resolve();
    })
  );
  
  // Activar inmediatamente (no esperar a que se cierre)
  self.skipWaiting();
});

// ════════════════════════════════════════════════════════
// ACTIVATE — Limpiar cachés viejas
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
  
  // Controlar todos los clientes
  self.clients.claim();
});

// ════════════════════════════════════════════════════════
// FETCH — Network-first, caché como fallback
// ════════════════════════════════════════════════════════
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // ✗ No interceptar requests a Supabase (siempre necesitan red fresca)
  if (url.includes('supabase.co')) {
    return;
  }

  // ✗ No interceptar CDNs externas importantes
  if (url.includes('fonts.googleapis.com') || 
      url.includes('cdn.jsdelivr.net')) {
    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Navigations: network-first con fallback a caché
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // Guardar respuesta fresca si es válida
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(cache => cache.put(e.request, clone));
          }
          return res;
        })
        .catch(err => {
          console.log(`⚠ Offline - fallback para: ${url}`);
          
          // Intentar usar caché
          return caches.match(e.request).then(cached => {
            if (cached) return cached;
            
            // Ultimate fallback: index.html
            return caches.match('/index.html');
          });
        })
    );
    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Otros recursos: network-first con caché
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Guardar en caché si es GET y exitoso
        if (res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // Fallback a caché
        return caches.match(e.request)
          .then(cached => cached || new Response('Sin conexión', { status: 503 }));
      })
  );
});

// ════════════════════════════════════════════════════════
// MESSAGE — Verificar actualizaciones
// ════════════════════════════════════════════════════════
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
