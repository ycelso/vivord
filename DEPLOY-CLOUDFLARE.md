# Desplegar VivoRD en Cloudflare

VivoRD necesita **dos piezas**: archivos estáticos (HTML, assets, `data/`) y **API** (`/api/proxy`, `/api/live/telesistema.m3u8`, `/api/radio-now-playing`).

## 1. Preparar el proyecto

```bash
# Define tu dominio real antes de generar sitemap y páginas legales
set SITE_URL=https://tudominio.com
set CONTACT_EMAIL=contacto@tudominio.com
set ALLOWED_ORIGINS=https://tudominio.com,https://www.tudominio.com

npm run deploy:prep
```

Esto genera:

- `data/proxy-allowlist.json` — dominios permitidos en el proxy
- `sitemap.xml` y `robots.txt`
- `aviso-legal.html`, `privacidad.html`, `terminos.html`, `contacto.html`

Opcional: comprobar streams rotos (tarda varios minutos):

```bash
npm run verify:streams
```

## 2. Cloudflare Pages (sitio estático)

1. Dashboard → **Workers & Pages** → **Create** → **Pages** → Connect Git o **Upload**.
2. **Build command:** `npm run deploy:prep` (o ejecútalo en CI antes del upload).
3. **Build output directory:** `/` (raíz del repo).
4. Variables de entorno en Pages (si el build corre ahí): `SITE_URL`, `CONTACT_EMAIL`.

`start:static` **no** incluye las APIs de reproducción. Sin Worker, los canales HLS y el proxy no funcionarán.

## 3. Cloudflare Worker (API)

En la carpeta `cloudflare/`:

```bash
cd cloudflare
npx wrangler deploy
```

1. Edita `wrangler.toml`: `SITE_URL` y la ruta `routes` con tu dominio.
2. En el dashboard del Worker, añade variables:
   - `SITE_URL` = `https://tudominio.com`
   - `ALLOWED_ORIGINS` = `https://tudominio.com,https://www.tudominio.com`

### Enlazar Worker con Pages

**Opción A — Misma ruta (recomendada)**  
En la zona DNS de Cloudflare, el Worker usa una ruta:

```
tudominio.com/api/*
```

El tráfico a `/api/*` lo atiende el Worker; el resto, Pages.

**Opción B — Subdominio API**  
Worker en `api.tudominio.com` y cambiar en el front las rutas `/api/...` (requiere ajuste en JS; por defecto el sitio usa rutas relativas `/api/...` en el mismo host).

## 4. Seguridad del proxy

- Solo URLs cuyo host está en `data/proxy-allowlist.json` (+ lista base en `scripts/proxy-security.mjs`).
- Tras añadir canales/radios nuevos: `npm run allowlist` y vuelve a desplegar Worker + Pages.
- Rate limit en Node local (`npm start`); en Cloudflare activa **Rate limiting** o **WAF** en rutas `/api/*`.

## 5. Desarrollo local

```bash
npm run deploy:prep
npm start
```

`ALLOWED_ORIGINS` vacío permite CORS `*` solo para pruebas en localhost.

## 6. Checklist post-despliegue

- [ ] `https://tudominio.com/robots.txt` y `sitemap.xml`
- [ ] Páginas legales en el footer
- [ ] Un canal HLS y una radio reproducen
- [ ] `/api/proxy?url=https://evil.com` devuelve **403**
- [ ] Telesistema: `/api/live/telesistema.m3u8`
