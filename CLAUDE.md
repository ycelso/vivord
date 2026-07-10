# CLAUDE.md — VivoRD (web + Android)

Contexto completo para agentes que retomen este proyecto. Cubre arquitectura, historial de trabajo, comandos, convenciones y estado actual.

---

## Identidad del proyecto

| Campo | Valor |
|-------|-------|
| **Nombre** | VivoRD |
| **Dominio producción** | https://vivo-rd.com |
| **App Android** | `com.vivord.app` (nombre visible: VivoRD) |
| **Contenido** | Televisión en vivo y radios de República Dominicana |
| **Repo local** | `C:\Users\monitoreo\Downloads\VivoRD` |
| **Repo GitHub** | https://github.com/ycelso/vivord (rama `master`) |
| **Rama producción Cloudflare Pages** | `main` — ver sección de deploy |
| **Package npm** | `clon-tv` (private) |

**Origen:** clon/rebrand de plataforma tipo canalesdominicanos.live. Catálogo en `data/`, páginas generadas en `canal/` y `radio/`.

---

## Arquitectura (obligatorio entender esto)

VivoRD **no es solo archivos estáticos**. En producción hay **dos piezas**:

```
Usuario (web o app)
       │
       ├─► HTML/CSS/JS/data/assets  ──► Cloudflare Pages (proyecto vivord2)
       │
       └─► /api/proxy
           /api/live/telesistema.m3u8
           /api/radio-now-playing   ──► Worker (_worker.js en Pages deploy)
                                        o Worker standalone (cloudflare/)
```

| Entorno | API |
|---------|-----|
| Web en vivo-rd.com | Mismo origen `/api/*` |
| App Android (Capacitor WebView) | `https://vivo-rd.com/api/*` vía `assets/js/api-config.js` |
| `npm run start:static` | **Sin API** — solo preview de diseño |
| `npm run start` | Servidor Node local con API (`scripts/server.mjs`) |

**App Android:** empaqueta copia del sitio en `www/` (generada por `npm run www:sync`). No abre URL remota por defecto; el APK incluye HTML local pero consume streams del backend remoto.

---

## Stack técnico

| Capa | Tecnología |
|------|------------|
| Sitio | HTML estático generado por scripts Node (`.mjs`), sin React/Vue |
| CSS | `assets/css/style.css` — tema oscuro `#0a0a0b`, acento naranja, Plus Jakarta Sans |
| TV | Video.js en `canal/*.html` |
| Radios | Streams vía proxy + metadata ICY |
| Build | `scripts/*.mjs` |
| Hosting | Cloudflare Pages + Wrangler 4 |
| API edge | `cloudflare/pages-worker.mjs` → bundle `_worker.js`; alternativa `cloudflare/worker.mjs` |
| Android | Capacitor 7, Gradle, JDK 17, SDK 34+ |
| Plugins Capacitor | AdMob, App, Splash, StatusBar, MediaSession |
| Java custom | `RadioPlaybackService`, `RadioNativePlugin`, `RadioAudioFocusPlugin` |
| Imágenes | `sharp` (logos, favicon, iconos) |
| Tests/automation | Playwright (`@playwright/test`) |
| Monetización web | **Sin anuncios activos.** AdSense retirado (rechazo "contenido de bajo valor"). Preparados y apagados: banner de afiliado (`AFFILIATE`) y Adsterra Social Bar (`ADSTERRA_SOCIAL_BAR`) |
| Monetización app | AdMob nativo (`pub-9983636461587656` vía `ADMOB_PUBLISHER_ID` → `app-ads.txt`) |

---

## Estructura de directorios

