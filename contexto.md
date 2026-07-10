# VivoRD — Contexto del proyecto (handoff para subagentes)

Documento de continuidad: qué es el proyecto, qué se hizo, con qué herramientas, y cómo reproducir web + Android sin releer todo el chat.

---

## 1. Qué es VivoRD

| Campo | Valor |
|-------|-------|
| **Nombre** | VivoRD |
| **Dominio producción** | https://vivo-rd.com |
| **App Android** | `com.vivord.app` (Capacitor 7) |
| **Contenido** | TV en vivo y radios de República Dominicana |
| **Repo local** | `C:\Users\monitoreo\Downloads\VivoRD` (⚠️ **no** `clon-tv`: esa carpeta solo tiene un `CLAUDE.md`) |
| **Repo GitHub** | https://github.com/ycelso/vivord (rama `master`, commit inicial `9db3d30`) |
| **Rama producción Cloudflare Pages** | `main` (≠ rama git `master` — ver §5) |

**Arquitectura en producción (2 piezas obligatorias):**

1. **Sitio estático** — HTML, CSS, JS, `data/`, imágenes → Cloudflare Pages.
2. **API** — `/api/proxy`, `/api/live/telesistema.m3u8`, `/api/radio-now-playing` → Worker embebido en el deploy de Pages (`_worker.js`) o Worker separado en `cloudflare/`.

La app Android empaqueta el mismo sitio en WebView; las APIs las consume desde `https://vivo-rd.com` (ver `assets/js/api-config.js`).

---

## 2. Stack y dependencias

| Capa | Tecnología |
|------|------------|
| Frontend | HTML estático generado por scripts Node (`.mjs`) |
| Estilos | `assets/css/style.css` — diseño oscuro, acento naranja, Plus Jakarta Sans |
| Reproductor | Video.js en páginas de canal; radios con streams vía proxy |
| Build web | Scripts en `scripts/` (sin framework React/Vue) |
| Hosting | Cloudflare Pages (`vivord2`) + Wrangler |
| App móvil | Capacitor 7 + Android Gradle, JDK 17 |
| Ads web | **Ninguno activo.** AdSense retirado. Listos y apagados: banner de afiliado (`AFFILIATE`) y Adsterra Social Bar (`ADSTERRA_SOCIAL_BAR`) |
| Ads app | `@capacitor-community/admob` (nativo). Ninguna red web entra al WebView: guard `VIVORD_IS_NATIVE` |
| Radio background | `@jofr/capacitor-media-session` + plugins Java custom |
| Automatización | Playwright (tests, Play Store parcial, browser MCP en Edge) |
| Imágenes | `sharp` (logos, favicon, iconos Android) |

**Fuente de datos original:** catálogo scrapeado/derivado de canalesdominicanos.live → `data/catalog.json`, `data/channels.json`, cientos de `canal/*.html` y `radio/*.html`.

---

## 3. Estructura clave del repo

```
VivoRD/
├── index.html, radios.html          # Home liviano (grids vía JSON + JS)
├── canal/*.html, radio/*.html       # 65 canales, 372 radios (fuente: data/catalog.json)
├── data/                            # Catálogos, índices, allowlist proxy
├── assets/                          # CSS, JS, img, media espejada
├── logos/                           # Fuente del diseñador (PNG + logo.svg potrace)
├── scripts/                         # Todo el pipeline de build/deploy
├── cloudflare/                      # Worker API standalone (alternativa)
├── www/                             # Copia para Capacitor (generada, no editar a mano)
├── android/                         # Proyecto Capacitor Android
├── dist/vivord-pages/               # Output deploy Cloudflare (generado)
├── dist/android-release/            # APK/AAB + notas Play Store (parcialmente en git)
├── wrangler.toml                    # Pages project `vivord2`
└── capacitor.config.json            # webDir: www, appId: com.vivord.app
```

**Archivos de config importantes:**

