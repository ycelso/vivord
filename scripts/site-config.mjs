/** Configuración del sitio (sobrescribir con variables de entorno en producción). */
export const SITE_NAME = 'VivoRD';
export const SITE_URL = (process.env.SITE_URL || 'https://vivo-rd.com').replace(/\/$/, '');
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'contacto@vivo-rd.com';
// X/Twitter handle for attribution in cards (include leading @)
export const TWITTER_SITE = (process.env.TWITTER_SITE || '@VivoRD').trim();

/**
 * Google AdSense — ID del editor (ej. ca-pub-1234567890123456).
 * También: set ADSENSE_CLIENT=ca-pub-... antes de npm run build / deploy:prep
 */
export const ADSENSE_CLIENT = (process.env.ADSENSE_CLIENT || 'ca-pub-9983636461587656').trim();
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || SITE_URL)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** App nativa Capacitor (com.vivord.app), publicada en Google Play. */
export const ANDROID_PACKAGE = 'com.vivord.app';