```
VivoRD/
├── index.html, radios.html       # Home liviano (~14 KB); grids vía JSON + JS
├── canal/*.html                  # 65 páginas reproductor TV (fuente: data/catalog.json)
├── radio/, radios/               # 372 páginas emisoras + home radios.html
├── data/                         # catalog.json, home-tv.json, proxy-allowlist.json, etc.
├── assets/
│   ├── css/style.css
│   ├── js/                       # catalog-home.js, api-config.js, search.js, …
│   └── img/                      # Logos, favicons, OG (post brand:sync)
├── logos/                        # Fuente diseñador (PNG + logo.svg potrace B/N)
├── scripts/                      # Pipeline completo build/deploy/android
├── cloudflare/                   # Worker API standalone
├── www/                          # GENERADO — copia para Capacitor (no editar a mano)
├── android/                      # Proyecto Capacitor Android
├── dist/
│   ├── vivord-pages/             # Output deploy Cloudflare (generado)
│   └── android-release/          # APK/AAB + PLAY-STORE-NOTES-*.txt
├── guias/                        # Contenido SEO generado
├── wrangler.toml                 # Pages: project vivord2, output dist/vivord-pages
├── capacitor.config.json
└── package.json
```

**Config clave:**

- `scripts/site-config.mjs` — `SITE_URL`, `CONTACT_EMAIL`, `ALLOWED_ORIGINS`, `ANDROID_PACKAGE`, `ADMOB_PUBLISHER_ID`, `ADSTERRA_SOCIAL_BAR`, `AFFILIATE`, `ADSENSE_CLIENT` (vacío a propósito)
- `android/app/build.gradle` — `applicationId`, `versionCode`, `versionName`
- `capacitor.config.json` — `webDir: www`, splash, status bar, `allowNavigation`
- `.gitignore` — excluye keystores, `.aab`/`.apk` sueltos, `node_modules`, `www/*`; trackea `dist/android-release/**` (notas, no binarios grandes)

---

## Rendimiento web (decisiones ya tomadas)

- **Home TV** (`index.html`): grid desde `data/home-tv.json` + `catalog-home.js`, paginación 48 en 48.
- **Home radios** (`radios.html`): `data/home-radios.json` + `catalog-radios.js`, misma paginación.
- **Búsqueda**: `data/search-index.json` solo al usar el buscador.
- **`video-js.css`**: solo en páginas con reproductor, no en home/radios.
- **Logos**: espejo local opcional `npm run mirror-images` → `assets/media/` (WebP 256px).
- **Caché**: assets estáticos con headers largos en servidor local; Cloudflare CDN en prod.

---

## Historial de trabajo realizado

### 1. Sitio base y optimización
- Rebrand a VivoRD, paleta oscura + naranja.
- Reducción peso home/radios (JSON + JS lazy vs cientos de `<img>` inline).
- Logo: maestro `assets/img/vivord-logo-full.png` → `npm run build:logo` genera tamaños.
- Header/favicon en PNG; script `scripts/build-logo-png.mjs`.

### 2. Infraestructura Cloudflare
- **Proxy seguro**: allowlist (`generate-allowlist.mjs`), CORS, rate limit — `proxy-handler.mjs`, `proxy-security.mjs`.
- **SEO/legal**: `deploy:prep` genera sitemap, robots, aviso-legal, privacidad, términos, contacto, guías.
- **Streams**: `npm run verify:streams` audita URLs rotas.
- **Deploy**: `npm run pages:deploy` = `deploy:prep` + `deploy:pack` + `wrangler pages deploy --project-name=vivord2 --branch=main`.
- Dominio **vivo-rd.com** → Cloudflare Pages.
- Wrangler autenticado: cuenta Google del owner (`wrangler whoami`).
- Worker ruta: `vivo-rd.com/api/*` (ver `cloudflare/wrangler.toml`).

### 3. Marca e iconografía
- Pipeline diseñador → producción: `scripts/sync-brand-assets.mjs` (`npm run brand:sync`).
- PNGs en `logos/` mapeados a `assets/img/` (OG 1200×630, PWA 512, favicons, apple-touch).
- **`logos/logo.svg` es potrace B/N — NO usar como favicon.**
- Fix favicon producción: `scripts/favicon-svg.mjs` genera `favicon.svg` a **color** (PNG embebido base64); Chrome prioriza SVG.
- Android icons: `npm run android:icons`.
- Play Store assets: `play-store:assets`, `play-store:screenshots`.

