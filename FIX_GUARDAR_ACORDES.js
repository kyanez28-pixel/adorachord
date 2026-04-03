// ════════════════════════════════════════════════════════════════════════
// FIX: GUARDAR ACORDES - Copiar este código en index.html
// ════════════════════════════════════════════════════════════════════════
// 
// UBICACIÓN: Antes de </body> en index.html
// O: Dentro del <script> actual donde está el último patch
//
// ════════════════════════════════════════════════════════════════════════

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. ASEGURAR QUE syncStart/syncDone EXISTEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. GUARDAR Y PATCHAR dbSaveSong CORRECTAMENTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Guardar función original si aún no está guardada
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

// Patchar dbSaveSong correctamente
window.dbSaveSong = async function(song) {
    // Incluir URL de acordes si está pendiente
    if (window._pendingAcordesUrlForSave !== undefined && window._pendingAcordesUrlForSave !== null) {
        song.url = window._pendingAcordesUrlForSave;
    }
    window._pendingAcordesUrlForSave = undefined;
    
    // Llamar función original
    return _origDbSaveSongFixed(song);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. MEJORAR handleUpload CON MEJOR MANEJO DE ERRORES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
                
                // Generar nombre de canción
                const nameParts = file.name.replace(/\.[^.]+$/, '').split(/[-_\s]+/);
                const name = nameParts
                    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
                    .join(' ');
                
                const songId = uid();
                lastSongId = songId;

                // 1️⃣ SUBIR IMAGEN A STORAGE
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

                // 2️⃣ OBTENER URL PÚBLICA
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

                // 3️⃣ CREAR OBJETO CANCIÓN
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
                    url: acordesUrl,  // ✓ URL de acordes aquí
                    audioData: null,
                    audioUrl: null,
                    coverUrl: null
                };
                
                songs.push(newSong);
                console.log(`✓ Canción creada: ${name}`);

                // 4️⃣ GUARDAR EN BASE DE DATOS
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
                    
                    // Deshacer
                    const idx = songs.indexOf(newSong);
                    if (idx > -1) songs.splice(idx, 1);
                    
                    failed++;
                }
                
            } catch(fileErr) {
                console.error('❌ Error procesando archivo:', fileErr);
                failed++;
            }
        }
        
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // RESULTADO FINAL
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
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

// ════════════════════════════════════════════════════════════════════════
// FIN DEL FIX
// ════════════════════════════════════════════════════════════════════════
