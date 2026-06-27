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

async function initPlayer(streamUrl, streamType = 'auto', streamReferer = '') {
  const videoElement = document.getElementById('main-player');
  if (!videoElement) return;

  let retryCount = 0;
  let retryTimer = null;

  function clearRetryTimer() {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  }

  function scheduleRetry(doRetry, reason) {
    retryCount += 1;
    clearRetryTimer();
    const delayMs = Math.min(25000, 1500 * Math.pow(2, Math.max(0, retryCount - 1)));
    showRetryUi(videoElement, reason ? `${reason} Reintentando en ${Math.round(delayMs / 1000)}s…` : `Reintentando en ${Math.round(delayMs / 1000)}s…`);
    if (retryCount > 5) return;
    retryTimer = setTimeout(() => doRetry(), delayMs);
  }

  const isHls =
    streamType === 'application/x-mpegURL' ||
    streamUrl.includes('.m3u8') ||
    (streamType === 'auto' && streamUrl.includes('.m3u8'));

  if (isHls) {
    videoElement.classList.remove('video-js', 'vjs-default-skin', 'vjs-big-play-centered');
    videoElement.classList.add('player-video');
    if (!videoElement.hasAttribute('controls')) videoElement.setAttribute('controls', '');
    videoElement.setAttribute('playsinline', '');
    videoElement.setAttribute('webkit-playsinline', '');

    const src = window.VivordHls
      ? window.VivordHls.proxiedHlsUrl(streamUrl, streamReferer)
      : streamUrl;

    if (window.VivordHls) {
      const ui = ensureRetryUi(videoElement);
      ui?.querySelector?.('[data-hide]')?.addEventListener?.('click', () => hideRetryUi(videoElement));
      ui?.querySelector?.('[data-retry]')?.addEventListener?.('click', () => {
        retryCount = 0;
        clearRetryTimer();
        doPlay();
      });

      const doPlay = async () => {
        hideRetryUi(videoElement);
        try {
          if (videoElement.__vivordHlsInstance?.destroy) {
            videoElement.__vivordHlsInstance.destroy();
          }
        } catch {}
        try {
          const inst = await window.VivordHls.playHlsVideo(videoElement, src, {
            onFatal: () => scheduleRetry(doPlay, 'Error al reproducir.'),
          });
          videoElement.__vivordHlsInstance = inst || null;
        } catch {
          scheduleRetry(doPlay, 'Error al reproducir.');
        }
      };

      await doPlay();
      return;
    }
  }

  if (streamType === 'auto') {
    if (streamUrl.includes('youtube') || streamUrl.includes('youtu.be')) {
      streamType = 'video/mp4';
    } else if (!isHls) {
      streamType = 'video/mp4';
    }
  }

  if (isHls || typeof videojs === 'undefined') return;

  const ui = ensureRetryUi(videoElement);
  ui?.querySelector?.('[data-hide]')?.addEventListener?.('click', () => hideRetryUi(videoElement));

  const player = videojs(videoElement, {
    controls: true,
    autoplay: true,
    preload: 'auto',
    fluid: true,
    responsive: true,
    sources: [{ src: streamUrl, type: streamType }],
  });

  const doRetry = () => {
    hideRetryUi(videoElement);
    try {
      player.src({ src: streamUrl, type: streamType });
      player.load();
      player.play().catch(() => {});
    } catch {}
  };

  ui?.querySelector?.('[data-retry]')?.addEventListener?.('click', () => {
    retryCount = 0;
    clearRetryTimer();
    doRetry();
  });

  player.on('error', () => {
    const err = player.error();
    console.log('Error en reproductor:', err);
    scheduleRetry(doRetry, 'La señal falló.');
  });

  player.on('playing', () => {
    retryCount = 0;
    clearRetryTimer();
    hideRetryUi(videoElement);
  });
}
