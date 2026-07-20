// Búsqueda local — carga diferida del índice
let channelsCache = null;
let channelsLoading = null;

function isAppRadioOnly() {
  return (
    document.documentElement.classList.contains('app-radio-only') ||
    document.querySelector('meta[name="vivord-app-mode"][content="radio-only"]') != null
  );
}

function effectiveSearchMode(mode) {
  if (isAppRadioOnly()) return 'radio';
  return mode;
}

async function loadChannels() {
  if (channelsCache) return channelsCache;
  if (channelsLoading) return channelsLoading;

  channelsLoading = (async () => {
    const base = window.BASE_URL || './';
    const res = await fetch(`${base}data/search-index.json`);
    if (!res.ok) throw new Error('search-index');
    const data = await res.json();
    channelsCache = data;
    return data;
  })();

  try {
    return await channelsLoading;
  } finally {
    channelsLoading = null;
  }
}

function preloadSearchIndex() {
  if (!channelsCache && !channelsLoading) loadChannels().catch(() => {});
}

function resolveAssetUrl(path, base) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const b = base || window.BASE_URL || './';
  if (path.startsWith('./') || path.startsWith('../')) return b + path.replace(/^\.\//, '');
  return b + path;
}

function localSearch(term, mode = 'all') {
  mode = effectiveSearchMode(mode);
  const q = term.toLowerCase();
  const match = (item) => item.name.toLowerCase().includes(q) || item.slug.includes(q);
  const channels =
    mode === 'radio'
      ? []
      : (channelsCache?.channels || []).filter(match).slice(0, 12);
  const stations =
    mode === 'tv'
      ? []
      : (channelsCache?.stations || []).filter(match).slice(0, mode === 'radio' ? 12 : 8);
  return { channels, stations };
}

