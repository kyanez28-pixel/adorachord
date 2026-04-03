# 📝 CÓMO USAR EL OCR CORRECTAMENTE

## PROBLEMA IDENTIFICADO

El OCR de Google Cloud Vision extrae el texto línea por línea, pero **NO puede capturar la posición horizontal exacta** de los acordes sobre las palabras.

En tu imagen, los acordes están espaciados así:
```
C        F        C
Cuan gloriosa será la mañana
```

Pero el OCR lo lee así:
```
C
F
C
Cuan gloriosa será la mañana
```

## SOLUCIÓN: EDITAR EL TEXTO ANTES DE IMPORTAR

Después de hacer clic en "Extraer texto", **EDITA** el texto en el cuadro para poner los acordes en el formato correcto:

### Formato correcto (acordes en línea, letra debajo):
```
C           F           C
Cuan gloriosa será la mañana

F    G         C
Cuando venga Jesús el salvador

F    G              C
Las naciones unidas como hermanas

G              C
Bienvenida daremos al Señor
```

### Pasos:

1. **Extraer texto** con el botón 🔍
2. **Editar el texto** en el cuadro:
   - Pon los acordes que van juntos en UNA SOLA LÍNEA
   - Deja la letra en la línea siguiente
   - Usa espacios para alinear los acordes sobre las palabras
3. **Importar** con el botón ✓

## EJEMPLO COMPLETO

### ❌ Texto extraído por OCR (incorrecto):
```
Cuan gloriosa será la Mañana
C
F
C
Cuan gloriosa será la mañana
F G
C
Cuando venga Jesús el salvador
```

### ✅ Texto editado (correcto):
```
Verso 1

C           F           C
Cuan gloriosa será la mañana

F    G         C
Cuando venga Jesús el salvador

F    G              C
Las naciones unidas como hermanas

G              C
Bienvenida daremos al Señor

Coro

C           F           C
El cristiano fiel y verdadero

F              G           C
Y también el obrero de valor

F              G           C
Y la iglesia, esposa del Cordero

G                    C
Estarán en los brazos de Señor
```

## TIPS IMPORTANTES

1. **Agrupa los acordes**: Si varios acordes van en la misma línea de letra, ponlos juntos en una línea
2. **Usa espacios**: Alinea los acordes sobre las palabras usando espacios
3. **Marca las secciones**: Agrega "Verso 1", "Coro", etc. para mejor estructura
4. **Líneas vacías**: Usa líneas vacías para separar estrofas

## ALTERNATIVA: USAR EL BOTÓN IA

Si no quieres editar manualmente, puedes usar el botón **📸 IA** en lugar del OCR:
- La IA de Gemini puede entender mejor la estructura visual
- Pero puede tener errores de JSON (ya corregidos)
- Es más lenta que el OCR

## CONCLUSIÓN

El OCR es **MUY RÁPIDO** para extraer texto, pero requiere **EDICIÓN MANUAL** para estructurar correctamente los acordes sobre la letra.

**Tiempo estimado**: 2-3 minutos de edición manual por canción.