### 4. App Android (Capacitor)
- WebView con sitio local en `www/`.
- API remota obligatoria (`vivo-rd.com`).
- Radio segundo plano: notificación media + plugins Java custom.
- Anuncios web nunca en la app: guard `window.VIVORD_IS_NATIVE` (`assets/js/adsterra.js`) + CSS `html.capacitor-app .ad-slot { display: none }`. Mezclar otra red con AdMob en el WebView puede costar la cuenta AdMob. Check: `npm run test:ads`.
- Keystore: `android/release/vivord-upload.jks` + `android/keystore.properties` (**local, NO git**).
- Release: `npm run android:release` → APK + AAB en `dist/android-release/`.

### 5. Google Play Store
- Versión en código: **1.0.10** (`versionCode` 11).
- AAB: `dist/android-release/vivord-1.0.10.aab`.
- Notas: `dist/android-release/PLAY-STORE-NOTES-1.0.10.txt`.
- Enviada a revisión Producción 100 % (desde 1.0.8 activa).
- Upload AAB: **manual** en Play Console (Playwright MCP extensión bloquea file upload).
- Script asistido: `scripts/play-store-upload.mjs`.

### 6. Git / GitHub
- Commit inicial `9db3d30` — 1372 archivos.
- Repo: https://github.com/ycelso/vivord (público).
- `gh` CLI **sin autenticar**; `git push` funciona vía credential manager Windows.

---

## Comandos esenciales

### Instalación
```powershell
cd C:\Users\monitoreo\Downloads\VivoRD
npm install
```

### Desarrollo web local
```powershell
npm start                  # Node + API (recomendado)
npm run start:static       # Solo estáticos, puerto 3000 — SIN /api
```

### Regenerar contenido
```powershell
npm run build              # Catálogo + streams desde fuente
npm run retheme              # HTML canales TV
npm run retheme:radios       # HTML radios
npm run mirror-images        # Espejo logos → assets/media/ (sharp)
npm run brand:sync           # logos/ → assets/img/ + favicon.svg
npm run www:sync             # Sitio → www/ (Android)
npm run hubs:build           # Hubs SEO
npm run build:guias          # Guías contenido
```

### Deploy Cloudflare
```powershell
$env:SITE_URL="https://vivo-rd.com"
$env:CONTACT_EMAIL="contacto@vivo-rd.com"
$env:ALLOWED_ORIGINS="https://vivo-rd.com,https://www.vivo-rd.com"

npm run deploy:prep          # allowlist, sitemap, legales, ads.txt
npm run pages:deploy         # prep + pack + wrangler deploy
```

Worker standalone (alternativa):
```powershell
cd cloudflare
npx wrangler deploy
```

### Android — desarrollo
```powershell
npm run android:prep         # retheme + radios + www:sync + cap sync
npm run android:open         # Android Studio
npm run android:run          # CLI con dispositivo conectado
```

### Android — release Play Store
```powershell
# Una vez:
$env:KEYSTORE_PASSWORD="..."
npm run android:keystore     # Crea .jks + keystore.properties

# Cada release:
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
npm run android:release      # brand:sync + icons + sync + gradle bundleRelease
adb install -r dist\android-release\vivord-1.0.10.apk
```

### Calidad / auditoría
```powershell
npm run verify:streams
npm run validate:links
npm run audit:descriptions
```

---

## Flujo deploy web (detalle)

1. **`deploy:prep`** — `generate-allowlist`, guías, sitemap, páginas legales, `ads.txt`, `app-ads.txt`.
2. **`deploy:pack`** — `syncWww()` → copia a `dist/vivord-pages`; bundle `_worker.js` con esbuild desde `cloudflare/pages-worker.mjs`; incluye `404.html`, sitemap, manifest, `_redirects`.
3. **`wrangler pages deploy dist/vivord-pages --project-name=vivord2 --branch=main`**.

