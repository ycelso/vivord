# Instrucción afinada W3 + W4 — VivoRD (enriquecer, NO podar)

## Cambio de realidad (léelo antes de empezar)

W1 corregido demostró que el sitio **no tiene peso muerto que podar**: de 345 "fallos" del health-check, solo ~7 fichas estaban realmente caídas; el resto **funciona** (los `fetch failed`/`url_pagina_no_audio` eran falsos negativos del checker server-side). Conclusión:

- **NO se desindexan ni se borran más fichas.** El conjunto indexable correcto es ~447 URLs.
- El uplift a 70-80% ya **no viene de reducir**, viene de **enriquecer** ~440 fichas que funcionan pero son "player + descripción plantilla", y de añadir contenido propio de catálogo (hubs).
- W3 (hubs) + W4 (de-duplicar descripciones) hacen ahora **todo** el trabajo pesado.

**Reglas (igual que antes):**
- Prohibido fabricar datos. Solo `data/*.json` (campos reales: `city`, `name`, `description`, `stream`, frecuencia parseable del texto).
- Cada workstream termina **ejecutando su comando de verificación y pegando la salida real**. No se reporta "hecho" sin el número medido.
- No tocar el criterio de salud de W1 (`stream-health-index.mjs` ya correcto: solo `http_404` + `tv-not-playing` + sin-stream).

**Datos medidos del catálogo (para dimensionar, no re-descubrir):**
- 381 radios. **15 ciudades con >=5 emisoras**: Santo Domingo (125), Santiago (58), San Pedro de Macorís (16), Barahona (13), La Vega (13), Santo Domingo Oeste (12), Puerto Plata (12), Higüey (10), La Romana (9), Sabaneta (8), San Francisco de Macorís (7), Monte Cristi (6), Moca (5), Baní (5). (16 sin ciudad → omitir.)
- Géneros con masa (match nombre+desc): salsa/tropical (137), noticias (128), urbano/reggaetón (96), bachata (95), merengue (91), baladas/romántica (89), cristiana (57), deportes (46).
- Longitud de descripciones: solo **7 radios <90 palabras**, 40 <120. **El problema NO es longitud, es repetición de frases plantilla.**

---

## W3 — Páginas-hub por ciudad y por género (PRIORIDAD #1)

**Objetivo:** convertir el catálogo en páginas con valor editorial propio e interconectar las ~440 fichas. Cada hub es contenido nuevo, original e indexable que NO es un reproductor.

**Archivos:** nuevo `scripts/hubs-build.mjs`; salida en `radios/ciudad/<slug>.html` y `radios/genero/<slug>.html`; teaser en `radios.html`; enlazar hubs desde cada ficha (breadcrumb, ver W5 si se hace); registrar en `generate-sitemap.mjs` y `sync-www.mjs`.

**Cambios:**
1. **Hubs de ciudad**: uno por cada ciudad con **>=5 emisoras saludables** (las 13-15 de la lista; excluir "sin ciudad"). Esperado: ~13-15 hubs.
2. **Hubs de género**: uno por cada género de la lista con **>=5 emisoras** (8 géneros). Clasificación por regex sobre `name`+`description` (reusar la lógica ya usada en `station-meta`/guías; NO inventar género si no hay match).
3. **Contenido de cada hub** (original, NO plantilla calcada entre hubs):
   - Intro editorial de **>=180 palabras** específica de esa ciudad/género (contexto real: qué caracteriza el dial de esa ciudad / ese género en RD). Variar la redacción entre hubs; no usar una sola plantilla con el nombre cambiado.
   - Grid/listado de las emisoras de ese grupo (solo saludables), con enlace a cada ficha.
   - Bloque "Guías relacionadas" enlazando a las guías pertinentes (reusar `guide-links.mjs`).
   - `<h1>` único, `<title>`/meta description únicos, canonical propio.
4. **Indexación**: solo `index, follow` los hubs con **>=5 fichas**; si alguno queda corto, `noindex`.
5. **Validación**: añadir todos los hubs al lote de `assertAllValidInternalLinks` ANTES de escribir (mismo patrón que guías). El build debe fallar si un hub enlaza a algo inexistente.
6. **Descubrimiento**: teaser en `radios.html` (sección "Explora por ciudad / por género") y enlaces en el footer o en un índice `radios/index.html`.

**Criterios de aceptación:**
- **>=20 hubs** generados (ciudades + géneros), todos con intro >=180 palabras.
- Ningún hub lista fichas no saludables.
- Todos los hubs indexables están en `sitemap.xml`.
- `node scripts/validate-internal-links.mjs` → exit 0 (y el validador del build completo no rompe).
- Las introducciones NO comparten frases largas idénticas entre sí (ver auditoría n-gramas de W4, aplicada también a hubs).

**Verificación (ejecutar y pegar salida; Windows/PowerShell + node):**
```
node --input-type=module -e "import fs from 'node:fs'; const c=fs.readdirSync('radios/ciudad').filter(f=>f.endsWith('.html')); const g=fs.readdirSync('radios/genero').filter(f=>f.endsWith('.html')); console.log('hubs ciudad:',c.length,'genero:',g.length,'total:',c.length+g.length);"
node --input-type=module -e "import fs from 'node:fs'; let min=1e9,bad=0; for(const d of ['radios/ciudad','radios/genero']) for(const f of fs.readdirSync(d).filter(x=>x.endsWith('.html'))){const t=fs.readFileSync(d+'/'+f,'utf8'); const m=(t.match(/<div class=\"hub-intro\">([\s\S]*?)<\/div>/)||[])[1]||''; const w=m.replace(/<[^>]+>/g,' ').trim().split(/\s+/).filter(Boolean).length; if(w<180)bad++; min=Math.min(min,w);} console.log('hubs con intro <180:',bad,'min intro:',min);"
node -e "const s=require('fs').readFileSync('sitemap.xml','utf8');console.log('hubs en sitemap:',(s.match(/radios\/(ciudad|genero)\//g)||[]).length)"
```

