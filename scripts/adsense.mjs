import { ADSENSE_CLIENT, ADMOB_PUBLISHER_ID } from './site-config.mjs';

// Cache-busting para cambios críticos (ej. banner cookies).
// Se evalúa en tiempo de build (Node) y queda fijo en el HTML generado.
export const ASSET_VER =
  (process.env.ASSET_VER || process.env.BUILD_ID || '').trim() || String(Date.now());

export function isAdsenseEnabled() {
  return Boolean(ADSENSE_CLIENT && /^ca-pub-\d+$/i.test(ADSENSE_CLIENT));
}

export function adsenseHeadSnippet() {
  if (!isAdsenseEnabled()) {
    return '  <meta name="vivord-adsense-client" content="">\n';
  }
  const client = ADSENSE_CLIENT;
  return `  <meta name="google-adsense-account" content="${client}">
  <meta name="vivord-adsense-client" content="${client}">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}" crossorigin="anonymous"></script>
`;
}

/** Desactivar slot bajo el reproductor durante revisión AdSense (home y listados siguen con anuncios). */
export const ADSENSE_BELOW_PLAYER = false;

/** Bloque display responsivo (debajo del reproductor o entre secciones). */
export function adSlotMarkup(depth = 0, { belowPlayer = false } = {}) {
  if (!isAdsenseEnabled()) return '';
  if (belowPlayer && !ADSENSE_BELOW_PLAYER) return '';
  const client = ADSENSE_CLIENT;
  return `<aside class="ad-slot" data-nosnippet aria-label="Publicidad">
  <span class="ad-slot__label">Publicidad</span>
  <ins class="adsbygoogle ad-slot__unit"
    style="display:block;min-height:90px"
    data-ad-client="${client}"
    data-ad-format="auto"
    data-full-width-responsive="true"></ins>
</aside>`;
}

export function adsFooterScripts(depth = 0) {
  const p = depth ? '../'.repeat(depth) : './';
  const consent = `<script src="${p}assets/js/cookie-consent.js?v=${ASSET_VER}" defer></script>`;
  if (!isAdsenseEnabled()) return consent;
  return `${consent}
<script src="${p}assets/js/adsense.js?v=${ASSET_VER}" defer></script>`;
}

export function generateAdsTxt() {
  if (!isAdsenseEnabled()) {
    return '# Cuando tengas tu ID de AdSense, define ADSENSE_CLIENT en scripts/site-config.mjs\n# y ejecuta: npm run deploy:prep\n';
  }
  const pubId = ADSENSE_CLIENT.replace(/^ca-pub-/i, 'pub-');
  return `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`;
}

/** app-ads.txt para verificación AdMob. Independiente de AdSense: la app sigue monetizando. */
export function generateAppAdsTxt() {
  if (!/^pub-\d+$/i.test(ADMOB_PUBLISHER_ID)) {
    return '# Define ADMOB_PUBLISHER_ID en scripts/site-config.mjs\n';
  }
  return `google.com, ${ADMOB_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0\n`;
}