**Importante:** sin `404.html` correcto, Pages asume SPA y puede romper rutas `/assets/*`.

**`--branch=main` no es opcional.** La rama de producción del proyecto `vivord2` es `main`, pero el repo git está en `master`. Sin el flag, wrangler usa la rama git actual y el deploy entra como **preview** (`master.vivord2.pages.dev`): imprime `Deployment complete!` y **vivo-rd.com no cambia**. Es un éxito falso. Verificar siempre contra el dominio real, no contra la URL `*.pages.dev` que imprime wrangler.

**`SELF_SIGNED_CERT_IN_CHAIN` al subir:** no es transitorio. En Windows, Node no usa el almacén de certificados del sistema, donde vive la CA del antivirus/proxy que intercepta TLS. Desplegar con `$env:NODE_OPTIONS="--use-system-ca"` (Node ≥ 22.15). Sigue verificando la cadena. **Nunca** `NODE_TLS_REJECT_UNAUTHORIZED=0`: eso expondría el token de Cloudflare.

---

## Flujo Android (detalle)

1. Cambios en HTML/CSS/JS del sitio.
2. `npm run android:prep` (o manualmente: `retheme` + `retheme:radios` + `android:sync`).
3. Probar en emulador/dispositivo.
4. Para release: bump versión en `build.gradle` + `android-release.mjs`, notas en `PLAY-STORE-NOTES-*.txt`.
5. `npm run android:release`.
6. Subir `.aab` a Play Console manualmente.

**Comportamiento app vs web:**

| Aspecto | Web | App |
|---------|-----|-----|
| API | Mismo origen | `vivo-rd.com` |
| Anuncios | Ninguno activo (afiliado y Adsterra listos, apagados) | AdMob |
| Botón atrás | Navegador | Historial / salir |
| Radio background | Limitado | Notificación + audio background |
| Sin internet | Parcial | Aviso rojo |

**Modo solo-web (APK pequeño):** en `capacitor.config.json` añadir `"server": { "url": "https://vivo-rd.com" }` + `android:sync`. Requiere sitio online.

**Debug API en emulador:**
```javascript
localStorage.setItem('vivord_api_base', 'http://10.0.2.2:3000');
location.reload();
```

---

## Servicios y credenciales

| Servicio | Detalle |
|----------|---------|
| Dominio | vivo-rd.com |
| Cloudflare Pages | `vivord2`, output `dist/vivord-pages` |
| Cloudflare Worker | `vivord-api`, ruta `/api/*` |
| Wrangler | Cuenta Google del owner (`wrangler whoami`) |
| GitHub | https://github.com/ycelso/vivord |
| Play Console | Google account del owner |
| AdSense | Retirado — sitio rechazado por "contenido de bajo valor". No reenviar a revisión: arriesga la cuenta Google que sostiene AdMob |
| AdMob | `pub-9983636461587656` (app) |
| Contacto | contacto@vivo-rd.com |
| Keystore | `android/release/vivord-upload.jks` — **backup obligatorio, no en git** |

---

## Convenciones para agentes

### Hacer
- Regenerar HTML con `retheme` / `retheme:radios`, no editar cientos de HTML a mano salvo casos puntuales.
- Ejecutar `brand:sync` tras cambios en `logos/`.
- Usar `deploy:prep` antes de deploy.
- Bump `versionCode` **y** `versionName` juntos en Android.
- Mantener `proxy-allowlist.json` actualizado si hay dominios stream nuevos.
- Probar API en prod tras deploy: `/api/proxy` con URL allowlisted.

