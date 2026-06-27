/**
 * Hero carousel estilo streaming: panel principal + grid 3×3 de miniaturas.
 */
function initHeroCarousel(root) {
  const thumbs = [...root.querySelectorAll('.hero-carousel__thumb')];
  if (thumbs.length === 0) return;

  const bg = root.querySelector('.hero-carousel__bg');
  const cta = root.querySelector('#heroCarouselCta');
  const title = root.querySelector('#heroCarouselTitle');
  const desc = root.querySelector('#heroCarouselDesc');
  const meta = root.querySelector('#heroCarouselMeta');
  const badge = root.querySelector('#heroCarouselBadge');
  const progressBar = root.querySelector('#heroCarouselProgress');
  const autoplayMs = parseInt(root.dataset.autoplay, 10) || 7000;

  let index = 0;
  let timer = null;
  let progressTimer = null;
  let paused = false;
  let progressStart = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function applyThumb(thumb, animate = true) {
    const i = parseInt(thumb.dataset.index, 10);
    index = i;

    thumbs.forEach((t) => {
      const active = t === thumb;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    if (bg) {
      bg.style.opacity = animate ? '0' : '1';
      const img = thumb.dataset.img;
      if (animate) {
        setTimeout(() => {
          bg.src = img;
          bg.style.opacity = '1';
        }, 200);
      } else {
        bg.src = img;
      }
    }

    if (cta) cta.href = thumb.dataset.href || '#';
    if (title) title.textContent = thumb.dataset.title || '';
    if (desc) desc.textContent = thumb.dataset.desc || '';
    if (meta) meta.textContent = thumb.dataset.meta || '';
    if (badge) badge.hidden = thumb.dataset.live !== '1';

    if (animate) {
      root.classList.add('is-transitioning');
      setTimeout(() => root.classList.remove('is-transitioning'), 400);
    }

    resetProgress();
  }

  function goTo(i) {
    const thumb = thumbs[((i % thumbs.length) + thumbs.length) % thumbs.length];
    if (thumb) applyThumb(thumb);
  }

  function next() {
    goTo(index + 1);
  }

  function resetProgress() {
    if (!progressBar) return;
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';
    progressStart = performance.now();
    if (progressTimer) cancelAnimationFrame(progressTimer);

    if (!autoplayMs || paused) return;

    function tick(now) {
      const elapsed = now - progressStart;
      const pct = Math.min(100, (elapsed / autoplayMs) * 100);
      progressBar.style.width = `${pct}%`;
      if (pct < 100 && !paused) progressTimer = requestAnimationFrame(tick);
    }
    progressTimer = requestAnimationFrame(tick);
  }

  function startAutoplay() {
    stopAutoplay();
    if (reducedMotion || !autoplayMs || thumbs.length < 2) return;
    resetProgress();
    timer = setInterval(() => {
      if (!paused) next();
    }, autoplayMs);
  }

  function stopAutoplay() {
    if (timer) clearInterval(timer);
    timer = null;
    if (progressTimer) cancelAnimationFrame(progressTimer);
  }

  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      applyThumb(thumb);
      stopAutoplay();
      startAutoplay();
    });
  });

  const stage = root.querySelector('.hero-carousel__stage');
  if (stage && !reducedMotion) {
    let touchStartX = 0;
    let touchStartY = 0;
    stage.addEventListener(
      'touchstart',
      (e) => {
        const t = e.changedTouches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
      },
      { passive: true }
    );
    stage.addEventListener(
      'touchend',
      (e) => {
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
        const next = dx < 0 ? index + 1 : index - 1;
        goTo(next);
        stopAutoplay();
        startAutoplay();
      },
      { passive: true }
    );
  }

  root.addEventListener('mouseenter', () => {
    paused = true;
    if (progressBar) progressBar.style.width = progressBar.style.width;
  });
  root.addEventListener('mouseleave', () => {
    paused = false;
    resetProgress();
  });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
      stopAutoplay();
      startAutoplay();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(index - 1);
      stopAutoplay();
      startAutoplay();
    }
  });

  root.setAttribute('tabindex', '0');

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      paused = true;
      stopAutoplay();
    } else if (!reducedMotion) {
      paused = false;
      startAutoplay();
    }
  });

  applyThumb(thumbs[0], false);
  startAutoplay();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.hero-carousel').forEach((root) => {
    initHeroCarousel(root);
    window.VivoRDCatalogUtils?.hydrateLazyImages(root);
  });
});
