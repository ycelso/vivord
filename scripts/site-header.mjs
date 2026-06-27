import { brandMark, brandWordmark } from './brand-markup.mjs';

/** Cabecera compartida (desktop: enlaces; móvil: pestañas TV / Radios). */
export function siteHeader(active = 'tv', depth = 0, searchPlaceholder = 'Buscar canal…') {
  const p = depth ? '../'.repeat(depth) : './';
  const tvActive = active === 'tv';
  const radioActive = active === 'radios';
  const searchMode = tvActive ? 'tv' : 'radio';
  const mobilePlaceholder = tvActive ? 'Buscar canal…' : 'Buscar emisora…';
  return `<a href="#main-content" class="skip-link">Saltar al contenido</a>
<header class="site-header">
  <div class="container nav-inner">
    <a href="${p}index.html" class="brand">
      ${brandMark(depth)}
      ${brandWordmark()}
    </a>
    <nav class="nav-links" id="navLinks">
      <a href="${p}index.html" class="nav-link${tvActive ? ' active' : ''}">TV en Vivo</a>
      <a href="${p}radios.html" class="nav-link${radioActive ? ' active' : ''}">Radios</a>
    </nav>
    <div class="nav-search">
      <svg class="nav-search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      <input type="search" placeholder="${searchPlaceholder}" id="searchInput" autocomplete="off">
    </div>
    <div class="nav-actions">
    <button type="button" class="nav-toggle nav-toggle--search" id="navSearchMobile" aria-label="Buscar" aria-expanded="false" aria-controls="mobileHeaderSearch">
      <svg class="nav-toggle__icon-search" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      <svg class="nav-toggle__icon-close" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    <button type="button" class="nav-toggle nav-toggle--menu" id="navToggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="navLinks">
      <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
    </div>
  </div>
  <div class="nav-mobile-tabs container" role="tablist" aria-label="Sección">
    <a href="${p}index.html" class="nav-mobile-tab${tvActive ? ' is-active' : ''}" role="tab"${tvActive ? ' aria-selected="true"' : ''}>TV en Vivo</a>
    <a href="${p}radios.html" class="nav-mobile-tab${radioActive ? ' is-active' : ''}" role="tab"${radioActive ? ' aria-selected="true"' : ''}>Radios</a>
  </div>
  <div class="nav-mobile-search container" data-search-mode="${searchMode}">
    <div class="nav-mobile-search__field">
      <svg class="nav-search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      <input type="search" id="mobileHeaderSearch" placeholder="${mobilePlaceholder}" autocomplete="off" enterkeyhint="search" aria-controls="mobileHeaderSearchResults" aria-expanded="false">
    </div>
    <div id="mobileHeaderSearchResults" class="nav-mobile-search__results" role="listbox" hidden></div>
  </div>
</header>`;
}
