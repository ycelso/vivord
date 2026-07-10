import { SITE_NAME } from './site-config.mjs';
import { adsFooterScripts } from './adsense.mjs';
import { adsterraFooterScript } from './adsterra.mjs';
import { analyticsSnippet } from './analytics.mjs';

/** Pie de página: marca, copyright, disclaimer y enlaces legales (TV/Radios solo en cabecera). */
export function siteFooter(depth = 0) {
  const p = depth ? '../'.repeat(depth) : './';
  const year = new Date().getFullYear();
  const searchPlaceholder = depth ? 'Buscar canal o radio…' : 'Buscar canal…';

  return `<footer class="site-footer">
  <div class="container footer-inner">
    <div class="footer-col">
      <div class="footer-brand">${SITE_NAME.replace('RD', '')}<span>RD</span></div>
      <p class="footer-tagline">TV y radio dominicana en directo</p>
      <p class="footer-copy">© ${year} ${SITE_NAME}. Todos los derechos reservados.</p>
      <p class="footer-disclaimer">No somos emisora ni dueños de las señales; contenidos y marcas pertenecen a sus titulares.</p>
    </div>
    <nav class="footer-legal" aria-label="Información legal">
      <a href="${p}guias/">Guías</a>
      <a href="${p}sobre-vivord.html">Acerca de</a>
      <a href="${p}aviso-legal.html">Aviso legal</a>
      <a href="${p}privacidad.html">Privacidad</a>
      <a href="${p}terminos.html">Términos</a>
      <a href="${p}contacto.html">Contacto</a>
    </nav>
  </div>
</footer>
<div id="mobileSearch" class="mobile-search-overlay" role="dialog" aria-modal="true" aria-label="Buscar" aria-hidden="true">
  <div class="mobile-search-shell">
    <div class="mobile-search-container">
      <input type="search" placeholder="${searchPlaceholder}" id="mobileSearchInput" autocomplete="off" enterkeyhint="search">
      <button type="button" class="mobile-search-close" id="mobileSearchClose" aria-label="Cerrar">✕</button>
    </div>
    <div id="mobileSearchResults" class="mobile-search-results"></div>
  </div>
</div>
<div id="cookieConsent" class="cookie-consent" role="dialog" aria-live="polite" aria-label="Cookies" hidden>
  <p class="cookie-consent__text">Usamos cookies para publicidad y mejorar el sitio. <a href="${p}privacidad.html">Privacidad</a></p>
  <div class="cookie-consent__actions">
    <button type="button" class="cookie-consent__btn cookie-consent__btn--ghost" id="cookieReject">Rechazar</button>
    <button type="button" class="cookie-consent__btn" id="cookieAccept">Aceptar</button>
  </div>
</div>
${adsFooterScripts(depth)}${adsterraFooterScript(depth)}${analyticsSnippet()}`;
}
