/**
 * Dailymotion: carga diferida (click-to-play) para evitar pantallas grises por autoplay/políticas.
 * - Mantiene el player en el sitio (iframe) pero solo lo inicializa cuando el usuario toca "Reproducir".
 */
(function () {
  function boot(root) {
    const btn = root.querySelector('[data-dm-play]');
    const iframe = root.querySelector('iframe[data-dm-embed]');
    if (!btn || !iframe) return;

    const base = iframe.getAttribute('data-dm-embed') || '';
    if (!base) return;

    btn.addEventListener('click', () => {
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');

      // Para el primer click, intentamos autostart. Si el navegador lo bloquea,
      // el propio player mostrará pantalla de inicio y permitirá play manual.
      const u = new URL(base);
      if (!u.searchParams.has('mute')) u.searchParams.set('mute', '1');
      iframe.src = u.href;

      // Oculta overlay
      root.classList.add('dm-ready');
    });
  }

  document.querySelectorAll('.dm-player').forEach(boot);
})();