- `scripts/site-config.mjs` — `SITE_URL`, email, origins CORS, `ADMOB_PUBLISHER_ID`, `ADSTERRA_SOCIAL_BAR`, `AFFILIATE`, `ADSENSE_CLIENT` (vacío a propósito).
- `capacitor.config.json` — splash, status bar, allowNavigation.
- `android/app/build.gradle` — `versionCode` / `versionName`.
- `.gitignore` — excluye `node_modules`, keystores, `.aab`/`.apk` sueltos; **sí** trackea `dist/android-release/**` (notas, no binarios grandes).

---

## 4. Qué se hizo (cronología lógica)

### Fase A — Sitio base y optimización

- Clon/rebrand de plataforma TV dominicana → marca **VivoRD**.
- Home y radios livianos: grids paginados desde `data/home-tv.json` / `data/home-radios.json` + `catalog-home.js` / `catalog-radios.js`.
- Búsqueda lazy con `data/search-index.json`.
- Espejo local de logos: `npm run mirror-images` → `assets/media/`.
- Logo maestro: `assets/img/vivord-logo-full.png` → `npm run build:logo` genera tamaños header/favicon.

### Fase B — Producción Cloudflare

- **Proxy seguro:** allowlist (`data/proxy-allowlist.json`), rate limit, CORS → `scripts/proxy-handler.mjs`, `proxy-security.mjs`.
- **Legal + SEO:** `npm run deploy:prep` genera sitemap, robots, páginas legales, `ads.txt`, guías.
- **Verificación streams:** `npm run verify:streams`.
- **Deploy Pages:** `npm run pages:deploy` → `deploy:prep` + `deploy:pack` + `wrangler pages deploy --branch=main`.
- Proyecto Cloudflare Pages: **`vivord2`**, output `dist/vivord-pages`.
- Dominio custom: **vivo-rd.com** apuntando a Pages.
- Cuenta Wrangler autenticada: cuenta Google del owner (account `0bbe0f2133c2dbde18cba6a4506e7279`).
- Preview reciente de deploy: `https://59431112.vivord2.pages.dev` (el hash cambia por deploy).

### Fase C — Marca e iconografía

- Pipeline de logos diseñador → web/Android: `scripts/sync-brand-assets.mjs` (`npm run brand:sync`).
- Mapeo `logos/*.png` → `assets/img/` (OG, PWA, favicons PNG, iconos app).
- **`logo.svg` en `logos/` es potrace B/N — no usarlo como favicon.**
- Fix favicon: `scripts/favicon-svg.mjs` genera `assets/img/favicon.svg` a **color** embebiendo PNG base64 (Chrome prioriza SVG sobre PNG).
- Iconos Android: `npm run android:icons` desde PNGs de marca.
- Assets Play Store: `play-store:assets`, `play-store:screenshots`.

### Fase D — App Android

- Capacitor empaqueta `www/` (sync desde raíz del sitio).
- Plugins nativos custom en `android/app/src/main/java/com/vivord/app/`:
  - `RadioPlaybackService`, `RadioNativePlugin`, `RadioAudioFocusPlugin`.
- Radio en segundo plano con notificación media.
- Release firmado: keystore en `android/release/vivord-upload.jks` + `android/keystore.properties` (**local, no en git**).
- Build release: `npm run android:release` → `dist/android-release/vivord-1.0.10.aab` (+ APK).
- Versión actual en código: **1.0.10** (`versionCode` 11).

### Fase E — Google Play Store

- AAB **1.0.10** generado en `dist/android-release/`.
- Notas de versión en `dist/android-release/PLAY-STORE-NOTES-1.0.10.txt`.
- Envío a revisión en **Producción** (100 % rollout) vía Play Console (asistido por agente + navegador).
- Producción activa antes del envío: **1.0.8**; **1.0.10** quedó en revisión al cierre de la sesión.
- **Limitación:** Playwright MCP con extensión Edge **no puede** hacer `file upload` en Play Console → subida del `.aab` fue **manual** por el usuario.
- Script semi-automático: `scripts/play-store-upload.mjs` (requiere sesión Google en perfil Playwright).

