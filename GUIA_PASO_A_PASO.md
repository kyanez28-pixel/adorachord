# 🔧 GUÍA: Cómo Reparar el Error "Error al Guardar" en AdoraChord

## 🎯 El Problema

Cuando intentas subir un archivo de acordes (JPG/PNG), ves este error:

```
⚠ Error al guardar
```

Aunque el archivo se sube a Supabase Storage, no se guarda en la base de datos.

---

## ✅ Solución: 3 Pasos

### PASO 1: Verificar el Problema en Consola (5 min)

**1.1 Abre la Consola de Desarrollador:**
- Windows/Linux: `F12` o `Ctrl+Shift+I`
- Mac: `Cmd+Option+I`

**1.2 Ve a la pestaña "Console"**
<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200' style='background:%23222'%3E%3Ctext x='10' y='30' fill='%23fff' font-family='monospace'%3EConsole%3C/text%3E%3Crect x='10' y='50' width='380' height='120' fill='%23111' stroke='%23444' stroke-width='1'/%3E%3Ctext x='20' y='80' fill='%2366f' font-family='monospace' font-size='14'%3E%3E%3C/text%3E%3Ctext x='40' y='80' fill='%23fff' font-family='monospace' font-size='14'%3Etypeof syncStart%3C/text%3E%3Ctext x='20' y='110' fill='%23f66' font-family='monospace' font-size='14'%3E%22undefined%22%3C/text%3E%3C/svg%3E" alt="Console" style="max-width: 100%; border: 1px solid #444;"/><br>
*(Si ves "undefined", ese es el problema)*

**1.3 Escribe este comando:**
```javascript
typeof syncStart
```

**Resultado:**
- ✅ `"function"` = está bien
- ❌ `"undefined"` = problema encontrado

**1.4 Si ves undefined, escribe:**
```javascript
typeof syncDone
```

**Resultado:**
- ✅ `"function"` = está bien
- ❌ `"undefined"` = también problema

---

### PASO 2: Aplicar el Fix (10 min)

#### Opción A: Si `syncStart` y `syncDone` están undefined (95% de casos)

**2A.1 Abre tu archivo `index.html` en un editor**

**2A.2 Ve al FINAL del archivo, busca:**
```html
</body>
</html>
```

**2A.3 ANTES de `</body>`, agrega este bloque:**

```html
<!-- FIX: Manejo de Guardar Acordes -->
<script>
// ════════════════════════════════════════════════════════
// 1. ASEGURAR QUE syncStart/syncDone EXISTEN
// ════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════
// 2. GUARDAR Y PATCHAR dbSaveSong CORRECTAMENTE
// ════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════
// 3. MEJORAR handleUpload CON MEJOR MANEJO DE ERRORES
// ════════════════════════════════════════════════════════

const _origHandleUploadFixed = window.handleUpload || (async function(files) {
    console.warn('⚠ handleUpload original no encontrada');
});

window.handleUpload = async function(files) {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (!arr.length) { 
        if (typeof toast === 'function') {
            toast('⚠ Solo se aceptan imágenes');
        }
        return; 
    }
    
    console.log(`📤 Iniciando carga de ${arr.length} imagen(s)…`);
    
    if (typeof setBadge === 'function') {
        setBadge('syncing', `↻ Subiendo ${arr.length} imagen(s)…`);
    }
    
    let done = 0;
    let failed = 0;
    let lastSongId = null;
    
    try {
        for (const file of arr) {
            try {
                console.log(`📸 Procesando: ${file.name}`);
                
                const nameParts = file.name.replace(/\.[^.]+$/, '').split(/[-_\s]+/);
                const name = nameParts
                    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
                    .join(' ');
                
                const songId = uid();
                lastSongId = songId;

                // 1. SUBIR IMAGEN A STORAGE
                const ext = file.type.split('/')[1] || 'jpg';
                const path = `${songId}/acordes.${ext}`;
                
                console.log(`☁️ Subiendo a Storage: ${path}`);
                
                const { error: uploadError } = await sb.storage
                    .from('multitracks')
                    .upload(path, file, {
                        cacheControl: '3600',
                        upsert: true,
                        contentType: file.type
                    });
                
                if (uploadError) {
                    console.error(`❌ Error subiendo: ${file.name}`, uploadError);
                    if (typeof toast === 'function') {
                        toast(`✗ Error: ${file.name}`);
                    }
                    failed++;
                    continue;
                }

                // 2. OBTENER URL PÚBLICA
                const { data } = sb.storage
                    .from('multitracks')
                    .getPublicUrl(path);
                
                const acordesUrl = data?.publicUrl || '';
                
                if (!acordesUrl) {
                    console.error('❌ No se pudo obtener URL pública', data);
                    if (typeof toast === 'function') {
                        toast('✗ Error obteniendo URL');
                    }
                    failed++;
                    continue;
                }
                
                console.log(`✓ URL obtenida: ${acordesUrl.substring(0, 50)}…`);

                // 3. CREAR OBJETO CANCIÓN
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
                    url: acordesUrl,
                    audioData: null,
                    audioUrl: null,
                    coverUrl: null
                };
                
                songs.push(newSong);
                console.log(`✓ Canción creada: ${name}`);

                // 4. GUARDAR EN BASE DE DATOS
                try {
                    console.log(`💾 Guardando en DB: ${songId}`);
                    
                    await dbSaveSong(newSong);
                    
                    done++;
                    console.log(`✓ ¡Guardado! ${name}`);
                    
                } catch(dbErr) {
                    console.error('❌ Error guardando en DB:', dbErr);
                    
                    if (typeof toast === 'function') {
                        toast(`✗ Error en BD: ${name}`);
                    }
                    
                    const idx = songs.indexOf(newSong);
                    if (idx > -1) songs.splice(idx, 1);
                    
                    failed++;
                }
                
            } catch(fileErr) {
                console.error('❌ Error procesando archivo:', fileErr);
                failed++;
            }
        }
        
        // RESULTADO FINAL
        if (typeof setBadge === 'function') {
            setBadge('');
        }
        
        if (done > 0) {
            const msg = `✓ ${done} imagen${done!==1?'es':''} subida${done!==1?'s':''}`;
            console.log(msg);
            
            if (typeof toast === 'function') {
                toast(msg);
            }
            
            if (lastSongId && typeof window.selectedSongId !== 'undefined') {
                window.selectedSongId = lastSongId;
            }
            
            if (typeof refreshUI === 'function') {
                refreshUI();
            }
        }
        
        if (failed > 0) {
            const msg = `⚠ ${failed} archivo${failed!==1?'s':''} falló`;
            console.warn(msg);
            
            if (typeof toast === 'function') {
                toast(msg);
            }
        }
        
    } catch(err) {
        console.error('❌ ERROR CRÍTICO en handleUpload:', err);
        
        if (typeof setBadge === 'function') {
            setBadge('error', '✗ Error fatal');
            setTimeout(() => setBadge(''), 3000);
        }
        
        if (typeof toast === 'function') {
            toast('✗ Error crítico al subir');
        }
    }
};

console.log('✅ Fix aplicado: Manejo mejorado de carga de acordes');
</script>
</body>
</html>
```