document.addEventListener('DOMContentLoaded', () => {
  const handleGlobalSearch = (inputElement, resultsContainer, isMobile = false, mode = 'all') => {
    if (!inputElement) return;

    inputElement.addEventListener('focus', preloadSearchIndex, { once: true });

    if (!resultsContainer) {
      if (isMobile) {
        resultsContainer =
          document.getElementById('mobileSearchResults') ||
          (() => {
            const el = document.createElement('div');
            el.id = 'mobileSearchResults';
            el.className = 'mobile-search-results';
            const shell = inputElement.closest('.mobile-search-shell');
            if (shell) shell.appendChild(el);
            else inputElement.parentElement.after(el);
            return el;
          })();
      } else {
        resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results-dropdown';
        const searchWrapper = inputElement.closest('.search-bar') || inputElement.parentElement;
        searchWrapper.appendChild(resultsContainer);
        searchWrapper.style.position = 'relative';
      }
    }

    let searchTimeout;

    inputElement.addEventListener('keyup', (e) => {
      clearTimeout(searchTimeout);
      const term = e.target.value.toLowerCase().trim();

      if (term.length < 2) {
        if (isMobile) {
          if (resultsContainer.id === 'mobileHeaderSearchResults') {
            resultsContainer.hidden = true;
            inputElement.setAttribute('aria-expanded', 'false');
          } else {
            resultsContainer.innerHTML =
              '<p class="mobile-search-hint">Escribe al menos 2 caracteres…</p>';
          }
        } else {
          resultsContainer.innerHTML = '';
          resultsContainer.classList.remove('show');
        }
        return;
      }

      if (isMobile) {
        resultsContainer.innerHTML = '<p class="mobile-search-hint">Buscando…</p>';
      } else {
        resultsContainer.innerHTML =
          '<div style="padding:15px; text-align:center; color:var(--text-muted);">Buscando...</div>';
        resultsContainer.classList.add('show');
      }

      searchTimeout = setTimeout(async () => {
        try {
          await loadChannels();
        } catch {
          resultsContainer.innerHTML =
            '<p class="mobile-search-hint">Error al cargar búsqueda</p>';
          return;
        }

        const data = localSearch(term, mode);

        if (data.channels.length === 0 && data.stations.length === 0) {
          resultsContainer.innerHTML =
            '<p class="mobile-search-hint">No se encontraron resultados</p>';
          return;
        }

        let html = '';
        const itemClass = isMobile ? 'mobile-result-item' : 'search-item';
        const base = window.BASE_URL || './';

        if (data.channels.length > 0) {
          html += isMobile
            ? '<p class="mobile-search-category">Canales</p>'
            : '<div class="search-category-title">📺 Canales</div>';
          data.channels.forEach((channel) => {
            const href = channel.url.startsWith('http') ? channel.url : base + channel.url;
            const img = resolveAssetUrl(channel.img, base);
            html += `<a href="${href}" class="${itemClass}"><img src="${img}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span>${channel.name}</span></a>`;
          });
        }

        if (data.stations.length > 0) {
          html += isMobile
            ? '<p class="mobile-search-category">Radios</p>'
            : '<div class="search-category-title">📻 Emisoras</div>';
          data.stations.forEach((station) => {
            const href = station.url.startsWith('http') ? station.url : base + station.url;
            const img = resolveAssetUrl(station.img, base);
            const round = isMobile ? ' mobile-result-item__img--round' : '';
            html += `<a href="${href}" class="${itemClass}"><img class="${round.trim()}" src="${img}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span>${station.name}</span></a>`;
          });
        }

        resultsContainer.innerHTML = html;
        if (!isMobile) {
          resultsContainer.classList.add('show');
        } else if (resultsContainer.id === 'mobileHeaderSearchResults') {
          resultsContainer.hidden = false;
          inputElement.setAttribute('aria-expanded', 'true');
        }
      }, 200);
    });

    if (!isMobile) {
      document.addEventListener('click', (e) => {
        if (!inputElement.contains(e.target) && !resultsContainer.contains(e.target)) {
          resultsContainer.classList.remove('show');
        }
      });
      inputElement.addEventListener('focus', () => {
        preloadSearchIndex();
        if (inputElement.value.length >= 2) resultsContainer.classList.add('show');
      });
    }
  };

  handleGlobalSearch(document.getElementById('searchInput'), null, false, effectiveSearchMode('all'));
  handleGlobalSearch(document.getElementById('heroSearch'), null, false, effectiveSearchMode('all'));
  handleGlobalSearch(document.getElementById('heroRadioSearch'), null, false, 'radio');
  handleGlobalSearch(document.getElementById('mobileSearchInput'), null, true, effectiveSearchMode('all'));

  const mobileHeaderWrap = document.querySelector('.nav-mobile-search');
  const mobileHeaderInput = document.getElementById('mobileHeaderSearch');
  const mobileHeaderResults = document.getElementById('mobileHeaderSearchResults');
  if (mobileHeaderWrap && mobileHeaderInput && mobileHeaderResults) {
    const headerMode = effectiveSearchMode(
      mobileHeaderWrap.dataset.searchMode === 'radio' ? 'radio' : 'tv'
    );

    handleGlobalSearch(mobileHeaderInput, mobileHeaderResults, true, headerMode);

    const syncCatalog = (value) => {
      if (headerMode === 'tv' && window.VivoRDCatalog?.applyFilter) {
        window.VivoRDCatalog.applyFilter(value);
        const filter = document.getElementById('channelFilter');
        const hero = document.getElementById('heroSearch');
        if (filter) filter.value = value;
        if (hero) hero.value = value;
      } else if (headerMode === 'radio' && window.VivoRDRadioCatalog?.applyFilter) {
        window.VivoRDRadioCatalog.applyFilter(value, 'all');
        const filter = document.getElementById('radioFilter');
        const hero = document.getElementById('heroRadioSearch');
        if (filter) filter.value = value;
        if (hero) hero.value = value;
      }
    };

    let syncTimer;
    mobileHeaderInput.addEventListener('input', () => {
      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => syncCatalog(mobileHeaderInput.value), 160);
      const open = mobileHeaderInput.value.trim().length >= 2;
      mobileHeaderResults.hidden = !open;
      mobileHeaderInput.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    mobileHeaderInput.addEventListener('focus', () => {
      if (mobileHeaderInput.value.trim().length >= 2) {
        mobileHeaderResults.hidden = false;
        mobileHeaderInput.setAttribute('aria-expanded', 'true');
      }
    });

    mobileHeaderInput.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const term = mobileHeaderInput.value.trim();
      syncCatalog(term);
      mobileHeaderResults.hidden = true;
      mobileHeaderInput.setAttribute('aria-expanded', 'false');
      const target =
        headerMode === 'tv'
          ? document.getElementById('canales-principales') || document.getElementById('canales')
          : document.getElementById('emisoras-principales') || document.getElementById('radios-secundarias');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.addEventListener('click', (e) => {
      if (
        mobileHeaderWrap.contains(e.target) ||
        mobileHeaderResults.contains(e.target)
      ) {
        return;
      }
      mobileHeaderResults.hidden = true;
      mobileHeaderInput.setAttribute('aria-expanded', 'false');
    });
  }

  const heroSearch = document.getElementById('heroSearch');
  const heroRadioSearch = document.getElementById('heroRadioSearch');
  const channelFilter = document.getElementById('channelFilter');

  if (heroSearch && channelFilter && !document.getElementById('priorityChannels')) {
    heroSearch.addEventListener('input', () => {
      channelFilter.value = heroSearch.value;
      channelFilter.dispatchEvent(new Event('input', { bubbles: true }));
    });

    heroSearch.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const term = heroSearch.value.trim();
      if (term.length < 1) return;
      channelFilter.value = term;
      channelFilter.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('canales-principales')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const headerSearch = document.getElementById('searchInput');
  if (headerSearch && channelFilter && !window.VivoRDCatalog) {
    headerSearch.addEventListener('input', () => {
      channelFilter.value = headerSearch.value;
      channelFilter.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
});

if (typeof window.BASE_URL === 'undefined') {
  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean);
  const depth = parts.length > 0 && parts[parts.length - 1].endsWith('.html') ? parts.length - 1 : parts.length;
  window.BASE_URL = depth > 0 ? '../'.repeat(depth) : './';
}
