# 🔧 Guía de Implementación de Correcciones

## 📋 Tabla de Contenidos
1. [Cambios Requeridos](#cambios-requeridos)
2. [Pasos de Implementación](#pasos-de-implementación)
3. [Testing & Validación](#testing--validación)
4. [Deployment](#deployment)

---

## Cambios Requeridos

### ✅ Archivo 1: `sw.js` (REEMPLAZAR COMPLETAMENTE)

**Estado:** Completamente reescrito  
**Archivo corregido:** `sw.js` (en outputs)

**Cambios principales:**
- ✓ Separación de assets locales vs externos
- ✓ Mejor manejo de errores en caché de CDNs
- ✓ Estrategia mejorada de network-first
- ✓ Logging detallado para debugging
- ✓ Soporte para actualizaciones

---

### ✅ Archivo 2: `manifest.json` (ACTUALIZAR)

**Estado:** Requiere actualización  
**Archivo corregido:** `manifest.json` (en outputs)

**Cambios agregados:**
- ✓ `"display": "standalone"` - Ocultar barra de dirección
- ✓ `"orientation": "portrait-primary"` - Orientación preferida
- ✓ `"theme_color"` y `"background_color"` - Colores correctos
- ✓ `"icons"` con propósito `"maskable"` - Para Android adaptivo
- ✓ `"screenshots"` - Para mejorar UI de instalación
- ✓ `"shortcuts"` - Accesos rápidos (opcional)
- ✓ Campos completos y bien formateados

---

### ✅ Archivo 3: `index.html` (AGREGAR SCRIPT)

**Estado:** Requiere adición de código  
**Código a agregar:** `pwa-init.js`

**Ubicación:** 
```html
</head>
  ...
</body>

<!-- AGREGAR ESTO ANTES DE CERRAR </body> -->
<script>
  [... código de pwa-init.js ...]
</script>
</body>
</html>
```

**Alternativa:** Puedes incluirlo como archivo externo:
```html
<script src="pwa-init.js" defer></script>
</body>
</html>
```

---

### ℹ️ Archivo 4: `icon-192.png` y `icon-512.png`

**Estado:** ✓ Correctos  
No requieren cambios.

---

## Pasos de Implementación

### Paso 1️⃣: Actualizar `sw.js`

```bash
# Reemplazar completamente el contenido
# Copiar el archivo sw.js corregido de outputs
```

**Verificar:**
- [ ] El archivo empieza con `const VERSION = '1.0.0';`
- [ ] Tiene secciones de INSTALL, ACTIVATE, FETCH
- [ ] Hay comentarios explicativos

---

### Paso 2️⃣: Actualizar `manifest.json`

```bash
# Reemplazar el contenido actual
# Copiar el archivo manifest.json corregido de outputs
```

**Verificar:**
- [ ] Campo `"display": "standalone"` existe
- [ ] `"icons"` tiene 4 entradas (2 para `"any"`, 2 para `"maskable"`)
- [ ] `"theme_color"` es `"#E8572A"`
- [ ] `"background_color"` es `"#0C0B0A"`
- [ ] JSON es válido (sin comas faltantes)

**Validar JSON:**
```javascript
// En consola del navegador
fetch('manifest.json').then(r => r.json()).then(console.log)
```

---

### Paso 3️⃣: Agregar script de inicialización PWA a `index.html`

**Opción A: Insertar código inline (recomendado)**

1. Abre `index.html` en tu editor
2. Ve al final del archivo, busca `</body>`
3. **Antes** de `</body>`, inserta el contenido de `pwa-init.js` dentro de:
   ```html
   <script>
     [contenido aquí]
   </script>
   ```

**Opción B: Archivo externo**

1. Guarda `pwa-init.js` en la misma carpeta que `index.html`
2. En `index.html`, antes de `</body>` agrega:
   ```html
   <script src="pwa-init.js" defer></script>
   </body>
   </html>
   ```

---

### Paso 4️⃣: Verificar meta tags adicionales en `index.html`

Busca la sección `<head>` y asegúrate que tenga (agregar si falta):

```html
<head>
    ...existentes...

    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#E8572A">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="AdoraChord">
    <meta name="description" content="Gestión de equipo de alabanza y canciones">
    
    <!-- Icons -->
    <link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="icon-512.png">
    <link rel="apple-touch-icon" href="icon-192.png">
    
    <!-- Manifest -->
    <link rel="manifest" href="manifest.json">
</head>
```

---

## Testing & Validación

### 🧪 Test 1: Service Worker Registration

**En Chrome DevTools:**

1. Abre DevTools (`F12` o `Ctrl+Shift+I`)
2. Ve a **Application** → **Service Workers**
3. Deberías ver: `sw.js` con estado **activated and running**

**Si no aparece:**
- Abre **Console** y busca errores rojo
- Verifica que `sw.js` está en la carpeta raíz
- Intenta: `navigator.serviceWorker.getRegistrations()`

---

### 🧪 Test 2: Manifest Validation

**En Chrome DevTools:**

1. Ve a **Application** → **Manifest**
2. Deberías ver todos los campos correctamente:
   - ✓ Name: "AdoraChord Pro"
   - ✓ Start URL: "/"
   - ✓ Display: "standalone"
   - ✓ Icons (lista con 4 elementos)

**Si hay errores:**
- Abre **Console** y busca mensajes de manifest
- Usa [manifest-validator.appspot.com](https://manifest-validator.appspot.com)

---

### 🧪 Test 3: Instalabilidad

**Chrome/Edge (Android):**
1. Abre la app en móvil Android
2. Toca los 3 puntos → **Instalar aplicación** o **Install app**
3. Confirma

**Safari (iOS):**
1. Abre la app en Safari iOS
2. Toca Compartir → **Agregar a pantalla de inicio**
3. Confirma

**Si no aparece opción de instalar:**
- [ ] Verificar que manifest.json es válido
- [ ] Verificar que `display: "standalone"` existe
- [ ] Verificar que icons tienen tamaños correctos (192x192, 512x512)
- [ ] Verificar que https está activo (o localhost para testing)

---

### 🧪 Test 4: Offline Functionality

**En Chrome DevTools:**

1. Ve a **Network**
2. Marca el checkbox **Offline**
3. Recarga la página
4. Deberías ver `index.html` cargado desde caché

**Si falla:**
- Verifica que `sw.js` tiene correcta estrategia de caché
- Revisa la sección "Cache Storage" en Application tab

---

### 🧪 Test 5: Cache Storage

**En Chrome DevTools:**

1. Ve a **Application** → **Cache Storage**
2. Deberías ver una entrada: `adorachord-1.0.0`
3. Al expandir, deberías ver:
   - `/`
   - `/index.html`
   - Posiblemente Google Fonts y Supabase (si estaban online)

---

### 🧪 Test 6: Console Logs

**Abre la consola** y verifica logs:

```
✓ Service Worker registrado
✓ Assets locales cacheados
✓ PWA initialization scripts cargados
```

**Si ves errores:**
- Nota el mensaje exacto
- Verifica que los archivos existen en el servidor
- Revisa secciones relevantes de `sw.js`

---

## Deployment

### 📦 Prepara tu deployment:

```
tu-proyecto/
├── index.html         ✓ (actualizado con script PWA)
├── manifest.json      ✓ (completado)
├── sw.js              ✓ (reescrito)
├── pwa-init.js        ✓ (opcional, si no está inline)
├── icon-192.png       ✓ (sin cambios)
├── icon-512.png       ✓ (sin cambios)
└── (otros archivos)
```

### 🌐 Deploy a tu servidor:

1. **Asegurar HTTPS:**
   - PWA requiere HTTPS (o localhost)
   - Usar certificado válido

2. **Headers HTTP recomendados:**
   ```
   Service-Worker-Allowed: /
   Cache-Control: no-cache, no-store, must-revalidate (para index.html)
   Cache-Control: max-age=31536000 (para assets versionados)
   ```

3. **Verificar en el navegador:**
   - [ ] Manifest es válido
   - [ ] SW está registered
   - [ ] App es instalable
   - [ ] Funciona offline

---

## Troubleshooting

| Problema | Causa | Solución |
|----------|-------|----------|
| SW no registra | `sw.js` no encontrado | Verificar ruta, debe estar en `/` |
| Manifest error | JSON inválido | Validar con JSON validator |
| No se puede instalar | Falta `display:standalone` | Actualizar manifest.json |
| Cache vacío | SW no se activó | Forzar actualización, limpiar cache |
| Fonts no cargan offline | No están en caché | Cargar online primero |

---

## 📞 Soporte

Si tienes problemas:

1. **Verificar Chrome DevTools:**
   - Application → Service Workers
   - Application → Cache Storage
   - Console (buscar errores)

2. **Limpiar caché:**
   ```javascript
   // En console
   caches.keys().then(keys => 
     Promise.all(keys.map(k => caches.delete(k)))
   )
   ```

3. **Reinstalar Service Worker:**
   - DevTools → Application → Service Workers → Unregister
   - Recarga
   - Espera 5 segundos

---

**✅ Checklist Final:**
- [ ] `sw.js` reemplazado
- [ ] `manifest.json` actualizado
- [ ] Script PWA agregado a `index.html`
- [ ] Meta tags verificados
- [ ] Testing local completado
- [ ] HTTPS activado en servidor
- [ ] App instalable en móvil
- [ ] Funciona offline
- [ ] Deployed a producción

---

**Última actualización:** 2026-03-25
