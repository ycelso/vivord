# VivoRD

Plataforma limpia para ver **televisión dominicana en vivo** en el navegador.

## Comandos

```bash
npm run retheme    # Regenerar HTML con diseño VivoRD (mantiene streams)
npm run build      # Actualizar catálogo + streams desde la fuente
npm run retheme:radios
npm run build:logo # PNG de icono desde vivord-logo-full.png
npm run mirror-images  # Descarga logos a assets/media/ (WebP 256px)
npm start          # Servidor local (caché en /assets y /data)
```

### Logos locales (espejo)

1. `npm install --no-save sharp` (solo la primera vez)
2. `npm run mirror-images` — descarga desde la fuente y guarda en `assets/media/canales/` y `assets/media/radios/`
3. `npm run retheme` y `npm run retheme:radios` — HTML y JSON apuntan a rutas locales cuando el archivo existe

Repite `mirror-images` tras un `build` que traiga URLs nuevas. Fallos en `data/image-mirror-log.json`.

## Rendimiento

- `index.html` liviano (~14 KB): grids de canales vía `data/home-tv.json` + `catalog-home.js` (paginación 48 en 48)
- `radios.html` liviano: emisoras vía `data/home-radios.json` + `catalog-radios.js` (misma paginación)
- Búsqueda global: `data/search-index.json` se carga solo al usar el buscador
- Assets estáticos con `Cache-Control` largo en `/assets/`

## Diseño

- Marca **VivoRD** con paleta oscura y acento naranja
- Logo oficial: `assets/img/vivord-logo-full.png` (maestro) → `npm run build:logo` genera `vivord-logo.png` y `favico.png`
- `video-js.css` solo en páginas con reproductor Video.js (no en inicio ni radios)
- Tipografía Plus Jakarta Sans
- Hero con búsqueda, estadísticas y grid de canales
- Páginas de reproducción con layout tipo reproductor profesional

## Estructura

- `index.html` — inicio
- `canal/*.html` — reproductor por canal
- `data/catalog.json` — catálogo completo con URLs de stream
- `assets/css/style.css` — sistema de diseño