### Fase F — Git y GitHub

- `git init` + `.gitignore` ampliado.
- Commit inicial: `9db3d30` — 1372 archivos.
- Repo creado en GitHub: **https://github.com/ycelso/vivord** (público, owner `ycelso`).
- Push exitoso con Git credential manager (`origin/master`).
- **`gh` CLI no autenticado** — `gh auth login` falló por timeout de código de dispositivo; no bloquea git push.

### Fase G — Retirada de AdSense y nueva monetización (2026-07-10)

- **AdSense rechazó vivo-rd.com por "contenido de bajo valor"**, segunda vez. Diagnóstico: el rechazo es sobre el **producto** (agregador que reproxea señales de terceros vía `/api/proxy`), no sobre la implementación. Las `guias/` autogeneradas por script sumaban un segundo motivo (contenido generado automáticamente). Ningún arreglo técnico lo resuelve.
- **Decisión: retirar AdSense en vez de reintentar.** Reenviar a revisión acumula historial contra la cuenta Google que **también sostiene AdMob**; el downside (perder AdMob) supera al upside.
- `ADSENSE_CLIENT = ''` literal, ya **no** se lee de `process.env`, para que el pipeline no pueda reactivarlo por accidente.
- **`generateAppAdsTxt()` desacoplado de `generateAdsTxt()`.** Antes derivaba de él: vaciar AdSense habría borrado `app-ads.txt` y roto la verificación de AdMob. Ahora usa `ADMOB_PUBLISHER_ID`.
- Privacidad, aviso legal, guías y banner de cookies dejan de declarar AdSense (texto neutral "publicidad de terceros"; AdMob se nombra solo para la app).
- **Banner de afiliado** (`scripts/affiliate.mjs`): enlace estático, sin JS, `rel="sponsored nofollow noopener"`. Reusa `.ad-slot`, que ya está oculto en `html.capacitor-app`. Sin `href` https no renderiza nada.
- **Adsterra Social Bar** (`scripts/adsterra.mjs` + `assets/js/adsterra.js`): loader que **nunca** inyecta en la app (`VIVORD_IS_NATIVE`) ni antes del consentimiento de cookies. Check: `npm run test:ads` (`scripts/adsterra.test.mjs`, 6 casos).
- **Bug encontrado:** `npm run pages:deploy` nunca desplegaba a producción. Ver §5.
- **Bug encontrado:** `.ad-slot` usaba `var(--radius-md)`, variable inexistente; su `border-radius` nunca se aplicó. Corregido a `var(--radius)`.
- Commits: `44d9f6c`, `458643f`, `281f0a5`, `9420bb1` — pusheados a `origin/master`.
- **Estado:** web sin anuncios en producción, verificado. Afiliado y Adsterra implementados pero **apagados**: faltan el enlace de afiliado y la zona de Adsterra.

---

## 5. Flujo WEB — paso a paso (reproducir)

### Desarrollo local

```powershell
cd C:\Users\monitoreo\Downloads\VivoRD
npm install
npm start                    # Servidor Node con API local (scripts/server.mjs)
# o solo estático (sin API):
npm run start:static         # Puerto 3000, NO sirve /api/*
```

### Regenerar contenido tras cambios en catálogo/diseño

```powershell
npm run build                # Actualiza catálogo + streams desde fuente
npm run retheme              # Regenera HTML TV
npm run retheme:radios       # Regenera HTML radios
npm run mirror-images        # Espeja logos externos (requiere sharp)
npm run brand:sync           # Sincroniza logos diseñador → assets/img + favicon.svg
npm run www:sync             # Copia sitio → www/ (para Android)
```

### Preparar y desplegar a Cloudflare

