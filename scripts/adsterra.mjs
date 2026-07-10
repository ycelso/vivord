import { ADSTERRA_SOCIAL_BAR } from './site-config.mjs';
import { ASSET_VER } from './adsense.mjs';

const escapeAttr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function isAdsterraEnabled() {
  return /^https:\/\//i.test(ADSTERRA_SOCIAL_BAR);
}

/** Loader de Adsterra. El script real solo se inyecta tras consentimiento y nunca en la app. */
export function adsterraFooterScript(depth = 0) {
  if (!isAdsterraEnabled()) return '';
  const p = depth ? '../'.repeat(depth) : './';
  return `
<script src="${p}assets/js/adsterra.js?v=${ASSET_VER}" data-adsterra-src="${escapeAttr(ADSTERRA_SOCIAL_BAR)}" defer></script>`;
}
