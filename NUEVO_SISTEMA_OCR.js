// ════════════════════════════════════════════════════════════════════════════
// NUEVO SISTEMA: OCR + Procesamiento Local
// Más confiable que IA generativa para extraer acordes de imágenes
// ════════════════════════════════════════════════════════════════════════════

/* 
INSTRUCCIONES DE INSTALACIÓN:
1. Copia este código DESPUÉS del script de importación de imagen (después de la línea ~14220)
2. Recarga tu aplicación
3. Verás un nuevo botón "📝 OCR" junto al botón "📸 IA"
*/

(function patchOCR() {
    'use strict';

    // ── Inyectar botón 📝 OCR en toolbar ───────────────────────────
    setTimeout(function() {
        var tb = document.querySelector('.cif-toolbar');
        if (!tb) return;
        var songId = window.selectedSongId;
        if (!songId) return;

        var btn = document.createElement('button');
        btn.className = 'cif-tbtn-ia';
        btn.title = 'Extraer texto de imagen con OCR (más confiable)';
        btn.textContent = '📝 OCR';
        btn.style.marginLeft = '4px';
        btn.onclick = function() { window.cifOpenOCRImport(); };
        
        var iaBtn = tb.querySelector('.cif-tbtn-ia');
        if (iaBtn && iaBtn.nextSibling) {
            tb.insertBefore(btn, iaBtn.nextSibling);
        } else {
            tb.appendChild(btn);
        }
    }, 200);

    // ── Modal OCR ───────────────────────────────────────────────
    window.cifOpenOCRImport = function() {
        document.getElementById('cif-ocr-overlay') && document.getElementById('cif-ocr-overlay').remove();

        var imgB64 = null, imgMime = 'image/jpeg', extractedText = '';

        var ov = document.createElement('div');
        ov.id = 'cif-ocr-overlay';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';

        var box = document.createElement('div');
        box.style.cssText = 'background:#1A1917;border:1px solid #252320;border-radius:16px;width:100%;max-width:900px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;';
        ov.appendChild(box);

        // Header
        var hdr = document.createElement('div');
        hdr.style.cssText = 'padding:20px;border-bottom:1px solid #252320;display:flex;align-items:center;justify-content:space-between;';
        hdr.innerHTML = '<div style="font-family:Syne,sans-serif;font-size:18px;font-weight:700;color:#F0EBE3;"><span style="font-size:24px">📝</span> Extraer texto con OCR</div>';
        
        var closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = 'background:none;border:none;color:#7A6E65;font-size:24px;cursor:pointer;padding:0;width:32px;height:32px;border-radius:6px;transition:all 0.15s;';
        closeBtn.onmouseover = function() { this.style.background = 'rgba(255,255,255,0.05)'; this.style.color = '#F0EBE3'; };
        closeBtn.onmouseout = function() { this.style.background = 'none'; this.style.color = '#7A6E65'; };
        closeBtn.onclick = function() { ov.remove(); };
        hdr.appendChild(closeBtn);
        box.appendChild(hdr);

        // Body
        var body = document.createElement('div');
        body.style.cssText = 'padding:20px;overflow-y:auto;flex:1;';
        box.appendChild(body);

        // Instrucciones
        var info = document.createElement('div');
        info.style.cssText = 'background:rgba(77,158,255,0.1);border:1px solid rgba(77,158,255,0.3);border-radius:10px;padding:14px;margin-bottom:16px;font-size:13px;color:#4D9EFF;line-height:1.6;';
        info.innerHTML = '<strong>💡 Cómo funciona:</strong><br>1. Sube una imagen con acordes y letra<br>2. El OCR extraerá todo el texto<br>3. Revisa y edita el texto si es necesario<br>4. Haz clic en "Importar" para estructurarlo automáticamente';
        body.appendChild(info);

        // API Key input
        var keyWrap = document.createElement('div');
        keyWrap.style.cssText = 'margin-bottom:16px;';
        keyWrap.innerHTML = '<label style="display:block;font-size:12px;font-weight:600;color:#7A6E65;margin-bottom:6px;">🔑 API Key de Google Cloud Vision (gratis)</label>';
        
        var keyInput = document.createElement('input');
        keyInput.type = 'password';
        keyInput.placeholder = 'Ingresa tu API Key (se guardará localmente)';
        keyInput.style.cssText = 'width:100%;background:#222120;border:1px solid #2E2B28;color:#F0EBE3;padding:10px 14px;border-radius:8px;font-size:13px;font-family:inherit;outline:none;';
        keyInput.value = localStorage.getItem('google_vision_api_key') || '';
        keyInput.onfocus = function() { this.style.borderColor = 'rgba(232,87,42,0.4)'; };
        keyInput.onblur = function() { this.style.borderColor = '#2E2B28'; };
        keyWrap.appendChild(keyInput);
        
        var keyHelp = document.createElement('div');
        keyHelp.style.cssText = 'font-size:11px;color:#7A6E65;margin-top:4px;';
        keyHelp.innerHTML = 'Obtén tu API Key gratis en: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color:#4D9EFF;">Google Cloud Console</a>';
        keyWrap.appendChild(keyHelp);
        body.appendChild(keyWrap);

        // File input
        var fileWrap = document.createElement('div');
        fileWrap.style.cssText = 'margin-bottom:16px;';
        
        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        var fileBtn = document.createElement('button');
        fileBtn.textContent = '📁 Seleccionar imagen';
        fileBtn.style.cssText = 'width:100%;background:#E8572A;color:#fff;border:none;padding:12px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:Syne,sans-serif;';
        fileBtn.onmouseover = function() { this.style.background = '#FF7A4D'; };
        fileBtn.onmouseout = function() { this.style.background = '#E8572A'; };
        fileBtn.onclick = function() { fileInput.click(); };
        
        fileWrap.appendChild(fileInput);
        fileWrap.appendChild(fileBtn);
        body.appendChild(fileWrap);

        // Preview
        var preview = document.createElement('div');
        preview.style.cssText = 'margin-bottom:16px;display:none;';
        var previewImg = document.createElement('img');
        previewImg.style.cssText = 'width:100%;max-height:300px;object-fit:contain;border-radius:8px;background:#0a0a0a;';
        preview.appendChild(previewImg);
        body.appendChild(preview);

        // Result area
        var resultWrap = document.createElement('div');
        resultWrap.style.cssText = 'display:none;margin-top:16px;';
        
        var resultLabel = document.createElement('label');
        resultLabel.style.cssText = 'display:block;font-size:12px;font-weight:600;color:#7A6E65;margin-bottom:6px;';
        resultLabel.textContent = '📄 Texto extraído (puedes editarlo):';
        resultWrap.appendChild(resultLabel);
        
        var resultText = document.createElement('textarea');
        resultText.style.cssText = 'width:100%;height:300px;background:#222120;border:1px solid #2E2B28;color:#F0EBE3;padding:12px;border-radius:8px;font-size:12px;font-family:Courier New,monospace;resize:vertical;outline:none;line-height:1.6;';
        resultText.placeholder = 'El texto extraído aparecerá aquí...';
        resultText.onfocus = function() { this.style.borderColor = 'rgba(232,87,42,0.4)'; };
        resultText.onblur = function() { this.style.borderColor = '#2E2B28'; };
        resultWrap.appendChild(resultText);
        body.appendChild(resultWrap);

        // Buttons
        var btnWrap = document.createElement('div');
        btnWrap.style.cssText = 'display:flex;gap:10px;margin-top:16px;';
        
        var extractBtn = document.createElement('button');
        extractBtn.textContent = '🔍 Extraer texto';
        extractBtn.disabled = true;
        extractBtn.style.cssText = 'flex:1;background:#4D9EFF;color:#fff;border:none;padding:12px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:Syne,sans-serif;opacity:0.5;';
        
        var importBtn = document.createElement('button');
        importBtn.textContent = '✓ Importar al editor';
        importBtn.disabled = true;
        importBtn.style.cssText = 'flex:1;background:#3ECF8E;color:#fff;border:none;padding:12px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:Syne,sans-serif;opacity:0.5;';
        
        btnWrap.appendChild(extractBtn);
        btnWrap.appendChild(importBtn);
        body.appendChild(btnWrap);

        // File change handler
        fileInput.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;
            
            var reader = new FileReader();
            reader.onload = function(ev) {
                imgB64 = ev.target.result.split(',')[1];
                imgMime = file.type;
                previewImg.src = ev.target.result;
                preview.style.display = 'block';
                extractBtn.disabled = false;
                extractBtn.style.opacity = '1';
                extractBtn.onmouseover = function() { this.style.background = '#6BB0FF'; };
                extractBtn.onmouseout = function() { this.style.background = '#4D9EFF'; };
                fileBtn.textContent = '✓ Imagen cargada - Cambiar';
            };
            reader.readAsDataURL(file);
        };

        // Extract button handler
        extractBtn.onclick = async function() {
            var apiKey = keyInput.value.trim();
            if (!apiKey) {
                alert('Por favor ingresa tu API Key de Google Cloud Vision');
                keyInput.focus();
                return;
            }
            
            localStorage.setItem('google_vision_api_key', apiKey);
            
            extractBtn.disabled = true;
            extractBtn.textContent = '⏳ Extrayendo texto...';
            
            try {
                var text = await extractTextWithOCR(imgB64, apiKey);
                extractedText = text;
                resultText.value = text;
                resultWrap.style.display = 'block';
                importBtn.disabled = false;
                importBtn.style.opacity = '1';
                importBtn.onmouseover = function() { this.style.background = '#5EDDA5'; };
                importBtn.onmouseout = function() { this.style.background = '#3ECF8E'; };
                extractBtn.textContent = '✓ Texto extraído';
                extractBtn.style.background = '#3ECF8E';
                
                // Scroll to result
                resultWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } catch(err) {
                alert('Error al extraer texto: ' + err.message);
                extractBtn.disabled = false;
                extractBtn.textContent = '🔍 Extraer texto';
            }
        };

        // Import button handler
        importBtn.onclick = function() {
            var text = resultText.value.trim();
            if (!text) {
                alert('No hay texto para importar');
                return;
            }
            
            try {
                var structured = parseChordText(text);
                importToEditor(structured);
                ov.remove();
                alert('✓ Acordes importados correctamente');
            } catch(err) {
                alert('Error al procesar el texto: ' + err.message);
            }
        };

        document.body.appendChild(ov);
    };

    // ── Función OCR con Google Cloud Vision ───────────────────────
    async function extractTextWithOCR(base64Image, apiKey) {
        var url = 'https://vision.googleapis.com/v1/images:annotate?key=' + apiKey;
        
        var response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [{
                    image: { content: base64Image },
                    features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
                }]
            })
        });
        
        if (!response.ok) {
            var error = await response.json().catch(function() { return {}; });
            throw new Error(error.error?.message || 'Error HTTP ' + response.status);
        }
        
        var data = await response.json();
        var text = data.responses?.[0]?.textAnnotations?.[0]?.description;
        
        if (!text) {
            throw new Error('No se pudo extraer texto de la imagen. Verifica que la imagen sea clara y contenga texto.');
        }
        
        return text;
    }

    // ── Parsear texto a estructura de acordes ───────────────────────
    function parseChordText(text) {
        var lines = text.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
        var result = { key: '', bpm: 0, sections: [] };
        var currentSection = null;
        
        // Detectar tonalidad y BPM en las primeras líneas
        for (var i = 0; i < Math.min(5, lines.length); i++) {
            var line = lines[i];
            
            // Buscar tonalidad (ej: "Tono: C", "Key: Am", "C mayor")
            var keyMatch = line.match(/(?:tono|key|tonalidad)[:\s]*([A-G][#b]?m?)/i);
            if (keyMatch) result.key = keyMatch[1];
            
            // Buscar BPM (ej: "BPM: 120", "Tempo: 90")
            var bpmMatch = line.match(/(?:bpm|tempo)[:\s]*(\d+)/i);
            if (bpmMatch) result.bpm = parseInt(bpmMatch[1]);
        }
        
        // Procesar líneas
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            
            // Detectar sección (ej: "INTRO", "[Verso 1]", "Coro:")
            var sectionMatch = line.match(/^[\[\(]?(intro|verso|estrofa|coro|puente|bridge|outro|instrumental|solo)[\s\d]*[\]\)]?:?$/i);
            if (sectionMatch) {
                if (currentSection) result.sections.push(currentSection);
                var type = sectionMatch[1].toLowerCase();
                if (type === 'estrofa') type = 'verso';
                if (type === 'bridge') type = 'puente';
                currentSection = {
                    type: type,
                    label: line.replace(/[\[\]\(\):]/g, '').trim(),
                    chordsOnly: false,
                    chords: [],
                    lines: []
                };
                continue;
            }
            
            // Si no hay sección, crear una por defecto
            if (!currentSection) {
                currentSection = {
                    type: 'verso',
                    label: 'Verso 1',
                    chordsOnly: false,
                    chords: [],
                    lines: []
                };
            }
            
            // Detectar si es línea de acordes (solo acordes, sin letra)
            var isChordLine = /^[A-G][#b]?m?(sus|maj|min|dim|aug|add|[0-9])*(\s+[A-G][#b]?m?(sus|maj|min|dim|aug|add|[0-9])*)*\s*$/.test(line);
            
            if (isChordLine) {
                // Línea solo con acordes
                var chords = line.split(/\s+/).filter(Boolean);
                currentSection.chords = currentSection.chords.concat(chords);
                
                // Si la siguiente línea no es acordes, es letra con acordes arriba
                if (i + 1 < lines.length && !/^[A-G][#b]?m?/.test(lines[i + 1])) {
                    var lyricLine = lines[i + 1];
                    i++; // Saltar la siguiente línea
                    
                    // Intentar mapear acordes a palabras
                    var words = lyricLine.split(/\s+/);
                    var chordPositions = [];
                    for (var j = 0; j < Math.min(chords.length, words.length); j++) {
                        chordPositions.push({ word: j, chord: chords[j] });
                    }
                    
                    currentSection.lines.push({
                        lyric: lyricLine,
                        chords: chordPositions
                    });
                }
            } else {
                // Línea de letra sin acordes
                currentSection.lines.push({
                    lyric: line,
                    chords: []
                });
            }
        }
        
        // Agregar última sección
        if (currentSection) result.sections.push(currentSection);
        
        // Si no hay secciones, crear una por defecto
        if (result.sections.length === 0) {
            result.sections.push({
                type: 'verso',
                label: 'Verso 1',
                chordsOnly: false,
                chords: [],
                lines: lines.map(function(l) { return { lyric: l, chords: [] }; })
            });
        }
        
        return result;
    }

    // ── Importar al editor (reutiliza la función existente) ───────────
    function importToEditor(data) {
        if (typeof window.cifImportToEditor === 'function') {
            window.cifImportToEditor(data);
        } else {
            // Fallback si la función no existe
            console.log('Datos estructurados:', data);
            alert('Función de importación no disponible. Datos en console.');
        }
    }

})();

console.log('✅ Patch OCR: Sistema de extracción de texto con Google Cloud Vision');