### No hacer
- No commitear `keystore.properties`, `.jks`, `.env` con secretos.
- No usar `logos/logo.svg` (potrace B/N) como favicon.
- No asumir que `start:static` valida reproducción.
- No subir AAB con Playwright MCP + extensión Edge (file upload bloqueado).
- No editar `www/` directamente — regenerar con `www:sync`.
- No asumir que `www:sync` actualiza la app: solo escribe en `www/`. `npx cap sync` (dentro de `android:sync`) es quien copia a `android/app/src/main/assets/public/`, carpeta gitignorada donde un desfase pasa inadvertido. Antes de cada release, verificar que ahí no queda `adsbygoogle`.
- No force-push `master` sin confirmación explícita del usuario.
- No reactivar `ADSENSE_CLIENT` ni reenviar el sitio a revisión de AdSense. El rechazo es sobre el producto (agregador de streams de terceros), no sobre la implementación; insistir arriesga la cuenta Google que también sostiene AdMob.
- No derivar `app-ads.txt` de `ADSENSE_CLIENT`: vaciar AdSense borraría la verificación de AdMob. Usa `ADMOB_PUBLISHER_ID`.
- No cargar ninguna red publicitaria dentro del WebView (guard `VIVORD_IS_NATIVE`). Correr `npm run test:ads` tras tocar `assets/js/adsterra.js`.
- No desplegar Pages sin `--branch=main`: el deploy entra como preview y vivo-rd.com no cambia, pese a imprimir `Deployment complete!`.

### Editar versiones Android
- `android/app/build.gradle` — `versionCode`, `versionName`
- `scripts/android-release.mjs` — constante `version` para nombres de archivo
- Crear `dist/android-release/PLAY-STORE-NOTES-X.Y.Z.txt`

---

## Limitaciones conocidas

1. Playwright MCP extensión Edge: navega/formularios OK; **upload archivos NO** (`DOM.setFileInputFiles: Not allowed`).
2. Login Google automatizado en browser MCP: no fiable.
3. `gh` CLI sin sesión — usar `git` directo.
4. App requiere internet + backend vivo-rd.com desplegado.
5. Optimización batería en Samsung/Xiaomi puede cortar radio background.
6. `logos/` puede tener solo SVG potrace; PNGs deben existir para `brand:sync` completo.
7. **Gradle no arranca en esta máquina:** `java.io.IOException: Unable to establish loopback connection`. No es Gradle ni el proyecto — `java.exe` no puede abrir su socket loopback interno (`sun.nio.ch.PipeImpl`). Reproducible con un `Selector.open()` suelto; falla con JDK 21 y con el JBR de Android Studio, y ningún flag de JVM lo esquiva. Node sí abre loopback. Es un antivirus/firewall filtrando el proceso Java. **Arreglo:** excluir `java.exe` del antivirus, o pausarlo para compilar.
8. **TLS interceptado:** wrangler aborta la subida con `SELF_SIGNED_CERT_IN_CHAIN`. Ya resuelto en `pages:deploy` con `--use-system-ca` (ver flujo de deploy). Probablemente el mismo antivirus de la limitación 7.

---

## Estado actual (2026-07-10)

| Área | Estado |
|------|--------|
| Web prod | https://vivo-rd.com — sin anuncios; AdSense retirado y verificado contra el dominio |
| Analítica | Cloudflare Web Analytics activo (token en `site-config.mjs`). Antes no había ninguna medición |
| Cloudflare | Deploy OK, proyecto `vivord2`, rama producción `main` |
| Monetización web | Afiliado y Adsterra implementados pero **apagados**: faltan enlace de afiliado y zona Adsterra |
| Monetización app | AdMob intacto (`app-ads.txt` sirve `pub-9983636461587656`) |
| Android código | 1.0.11 / versionCode 12, assets sincronizados sin AdSense |
| Android binario | ⚠️ **AAB 1.0.11 sin compilar**: Gradle no arranca en esta máquina (ver limitación 7) |
| Play Store | 1.0.10 en revisión — ese binario **sí** carga AdSense en el WebView junto a AdMob. Sustituir por 1.0.11 cuanto antes |
| GitHub | `origin/master` al día |
| gh CLI | Sin auth |
| Keystore | Solo local |