```powershell
# Opcional: variables antes del prep
$env:SITE_URL="https://vivo-rd.com"
$env:CONTACT_EMAIL="contacto@vivo-rd.com"
$env:ALLOWED_ORIGINS="https://vivo-rd.com,https://www.vivo-rd.com"

npm run deploy:prep          # allowlist, sitemap, legales, ads.txt, guías
npm run pages:deploy         # prep + pack + wrangler pages deploy --project-name=vivord2 --branch=main
```

**Qué hace `deploy:pack`:** copia `www/` → `dist/vivord-pages`, añade `404.html`, sitemap, `_worker.js` (API bundleada con esbuild desde `cloudflare/pages-worker.mjs`).

**Worker standalone (alternativa):** `cd cloudflare && npx wrangler deploy` — ruta `vivo-rd.com/api/*`.

### ⚠️ `--branch=main` no es opcional

La rama de producción del proyecto `vivord2` es **`main`**; el repo git está en **`master`**. `wrangler pages deploy` sin `--branch` usa la rama git actual, así que el deploy entra como **preview** (`master.vivord2.pages.dev`): imprime `Deployment complete!` y **vivo-rd.com no cambia**. Es un éxito falso, y así estuvo el script hasta 2026-07-10.

Verificar **siempre** contra el dominio real, no contra la URL `*.pages.dev` que imprime wrangler:

```powershell
curl.exe -s "https://vivo-rd.com/?cb=1" | Select-String "adsbygoogle"   # debe estar vacío
```

**TLS intermitente:** wrangler puede abortar a mitad de subida con `SELF_SIGNED_CERT_IN_CHAIN` (afecta también a `sparrow.cloudflare.com`, que es solo telemetría). Es transitorio: reintentar. **No** desactivar la verificación TLS ni usar `NODE_TLS_REJECT_UNAUTHORIZED=0` — expondría el token de Cloudflare.

### Verificar en vivo

- https://vivo-rd.com
- Favicon: https://vivo-rd.com/assets/img/favicon.svg (debe ser a color, no potrace)
- API: https://vivo-rd.com/api/proxy (solo URLs en allowlist)
- `https://vivo-rd.com/ads.txt` → plantilla comentada (AdSense retirado)
- `https://vivo-rd.com/app-ads.txt` → `google.com, pub-9983636461587656, DIRECT, f08c47fec0942fa0` (**AdMob depende de esto**)

---

## 6. Flujo ANDROID — paso a paso (reproducir)

### Requisitos

- Node.js 18+
- Android Studio (SDK 34+, Build-Tools, JDK 17)
- `JAVA_HOME` → `C:\Program Files\Android\Android Studio\jbr`

### Setup inicial (una vez)

```powershell
npm install
npm run android:add          # Si no existe carpeta android/
npm run android:keystore     # Crea .jks + keystore.properties (guardar contraseña)
```

### Ciclo de desarrollo

```powershell
npm run android:prep         # retheme + retheme:radios + www:sync + cap sync
npm run android:open         # Abre Android Studio
# Run ▶ en emulador o dispositivo USB
```

### Release para Play Store

```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
npm run android:release      # brand:sync + icons + sync + gradle bundleRelease
```

Salida: `dist/android-release/vivord-1.0.10.aab` (ajustar versión en `android-release.mjs` y `build.gradle` antes de nueva release).

### Subir a Play Console

1. https://play.google.com/console
2. App **VivoRD** → Producción → crear release → subir `.aab` (**manual** si usas browser MCP con extensión).
3. Notas es-419: copiar de `dist/android-release/PLAY-STORE-NOTES-X.Y.Z.txt`.
4. Política privacidad: https://vivo-rd.com/privacidad.html

### Probar APK en dispositivo

```powershell
adb install -r dist\android-release\vivord-1.0.10.apk
```

---

## 7. Servicios, cuentas y URLs

