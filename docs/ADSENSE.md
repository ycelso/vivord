# Google AdSense en VivoRD

## 1. Solicitar cuenta

1. https://www.google.com/adsense
2. Sitio: **https://vivo-rd.com**
3. País: República Dominicana
4. Completa datos de pago

## 2. Código de verificación

Google te dará un ID **`ca-pub-XXXXXXXXXXXXXXXX`**.

En PowerShell (antes de build/deploy):

```powershell
$env:ADSENSE_CLIENT="ca-pub-TU-ID-AQUI"
```

O edita `scripts/site-config.mjs` y asigna `ADSENSE_CLIENT` (solo para builds locales).

Luego:

```bash
npm run deploy:prep
npm run build:quick
npm run build:radios:quick
npm run pages:deploy
```

## 3. Verificar en AdSense

En el panel de AdSense → **Sitios** → comprobar que detecta el script en vivo-rd.com.

## 4. Tras la aprobación

- Activa **anuncios automáticos** o crea unidades display en AdSense.
- Los bloques del sitio se rellenan cuando el usuario pulsa **Aceptar** en el banner de cookies.

## Ubicación de anuncios

- Entre Destacadas y Principales (TV y Radios)
- Debajo del reproductor (fichas de canal/radio)
- Sin anuncios sobre el botón play

## ads.txt

Se genera en `ads.txt` al ejecutar `npm run deploy:prep` cuando `ADSENSE_CLIENT` está definido.
