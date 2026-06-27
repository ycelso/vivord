const PAGE_SIZE = 24;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function radioCardHtml(r, prefix = './radio/', eagerImg = false) {
  const name = escapeHtml(r.name);
  const slug = escapeHtml(r.slug);
  const img = escapeHtml(r.img);
  const dataName = escapeHtml(r.name.toLowerCase());
  const utils = window.VivoRDCatalogUtils;
  const imgHtml = eagerImg
    ? `<img src="${img}" alt="${name}" width="96" height="96" loading="eager" decoding="async" referrerpolicy="no-referrer">`
    : `<img ${utils.lazyImgAttrs(img, name, 96, 96)}>`;
  return `<a href="${prefix}${slug}.html" class="radio-card" data-name="${dataName}">
  <div class="radio-card__img">${imgHtml}</div>
  <span class="radio-card__name">${name}</span>
</a>`;
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

async function initRadioCatalog() {
  const featuredGrid = document.querySelector('.radio-featured');
  const priorityGrid = document.getElementById('priorityRadios');
  const catalogGrid = document.getElementById('allRadios');
  if (!featuredGrid && !priorityGrid && !catalogGrid) return null;

  const utils = window.VivoRDCatalogUtils;
  const data = await utils.fetchCatalogJson('data/home-radios.json');
  const base = window.BASE_URL || './';
  const prefix = `${base}radio/`;
  const featured = data.featured || [];
  const priority = data.priority || [];
  const catalog = data.catalog || [];

  const featuredSlugs = new Set(featured.map((r) => r.slug));
  const priorityOnly = priority.filter((r) => !featuredSlugs.has(r.slug));

  if (featuredGrid) {
    featuredGrid.innerHTML = featured
      .map((r, i) => radioCardHtml(r, prefix, i < 4))
      .join('');
    featuredGrid.removeAttribute('aria-busy');
    utils.hydrateLazyImages(featuredGrid);
  }

  if (priorityGrid) {
    priorityGrid.innerHTML = priorityOnly.map((r) => radioCardHtml(r, prefix)).join('');
    priorityGrid.removeAttribute('aria-busy');
    utils.hydrateLazyImages(priorityGrid);
  }

  let catalogShown = 0;
  let filterQuery = '';

  const loadMoreBtn = document.getElementById('loadMoreRadios');
  const filterEmpty = document.getElementById('radioFilterEmpty');
  const catalogCount = document.getElementById('radioCatalogShownCount');

  function filteredCatalog() {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return catalog;
    return catalog.filter(
      (r) => r.name.toLowerCase().includes(q) || r.slug.includes(q)
    );
  }

  function updateLoadMore() {
    if (!loadMoreBtn || !catalogGrid) return;
    const list = filteredCatalog();
    const hasMore = !filterQuery && catalogShown < list.length;
    loadMoreBtn.hidden = !hasMore;
    if (hasMore) {
      const left = list.length - catalogShown;
      loadMoreBtn.textContent = `Cargar más emisoras (${Math.min(PAGE_SIZE, left)} de ${left})`;
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
        slice.map((r) => radioCardHtml(r, prefix)).join('')
      );
      catalogShown += slice.length;
      utils.hydrateLazyImages(catalogGrid);
    }
    catalogGrid.removeAttribute('aria-busy');
    if (catalogCount) {
      catalogCount.textContent = filterQuery
        ? `${list.length} encontradas`
        : `${catalogShown} de ${list.length}`;
    }
    if (filterEmpty) filterEmpty.hidden = list.length > 0;
    updateLoadMore();
  }

  function applyFilter(query, scope = 'all') {
    const q = query.toLowerCase().trim();
    if (scope === 'secondary') {
      filterQuery = query;
    } else if (q) {
      filterQuery = query;
    } else {
      filterQuery = '';
    }

    const filterGrid = (grid) => {
      if (!grid) return;
      grid.querySelectorAll('.radio-card').forEach((card) => {
        const name = card.dataset.name || '';
        const show = !q || name.includes(q);
        card.classList.toggle('hidden', !show);
      });
    };

    if (scope === 'secondary') {
      if (q) {
        const list = filteredCatalog();
        catalogGrid.innerHTML = list.map((r) => radioCardHtml(r, prefix)).join('');
        catalogShown = list.length;
        utils.hydrateLazyImages(catalogGrid);
        loadMoreBtn.hidden = true;
        if (filterEmpty) filterEmpty.hidden = list.length > 0;
        if (catalogCount) catalogCount.textContent = `${list.length} encontradas`;
      } else {
        catalogShown = 0;
        renderCatalogBatch(true);
      }
      return;
    }

    filterGrid(featuredGrid);
    filterGrid(priorityGrid);

    if (q) {
      const list = filteredCatalog();
      catalogGrid.innerHTML = list.map((r) => radioCardHtml(r, prefix)).join('');
      catalogShown = list.length;
      utils.hydrateLazyImages(catalogGrid);
      loadMoreBtn.hidden = true;
      if (filterEmpty) filterEmpty.hidden = list.length > 0;
      if (catalogCount) catalogCount.textContent = `${list.length} encontradas`;
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
  const loader = document.getElementById('radioCatalogLoader');
  initRadioCatalog()
    .then((api) => {
      if (loader) loader.hidden = true;
      if (!api) return;
      window.VivoRDRadioCatalog = api;
      window.VivoRDUserState?.initHome?.('radio');

      const filter = document.getElementById('radioFilter');
      const heroSearch = document.getElementById('heroRadioSearch');
      const headerSearch = document.getElementById('searchInput');
      const mobileHeaderSearch = document.getElementById('mobileHeaderSearch');

      const applyAll = debounce((value) => {
        api.applyFilter(value, 'all');
        if (heroSearch && heroSearch.value !== value) heroSearch.value = value;
        if (filter && filter.value !== value) filter.value = value;
        if (mobileHeaderSearch && mobileHeaderSearch.value !== value) {
          mobileHeaderSearch.value = value;
        }
      }, 180);

      const applySecondary = debounce((value) => {
        api.applyFilter(value, 'secondary');
      }, 180);

      filter?.addEventListener('input', () => applySecondary(filter.value));
      heroSearch?.addEventListener('input', () => applyAll(heroSearch.value));
      headerSearch?.addEventListener('input', () => applyAll(headerSearch.value));
      mobileHeaderSearch?.addEventListener('input', () => applyAll(mobileHeaderSearch.value));

      heroSearch?.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const term = heroSearch.value.trim();
        if (!term) return;
        applyAll(term);
        document.getElementById('radios-secundarias')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    })
    .catch(() => {
      if (loader) {
        loader.textContent = 'No se pudo cargar el catálogo. Recarga la página.';
      }
    });
});