| Servicio | Detalle |
|----------|---------|
| **Dominio** | vivo-rd.com |
| **Cloudflare Pages** | Proyecto `vivord2`, output `dist/vivord-pages` |
| **Cloudflare Worker API** | `vivord-api` en `cloudflare/` (ruta `/api/*`) |
| **Wrangler** | Autenticado con la cuenta Google del owner (`wrangler whoami`) |
| **GitHub** | https://github.com/ycelso/vivord |
| **Google Play** | App `com.vivord.app`, consola Play (login Google del owner) |
| **AdSense** | ❌ Retirado (rechazo "contenido de bajo valor"). No reenviar a revisión |
| **AdMob** | `pub-9983636461587656` — publica en `app-ads.txt`, sostiene los ingresos de la app |
| **Afiliado / Adsterra** | Implementados, apagados. Faltan enlace de afiliado y zona Adsterra |
| **Email contacto** | contacto@vivo-rd.com |

---

## 8. Scripts npm — referencia rápida

| Comando | Uso |
|---------|-----|
| `npm run retheme` / `retheme:radios` | Regenerar HTML |
| `npm run build` | Actualizar catálogo desde fuente |
| `npm run brand:sync` | Logos diseñador → assets + favicon SVG |
| `npm run deploy:prep` | Pre-deploy (allowlist, legal, sitemap) |
| `npm run pages:deploy` | Deploy completo a Cloudflare |
| `npm run www:sync` | Sitio → carpeta `www/` |
| `npm run android:prep` | Preparar app Android |
| `npm run android:release` | APK + AAB firmados |
| `npm run android:icons` | Launcher + splash desde logo |
| `npm run verify:streams` | Auditar streams rotos |
| `npm run validate:links` | Enlaces internos |
| `npm run test:ads` | Guard nativo + consentimiento del loader Adsterra |
| `npm run play-store:screenshots` | Capturas para ficha Play |

Lista completa en `package.json`.

---

## 9. Limitaciones y gotchas conocidos

1. **`npm run start:static` no incluye API** — canales HLS y proxy no funcionan sin Worker/servidor Node.
2. **Favicon:** no copiar `logos/logo.svg` → `favicon.svg`; usar `favicon-svg.mjs`.
3. **Playwright MCP + extensión Edge:** navega y rellena formularios, pero **bloquea upload de archivos** (`DOM.setFileInputFiles: Not allowed`). AAB manual o Playwright sin extensión.
4. **Login Google automatizado** en browser MCP: no fiable; sesión GitHub web sí funcionó en Cursor browser.
5. **`gh` CLI sin auth** — usar `git` directo o completar `gh auth login`.
6. **Keystore:** sin `android/release/vivord-upload.jks` + contraseña no se puede firmar updates Play.
7. **App necesita internet** y backend en vivo-rd.com; modo offline limitado.
8. **`logos/`** puede tener solo `logo.svg` (potrace); PNGs de marca deben estar en `logos/` para `brand:sync` o ya procesados en `assets/img/`.
9. **Deploy Pages sin `--branch=main`** → entra como preview y vivo-rd.com no cambia, aunque wrangler diga `Deployment complete!`. Ver §5.
10. **`app-ads.txt` nunca debe derivar de `ADSENSE_CLIENT`** — vaciar AdSense borraría la verificación de AdMob y con ella los ingresos de la app.
11. **Ninguna red publicitaria web dentro del WebView.** Mezclar otra red con AdMob puede costar la cuenta AdMob. Guard: `window.VIVORD_IS_NATIVE` en `assets/js/adsterra.js` + CSS `html.capacitor-app .ad-slot { display: none }`. Correr `npm run test:ads` tras tocarlo.
13. **`www:sync` NO actualiza la app.** Copia el sitio a `www/`, pero quien lleva `www/` → `android/app/src/main/assets/public/` es `npx cap sync`. Usar **`npm run android:sync`** (hace las dos cosas) o `android:prep`. Esa carpeta está gitignorada, así que un desfase no se ve en `git status`. Comprobar antes de cada release:
    ```powershell
    Get-ChildItem android/app/src/main/assets/public -Filter *.html -Recurse | Select-String "adsbygoogle" | Measure-Object
    ```
    Debe dar 0. En 2026-07-10 esta carpeta llevaba el `<script>` de AdSense **directo en el `<head>`, sin guard**, y un `adsense.js` antiguo sin `VIVORD_IS_NATIVE`: la app cargaba AdSense junto a AdMob dentro del WebView.
