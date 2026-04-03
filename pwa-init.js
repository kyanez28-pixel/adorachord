'use strict';

// ── 1. Registrar Service Worker ──────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('✓ Service Worker registrado:', registration.scope);

        // Verificar actualizaciones cada 6 horas
        setInterval(() => registration.update(), 6 * 60 * 60 * 1000);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('📦 Nueva versión disponible');
              window.dispatchEvent(new Event('sw-update-available'));
            }
          });
        });
      })
      .catch(err => console.error('✗ Error registrando Service Worker:', err));
  });
}

// ── 2. Prompt de instalación (Android) ──────────────────────────
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('📲 PWA lista para instalar');
  window.dispatchEvent(new Event('pwa-install-prompt-ready'));
});

window.installPWA = () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(result => {
    console.log(result.outcome === 'accepted' ? '✓ PWA instalada' : '✗ Instalación rechazada');
    deferredPrompt = null;
  });
};

window.addEventListener('appinstalled', () => {
  console.log('✓ PWA instalada correctamente');
  deferredPrompt = null;
  window.dispatchEvent(new Event('pwa-installed'));
});

// ── 3. Modo standalone ───────────────────────────────────────────
const isStandalone = window.navigator.standalone === true
  || window.matchMedia('(display-mode: standalone)').matches
  || window.matchMedia('(display-mode: fullscreen)').matches;

if (isStandalone) {
  console.log('📱 Ejecutando en modo standalone');
  document.documentElement.classList.add('pwa-standalone');
}

// ── 4. Conectividad ──────────────────────────────────────────────
window.addEventListener('online',  () => window.dispatchEvent(new Event('app-online')));
window.addEventListener('offline', () => window.dispatchEvent(new Event('app-offline')));

// ── 5. Errores no capturados ─────────────────────────────────────
window.addEventListener('unhandledrejection', e => {
  console.error('⚠ Promise no manejada:', e.reason);
});

console.log('✓ PWA init cargado');
