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

// ── 6. Guía de Instalación para iOS (iPhone) ─────────────────────
const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isIOSStandalone = window.navigator.standalone === true;
const isPWAStandalone = window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches;

if (isIOSDevice && !isIOSStandalone && !isPWAStandalone) {
  const dismissed = localStorage.getItem('ios-pwa-prompt-dismissed');
  if (!dismissed) {
    window.addEventListener('load', () => {
      // Retrasar 3 segundos para que cargue la interfaz principal de la app primero
      setTimeout(showIOSInstallPrompt, 3000);
    });
  }
}

function showIOSInstallPrompt() {
  // Evitar duplicados
  if (document.getElementById('ios-install-prompt')) return;

  // Inyectar Estilos CSS
  const style = document.createElement('style');
  style.id = 'ios-install-styles';
  style.textContent = `
    .ios-install-banner {
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: rgba(26, 25, 23, 0.9);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(232, 87, 42, 0.35);
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-family: 'DM Sans', sans-serif;
      color: #F0EBE3;
      animation: iosSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes iosSlideIn {
      from { transform: translateY(120%) scale(0.95); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
    @keyframes iosSlideOut {
      from { transform: translateY(0) scale(1); opacity: 1; }
      to { transform: translateY(120%) scale(0.95); opacity: 0; }
    }
    .ios-install-banner.dismissing {
      animation: iosSlideOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .ios-install-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .ios-install-title {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 15px;
      color: #F0EBE3;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ios-install-icon {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #E8572A, #FF7A4D);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    .ios-install-close-btn {
      background: transparent;
      border: none;
      color: #7A6E65;
      cursor: pointer;
      font-size: 16px;
      padding: 4px;
      line-height: 1;
      transition: color 0.15s;
    }
    .ios-install-close-btn:hover {
      color: #F0EBE3;
    }
    .ios-install-body {
      font-size: 12px;
      line-height: 1.5;
      color: #D5CFC6;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .ios-install-step {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.03);
      padding: 8px 12px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.02);
    }
    .ios-install-step-num {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      color: #E8572A;
      font-size: 13px;
    }
    .ios-install-step-text {
      flex: 1;
    }
    .ios-install-svg-icon {
      color: #E8572A;
      vertical-align: middle;
    }
    /* Estilo responsivo para tablets/pantallas grandes */
    @media (min-width: 769px) {
      .ios-install-banner {
        max-width: 400px;
        right: 20px;
        left: auto;
        bottom: 20px;
      }
    }
  `;
  document.head.appendChild(style);

  // Inyectar Contenedor HTML
  const banner = document.createElement('div');
  banner.id = 'ios-install-prompt';
  banner.className = 'ios-install-banner';
  banner.innerHTML = `
    <div class="ios-install-header">
      <div class="ios-install-title">
        <div class="ios-install-icon">🎵</div>
        Instalar AdoraChord Pro
      </div>
      <button class="ios-install-close-btn" id="ios-install-close-btn">✕</button>
    </div>
    <div class="ios-install-body">
      <p>Agrega esta aplicación a tu pantalla de inicio para usarla a pantalla completa y sin conexión.</p>
      <div class="ios-install-step">
        <span class="ios-install-step-num">1</span>
        <span class="ios-install-step-text">Presiona el botón de <b>Compartir</b> en Safari 
          <svg class="ios-install-svg-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-top:-2px; margin-left: 2px;">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
        </span>
      </div>
      <div class="ios-install-step">
        <span class="ios-install-step-num">2</span>
        <span class="ios-install-step-text">Selecciona <b>"Agregar a pantalla de inicio"</b> 
          <svg class="ios-install-svg-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-top:-2px; margin-left: 2px;">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </span>
      </div>
    </div>
  `;
  document.body.appendChild(banner);

  // Manejar Cierre del Banner
  document.getElementById('ios-install-close-btn').addEventListener('click', () => {
    banner.classList.add('dismissing');
    localStorage.setItem('ios-pwa-prompt-dismissed', 'true');
    setTimeout(() => {
      banner.remove();
      style.remove();
    }, 400);
  });
}

console.log('✓ PWA init cargado con soporte iOS');