12. **No reactivar AdSense.** El rechazo es sobre el producto, no sobre el código; insistir arriesga la cuenta Google que sostiene AdMob.

---

## 10. Estado al cierre de la sesión (2026-07-10)

| Área | Estado |
|------|--------|
| Web producción | vivo-rd.com **sin anuncios**; AdSense retirado y verificado contra el dominio |
| Cloudflare | Wrangler OK, proyecto `vivord2`, rama producción `main` |
| Monetización web | Afiliado + Adsterra implementados, **apagados**: faltan enlace de afiliado y zona Adsterra |
| Monetización app | AdMob intacto; `app-ads.txt` sirve `pub-9983636461587656` |
| `www/` | Sincronizado (`www:sync`), sin AdSense |
| Android código | 1.0.10 / versionCode 11 |
| Play Store | 1.0.10 enviada a revisión (desde 1.0.8 en prod) |
| Git | `origin/master` al día hasta `9420bb1` |
| gh CLI | Pendiente autenticación |
| Keystore / contraseñas | Solo en máquina local, no en git |

**Lo único pendiente que requiere al owner:** sacar el enlace de afiliado (Surfshark/NordVPN) y crear la zona Social Bar en Adsterra. Pegar cada uno en `scripts/site-config.mjs`, luego `retheme`, `retheme:radios`, `pages:deploy`.

---

## 11. Tareas típicas para quien retome

**Cambio en el sitio web:**
1. Editar scripts/plantillas o HTML fuente.
2. `npm run retheme` (+ radios si aplica).
3. `npm run deploy:prep && npm run pages:deploy`.
4. **Verificar contra vivo-rd.com**, no contra la URL `*.pages.dev` que imprime wrangler.
5. Si afecta app: `npm run android:prep` o release.

**Activar la monetización web (pendiente):**
1. Enlace de afiliado → `AFFILIATE.href` en `scripts/site-config.mjs` (solo `https://`).
2. Zona Adsterra Social Bar → `ADSTERRA_SOCIAL_BAR` (URL del `invoke.js`, solo `https://`).
3. `npm run test:ads` → debe pasar.
4. `npm run retheme && npm run retheme:radios && npm run pages:deploy`.

**Nueva versión Android:**
1. Subir `versionCode` / `versionName` en `android/app/build.gradle`.
2. Actualizar versión en `scripts/android-release.mjs`.
3. Escribir `dist/android-release/PLAY-STORE-NOTES-X.Y.Z.txt`.
4. `npm run android:release` → subir AAB a Play Console.

**Cambio de logo/marca:**
1. Colocar PNGs en `logos/` (ver tamaños en `sync-brand-assets.mjs`).
2. `npm run brand:sync`.
3. `npm run android:icons`.
4. Redeploy web + rebuild Android.

---

## 12. Documentación existente en el repo

- `README.md` — overview y comandos básicos.
- `ANDROID.md` — Capacitor, release, Play Store, troubleshooting.
- `DEPLOY-CLOUDFLARE.md` — Pages + Worker, variables, DNS.
- `CALIDAD-CONTENIDO.md` — por qué solo ~7 fichas llevan `noindex`, hubs de ciudad/género, de-duplicación de descripciones. Sustituye a los `INSTRUCCION-ADSENSE*.md`, borrados en Fase G.

---

*Generado para handoff de subagentes. Actualizar este archivo cuando cambien versión Android, deploy, dominio o flujos críticos.*
