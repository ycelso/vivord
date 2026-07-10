# Calidad de contenido — decisiones y por qué

Por qué el sitio genera lo que genera. Los números concretos **no** se documentan aquí: se recalculan con los comandos de abajo. Esto solo guarda lo que no se deduce leyendo el código.

Origen: este trabajo se hizo buscando la aprobación de AdSense. **AdSense se retiró** (ver `contexto.md`, Fase G). Lo que queda vale por SEO orgánico y por la experiencia de usuario, no por el anuncio.

---

## 1. Solo ~7 fichas llevan `noindex`, no 345

El health-check server-side reportaba ~345 fichas caídas. **Casi todas eran falsos negativos**: `fetch failed` (status 0), `http_403`, timeouts y `url_pagina_no_audio` ocurren porque el checker no es un navegador, no porque el stream esté muerto.

`scripts/stream-health-index.mjs` solo marca como no saludable:

- `http_404` (`HARD_STREAM_ISSUES`)
- entradas confirmadas en `data/tv-not-playing.json`
- fichas sin stream

**No ampliar ese criterio sin comprobar en un navegador real.** Desindexar cientos de fichas que funcionan destruiría el sitio. Las no saludables pasan a `noindex` y salen del sitemap, pero **siguen accesibles**: no se borran.

## 2. Hubs de ciudad y de género

`scripts/hubs-build.mjs` genera hubs para ciudades y géneros con **≥5 emisoras saludables**. Son páginas de navegación reales ("emisoras de Santiago", "radios de merengue"), con intro editorial propia, grid de fichas y enlaces a guías.

Reglas que sostienen su valor:

- Intro **variada de verdad** entre hubs. Una sola plantilla con el nombre cambiado es contenido duplicado a escala, y se nota.
- Solo listan fichas saludables.
- Con menos de 5 fichas, `noindex`.
- Nada de datos inventados: ciudad, frecuencia y género salen de `data/*.json` o no se ponen.

## 3. Descripciones: el problema es la repetición, no la longitud

Casi ninguna ficha es corta. Lo que sobra son **muletillas idénticas repetidas en cientos de fichas**. `scripts/description-enrich.mjs` rota paráfrasis por hash de slug; `scripts/audit-descriptions.mjs` mide n-gramas de 6-8 palabras y su porcentaje de aparición.

Objetivo: **ningún n-grama de 6+ palabras en más del 15% de las fichas.**

No "engordar" descripciones con relleno. El objetivo es menos repetición, no más palabras.

## 4. Confianza del dominio

`sobre-vivord.html` (responsable editorial, metodología, contacto) y la sección **DMCA / retirada de contenido** en `aviso-legal.html`. Un sitio que reemite señales de terceros necesita un procedimiento de retirada visible. Esto no era para AdSense: es exposición legal.

---

## Verificación

```powershell
# Fichas y hubs
node -e "console.log('canales:', require('./data/catalog.json').channels.length)"
(Get-ChildItem radio -Filter *.html).Count
(Get-ChildItem radios/ciudad, radios/genero -Filter *.html).Count

# Cuántas fichas quedan fuera del índice
(Get-ChildItem canal, radio -Filter *.html -Recurse | Select-String -Pattern "noindex" -List).Count

# Repetición de plantillas
node scripts/audit-descriptions.mjs

# Enlaces internos: debe salir exit 0
node scripts/validate-internal-links.mjs
```

---

## No hacer

- No ampliar el criterio de `stream-health-index.mjs` sin verificar en navegador. Los `fetch failed` son falsos negativos.
- No borrar fichas accesibles para el usuario. Solo `noindex` + fuera del sitemap.
- No inventar ciudad, frecuencia ni género. Solo `data/*.json`.
- No usar una plantilla única de intro para todos los hubs.
- No debilitar `validate-internal-links.mjs` para que el build pase.

## Pendiente de decidir

Las `guias/` se generan por script (`scripts/guias-build.mjs`). Es contenido autogenerado, el tipo que Google penaliza, y contribuyó al rechazo de AdSense. Ya no cumplen su propósito original. **Comprobar en Search Console si traen tráfico orgánico**; si no lo traen, son candidatas a eliminarse.
