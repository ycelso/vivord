/**
 * Caché de catálogo + imágenes solo cuando entran en pantalla.
 */
(function () {
  const CACHE_TTL_MS = 10 * 60 * 1000;
  let lazyObserver = null;

  async function fetchCatalogJson(relativePath) {
    const base = window.BASE_URL || './';
    const url = relativePath.startsWith('http') ? relativePath : `${base}${relativePath}`;
    const key = `vivord:catalog:${url}`;

    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const { t, data } = JSON.parse(raw);
        if (Date.now() - t < CACHE_TTL_MS) return data;
      }
    } catch {
      /* sin caché */
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`No se pudo cargar ${relativePath}`);
    const data = await res.json();

    try {
      sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), data }));
    } catch {
      /* quota */
    }

    return data;
  }

  function hydrateLazyImages(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const imgs = scope.querySelectorAll('img[data-src]');
    if (!imgs.length) return;

    if (!('IntersectionObserver' in window)) {
      imgs.forEach((img) => {
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
      });
      return;
    }

    if (!lazyObserver) {
      lazyObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            lazyObserver.unobserve(img);
          });
        },
        { rootMargin: '100px 0px', threshold: 0.01 }
      );
    }

    imgs.forEach((img) => lazyObserver.observe(img));
  }

  function lazyImgAttrs(src, alt, w, h) {
    const safeSrc = String(src).replace(/"/g, '&quot;');
    const safeAlt = String(alt).replace(/"/g, '&quot;');
    return `data-src="${safeSrc}" src="" alt="${safeAlt}" width="${w}" height="${h}" loading="lazy" decoding="async" referrerpolicy="no-referrer"`;
  }

  window.VivoRDCatalogUtils = {
    fetchCatalogJson,
    hydrateLazyImages,
    lazyImgAttrs,
  };
})();
