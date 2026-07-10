/** Configuración del sitio (sobrescribir con variables de entorno en producción). */
export const SITE_NAME = 'VivoRD';
export const SITE_URL = (process.env.SITE_URL || 'https://vivo-rd.com').replace(/\/$/, '');
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'contacto@vivo-rd.com';
// X/Twitter handle for attribution in cards (include leading @)
export const TWITTER_SITE = (process.env.TWITTER_SITE || '@VivoRD').trim();

/**
 * Google AdSense — desactivado: el sitio no cumple las políticas de contenido de AdSense.
 * Vacío = sin script, sin slots, sin ads.txt.
 * No se lee de process.env a propósito: evita reactivación accidental en el pipeline de deploy.
 * Para reactivar hay que editar esta línea a mano.
 */
export const ADSENSE_CLIENT = '';

/** AdMob (app Android) — independiente de AdSense; alimenta app-ads.txt. */
export const ADMOB_PUBLISHER_ID = (process.env.ADMOB_PUBLISHER_ID || 'pub-9983636461587656').trim();

/**
 * Banner de afiliado. Sin `href` no se renderiza nada.
 * Pega aquí tu enlace de afiliado (o usa AFFILIATE_URL en el entorno).
 */
/**
 * Cloudflare Web Analytics — token del beacon (Dashboard → Web Analytics → tu sitio).
 * Vacío = no se carga. Sin cookies ni fingerprinting: no requiere consentimiento.
 * No se carga en la app nativa (mediría el WebView y ensuciaría las métricas web).
 */
export const CF_ANALYTICS_TOKEN = (
  process.env.CF_ANALYTICS_TOKEN || 'e9404442a62f475288b0ecd5b2238c23'
).trim();

/**
 * Adsterra Social Bar — URL del script `invoke.js` de tu zona.
 * Vacío = no se carga. Nunca se sirve dentro de la app nativa (ver assets/js/adsterra.js):
 * mezclar otra red con AdMob en el WebView es motivo de suspensión de la cuenta AdMob.
 */
export const ADSTERRA_SOCIAL_BAR = (process.env.ADSTERRA_SOCIAL_BAR || '').trim();

export const AFFILIATE = {
  href: (process.env.AFFILIATE_URL || '').trim(),
  title: 'VivoRD sin bloqueos desde el extranjero',
  text: 'Algunas señales solo se ven desde República Dominicana. Con una VPN las abres desde cualquier país.',
  cta: 'Ver planes',
};
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || SITE_URL)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** App nativa Capacitor (com.vivord.app), publicada en Google Play. */
export const ANDROID_PACKAGE = 'com.vivord.app';
