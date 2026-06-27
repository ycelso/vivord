/**
 * UX móvil: pestañas TV/Radios, búsqueda desplegable en cabecera.
 */
function isMobileUserAgent() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

function applyDeviceClass() {
  const isMobileUA = isMobileUserAgent();
  const root = document.documentElement;
  root.classList.toggle('is-mobile', isMobileUA);
  root.classList.toggle('is-desktop', !isMobileUA);
  return isMobileUA;
}

function removeDesktopMobileChrome() {
  document.querySelector('.nav-mobile-tabs')?.remove();
  document.querySelector('.nav-mobile-search')?.remove();
  const searchBtn = document.getElementById('navSearchMobile');
  searchBtn?.remove();
  document.getElementById('navToggle')?.remove();
  document.getElementById('mobileNavDrawer')?.remove();
}

function initMobileUx() {
  const isMobileUA = applyDeviceClass();
  if (!isMobileUA) {
    removeDesktopMobileChrome();
  }

  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const navSearchBtn = document.getElementById('navSearchMobile');
  const headerSearchPanel = document.querySelector('.nav-mobile-search');
  const headerSearchInput = document.getElementById('mobileHeaderSearch');
  const mobileSearch = document.getElementById('mobileSearch');
  const mobileSearchInput = document.getElementById('mobileSearchInput');
  const mobileSearchClose = document.getElementById('mobileSearchClose');

  let navBackdrop = document.getElementById('navBackdrop');
  if (!navBackdrop) {
    navBackdrop = document.createElement('div');
    navBackdrop.id = 'navBackdrop';
    navBackdrop.className = 'nav-backdrop';
    document.body.appendChild(navBackdrop);
  }

  let navDrawer = document.getElementById('mobileNavDrawer');
  if (!navDrawer && navLinks) {
    navDrawer = document.createElement('nav');
    navDrawer.id = 'mobileNavDrawer';
    navDrawer.className = 'mobile-nav-drawer';
    navDrawer.setAttribute('aria-label', 'Menú principal');
    navDrawer.innerHTML = navLinks.innerHTML;
    document.body.appendChild(navDrawer);
  }

  let backdropMuteUntil = 0;

  function isNavOpen() {
    return document.body.classList.contains('nav-menu-open');
  }

  function isHeaderSearchOpen() {
    return document.body.classList.contains('mobile-header-search-open');
  }

  function setBodyLock(locked) {
    document.body.classList.toggle('is-scroll-locked', locked);
  }

  function closeNav() {
    document.body.classList.remove('nav-menu-open');
    navToggle?.setAttribute('aria-expanded', 'false');
    navToggle?.setAttribute('aria-label', 'Abrir menú');
    navDrawer?.setAttribute('aria-hidden', 'true');
    if (!isHeaderSearchOpen() && !mobileSearch?.classList.contains('show')) {
      navBackdrop.classList.remove('show');
      navBackdrop.setAttribute('aria-hidden', 'true');
      setBodyLock(false);
    }
  }

  function openNav() {
    closeHeaderSearch();
    closeMobileSearch();
    document.body.classList.add('nav-menu-open');
    navToggle?.setAttribute('aria-expanded', 'true');
    navToggle?.setAttribute('aria-label', 'Cerrar menú');
    navDrawer?.setAttribute('aria-hidden', 'false');
    setBodyLock(true);
    backdropMuteUntil = Date.now() + 450;
    requestAnimationFrame(() => {
      navBackdrop.classList.add('show');
      navBackdrop.setAttribute('aria-hidden', 'false');
    });
  }

  function toggleNav() {
    if (isNavOpen()) closeNav();
    else openNav();
  }

  function closeHeaderSearch() {
    document.body.classList.remove('mobile-header-search-open');
    navSearchBtn?.setAttribute('aria-expanded', 'false');
    navSearchBtn?.setAttribute('aria-label', 'Buscar');
    headerSearchInput?.setAttribute('aria-expanded', 'false');
    const results = document.getElementById('mobileHeaderSearchResults');
    if (results) results.hidden = true;
    if (!isNavOpen() && !mobileSearch?.classList.contains('show')) {
      navBackdrop.classList.remove('show');
      navBackdrop.setAttribute('aria-hidden', 'true');
      setBodyLock(false);
    }
  }

  function openHeaderSearch() {
    if (!headerSearchPanel) return false;
    closeNav();
    closeMobileSearch();
    document.body.classList.add('mobile-header-search-open');
    navSearchBtn?.setAttribute('aria-expanded', 'true');
    navSearchBtn?.setAttribute('aria-label', 'Cerrar búsqueda');
    headerSearchInput?.setAttribute('aria-expanded', 'false');
    requestAnimationFrame(() => headerSearchInput?.focus({ preventScroll: true }));
    return true;
  }

  function toggleHeaderSearch() {
    if (isHeaderSearchOpen()) closeHeaderSearch();
    else openHeaderSearch();
  }

  function closeMobileSearch() {
    if (!mobileSearch) return;
    mobileSearch.classList.remove('show');
    mobileSearch.setAttribute('aria-hidden', 'true');
    if (!isNavOpen() && !isHeaderSearchOpen()) setBodyLock(false);
  }

  function openMobileSearch() {
    if (!mobileSearch) return;
    closeNav();
    closeHeaderSearch();
    mobileSearch.classList.add('show');
    mobileSearch.setAttribute('aria-hidden', 'false');
    setBodyLock(true);
    requestAnimationFrame(() => mobileSearchInput?.focus());
  }

  const mobileTabs = document.querySelector('.nav-mobile-tabs');
  const menuOnMobile = navToggle && !mobileTabs;

  if (menuOnMobile && navDrawer) {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-controls', 'mobileNavDrawer');

    navToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleNav();
    });

    navDrawer.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        closeNav();
      });
    });
  }

  if (navSearchBtn) {
    navSearchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (headerSearchPanel) {
        toggleHeaderSearch();
      } else {
        openMobileSearch();
      }
    });
  }

  navBackdrop.addEventListener('click', () => {
    if (Date.now() < backdropMuteUntil) return;
    if (isNavOpen()) closeNav();
  });

  document.addEventListener(
    'click',
    (e) => {
      if (!isHeaderSearchOpen()) return;
      const t = e.target;
      if (
        headerSearchPanel?.contains(t) ||
        navSearchBtn?.contains(t)
      ) {
        return;
      }
      closeHeaderSearch();
    },
    true
  );

  if (mobileSearchClose) {
    mobileSearchClose.addEventListener('click', closeMobileSearch);
  }

  if (mobileSearch) {
    mobileSearch.addEventListener('click', (e) => {
      if (e.target === mobileSearch) closeMobileSearch();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeHeaderSearch();
    closeMobileSearch();
    closeNav();
  });

  window.addEventListener(
    'resize',
    () => {
      if (window.innerWidth > 900) {
        closeHeaderSearch();
        closeNav();
      }
    },
    { passive: true }
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileUx);
} else {
  initMobileUx();
}
