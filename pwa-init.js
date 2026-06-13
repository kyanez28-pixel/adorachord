'use strict';

// ── Detección de plataforma ──────────────────────────────────────────────────
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(navigator.userAgent);
const isMobile = isIOS || isAndroid || window.innerWidth < 769;

const isIOSStandalone  = window.navigator.standalone === true;
const isPWAStandalone  = window.matchMedia('(display-mode: standalone)').matches
  || window.matchMedia('(display-mode: fullscreen)').matches;
const isInstalled = isIOSStandalone || isPWAStandalone;

// ── 1. Registrar Service Worker ──────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => {
        console.log('✓ SW registrado:', reg.scope);
        setInterval(() => reg.update(), 6 * 60 * 60 * 1000);
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(new Event('sw-update-available'));
            }
          });
        });
      })
      .catch(err => console.error('✗ SW error:', err));
  });
}

// ── 2. Capturar evento de instalación Android ────────────────────────────────
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('📲 PWA lista para instalar (Android)');
  window.dispatchEvent(new Event('pwa-install-prompt-ready'));
  // Mostrar banner Android si no está instalada
  if (!isInstalled) {
    setTimeout(showInstallBanner, 1500);
  }
});

window.installPWA = () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(result => {
    console.log(result.outcome === 'accepted' ? '✓ PWA instalada' : '✗ Rechazada');
    deferredPrompt = null;
    hidePWABanners();
  });
};

window.addEventListener('appinstalled', () => {
  console.log('✓ PWA instalada');
  deferredPrompt = null;
  hidePWABanners();
  showInstallSuccessToast();
});

// ── 3. Modo standalone ───────────────────────────────────────────────────────
if (isInstalled) {
  document.documentElement.classList.add('pwa-standalone');
}

// ── 4. Conectividad ─────────────────────────────────────────────────────────
window.addEventListener('online',  () => window.dispatchEvent(new Event('app-online')));
window.addEventListener('offline', () => window.dispatchEvent(new Event('app-offline')));

// ── 5. Errores no capturados ─────────────────────────────────────────────────
window.addEventListener('unhandledrejection', e => {
  console.error('⚠ Promise no manejada:', e.reason);
});

