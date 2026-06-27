# VivoRD — App Android (Capacitor)

La app Android empaqueta el mismo sitio web (HTML + JS) dentro de un **WebView nativo**. Las señales HLS y el proxy siguen yendo al servidor en **`https://vivo-rd.com`** (API en Cloudflare Worker).

## Requisitos en tu PC

1. **Node.js** 18+ (ya lo usas para el proyecto)
2. **Android Studio** (Ladybug o más reciente) con:
   - Android SDK Platform 34+
   - Android SDK Build-Tools
3. Variables de entorno (Android Studio suele configurarlas):
   - `ANDROID_HOME` o `ANDROID_SDK_ROOT`
   - `JAVA_HOME` (JDK 17)

## Instalación (una vez)

```powershell
cd c:\Users\monitoreo\Downloads\clon-tv
npm install
npm run android:add
```

## Generar / actualizar el proyecto Android

Cada vez que cambies HTML, CSS o JS del sitio:

```powershell
npm run android:prep
```

Equivale a `retheme` + `retheme:radios` + copiar a `www/` + `cap sync android`.

## Comportamiento en la app (vs web)

| Aspecto | Web | App Android |
|---------|-----|-------------|
| API / streams | Mismo origen | `https://vivo-rd.com/api/...` |
| AdSense / cookies | Banner + anuncios | **Desactivado** (WebView; futuro: AdMob nativo) |
| Botón atrás | Navegador | Historial o salir de la app |
| Sin internet | — | Aviso rojo abajo |
| Barra de estado | — | Oscura, contenido bajo notch (`safe-area`) |
| Radio en segundo plano | — | Notificación con play/pausa (`@jofr/capacitor-media-session`) |

### Radio en segundo plano (Android)

Al reproducir una emisora, la app muestra una **notificación persistente** y el audio sigue con la pantalla apagada o en otra app.

1. Reproduce una radio en la app.
2. Acepta **Notificaciones** si Android lo pide (Android 13+).
3. Minimiza o bloquea la pantalla.
4. Usa los controles de la notificación (▶ / ⏸).

Si Android 13+ no muestra la notificación, activa **Notificaciones** para VivoRD en Ajustes del teléfono.

En algunos teléfonos (Samsung, Xiaomi, etc.) desactiva **optimización de batería** para VivoRD si el audio se corta en segundo plano.

Tras cambiar JS nativo o plugins:

```powershell
npm run retheme:radios
npm run android:sync
```

## Probar en emulador o teléfono

```powershell
npm run android:open
```

En Android Studio: **Run** (▶) con un dispositivo USB (depuración USB activada) o emulador.

O desde terminal (con dispositivo conectado):

```powershell
npm run android:run
```

## Cómo funciona el API en la app

| Entorno | Reproducción |
|---------|----------------|
| Navegador web | `/api/proxy` en el mismo dominio |
| App Android | `https://vivo-rd.com/api/proxy` (automático vía `assets/js/api-config.js`) |

**Importante:** La app necesita **internet** y que el backend esté desplegado en `vivo-rd.com`. Puedes probar antes del dominio cambiando la URL del API:

```javascript
// En Chrome DevTools remoto o consola WebView:
localStorage.setItem('vivord_api_base', 'http://10.0.2.2:3000'); // emulador → PC local
location.reload();
```

En teléfono físico usa la IP de tu PC en la red Wi‑Fi, por ejemplo `http://192.168.1.50:3000`.

## APK / AAB firmado (Play Store)

### 1. Crear keystore (solo una vez)

En PowerShell, elige una contraseña segura y **guárdala** (sin ella no podrás actualizar la app en Play):

```powershell
cd c:\Users\monitoreo\Downloads\clon-tv
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
$env:KEYSTORE_PASSWORD="TU_CONTRASEÑA_SEGURA"
npm run android:keystore
```

Se crean:

- `android/release/vivord-upload.jks` — **haz copia de seguridad**
- `android/keystore.properties` — no se sube a git

### 2. Compilar release

```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
npm run android:release
```

Salida en `dist/android-release/`:

| Archivo | Uso |
|---------|-----|
| `vivord-YYYY-MM-DD.apk` | Instalar en tu móvil |
| `vivord-YYYY-MM-DD.aab` | Subir a [Google Play Console](https://play.google.com/console) |

### 3. Probar en tu celular (release + radio en segundo plano)

1. **Opciones de desarrollador** → **Depuración USB** activada.
2. Conecta el USB y acepta la autorización.
3. Instala:

```powershell
adb install -r dist\android-release\vivord-2026-05-26.apk
```

(Ajusta el nombre del archivo al que generó el build.)

4. Abre VivoRD → una radio → **Play**.
5. Pulsa **Home** o apaga la pantalla: debe seguir sonando.
6. Revisa la **notificación** con play/pausa (en Android 13+: Ajustes → Apps → VivoRD → Notificaciones **activadas**).

### 4. Subir a Play Store (resumen)

1. Cuenta desarrollador Google Play (~USD 25, pago único).
2. Crear app → subir el **.aab**.
3. Política de privacidad: `https://vivo-rd.com/privacidad.html`
4. Declarar contenido de **terceros** (señales de emisoras).
5. Ficha: capturas, descripción, icono 512×512 (ya en la app).

## APK debug (pruebas rápidas en Android Studio)

**Build → Build APK(s)** → `android/app/build/outputs/apk/debug/app-debug.apk`

## Icono y splash

El icono del launcher y la pantalla de arranque se generan desde tu logo en `assets/img/`:

```powershell
npm run android:icons
```

Usa, en este orden: `vivord-logo-icon.png` → `vivord-logo.png` → `vivord-logo-full.png`.

Luego en Android Studio: **Build → Clean Project → Run**.

Para regenerar el PNG del emblema desde el logo maestro: `npm run build:logo` (requiere `vivord-logo-full.png`).

Splash: fondo `#0a0a0b` (`capacitor.config.json` + `splash.xml`).

## ID de la app

- **Application ID:** `com.vivord.app`
- **Nombre visible:** VivoRD

## Modo solo web (sin empaquetar)

Si prefieres que la app abra directamente el sitio publicado (sin copiar 600 HTML al APK), edita `capacitor.config.json`:

```json
"server": {
  "url": "https://vivo-rd.com",
  "cleartext": false
}
```

Luego `npm run android:sync`. El APK será más pequeño pero **requiere** que el sitio ya esté online.

## Solución de problemas

| Problema | Qué hacer |
|----------|-----------|
| Pantalla en blanco | `npm run android:sync` y revisar Logcat en Android Studio |
| No reproduce TV/radio | Comprueba que `vivo-rd.com/api/proxy` responda; prueba `localStorage` con tu servidor |
| iframes no cargan | Ya permitidos en `allowNavigation` del config |
| Build falla JDK | Usa JDK 17 en Android Studio → Settings → Build Tools |

## Publicar en Google Play

1. Cuenta desarrollador Google Play (~USD 25, pago único).
2. Política de privacidad en URL pública (`https://vivo-rd.com/privacidad.html`).
3. AAB firmado en release.
4. Declarar que la app reproduce **contenido de terceros** y enlaces a emisoras.
