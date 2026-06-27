const PAGE_SIZE = 24;
const PRIORITY_BATCH = 12;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function channelCardHtml(ch, prefix = './canal/', eagerImg = false) {
  const name = escapeHtml(ch.name);
  const slug = escapeHtml(ch.slug);
  const img = escapeHtml(ch.img);
  const dataName = escapeHtml(ch.name.toLowerCase());
  const utils = window.VivoRDCatalogUtils;
  const imgHtml = eagerImg
    ? `<img src="${img}" alt="${name}" width="120" height="120" loading="eager" decoding="async" referrerpolicy="no-referrer">`
    : `<img ${utils.lazyImgAttrs(img, name, 120, 120)}>`;
  return `<a href="${prefix}${slug}.html" class="channel-card" data-name="${dataName}">
  <div class="card-img-container">${imgHtml}</div>
  <div class="channel-name">${name}</div>
</a>`;
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

async function initTvCatalog() {
  const priorityGrid = document.getElementById('priorityChannels');
  const catalogGrid = document.getElementById('allChannels');
  if (!priorityGrid && !catalogGrid) return null;

  const utils = window.VivoRDCatalogUtils;
  const data = await utils.fetchCatalogJson('data/home-tv.json');
  const base = window.BASE_URL || './';
  const prefix = `${base}canal/`;
  const priority = data.priority || [];
  const catalog = data.catalog || [];

  let priorityShown = 0;
  const loadMorePriorityBtn = document.getElementById('loadMorePriorityChannels');

  function renderPriorityBatch(reset = false) {
    if (!priorityGrid) return;
    if (reset) {
      priorityGrid.innerHTML = '';
      priorityShown = 0;
    }
    const slice = priority.slice(priorityShown, priorityShown + PRIORITY_BATCH);
    if (slice.length) {
      const html = slice
        .map((ch, i) => channelCardHtml(ch, prefix, priorityShown === 0 && i < 4))
        .join('');
      priorityGrid.insertAdjacentHTML('beforeend', html);
      priorityShown += slice.length;
      utils.hydrateLazyImages(priorityGrid);
    }
    priorityGrid.removeAttribute('aria-busy');
    if (loadMorePriorityBtn) {
      const left = priority.length - priorityShown;
      loadMorePriorityBtn.hidden = left <= 0;
      if (left > 0) {
        loadMorePriorityBtn.textContent = `Cargar más principales (${Math.min(PRIORITY_BATCH, left)})`;
      }
    }
  }

  renderPriorityBatch(true);
  loadMorePriorityBtn?.addEventListener('click', () => renderPriorityBatch(false));

  let catalogShown = 0;
  let filterQuery = '';

  const loadMoreBtn = document.getElementById('loadMoreChannels');
  const filterEmpty = document.getElementById('filterEmpty');
  const catalogCount = document.getElementById('catalogShownCount');

  function filteredCatalog() {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return catalog;
    return catalog.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.includes(q)
    );
  }

  function updateLoadMore() {
    if (!loadMoreBtn || !catalogGrid) return;
    const list = filteredCatalog();
    const hasMore = !filterQuery && catalogShown < list.length;
    loadMoreBtn.hidden = !hasMore;
    if (hasMore) {
      const left = list.length - catalogShown;
      loadMoreBtn.textContent = `Cargar más canales (${Math.min(PAGE_SIZE, left)} de ${left})`;
    }
  }

  function renderCatalogBatch(reset = false) {
    if (!catalogGrid) return;
    const list = filteredCatalog();
    if (reset) {
      catalogGrid.innerHTML = '';
      catalogShown = 0;
    }
    const slice = list.slice(catalogShown, catalogShown + PAGE_SIZE);
    if (slice.length) {
      catalogGrid.insertAdjacentHTML(
        'beforeend',
        slice.map((ch) => channelCardHtml(ch, prefix)).join('')
      );
      catalogShown += slice.length;
      utils.hydrateLazyImages(catalogGrid);
    }
    catalogGrid.removeAttribute('aria-busy');
    if (catalogCount) {
      catalogCount.textContent = filterQuery
        ? `${list.length} encontrados`
        : `${catalogShown} de ${list.length}`;
    }
    if (filterEmpty) filterEmpty.hidden = list.length > 0;
    updateLoadMore();
  }

  function applyFilter(query) {
    filterQuery = query;
    const q = filterQuery.toLowerCase().trim();

    if (priorityGrid) {
      priorityGrid.querySelectorAll('.channel-card').forEach((card) => {
        const name = card.dataset.name || '';
        const show = !q || name.includes(q);
        card.classList.toggle('hidden', !show);
      });
      if (loadMorePriorityBtn) loadMorePriorityBtn.hidden = Boolean(q);
    }

    if (q) {
      const list = filteredCatalog();
      catalogGrid.innerHTML = list.map((ch) => channelCardHtml(ch, prefix)).join('');
      catalogShown = list.length;
      utils.hydrateLazyImages(catalogGrid);
      loadMoreBtn.hidden = true;
      if (filterEmpty) filterEmpty.hidden = list.length > 0;
      if (catalogCount) catalogCount.textContent = `${list.length} encontrados`;
    } else {
      catalogShown = 0;
      renderCatalogBatch(true);
    }
  }

  renderCatalogBatch(true);
  loadMoreBtn?.addEventListener('click', () => renderCatalogBatch(false));

  return { applyFilter, data };
}

document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('catalogLoader');
  initTvCatalog()
    .then((api) => {
      if (loader) loader.hidden = true;
      if (!api) return;
      window.VivoRDCatalog = api;
      window.VivoRDCatalogUtils?.hydrateLazyImages(document.getElementById('featuredCarousel'));
      window.VivoRDUserState?.initHome?.('tv');

      const filter = document.getElementById('channelFilter');
      const heroSearch = document.getElementById('heroSearch');
      const headerSearch = document.getElementById('searchInput');
      const mobileHeaderSearch = document.getElementById('mobileHeaderSearch');

      const applyFilter = debounce((value) => {
        api.applyFilter(value);
        if (heroSearch && heroSearch.value !== value) heroSearch.value = value;
        if (filter && filter.value !== value) filter.value = value;
        if (mobileHeaderSearch && mobileHeaderSearch.value !== value) {
          mobileHeaderSearch.value = value;
        }
      }, 180);

      filter?.addEventListener('input', () => applyFilter(filter.value));
      heroSearch?.addEventListener('input', () => applyFilter(heroSearch.value));
      headerSearch?.addEventListener('input', () => applyFilter(headerSearch.value));
      mobileHeaderSearch?.addEventListener('input', () => applyFilter(mobileHeaderSearch.value));

      heroSearch?.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const term = heroSearch.value.trim();
        if (!term) return;
        applyFilter(term);
        document.getElementById('canales-principales')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    })
    .catch(() => {
      if (loader) {
        loader.textContent = 'No se pudo cargar el catálogo. Recarga la página.';
      }
    });
});
