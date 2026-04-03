# 🚀 EMPIEZA AQUI: Solución para "Error al Guardar" en AdoraChord

## 📋 TU PROBLEMA

Cuando intentas subir acordes (JPG/PNG), ves:
```
⚠ Error al guardar
```

---

## ✅ SOLUCIÓN RÁPIDA (5 minutos)

### Paso 1: Abre tu `index.html` en un editor de texto

- Usa: VS Code, Notepad++, o cualquier editor
- NO usar: Word o Google Docs

### Paso 2: Ve al FINAL del archivo

Busca esta línea (aproximadamente al final):
```html
</body>
</html>
```

### Paso 3: Agrega el código FIX

**Antes de `</body>`**, inserta:

```html
<!-- FIX: Manejo de Guardar Acordes -->
<script>
if (typeof syncStart === 'undefined') {
    window.syncStart = function() {
        if (typeof setBadge === 'function') {
            setBadge('syncing', '↻ Sincronizando…');
        }
    };
}

if (typeof syncDone === 'undefined') {
    window.syncDone = function(error) {
        if (error) {
            console.error('⚠ Error en sincronización:', error);
            if (typeof setBadge === 'function') {
                setBadge('error', '✗ Error al guardar');
                setTimeout(() => setBadge(''), 3000);
            }
        } else {
            if (typeof setBadge === 'function') {
                setBadge('');
            }
        }
    };
}

if (typeof _origDbSaveSongFixed === 'undefined') {
    window._origDbSaveSongFixed = window.dbSaveSong || (async function(song) {
        syncStart();
        
        const safeUrl      = (song.url      && song.url.startsWith('http'))      ? song.url      : null;
        const safeCoverUrl = (song.coverUrl && song.coverUrl.startsWith('http')) ? song.coverUrl : null;
        const safeAudioUrl = (song.audioUrl && song.audioUrl.startsWith('http')) ? song.audioUrl : null;

        const { error } = await sb.from('songs').upsert({
            id: song.id, 
            name: song.name, 
            author: song.author||'',
            key: song.key||'', 
            bpm: song.bpm||0, 
            type: song.type||'otro',
            duration: song.duration||0, 
            youtube: song.youtube||'',
            letter: song.letter||'',
            url: safeUrl,
            multitrack: song.multitrack||false,
            cover_url: safeCoverUrl,
            audio_url: safeAudioUrl,
            audio_data: null,
            compass: song.compass||'',
            duration_str: song.durationStr||''
        });
        
        syncDone(error);
        
        if (error) {
            throw error;
        }
    });
}

window.dbSaveSong = async function(song) {
    if (window._pendingAcordesUrlForSave !== undefined && window._pendingAcordesUrlForSave !== null) {
        song.url = window._pendingAcordesUrlForSave;
    }
    window._pendingAcordesUrlForSave = undefined;
    return _origDbSaveSongFixed(song);
};

console.log('✅ Fix aplicado: Manejo mejorado de carga de acordes');
</script>
```

### Paso 4: Guarda el archivo

- `Ctrl+S` (Windows/Linux)
- `Cmd+S` (Mac)

### Paso 5: Actualiza tu navegador

- Abre tu app en el navegador
- `F5` para recargar
- Espera a que cargue completamente

### Paso 6: Prueba a subir un archivo

- Haz clic en "Subir acordes (JPG/PNG)"
- Selecciona una imagen pequeña
- Espera

**¿Ves `✓ Guardado`?** → ✅ ¡FUNCIONA!

---

## 🔍 VERIFICAR SI FUNCIONÓ

### En tu navegador, abre la Consola:

1. Presiona `F12`
2. Ve a pestaña "Console"
3. Escribe: `typeof syncStart`
4. Debería mostrar: `"function"`

Si dice `"undefined"` → el fix no se aplicó correctamente

---

## 🆘 SI SIGUE SIN FUNCIONAR

Proporciona la información de la **GUIA_PASO_A_PASO.md** (está en outputs):

1. ¿Qué error ves exactamente en consola?
2. ¿La imagen se sube a Supabase Storage?
3. ¿Qué dice `typeof syncStart` en consola?

---

## 📚 DOCUMENTACIÓN COMPLETA

Si quieres entender el problema a fondo:

- **ANALISIS_ERROR_GUARDAR.md** — Explicación técnica del problema
- **FIX_GUARDAR_ACORDES.js** — Código completo del fix
- **GUIA_PASO_A_PASO.md** — Instrucciones detalladas con screenshots
- **GUIA_IMPLEMENTACION.md** — Para actualizar la PWA completa
- **INFORME_ERRORES.md** — Análisis de todos los errores encontrados

---

## 🎯 SOLUCIÓN COMPLETA (Opcional: PWA)

Si además quieres que tu app funcione como PWA instalable:

1. Reemplaza `sw.js` con `sw-CORRECTED.js`
2. Reemplaza `manifest.json` con `manifest-CORRECTED.json`
3. Agrega `pwa-init.js` en tu `index.html`

Ver: **GUIA_IMPLEMENTACION.md**

---

**Fecha:** 2026-03-25  
**Soporte:** Revisa GUIA_PASO_A_PASO.md si necesitas ayuda
