import { AFFILIATE } from './site-config.mjs';

const escapeAttr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function isAffiliateEnabled() {
  return /^https:\/\//i.test(AFFILIATE.href);
}

/**
 * Banner de afiliado. Reusa .ad-slot: ya está oculto en la app nativa
 * (html.capacitor-app) y en el modo radio inmersivo.
 * ponytail: enlace estático, sin JS ni consentimiento — no fija cookies propias.
 */
export function affiliateBanner() {
  if (!isAffiliateEnabled()) return '';
  const { href, title, text, cta } = AFFILIATE;
  return `<aside class="ad-slot" data-nosnippet aria-label="Publicidad">
  <span class="ad-slot__label">Publicidad</span>
  <a class="affiliate-cta" href="${escapeAttr(href)}" target="_blank" rel="sponsored nofollow noopener">
    <strong class="affiliate-cta__title">${escapeAttr(title)}</strong>
    <span class="affiliate-cta__text">${escapeAttr(text)}</span>
    <span class="affiliate-cta__btn">${escapeAttr(cta)}</span>
  </a>
</aside>`;
}
