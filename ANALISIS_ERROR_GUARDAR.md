# 🔴 ERROR AL GUARDAR ARCHIVOS - AdoraChord

## Problema Identificado

**Error:** Cuando intentas subir un archivo de acordes (JPG/PNG), aparece "Error al guardar"

**Ubicación del error:** Función `dbSaveSong()` línea 5039

---

## 🔍 Análisis Técnico

### El Problema:

En `handleUpload()` (línea 5432) se hace esto:

```javascript
// Subir imagen a Storage
const { error } = await sb.storage.from('multitracks').upload(path, file, {...});

// Obtener URL pública
const { data } = sb.storage.from('multitracks').getPublicUrl(path);
acordesUrl = data?.publicUrl || '';

// Guardar en DB
dbSaveSong(newSong);
```

**El problema crítico:** 

1. ✓ La imagen se sube a Supabase Storage correctamente
2. ✓ Se obtiene la URL pública correctamente
3. ❌ **PERO** la función `dbSaveSong()` usa `sbSyncStart()` y `sbSyncDone()` para manejar errores

```javascript
async function dbSaveSong(song) {
    syncStart();  // ← Inicia indicador de sincronización
    
    const { error } = await sb.from('songs').upsert({...});
    
    syncDone(error);  // ← Si hay error, muestra "⚠ Error al guardar"
}
```

### Causas Posibles:

1. **Problema más probable:** La función `syncStart()` o `syncDone()` no está definida
   - Si `syncStart` no existe → error silencioso
   - Si `syncDone` no maneja bien los errores → muestra el badge de error

2. **Segunda causa:** Error en Supabase al hacer INSERT/UPSERT
   - Validación en la tabla `songs`
   - Restricción de permisos RLS (Row Level Security)
   - Campo `url` no puede ser NULL cuando se espera

3. **Tercera causa:** Desfase entre versiones
   - El código patched intenta usar `_origDbSave` que no existe
   - Ver línea 12321: `return _origDbSave && _origDbSave(song);`

---

## ✅ SOLUCIÓN

### Opción 1: Verificar que `syncStart/syncDone` existen (PRIMERO)

Busca en tu HTML estas funciones:

```javascript
function syncStart() { ... }
function syncDone(error) { ... }
```

Si NO existen, agrégalas:

```javascript
let syncBadgeActive = false;

function syncStart() {
    syncBadgeActive = true;
    setBadge('syncing', '↻ Sincronizando…');
}

function syncDone(error) {
    syncBadgeActive = false;
    if (error) {
        console.error('Sync error:', error);
        setBadge('error', '⚠ Error al guardar');
        setTimeout(() => setBadge(''), 3000);
    } else {
        setBadge('');
    }
}
```

---

### Opción 2: Corregir la función patched (línea 12315)

**Actual (INCORRECTO):**
```javascript
window.dbSaveSong = async function(song) {
    if (window._pendingAcordesUrlForSave !== undefined && window._pendingAcordesUrlForSave !== null) {
        song.url = window._pendingAcordesUrlForSave;
    }
    window._pendingAcordesUrlForSave = undefined;
    return _origDbSave && _origDbSave(song);  // ← _origDbSave no está guardada
};
```

**Corrección:**
```javascript
// Guardar función original ANTES de patcharla
const _origDbSaveSong = window.dbSaveSong || (async function(song) {
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
});

// Ahora patchar correctamente
window.dbSaveSong = async function(song) {
    // Incluir URL de acordes si está pendiente
    if (window._pendingAcordesUrlForSave !== undefined && window._pendingAcordesUrlForSave !== null) {
        song.url = window._pendingAcordesUrlForSave;
    }
    window._pendingAcordesUrlForSave = undefined;
    
    // Llamar función original
    return _origDbSaveSong(song);
};
```

---

### Opción 3: Simplificar `handleUpload()` (RECOMENDADO)

El problema puede ser que hay demasiados pasos. Simplifica así:

```javascript
window.handleUpload = async function(files) {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!arr.length) { 
        toast('⚠ Solo se aceptan imágenes'); 
        return; 
    }
    
    setBadge('syncing', '↻ Subiendo imágenes…');
    let done = 0;
    let lastSongId = null;
    
    try {
        for (const file of arr) {
            const nameParts = file.name.replace(/\.[^.]+$/, '').split(/[-_\s]+/);
            const name = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
            const songId = uid();
            lastSongId = songId;

            // 1. Subir imagen
            const ext = file.type.split('/')[1] || 'jpg';
            const path = `${songId}/acordes.${ext}`;
            
            const { error: uploadError } = await sb.storage
                .from('multitracks')
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: file.type
                });
            
            if (uploadError) {
                console.error('❌ Error subiendo archivo:', uploadError);
                toast(`✗ Error subiendo ${file.name}`);
                continue;  // Siguiente archivo
            }

            // 2. Obtener URL pública
            const { data } = sb.storage
                .from('multitracks')
                .getPublicUrl(path);
            
            const acordesUrl = data?.publicUrl || '';
            
            if (!acordesUrl) {
                console.error('❌ No se pudo obtener URL pública');
                toast('✗ Error obteniendo URL pública');
                continue;
            }

            // 3. Crear canción
            const newSong = {
                id: songId,
                name: name,
                author: '',
                key: '',
                bpm: 0,
                type: 'otro',
                duration: 0,
                youtube: '',
                letter: name[0].toUpperCase(),
                url: acordesUrl,  // ✓ URL aquí
                audioData: null,
                audioUrl: null,
                coverUrl: null
            };
            
            songs.push(newSong);

            // 4. Guardar en DB
            try {
                await dbSaveSong(newSong);
                done++;
                console.log(`✓ Canción guardada: ${name}`);
            } catch(dbErr) {
                console.error('❌ Error guardando en DB:', dbErr);
                toast(`✗ Error guardando ${name} en base de datos`);
                songs.pop();  // Deshacer push
            }
        }
        
        // Resultado final
        setBadge('');
        if (done > 0) {
            toast(`✓ ${done} imagen${done!==1?'es':''} subida${done!==1?'s':''}`);
            if (lastSongId) selectedSongId = lastSongId;
            refreshUI();
        }
        
    } catch(err) {
        console.error('❌ Error crítico en handleUpload:', err);
        toast('✗ Error fatal al subir imágenes');
        setBadge('error', '✗ Error al subir');
    }
};
```

---

## 🧪 Cómo Debuggear

### Paso 1: Abre la Consola
`F12` → **Console**

### Paso 2: Intenta subir un archivo
- Haz clic en "Subir acordes"
- Selecciona una imagen JPG o PNG

### Paso 3: Mira los logs
- ¿Ves `✓ Subiendo imágenes…`?
- ¿Ves error en rojo?
- Copia el error exacto

### Paso 4: Verifica sincronización
En consola escribe:
```javascript
// Ver si syncStart está disponible
typeof syncStart
// Debería devolver: "function"

// Si devuelve "undefined" → ese es el problema
```

---

## 📋 Checklist de Solución

- [ ] **Verificar `syncStart/syncDone` existen**
  - Buscar en HTML: `function syncStart`
  - Si no existen, agregar

- [ ] **Corregir patching de `dbSaveSong`**
  - Guardar función original ANTES
  - Asegurar que se llama correctamente

- [ ] **Simplificar `handleUpload`** (si el anterior falla)
  - Usar versión mejorada arriba
  - Agregar try/catch completo

- [ ] **Testear en consola**
  ```javascript
  // Verificar que existe
  typeof handleUpload  // "function"
  
  // Ver si hay archivos pendientes
  window._pendingAcordesUrlForSave
  
  // Limpiar variable si está corrupta
  window._pendingAcordesUrlForSave = undefined
  ```

- [ ] **Reintenta subir archivo**
  - Si funciona ✓ → problema resuelto
  - Si falla → copiar error y revisar paso siguiente

---

## 🎯 Próximos Pasos

1. **Primero:** Copia los logs exactos de error de consola
2. **Segundo:** Verifica si `syncStart` existe
3. **Tercero:** Aplica la solución correspondiente
4. **Cuarto:** Testea nuevamente

**Si necesitas más ayuda, proporciona:**
- ✓ Error exacto de consola (F12 → Console)
- ✓ Network tab (F12 → Network) - ver request a `songs` table
- ✓ Tu versión de Supabase JS (busca en index.html: `@supabase/supabase-js@`)

---

**Fecha:** 2026-03-25  
**Aplicación:** AdoraChord Pro
