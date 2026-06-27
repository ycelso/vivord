# Instrucción técnica para subagente — VivoRD: de ~45% a 70-80% de aprobación AdSense

## Marco (léelo antes de tocar código)

La aguja **no** sube con más prosa en las fichas. Sube con **una sola idea**: *elevar la calidad media del conjunto indexado y la confianza del dominio*. Hoy Google rastrea ~450 páginas donde el tipo dominante es "reproductor de terceros + texto plantilla", y **>50% de los reproductores ni siquiera funcionan** (`data/stream-health.json`: 345/555 fallidos). Eso es lo que dispara "contenido de bajo valor".

**Regla de oro:** prohibido fabricar datos (frecuencias, años, nombres de programas inventados). Solo usar datos verificables ya presentes en `data/*.json`. Si un dato no existe, se omite, no se inventa.

**Regla de honestidad:** cada workstream termina **ejecutando su comando de verificación y pegando la salida real**. No se reporta "hecho" sin el número medido. (Las rondas previas fallaron por reportar trabajo parcial como completo.)

**Contexto del mecanismo existente (no reinventar):**
- `radio-build.mjs` ya tiene pipeline `organizeRadios` → `priority/rest/excluded/classified/published`, con `shouldExclude`/`excludeReason`; borra páginas excluidas (`removeExcludedRadioPages`) y las saca del catálogo. PERO decide por **clasificación** (emisora/programa/evento/internacional), no por salud del stream.
- `generate-sitemap.mjs` arma el sitemap desde `data/channels.json` y `data/radios.json` (catálogo publicado) + guías + páginas legales.
- El `<meta name="robots" content="index, follow">` está **hardcodeado** en todas las fichas.
- Validador de enlaces: `scripts/validate-internal-links.mjs` (`assertAllValidInternalLinks`), ya cableado en `build.mjs`, `radio-build.mjs` y `guias-build.mjs` ANTES de escribir.

---

## W1 — Des-indexar fichas con reproductor muerto (MAYOR IMPACTO)

**Objetivo:** que el conjunto indexado solo contenga fichas con valor funcional. Las fichas de stream caído pasan a `noindex` y salen del sitemap, pero **siguen accesibles** para el usuario (no se borran).

**Archivos:** `scripts/build.mjs`, `scripts/radio-build.mjs`, `scripts/generate-sitemap.mjs`, nuevo `scripts/stream-health-index.mjs`; lee `data/stream-health.json`, `data/embed-health.json`, `data/tv-not-playing.json`.

**Cambios:**
1. Crear `scripts/stream-health-index.mjs` que exporte `isHealthy(slug, kind)` y `buildHealthSet()` consolidando los slugs en `failed` de los tres archivos de salud.
2. En `buildChannelPage`/`buildRadioPage`: si la ficha NO es saludable, inyectar `<meta name="robots" content="noindex, follow">` (sustituyendo el `index, follow` hardcodeado). Las saludables mantienen `index, follow`.
3. En `generate-sitemap.mjs`: excluir del sitemap todo slug no saludable. El sitemap solo lista fichas indexables.
4. Añadir aviso visible no intrusivo en fichas no saludables: *"Señal no disponible temporalmente"*.

**Criterio de aceptación:**
- Nº de fichas con `noindex` == nº de slugs fallidos presentes en el sitio.
- `sitemap.xml` no contiene ningún slug no saludable.
- Las páginas `index, follow` restantes son SOLO las de stream verificado-ok.

**Verificación (ejecutar y pegar salida):**
```
node -e "const h=require('./data/stream-health.json');console.log('failed:',h.failed.length)"
# tras build:
grep -rl "noindex" radio/ canal/ | wc -l
grep -c "<loc>" sitemap.xml
```

---

## W2 — Página "Sobre VivoRD" + E-E-A-T y DMCA (ALTO IMPACTO, BAJO ESFUERZO)

**Objetivo:** señales de confianza que Google exige a sitios monetizados. Hoy no hay "Acerca de" con responsable editorial ni proceso DMCA claro.

**Archivos:** nuevo `sobre-vivord.html` (generado), enlace en header/footer, ampliar `aviso-legal.html`.

**Cambios:**
1. Página "Acerca de" (>=500 palabras reales): qué es VivoRD, quién lo mantiene, metodología (cómo se verifica el catálogo con `stream-health`), política editorial, contacto.
2. Sección **DMCA / retirada de contenido** explícita con procedimiento y correo.
3. Fecha de "última actualización" y enlace a la página en el footer global.

**Criterio de aceptación:** `sobre-vivord.html` existe, >=500 palabras, enlazado desde footer en todas las páginas, en sitemap, y pasa el validador de enlaces.

**Verificación:**
```
node -e "const fs=require('fs');const t=fs.readFileSync('sobre-vivord.html','utf8').replace(/<[^>]+>/g,' ');console.log('palabras:',t.split(/\s+/).filter(Boolean).length)"
grep -c "sobre-vivord" sitemap.xml
```

---

## W3 — Páginas-hub por ciudad y por género (ALTO IMPACTO)