**2A.4 Guarda el archivo**
- `Ctrl+S` (Windows/Linux)
- `Cmd+S` (Mac)

---

### PASO 3: Testear el Fix (5 min)

**3.1 Recarga la página web**
- `F5` o `Ctrl+R`
- Espera a que cargue completamente

**3.2 Abre la Consola (F12)**

**3.3 Verifica el fix:**
```javascript
typeof syncStart
// Debería devolver: "function" ✓
```

**3.4 Intenta subir un archivo:**
- Haz clic en "Subir acordes (JPG/PNG)"
- Selecciona una imagen pequeña (1-2 MB)
- Espera a que suba

**3.5 Mira la Consola:**
- Deberías ver:
  ```
  📤 Iniciando carga de 1 imagen(s)…
  📸 Procesando: archivo.jpg
  ☁️ Subiendo a Storage: xxxxx/acordes.jpg
  ✓ URL obtenida: https://...
  ✓ Canción creada: Archivo
  💾 Guardando en DB: xxxxx
  ✓ ¡Guardado! Archivo
  ✅ Fix aplicado: Manejo mejorado...
  ```

- ✅ Si ves `✓ ¡Guardado!` = **FUNCIONA** 🎉

---

## 🚨 Si Sigue Sin Funcionar

### Debug 1: Verificar Supabase

En consola escribe:
```javascript
// Verificar conexión a Supabase
typeof sb
// Debe devolver: "object"

// Ver el cliente
sb
// Debe mostrar objeto con métodos
```

### Debug 2: Verificar Permisos

En **Supabase Dashboard:**
1. Ve a `SQL Editor`
2. Ejecuta:
```sql
SELECT * FROM songs LIMIT 5;
```

Si falla → problema de permisos RLS (Row Level Security)

### Debug 3: Verificar Storage

En **Supabase Storage:**
1. Ve a bucket `multitracks`
2. ¿Ves carpetas como `xxxxx/acordes.jpg`?
3. Si sí → Storage funciona, problema está en DB

---

## 📞 Si Necesitas Ayuda

Proporciona esta información:

```javascript
// En consola, copia esto:
console.log({
    syncStart: typeof syncStart,
    syncDone: typeof syncDone,
    dbSaveSong: typeof dbSaveSong,
    handleUpload: typeof handleUpload,
    sb: typeof sb,
    songs: typeof songs,
    toast: typeof toast
});
```

Debería mostrar:
```javascript
{
  syncStart: "function",
  syncDone: "function",
  dbSaveSong: "function",
  handleUpload: "function",
  sb: "object",
  songs: "object",
  toast: "function"
}
```

Si algo es `"undefined"` → ese es el problema.

---

## ✅ Checklist Final

- [ ] Abrí la Consola (F12)
- [ ] Verifiqué `typeof syncStart` → "undefined"
- [ ] Apliqué el script FIX antes de `</body>`
- [ ] Guardé el archivo (Ctrl+S)
- [ ] Recargué la página (F5)
- [ ] Intenté subir un archivo
- [ ] Vi `✓ ¡Guardado!` en consola
- [ ] La imagen aparece en mi biblioteca

---

**Fecha:** 2026-03-25  
**Aplicación:** AdoraChord Pro  
**Estado:** Listo para aplicar