---

## W4 — De-duplicar el cuerpo de las descripciones (PRIORIDAD #2)

**Objetivo correcto (ajustado):** el problema medido NO es longitud (solo 7 fichas <90 palabras), es **repetición de las mismas frases plantilla** en cientos de fichas. Hay que **reducir la duplicación inter-fichas**, no rellenar.

**Archivos:** `scripts/description-enrich.mjs`; nuevo `scripts/audit-descriptions.mjs`.

**Cambios:**
1. **Auditoría primero** (`audit-descriptions.mjs`): recorre las descripciones renderizadas de `radio/` + `canal/`, extrae n-gramas de 6-8 palabras y reporta los que aparecen en **>15% de las fichas**. Esa es la lista objetivo de muletillas a romper.
2. **Diccionario de paráfrasis**: para cada muletilla del top (p. ej. "ofreciendo una programación que mantiene a los oyentes conectados", "combina información actualizada con entretenimiento", "los éxitos del momento y clásicos que no pasan de moda"), crear **>=4 variantes equivalentes** y rotar por hash de slug. Mantener significado; no degradar gramática.
3. **Línea de datos verificables** (si no existe ya por fiche): una frase con ciudad + frecuencia + género detectado, **>=6 plantillas** rotadas por hash. Solo datos reales.
4. **Las 7 fichas <90 palabras**: ampliar SOLO esas con una segunda frase de datos reales (ciudad, dial, tipo) hasta >=90. No tocar las demás para "engordar".
5. NO romper HTML: respetar `<ul>`, `<strong>`, etc.

**Criterios de aceptación:**
- Tras el cambio, **ninguna frase de 6+ palabras aparece en >15% de las fichas** (re-correr `audit-descriptions.mjs`).
- 0 fichas saludables <90 palabras.
- 0 `<p></p>` vacíos y 0 `<p><ul` (no introducir HTML inválido).
- El build y el validador de enlaces siguen en exit 0.

**Verificación (ejecutar y pegar salida real ANTES y DESPUÉS):**
```
node scripts/audit-descriptions.mjs        # debe imprimir: top n-gramas con su % ; objetivo: ninguno >15% tras el fix
node --input-type=module -e "import fs from 'node:fs'; let lt90=0; for(const d of ['radio','canal']) for(const f of fs.readdirSync(d).filter(x=>x.endsWith('.html'))){const t=fs.readFileSync(d+'/'+f,'utf8'); const m=(t.match(/<div class=\"description-content\">([\s\S]*?)<\/div>/)||[])[1]||''; const w=m.replace(/<[^>]+>/g,' ').trim().split(/\s+/).filter(Boolean).length; if(w&&w<90)lt90++;} console.log('fichas <90 palabras:',lt90);"
```

---

## W5 (opcional, sigue vigente) — Higiene + datos estructurados

Solo si queda tiempo tras W3+W4:
1. Arreglar `<p><ul>...</ul></p>` (lista fuera del `<p>`).
2. JSON-LD por ficha (`RadioStation`/`TelevisionChannel`) + `BreadcrumbList` (Inicio > Radios > [Ciudad/Género] > Emisora), enlazando al hub de W3.
3. Breadcrumbs visibles → refuerzan el interlinking de los hubs.

**Verificación:** `grep -rc "<p><ul" radio/ canal/` → 0 (o equivalente node).

---

## Cierre y despliegue (proceso)

1. Build completo + `node scripts/validate-internal-links.mjs` → exit 0 en TODO el sitio.
2. Deploy (`npm run deploy:pack` + `wrangler pages deploy`).
3. Verificar en vivo: 1 hub de ciudad, 1 hub de género, 2-3 fichas con descripción ya diferenciada.
4. Esperar **48 h** y solo entonces solicitar revisión AdSense.

---

## Impacto esperado (recalibrado tras W1)

| Workstream | Palanca | Delta probabilidad |
|---|---|---|
| W3 hubs ciudad/género (~20 páginas nuevas de valor + interlinking) | Contenido propio real | **+10-15 pts** |
| W4 de-duplicar descripciones | Menos "contenido plantilla a escala" | **+6-10 pts** |
| W5 schema/breadcrumbs (opcional) | Calidad técnica | **+2-3 pts** |

Partiendo de ~50-55% (tras W1+W2 desplegados) → objetivo **70-80%**.

## Guardarraíles (NO hacer)

- **NO desindexar ni borrar más fichas.** Enriquecer, no podar.
- No inventar datos (ciudad, frecuencia, género). Solo lo verificable en `data/*.json`.
- No "engordar" descripciones con relleno: el objetivo de W4 es **menos repetición**, no más palabras.
- No usar UNA plantilla de intro para todos los hubs con el nombre cambiado: cada intro debe variar de verdad.
- No debilitar el validador de enlaces.
- No reportar un workstream sin pegar la salida real de su verificación.
- No pedir revisión AdSense antes de desplegar y esperar 48 h.

---

**Prioridad:** W3 es el mayor aporte ahora (contenido propio nuevo). W4 es el segundo (rompe la huella de plantilla del 90% del sitio). W5 es pulido. Hacer en ese orden.