**Objetivo:** convertir listados en páginas con valor editorial propio e interconectar el catálogo. `radios-all.json` ya trae `city`; el género es parseable del texto.

**Archivos:** nuevo `scripts/hubs-build.mjs`, salida en `radios/ciudad/<slug>.html` y `radios/genero/<slug>.html`, teaser en `radios.html`.

**Cambios:**
1. Generar hubs para las **ciudades** con >=5 emisoras saludables (Santo Domingo, Santiago, La Vega, etc.) y los **géneros** principales (merengue, bachata, urbano, noticias, cristiana, deportes).
2. Cada hub: intro original de **>=150 palabras** + grid de emisoras (solo saludables) + enlaces a las guías relevantes.
3. Solo indexar hubs con >=5 fichas; el resto `noindex`.
4. Validar enlaces (extender `assertAllValidInternalLinks` a los hubs).

**Criterio de aceptación:** >=10 hubs generados, cada uno con intro >=150 palabras y solo fichas saludables; todos en sitemap y validados.

**Verificación:**
```
ls radios/ciudad radios/genero | wc -l
node scripts/validate-internal-links.mjs   # debe seguir en exit 0
```

---

## W4 — Diferenciar el cuerpo central de las descripciones (MEDIO)

**Objetivo:** romper el patrón plantilla del medio (lo único que quedó sin tocar). NO reescribir a mano 437; variar estructuralmente.

**Archivos:** `scripts/description-enrich.mjs`.

**Cambios:**
1. Insertar tras el primer párrafo una **línea de datos verificables** derivada solo de campos reales (ciudad, frecuencia, género detectado), con >=6 plantillas rotadas por hash de slug.
2. Normalizar muletillas repetidas del medio ("ofreciendo una programación que mantiene a los oyentes conectados", "combina información actualizada con entretenimiento") con un diccionario de >=8 variantes equivalentes, rotado por hash.
3. Garantía: cada ficha saludable tiene **>=90 palabras únicas** de descripción (lead + cuerpo).

**Criterio de aceptación:**
- 0 fichas saludables por debajo de 90 palabras.
- Ninguna frase-muletilla aparece en >25% de las fichas.

**Verificación (script de auditoría de n-gramas):**
```
node scripts/audit-descriptions.mjs   # crear: imprime top-10 frases de 6 palabras y su % de aparición + nº fichas <90 palabras
```

---

## W5 — Higiene técnica y datos estructurados (MEDIO)

**Archivos:** `scripts/description-format.mjs`, plantillas de ficha, `scripts/seo-head.mjs`.

**Cambios:**
1. Arreglar HTML inválido `<p><ul>...</ul></p>` -> sacar la `<ul>` fuera del `<p>`.
2. Añadir JSON-LD por ficha: `RadioStation`/`TelevisionChannel` + `BreadcrumbList` (Inicio > Radios > [Ciudad] > Emisora).
3. Breadcrumbs visibles enlazando al hub de ciudad/género (refuerza W3).

**Criterio de aceptación:** 0 ocurrencias de `<p><ul`; JSON-LD válido en una muestra (probar 3 URLs en el validador de Schema.org).

**Verificación:**
```
grep -rc "<p><ul" radio/ canal/ | grep -v ":0" | wc -l   # debe ser 0
```

---

## W6 — Cierre y despliegue (PROCESO)

1. Ejecutar build completo (`npm run build` + `build:radios` o los scripts reales del repo) y confirmar que el validador de enlaces pasa en **todo** el sitio (no solo guías).
2. `node scripts/validate-internal-links.mjs` -> exit 0.
3. Deploy: `npm run deploy:pack` + `wrangler pages deploy`.
4. Verificar en vivo 3 URLs: una ficha saludable (`index`), una no saludable (`noindex`), un hub.
5. Esperar **48 h** para rastreo. Solo entonces solicitar revisión AdSense.

---

## Tabla de impacto esperado

| Workstream | Palanca | Delta probabilidad |
|---|---|---|
| W1 noindex streams muertos | Calidad media del set indexado | **+15-20 pts** |
| W2 Sobre/E-E-A-T/DMCA | Confianza del dominio | **+5-8 pts** |
| W3 Hubs ciudad/género | Contenido propio + interlinking | **+8-12 pts** |
| W4 diferenciar cuerpo | Menos duplicación a escala | **+3-5 pts** |
| W5 hygiene + schema | Calidad técnica | **+2-3 pts** |

Suma realista sobre ~45% -> **70-80%**.

## Guardarraíles (NO hacer)

- No borrar fichas accesibles para el usuario; solo `noindex` + fuera de sitemap.
- No inventar datos. Solo `data/*.json`.
- No debilitar el validador para que pase.
- No reportar un workstream sin pegar la salida real de su comando de verificación.
- No pedir revisión AdSense antes de desplegar y esperar 48 h.

---

**Nota de prioridad:** W1 es el 80% del resultado. Si solo se hicieran W1 + W2 correctamente, ya se pasaría de ~45% a ~60-65%. W3 es lo que empuja a 70-80%. W4/W5 son pulido.
