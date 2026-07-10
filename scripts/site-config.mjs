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
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || SITE_URL)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** App nativa Capacitor (com.vivord.app), publicada en Google Play. */
export const ANDROID_PACKAGE = 'com.vivord.app';
