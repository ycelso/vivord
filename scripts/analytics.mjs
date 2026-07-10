import { CF_ANALYTICS_TOKEN } from './site-config.mjs';

export function isAnalyticsEnabled() {
  return /^[a-f0-9]{32}$/i.test(CF_ANALYTICS_TOKEN);
}

/**
 * Beacon de Cloudflare Web Analytics.
 *
 * Sin cookies ni fingerprinting → no va detrás del banner de consentimiento.
 * No se carga en la app nativa: `window.Capacitor` lo inyecta el WebView antes
 * que cualquier script del sitio, así que el guard funciona aunque este inline
 * corra antes que capacitor-native.js (que es `defer`).
 */
export function analyticsSnippet() {
  if (!isAnalyticsEnabled()) return '';
  return `
<script>(function(){try{if(window.VIVORD_IS_NATIVE||window.Capacitor?.isNativePlatform?.())return;}catch(e){}var s=document.createElement('script');s.defer=true;s.src='https://static.cloudflareinsights.com/beacon.min.js';s.setAttribute('data-cf-beacon','{"token":"${CF_ANALYTICS_TOKEN}"}');document.head.appendChild(s);})();</script>`;
}