// ── 6. Estilos del sistema de instalación ───────────────────────────────────
function injectInstallStyles() {
  if (document.getElementById('pwa-install-styles')) return;
  const style = document.createElement('style');
  style.id = 'pwa-install-styles';
  style.textContent = `
    /* ═══════════════════════════════════════════════
       BANNER FLOTANTE PRINCIPAL (ANDROID + iOS)
    ═══════════════════════════════════════════════ */
    .pwa-install-banner {
      position: fixed;
      bottom: 80px; /* encima del bottom-nav */
      left: 12px;
      right: 12px;
      z-index: 9500;
      background: linear-gradient(145deg, #1C1A18 0%, #242220 100%);
      border: 1px solid rgba(232, 87, 42, 0.4);
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(232,87,42,0.1), inset 0 1px 0 rgba(255,255,255,0.05);
      overflow: hidden;
      font-family: 'DM Sans', sans-serif;
      animation: pwaSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
      max-width: 480px;
      margin: 0 auto;
    }

    @media (min-width: 769px) {
      .pwa-install-banner {
        bottom: 24px;
        left: auto;
        right: 24px;
        max-width: 380px;
        margin: 0;
      }
    }

    .pwa-install-banner.hiding {
      animation: pwaSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes pwaSlideUp {
      from { transform: translateY(120%) scale(0.95); opacity: 0; }
      to   { transform: translateY(0) scale(1); opacity: 1; }
    }
    @keyframes pwaSlideDown {
      from { transform: translateY(0) scale(1); opacity: 1; }
      to   { transform: translateY(120%) scale(0.95); opacity: 0; }
    }

    /* Franja de color superior */
    .pwa-banner-stripe {
      height: 3px;
      background: linear-gradient(90deg, #E8572A, #FF7A4D, #E8572A);
      background-size: 200% 100%;
      animation: pwaBannerStripe 3s linear infinite;
    }
    @keyframes pwaBannerStripe {
      0%   { background-position: 0% 0%; }
      100% { background-position: 200% 0%; }
    }

    .pwa-banner-inner {
      padding: 16px 16px 16px;
    }

    /* Cabecera */
    .pwa-banner-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }

    .pwa-banner-app-icon {
      width: 48px; height: 48px;
      background: linear-gradient(135deg, #E8572A, #FF7A4D);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
      box-shadow: 0 6px 20px rgba(232,87,42,0.4);
    }

    .pwa-banner-app-info { flex: 1; min-width: 0; }
    .pwa-banner-app-name {
      font-family: 'Syne', sans-serif;
      font-size: 15px; font-weight: 800;
      color: #F0EBE3;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .pwa-banner-app-sub {
      font-size: 11px; color: #7A6E65;
      margin-top: 2px;
    }

    .pwa-banner-close {
      background: rgba(255,255,255,0.06);
      border: none; color: #7A6E65;
      cursor: pointer;
      width: 28px; height: 28px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
      transition: all 0.15s;
      flex-shrink: 0;
    }
    .pwa-banner-close:hover { background: rgba(255,255,255,0.12); color: #F0EBE3; }

    /* Selector iOS / Android */
    .pwa-platform-tabs {
      display: flex;
      gap: 4px;
      background: rgba(255,255,255,0.04);
      border-radius: 10px;
      padding: 3px;
      margin-bottom: 14px;
    }
    .pwa-platform-tab {
      flex: 1;
      padding: 8px 6px;
      border: none;
      background: transparent;
      color: #7A6E65;
      font-family: 'Syne', sans-serif;
      font-size: 11px; font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex; align-items: center; justify-content: center; gap: 5px;
    }
    .pwa-platform-tab.active {
      background: rgba(232,87,42,0.2);
      color: #FF7A4D;
      box-shadow: 0 2px 8px rgba(232,87,42,0.15);
    }
    .pwa-platform-tab:hover:not(.active) { color: #F0EBE3; }

    /* Contenido de cada pestaña */
    .pwa-tab-content { display: none; }
    .pwa-tab-content.active { display: block; }

    /* Botón de instalación Android */
    .pwa-install-btn-android {
      width: 100%;
      background: linear-gradient(135deg, #E8572A, #FF7A4D);
      border: none; color: #fff;
      padding: 14px 20px;
      border-radius: 12px;
      font-family: 'Syne', sans-serif;
      font-size: 14px; font-weight: 800;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: all 0.2s;
      box-shadow: 0 6px 20px rgba(232,87,42,0.4);
      letter-spacing: 0.3px;
    }
    .pwa-install-btn-android:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 30px rgba(232,87,42,0.5);
    }
    .pwa-install-btn-android:active { transform: scale(0.97); }

    .pwa-android-unavailable {
      text-align: center;
      padding: 12px;
      color: #7A6E65;
      font-size: 12px;
      line-height: 1.5;
    }
    .pwa-android-unavailable strong { color: #F0EBE3; display: block; margin-bottom: 4px; }

    /* Pasos iOS */
    .pwa-ios-steps {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .pwa-ios-step {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 10px;
      padding: 10px 12px;
      transition: all 0.15s;
    }
    .pwa-ios-step:hover { background: rgba(232,87,42,0.06); border-color: rgba(232,87,42,0.2); }

    .pwa-ios-step-num {
      width: 22px; height: 22px;
      background: rgba(232,87,42,0.2);
      color: #FF7A4D;
      border-radius: 50%;
      font-family: 'Syne', sans-serif;
      font-size: 11px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .pwa-ios-step-content { flex: 1; }
    .pwa-ios-step-text {
      font-size: 12px; color: #D5CFC6;
      line-height: 1.4;
    }
    .pwa-ios-step-text b { color: #F0EBE3; }
    .pwa-ios-step-icon {
      color: #E8572A;
      display: inline-flex; align-items: center;
      vertical-align: middle; margin-left: 3px;
    }

    /* Beneficios */
    .pwa-benefits {
      display: flex;
      gap: 6px;
      margin-top: 12px;
      flex-wrap: wrap;
    }
    .pwa-benefit-chip {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 20px;
      padding: 4px 10px;
      font-size: 10px;
      color: #7A6E65;
      display: flex; align-items: center; gap: 4px;
    }

    /* ═══════════════════════════════════════════════
       BOTÓN FLOTANTE DE INSTALACIÓN (FAB)
       Aparece en el bottom-nav o como FAB independiente
    ═══════════════════════════════════════════════ */
    .pwa-install-fab {
      position: fixed;
      bottom: 76px;
      right: 16px;
      z-index: 9000;
      background: linear-gradient(135deg, #E8572A, #FF7A4D);
      color: #fff;
      border: none;
      border-radius: 50px;
      padding: 12px 18px;
      font-family: 'Syne', sans-serif;
      font-size: 12px; font-weight: 800;
      cursor: pointer;
      display: none;
      align-items: center; gap: 6px;
      box-shadow: 0 8px 30px rgba(232,87,42,0.5);
      animation: pwaFabPop 0.5s cubic-bezier(0.16, 1, 0.3, 1) both 2s;
      transition: all 0.2s;
      letter-spacing: 0.3px;
    }
    .pwa-install-fab.visible { display: flex; }
    .pwa-install-fab:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 12px 40px rgba(232,87,42,0.6); }
    .pwa-install-fab:active { transform: scale(0.96); }

    @keyframes pwaFabPop {
      0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
      60%  { transform: scale(1.1) rotate(3deg); }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }

    .pwa-fab-pulse {
      position: absolute;
      top: -4px; right: -4px;
      width: 12px; height: 12px;
      background: #FF7A4D;
      border-radius: 50%;
      border: 2px solid #0C0B0A;
      animation: pwaFabPulse 2s ease-in-out infinite;
    }
    @keyframes pwaFabPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%       { transform: scale(1.4); opacity: 0.7; }
    }

    /* ═══════════════════════════════════════════════
       TOAST DE ÉXITO
    ═══════════════════════════════════════════════ */
    .pwa-success-toast {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(-100px);
      z-index: 99999;
      background: linear-gradient(135deg, #1a3a2a, #1e4032);
      border: 1px solid rgba(62,207,142,0.3);
      border-radius: 50px;
      padding: 12px 20px;
      font-family: 'Syne', sans-serif;
      font-size: 13px; font-weight: 700;
      color: #3ECF8E;
      display: flex; align-items: center; gap: 8px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      white-space: nowrap;
    }
    .pwa-success-toast.show {
      transform: translateX(-50%) translateY(0);
    }
  `;
  document.head.appendChild(style);
}