### Lo siguiente, en orden

1. **Compilar y subir 1.0.11.** Excluir `java.exe` del antivirus (o pausarlo) y `npm run android:release`. Versión, notas y assets ya están listos. Es el riesgo abierto más serio: el binario publicado mezcla AdSense y AdMob en el WebView.
2. **Enlace de afiliado** → `AFFILIATE.href` en `scripts/site-config.mjs`. La mayor fuente de ingresos esperada. `guias/ver-tv-dominicana-desde-el-extranjero.html` es la página con más intención de compra del sitio.
3. **Zona Adsterra** → `ADSTERRA_SOCIAL_BAR`, si se quiere red publicitaria además del afiliado.
4. En una semana, mirar en Cloudflare Web Analytics qué páginas traen tráfico antes de borrar contenido.

### Por qué se retiró AdSense

Rechazo por "contenido de bajo valor", dos veces. El motivo es el **producto**: un agregador que reproxea señales de terceros vía `/api/proxy` es, para Google, "contenido con poco o ningún valor agregado". Ningún arreglo técnico lo cambia. Reenviar a revisión acumula historial contra la cuenta Google que **también sostiene AdMob**, que es la única monetización viva. No reenviar.

Las `guias/` **no** son el problema: son nueve artículos originales de 738-917 palabras escritos a mano en `guias-content.mjs`, sin duplicación entre sí. Ver `CALIDAD-CONTENIDO.md`.

---

## Scripts npm — referencia completa

Ver `package.json`. Principales:

| Script | Función |
|--------|---------|
| `build` / `build:quick` | Catálogo desde fuente |
| `retheme` / `retheme:radios` | Regenerar HTML |
| `brand:sync` | Logos → assets |
| `build:logo` | PNG desde vivord-logo-full.png |
| `deploy:prep` / `deploy:pack` / `pages:deploy` | Pipeline Cloudflare |
| `www:sync` / `android:sync` / `android:prep` | Capacitor |
| `android:keystore` / `android:release` | Firma + AAB |
| `android:icons` | Launcher + splash |
| `verify:streams` / `validate:links` | QA |
| `play-store:assets` / `play-store:screenshots` / `play-store-upload` | Play Store |
| `mirror-images` / `allowlist` / `sitemap` / `legal` | Utilidades |
| `browser:login:play` | Abre Play Console en Edge |

---

## Documentación en repo

- `README.md` — overview
- `ANDROID.md` — Capacitor, release, troubleshooting
- `DEPLOY-CLOUDFLARE.md` — Pages + Worker + DNS
- `CALIDAD-CONTENIDO.md` — por qué solo ~7 fichas llevan `noindex` (los `fetch failed` del health-check son falsos negativos), hubs, descripciones
- `contexto.md` — handoff resumido (si existe)

---

## Checklist rápido por tarea

**Cambio contenido web → producción:**
1. `retheme` (+ `retheme:radios` si aplica)
2. `deploy:prep && pages:deploy`
3. Verificar vivo-rd.com + favicon + canal de prueba

**Nueva versión Android:**
1. Bump versiones (`build.gradle`, `android-release.mjs`)
2. `PLAY-STORE-NOTES-*.txt`
3. `android:release`
4. Subir AAB manual Play Console

**Cambio logo/marca:**
1. PNGs en `logos/` (ver specs en `sync-brand-assets.mjs`)
2. `brand:sync` → `android:icons`
3. Redeploy web + rebuild Android

**Nuevo dominio stream:**
1. Añadir a catálogo/build
2. `npm run allowlist` o `deploy:prep`
3. Redeploy

---

*Actualizar este archivo cuando cambien versión Android, infra Cloudflare, dominio, flujos de deploy o decisiones de arquitectura.*
