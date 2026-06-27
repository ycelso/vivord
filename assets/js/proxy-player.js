const DM_EMBED =
  'https://www.dailymotion.com/embed/video/x80ac48?autoplay=1&mute=0&queue-enable=false';

function ensureRetryUi(videoEl) {
  const stage = videoEl?.closest?.('.player-stage');
  if (!stage) return null;
  let root = stage.querySelector('.player-retry');
  if (!root) {
    root = document.createElement('div');
    root.className = 'player-retry';
    root.innerHTML = `<div class="player-retry__panel" role="status" aria-live="polite">
  <p class="player-retry__title">Señal inestable</p>
  <p class="player-retry__msg" data-msg>Estamos intentando reconectar…</p>
  <div class="player-retry__actions">
    <button type="button" class="player-retry__btn" data-retry>Reintentar</button>
    <button type="button" class="player-retry__btn player-retry__btn--ghost" data-hide>Ocultar</button>
  </div>
</div>`;
    stage.appendChild(root);
  }
  return root;
}

function showRetryUi(videoEl, msg) {
  const ui = ensureRetryUi(videoEl);
  if (!ui) return;
  const m = ui.querySelector('[data-msg]');
  if (m) m.textContent = msg || 'Estamos intentando reconectar…';
  ui.classList.add('show');
}

function hideRetryUi(videoEl) {
  const ui = ensureRetryUi(videoEl);
  ui?.classList?.remove('show');
}

function initProxyPlayer(streamUrl) {
  const video = document.getElementById('main-player');
  if (!video) return;

  const src =
    window.VivordHls?.proxiedHlsUrl?.(streamUrl) ??
    (window.apiUrl && streamUrl.startsWith('/api/') ? window.apiUrl(streamUrl) : streamUrl);

  const isTelesistema = streamUrl.includes('telesistema');

  let retryCount = 0;
  let retryTimer = null;
  const ui = ensureRetryUi(video);

  function clearRetryTimer() {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  }

  function scheduleRetry(doPlay, reason) {
    retryCount += 1;
    clearRetryTimer();
    const delayMs = Math.min(25000, 1500 * Math.pow(2, Math.max(0, retryCount - 1)));
    showRetryUi(video, reason ? `${reason} Reintentando en ${Math.round(delayMs / 1000)}s…` : `Reintentando en ${Math.round(delayMs / 1000)}s…`);
    if (retryCount > 5) return;
    retryTimer = setTimeout(() => doPlay(), delayMs);
  }

  function showDmEmbed() {
    const stage = video.closest('.player-stage');
    if (!stage) return;
    stage.innerHTML = `<iframe src="${DM_EMBED}" allowfullscreen allow="autoplay; fullscreen; picture-in-picture" title="Telesistema Canal 11"></iframe>`;
  }

  ui?.querySelector?.('[data-hide]')?.addEventListener?.('click', () => hideRetryUi(video));

  if (window.VivordHls?.isNativeApp?.() && isTelesistema) {
    const doPlay = () => {
      hideRetryUi(video);
      window.VivordHls.playHlsVideo(video, src, {
        onFatal: () => showDmEmbed(),
      });
    };
    ui?.querySelector?.('[data-retry]')?.addEventListener?.('click', () => {
      retryCount = 0;
      clearRetryTimer();
      doPlay();
    });
    doPlay();
    return;
  }

  if (!window.VivordHls) {
    console.warn('VivordHls no cargado');
    if (isTelesistema) showDmEmbed();
    return;
  }

  const doPlay = () => {
    hideRetryUi(video);
    window.VivordHls.playHlsVideo(video, src, {
      onFatal: isTelesistema ? showDmEmbed : () => scheduleRetry(doPlay, 'Error al reproducir.'),
    });
  };

  ui?.querySelector?.('[data-retry]')?.addEventListener?.('click', () => {
    retryCount = 0;
    clearRetryTimer();
    doPlay();
  });

  doPlay();
}