// ── 7. Funciones de utilidad ─────────────────────────────────────────────────
function hidePWABanners() {
  const banner = document.getElementById('pwa-main-banner');
  const fab = document.getElementById('pwa-install-fab');
  if (banner) {
    banner.classList.add('hiding');
    setTimeout(() => banner.remove(), 400);
  }
  if (fab) {
    fab.style.animation = 'pwaSlideDown 0.3s ease both';
    setTimeout(() => fab.remove(), 300);
  }
}

function showInstallSuccessToast() {
  const toast = document.createElement('div');
  toast.className = 'pwa-success-toast';
  toast.innerHTML = '✓ ¡AdoraChord instalada correctamente!';
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 50);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 500);
  }, 3500);
}

// ── 8. Banner principal de instalación ──────────────────────────────────────
function showInstallBanner(forceShow = false) {
  if (isInstalled) return;
  if (document.getElementById('pwa-main-banner')) return;

  const dismissed = localStorage.getItem('pwa-banner-dismissed-v2');
  const dismissedAt = parseInt(dismissed || '0', 10);
  const dayMs = 24 * 60 * 60 * 1000;

  // Si fue descartado hace menos de 3 días, no mostrar (a menos que forceShow)
  if (!forceShow && dismissed && (Date.now() - dismissedAt) < (3 * dayMs)) return;

  injectInstallStyles();

  // Detectar pestaña inicial según plataforma
  const initialTab = isIOS ? 'ios' : 'android';

  const banner = document.createElement('div');
  banner.id = 'pwa-main-banner';
  banner.className = 'pwa-install-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Instalar AdoraChord Pro');

  banner.innerHTML = `
    <div class="pwa-banner-stripe"></div>
    <div class="pwa-banner-inner">
      <div class="pwa-banner-header">
        <div class="pwa-banner-app-icon">🎵</div>
        <div class="pwa-banner-app-info">
          <div class="pwa-banner-app-name">AdoraChord Pro</div>
          <div class="pwa-banner-app-sub">Instala la app en tu dispositivo</div>
        </div>
        <button class="pwa-banner-close" id="pwa-banner-close-btn" aria-label="Cerrar">✕</button>
      </div>

      <!-- Selector de plataforma -->
      <div class="pwa-platform-tabs" role="tablist">
        <button class="pwa-platform-tab ${initialTab === 'android' ? 'active' : ''}" 
                id="pwa-tab-android" role="tab"
                aria-selected="${initialTab === 'android'}"
                onclick="pwaSwitchTab('android')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.523 15.341l1.505-2.6A.8.8 0 0018.334 11.6l-1.505 2.598a6.57 6.57 0 00-2.83-.629 6.57 6.57 0 00-2.83.629L9.666 11.6a.8.8 0 00-1.694.94l.065.101 1.505 2.6A6.5 6.5 0 006 21h12a6.5 6.5 0 00-3.477-5.659zM9.5 19a1 1 0 110-2 1 1 0 010 2zm5 0a1 1 0 110-2 1 1 0 010 2zM7.5 10.5a4.5 4.5 0 119 0H7.5z"/>
          </svg>
          Android
        </button>
        <button class="pwa-platform-tab ${initialTab === 'ios' ? 'active' : ''}"
                id="pwa-tab-ios" role="tab"
                aria-selected="${initialTab === 'ios'}"
                onclick="pwaSwitchTab('ios')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          iPhone / iPad
        </button>
      </div>

      <!-- Contenido Android -->
      <div class="pwa-tab-content ${initialTab === 'android' ? 'active' : ''}" id="pwa-content-android">
        ${deferredPrompt ? `
          <button class="pwa-install-btn-android" id="pwa-android-install-btn" onclick="window.installPWA()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Instalar en Android
          </button>
        ` : `
          <div class="pwa-android-unavailable">
            <strong>Cómo instalar en Android</strong>
            Abre esta página en <b>Chrome</b> → toca el menú ⋮ → selecciona
            <b>"Agregar a pantalla de inicio"</b> o <b>"Instalar aplicación"</b>.
          </div>
        `}
      </div>

      <!-- Contenido iOS -->
      <div class="pwa-tab-content ${initialTab === 'ios' ? 'active' : ''}" id="pwa-content-ios">
        <div class="pwa-ios-steps">
          <div class="pwa-ios-step">
            <div class="pwa-ios-step-num">1</div>
            <div class="pwa-ios-step-content">
              <div class="pwa-ios-step-text">
                Toca <b>Compartir</b> en Safari
                <span class="pwa-ios-step-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>
          <div class="pwa-ios-step">
            <div class="pwa-ios-step-num">2</div>
            <div class="pwa-ios-step-content">
              <div class="pwa-ios-step-text">
                Selecciona <b>"Agregar a pantalla de inicio"</b>
                <span class="pwa-ios-step-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="12" y1="8" x2="12" y2="16"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>
          <div class="pwa-ios-step">
            <div class="pwa-ios-step-num">3</div>
            <div class="pwa-ios-step-content">
              <div class="pwa-ios-step-text">Toca <b>"Agregar"</b> para confirmar</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Beneficios -->
      <div class="pwa-benefits">
        <div class="pwa-benefit-chip">📵 Sin conexión</div>
        <div class="pwa-benefit-chip">⚡ Más rápida</div>
        <div class="pwa-benefit-chip">🔔 Notificaciones</div>
        <div class="pwa-benefit-chip">📱 Pantalla completa</div>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('pwa-banner-close-btn').addEventListener('click', () => {
    localStorage.setItem('pwa-banner-dismissed-v2', String(Date.now()));
    banner.classList.add('hiding');
    setTimeout(() => banner.remove(), 400);
  });
}

// Función global para cambiar tabs
window.pwaSwitchTab = function(platform) {
  document.querySelectorAll('.pwa-platform-tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });
  document.querySelectorAll('.pwa-tab-content').forEach(c => c.classList.remove('active'));

  const tab = document.getElementById(`pwa-tab-${platform}`);
  const content = document.getElementById(`pwa-content-${platform}`);
  if (tab) { tab.classList.add('active'); tab.setAttribute('aria-selected', 'true'); }
  if (content) content.classList.add('active');
};

// Función global para abrir el banner manualmente
window.showPWAInstallBanner = function() {
  showInstallBanner(true);
};

// ── 9. FAB de instalación (para cuando no hay banner activo) ─────────────────
function showInstallFAB() {
  if (isInstalled) return;
  if (document.getElementById('pwa-install-fab')) return;

  injectInstallStyles();

  const fab = document.createElement('button');
  fab.id = 'pwa-install-fab';
  fab.className = 'pwa-install-fab';
  fab.setAttribute('aria-label', 'Instalar AdoraChord');
  fab.innerHTML = `
    <div class="pwa-fab-pulse"></div>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
    Instalar App
  `;

  fab.addEventListener('click', () => {
    if (deferredPrompt) {
      window.installPWA();
    } else {
      showInstallBanner(true);
    }
  });

  document.body.appendChild(fab);

  // Mostrar con delay
  setTimeout(() => fab.classList.add('visible'), 100);
}

// ── 10. Botón de instalación en sidebar footer ───────────────────────────────
function addInstallButtonToSidebar() {
  if (isInstalled) return;

  injectInstallStyles();

  // Añadir botón al sidebar footer si existe
  const sidebarFooter = document.querySelector('.sidebar-footer');
  if (sidebarFooter && !document.getElementById('sidebar-install-btn')) {
    const btnWrapper = document.createElement('div');
    btnWrapper.id = 'sidebar-install-btn';
    btnWrapper.style.cssText = `
      margin-top: 4px;
    `;

    const installBtn = document.createElement('button');
    installBtn.style.cssText = `
      width: 100%;
      background: linear-gradient(135deg, rgba(232,87,42,0.15), rgba(255,122,77,0.1));
      border: 1px solid rgba(232,87,42,0.3);
      color: #FF7A4D;
      padding: 9px 12px;
      border-radius: 10px;
      font-family: 'Syne', sans-serif;
      font-size: 11px; font-weight: 700;
      cursor: pointer;
      display: flex; align-items: center; gap: 8px;
      transition: all 0.15s;
      letter-spacing: 0.3px;
    `;
    installBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Instalar App
    `;

    installBtn.addEventListener('mouseenter', () => {
      installBtn.style.background = 'linear-gradient(135deg, rgba(232,87,42,0.25), rgba(255,122,77,0.18))';
      installBtn.style.borderColor = 'rgba(232,87,42,0.5)';
    });
    installBtn.addEventListener('mouseleave', () => {
      installBtn.style.background = 'linear-gradient(135deg, rgba(232,87,42,0.15), rgba(255,122,77,0.1))';
      installBtn.style.borderColor = 'rgba(232,87,42,0.3)';
    });

    installBtn.addEventListener('click', () => {
      if (deferredPrompt) {
        window.installPWA();
      } else {
        showInstallBanner(true);
      }
    });

    btnWrapper.appendChild(installBtn);
    sidebarFooter.insertBefore(btnWrapper, sidebarFooter.firstChild);
  }
}

