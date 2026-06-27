/**
 * Recientes (persistencia local) para TV y radios.
 * Se expone como window.VivoRDUserState.
 */
(function () {
  const KEY = 'vivord:user-state:v1';
  const MAX_RECENT = 30;
  /** Cuántas se muestran en la UI (localStorage guarda hasta MAX_RECENT). */
  const DISPLAY_RECENT = { tv: 3, radio: 3 };

  function now() {
    return Date.now();
  }

  function safeJsonParse(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { recent: { tv: [], radio: [] } };
      const st = safeJsonParse(raw, null);
      if (!st || typeof st !== 'object') throw new Error('bad');
      st.recent ||= { tv: [], radio: [] };
      st.recent.tv ||= [];
      st.recent.radio ||= [];
      return st;
    } catch {
      return { recent: { tv: [], radio: [] } };
    }
  }

  function saveState(st) {
    try {
      localStorage.setItem(KEY, JSON.stringify(st));
    } catch {
      /* quota / privado */
    }
  }

  function normKind(kind) {
    return kind === 'radio' ? 'radio' : 'tv';
  }

  function normalizeUrl(url) {
    const u = String(url || '').trim();
    if (!u) return '';
    // Normaliza URLs generadas desde páginas con depth=1 (../canal/.., ../radio/..)
    if (u.startsWith('../')) return u.replace(/^\.\.\//, './');
    return u;
  }

  function itemKey(item) {
    return String(item?.slug || '');
  }

  function dedupeBySlug(list) {
    const out = [];
    const seen = new Set();
    for (const it of list || []) {
      const k = itemKey(it);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push(it);
    }
    return out;
  }

  function clampList(list, max) {
    if (!Array.isArray(list)) return [];
    return list.slice(0, max);
  }

  function addRecent(kind, item) {
    const k = normKind(kind);
    const slug = itemKey(item);
    if (!slug) return;
    const st = loadState();
    const list = st.recent[k].filter((it) => it.slug !== slug);
    list.unshift({
      slug,
      name: item?.name || slug,
      img: item?.img || '',
      url: normalizeUrl(item?.url || ''),
      t: now(),
    });
    st.recent[k] = clampList(dedupeBySlug(list), MAX_RECENT);
    saveState(st);
    document.dispatchEvent(new CustomEvent('vivord:recent-changed', { detail: { kind: k } }));
  }

  function removeRecent(kind, slug) {
    const k = normKind(kind);
    const s = String(slug || '').trim();
    if (!s) return;
    const st = loadState();
    st.recent[k] = (st.recent[k] || []).filter((it) => it.slug !== s);
    saveState(st);
    document.dispatchEvent(new CustomEvent('vivord:recent-changed', { detail: { kind: k } }));
  }

  function getRecents(kind) {
    const k = normKind(kind);
    return loadState().recent[k];
  }

  function parseJsonDataset(el, attr) {
    try {
      const raw = el.getAttribute(attr);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function initRecentFromPage() {
    const meta = document.querySelector('[data-recent-item="1"]');
    if (!meta) return;
    const kind = normKind(meta.getAttribute('data-kind'));
    const item = parseJsonDataset(meta, 'data-item');
    if (!item?.slug) return;
    addRecent(kind, item);
  }

  function bindRecentRemoveButtons(root, kind) {
    const k = normKind(kind);
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('[data-recent-remove="1"]').forEach((btn) => {
      if (btn.__vivordRecentRemoveBound) return;
      btn.__vivordRecentRemoveBound = true;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeRecent(k, btn.getAttribute('data-slug') || '');
      });
    });
  }

  function renderSimpleGrid(kind, items, gridEl) {
    if (!gridEl) return;
    const k = normKind(kind);
    const utils = window.VivoRDCatalogUtils;
    const base = window.BASE_URL || './';
    const prefix = k === 'radio' ? `${base}radio/` : `${base}canal/`;
    const cardClass = k === 'radio' ? 'radio-card' : 'channel-card';
    const imgSize = k === 'radio' ? 96 : 120;
    const nameClass = k === 'radio' ? 'radio-card__name' : 'channel-name';
    const imgWrapClass = k === 'radio' ? 'radio-card__img' : 'card-img-container';

    const html = (items || [])
      .map((it) => {
        const name = String(it.name || '');
        const slug = String(it.slug || '');
        const img = String(it.img || '');
        const url = it.url || `${prefix}${slug}.html`;
        const imgHtml = img
          ? `<img ${utils?.lazyImgAttrs ? utils.lazyImgAttrs(img, name, imgSize, imgSize) : `src="${img}" alt="${name}" width="${imgSize}" height="${imgSize}"`} >`
          : '';
        return `<div class="recent-wrap" data-recent-wrap="1">
  <a href="${url}" class="${cardClass}">
  <div class="${imgWrapClass}">${imgHtml}</div>
  <div class="${nameClass}">${name}</div>
</a>
  <button type="button" class="recent-remove" data-recent-remove="1" data-kind="${k}" data-slug="${slug}" aria-label="Quitar de recientes" title="Quitar">✕</button>
</div>`;
      })
      .join('');

    gridEl.innerHTML = html || `<p class="section-sub">Todavía no hay recientes.</p>`;
    bindRecentRemoveButtons(gridEl, k);
    utils?.hydrateLazyImages?.(gridEl);
  }

  function renderRecent(kind) {
    const k = normKind(kind);
    const recentGrid = document.getElementById(k === 'radio' ? 'recentRadiosGrid' : 'recentTvGrid');
    const showMax = DISPLAY_RECENT[k] ?? 12;
    renderSimpleGrid(k, getRecents(k).slice(0, showMax), recentGrid);
    document.getElementById(k === 'radio' ? 'recentRadiosSection' : 'recentTvSection')?.toggleAttribute(
      'hidden',
      getRecents(k).length === 0
    );
  }

  function initHome(kind) {
    const k = normKind(kind);
    renderRecent(k);
    document.addEventListener('vivord:recent-changed', (e) => {
      if (e.detail?.kind === k) renderRecent(k);
    });
  }

  window.VivoRDUserState = {
    addRecent,
    removeRecent,
    getRecents,
    initRecentFromPage,
    initHome,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initRecentFromPage();
    });
  } else {
    initRecentFromPage();
  }
})();