// ── 11. Botón en bottom-nav (móvil) ─────────────────────────────────────────
function addInstallButtonToBottomNav() {
  if (isInstalled) return;

  injectInstallStyles();

  const bottomNav = document.getElementById('bottom-nav');
  if (bottomNav && !document.getElementById('bn-install')) {
    // Insertar estilos para el botón del bottom-nav
    const btnStyle = document.createElement('style');
    btnStyle.textContent = `
      #bn-install {
        position: relative;
        background: linear-gradient(135deg, rgba(232,87,42,0.2), rgba(255,122,77,0.15)) !important;
        color: #FF7A4D !important;
      }
      #bn-install .bn-install-dot {
        position: absolute;
        top: 6px; right: 12px;
        width: 7px; height: 7px;
        background: #FF7A4D;
        border-radius: 50%;
        border: 1.5px solid #111010;
        animation: pwaFabPulse 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(btnStyle);

    const installNavBtn = document.createElement('button');
    installNavBtn.id = 'bn-install';
    installNavBtn.className = 'bottom-nav-btn';
    installNavBtn.setAttribute('aria-label', 'Instalar aplicación');
    installNavBtn.innerHTML = `
      <div class="bn-install-dot"></div>
      <span class="bn-icon">⬇️</span>Instalar
    `;

    installNavBtn.addEventListener('click', () => {
      if (deferredPrompt) {
        window.installPWA();
      } else {
        showInstallBanner(true);
      }
    });

    bottomNav.appendChild(installNavBtn);
  }
}

// ── 12. Inicialización ───────────────────────────────────────────────────────
window.addEventListener('load', () => {
  if (isInstalled) {
    console.log('📱 Modo standalone — ya instalada');
    return;
  }

  // Esperar a que el DOM esté listo
  setTimeout(() => {
    addInstallButtonToSidebar();
    addInstallButtonToBottomNav();

    // iOS: mostrar banner automáticamente si no se descartó
    if (isIOS && !isIOSStandalone) {
      const dismissed = localStorage.getItem('pwa-banner-dismissed-v2');
      const dismissedAt = parseInt(dismissed || '0', 10);
      const dayMs = 24 * 60 * 60 * 1000;
      if (!dismissed || (Date.now() - dismissedAt) >= (3 * dayMs)) {
        setTimeout(() => showInstallBanner(), 2500);
      }
    }

    // Android sin deferredPrompt aún: mostrar FAB
    if (isAndroid && !deferredPrompt) {
      setTimeout(() => showInstallFAB(), 3000);
    }
  }, 800);
});

// Si el evento beforeinstallprompt ya fue disparado antes de que este script cargara
// y ya tenemos deferredPrompt, actualizar el botón
if (deferredPrompt) {
  setTimeout(() => {
    const androidContent = document.getElementById('pwa-content-android');
    if (androidContent) {
      androidContent.innerHTML = `
        <button class="pwa-install-btn-android" id="pwa-android-install-btn" onclick="window.installPWA()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Instalar en Android
        </button>
      `;
    }
  }, 1000);
}

console.log('✓ PWA init v3 — iOS:', isIOS, '| Android:', isAndroid, '| Instalada:', isInstalled);
