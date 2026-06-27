/**
 * Media Session: notificación + reproducción en segundo plano (app Android).
 * En web usa navigator.mediaSession cuando el navegador lo soporta.
 */
(function () {
  const APP_ORIGIN = 'https://vivo-rd.com';
  const BG_WATCH_MS = 2500;
  const BG_STALL_MS = 15000;
  const BG_RESUME_DELAYS = [0, 400, 1200, 2500];
  const COMPETE_CHECK_MS = 700;

  function isNative() {
    try {
      return Boolean(window.Capacitor?.isNativePlatform?.());
    } catch {
      return false;
    }
  }

  // El bridge nativo inyectado no siempre expone registerPlugin; los plugins
  // registrados en MainActivity quedan disponibles en Capacitor.Plugins.
  function resolvePlugin(name) {
    if (!isNative()) return null;
    const cap = window.Capacitor;
    if (typeof cap.registerPlugin === 'function') return cap.registerPlugin(name);
    return cap.Plugins?.[name] || null;
  }

  function getPlugin() {
    if (!window.__vivordMediaSessionPlugin) {
      window.__vivordMediaSessionPlugin = resolvePlugin('MediaSession');
    }
    return window.__vivordMediaSessionPlugin;
  }

  function getAudioFocusPlugin() {
    if (!window.__vivordAudioFocusPlugin) {
      window.__vivordAudioFocusPlugin = resolvePlugin('RadioAudioFocus');
    }
    return window.__vivordAudioFocusPlugin;
  }

  function webSession() {
    return typeof navigator !== 'undefined' && 'mediaSession' in navigator
      ? navigator.mediaSession
      : null;
  }

  let handlersBound = false;
  let nativeHandlersBound = false;
  let focusListenerBound = false;
  let playbackStopped = true;
  let userPaused = false;
  let focusDucked = false;
  let usingNativePlayer = false;
  let nativeRadioPlugin = null;
  let attachedAudio = null;
  let resumeTimer = null;
  let bgWatchTimer = null;
  let competeWatchTimer = null;
  let lastAudioTick = 0;
  let lastTickAt = 0;

  function absoluteArtworkUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    try {
      const href = new URL(path, window.location.href).href;
      if (isNative() && /\/assets\//i.test(href)) {
        const assetPath = href.replace(/^https?:\/\/[^/]+/i, '');
        return `${APP_ORIGIN}${assetPath.startsWith('/') ? assetPath : `/${assetPath}`}`;
      }
      return href;
    } catch {
      return path;
    }
  }

  function stationMetaFromDom() {
    const titleEl = document.querySelector('.radio-stage__title');
    const imgEl = document.querySelector('.radio-disc__logo, .radio-dock__art');
    const title = titleEl?.textContent?.trim() || 'VivoRD Radio';
    const subtitle =
      document.getElementById('radioNowPlaying')?.textContent?.trim() ||
      document.getElementById('radioStatus')?.textContent?.trim() ||
      'En vivo';
    const src = absoluteArtworkUrl(imgEl?.getAttribute('src') || '');
    const fallback = absoluteArtworkUrl('./assets/img/vivord-logo.png');
    const artwork = src
      ? [{ src, sizes: '512x512', type: 'image/png' }]
      : [{ src: fallback, sizes: '512x512', type: 'image/png' }];
    return { title, artist: subtitle, album: 'VivoRD', artwork };
  }

  async function updatePositionState(audio) {
    const el = audio || attachedAudio;
    if (!el) return;
    const plugin = getPlugin();
    if (!plugin?.setPositionState) return;
    const duration =
      Number.isFinite(el.duration) && el.duration > 0 && el.duration !== Infinity
        ? el.duration
        : 86400;
    const position = Number.isFinite(el.currentTime) ? el.currentTime : 0;
    try {
      await plugin.setPositionState({
        duration,
        position,
        playbackRate: el.playbackRate || 1,
      });
    } catch {
      /* noop */
    }
  }

  function shouldRecoverPlayback() {
    if (usingNativePlayer) return false;
    return (
      isNative() &&
      attachedAudio &&
      !playbackStopped &&
      !userPaused &&
      !focusDucked
    );
  }

  function isBackground() {
    return document.hidden || document.visibilityState === 'hidden';
  }

  async function requestAudioFocus() {
    const plugin = getAudioFocusPlugin();
    if (!plugin?.request) return;
    try {
      await plugin.request();
      focusDucked = false;
    } catch {
      /* noop */
    }
  }

  async function abandonAudioFocus() {
    const plugin = getAudioFocusPlugin();
    if (!plugin?.abandon) return;
    try {
      await plugin.abandon();
    } catch {
      /* noop */
    }
  }

  async function handleAudioFocusLost() {
    focusDucked = true;
    stopCompeteWatch();
    clearResumeTimer();
    if (attachedAudio && !attachedAudio.paused) {
      attachedAudio.pause();
    }
    await abandonAudioFocus();
    await setPlaybackState(false);
    window.dispatchEvent(new CustomEvent('vivord-radio-focus-lost'));
  }

  async function checkCompetingAudio() {
    if (!shouldRecoverPlayback()) return;
    const plugin = getAudioFocusPlugin();
    if (!plugin?.probeCompetingAudio) return;
    try {
      const { competing } = await plugin.probeCompetingAudio();
      if (competing) {
        await handleAudioFocusLost();
      }
    } catch {
      /* noop */
    }
  }

  function startCompeteWatch() {
    if (!isNative() || competeWatchTimer) return;
    const plugin = getAudioFocusPlugin();
    plugin?.startMonitoring?.().catch(() => {});
    competeWatchTimer = window.setInterval(() => {
      checkCompetingAudio();
    }, COMPETE_CHECK_MS);
  }

  function stopCompeteWatch() {
    if (competeWatchTimer) {
      window.clearInterval(competeWatchTimer);
      competeWatchTimer = null;
    }
    const plugin = getAudioFocusPlugin();
    plugin?.stopMonitoring?.().catch(() => {});
  }

  function setupAudioFocusListener() {
    if (!isNative() || focusListenerBound) return;
    const plugin = getAudioFocusPlugin();
    if (!plugin?.addListener) return;
    focusListenerBound = true;
    plugin.addListener('focusChange', ({ type }) => {
      if (type === 'gain') {
        focusDucked = false;
        return;
      }
      if (type === 'loss' || type === 'otherMedia') {
        handleAudioFocusLost();
      }
    });
  }

  async function recoverStream(reason) {
    if (!shouldRecoverPlayback()) return;
    try {
      if (window.VivordRadioMedia?.recoverStream) {
        await window.VivordRadioMedia.recoverStream(reason);
      } else if (attachedAudio?.paused) {
        await attachedAudio.play();
      } else {
        attachedAudio.pause();
        await attachedAudio.play();
      }
      await setPlaybackState(true);
      await updatePositionState(attachedAudio);
    } catch {
      /* reintento en el siguiente tick */
    }
  }

  function clearResumeTimer() {
    if (resumeTimer) {
      window.clearTimeout(resumeTimer);
      resumeTimer = null;
    }
  }

  async function scheduleBackgroundResume() {
    if (!shouldRecoverPlayback()) return;

    await setMetadata();
    await setPlaybackState(true);
    await updatePositionState(attachedAudio);

    if (!attachedAudio?.paused && attachedAudio?.readyState >= 3) return;

    clearResumeTimer();

    const runAttempt = (index) => {
      if (!shouldRecoverPlayback()) return;
      const waitMs = BG_RESUME_DELAYS[index] ?? BG_RESUME_DELAYS[BG_RESUME_DELAYS.length - 1];
      resumeTimer = window.setTimeout(async () => {
        resumeTimer = null;
        if (!shouldRecoverPlayback()) return;
        if (!attachedAudio?.paused && attachedAudio?.readyState >= 3) return;
        try {
          await attachedAudio.play();
          await setPlaybackState(true);
          await updatePositionState(attachedAudio);
          if (!attachedAudio.paused && attachedAudio.readyState >= 3) return;
        } catch {
          /* siguiente intento */
        }
        if (index + 1 < BG_RESUME_DELAYS.length) {
          runAttempt(index + 1);
        } else {
          await recoverStream('background-resume');
        }
      }, waitMs);
    };

    runAttempt(0);
  }

  function tickBackgroundWatch() {
    if (!shouldRecoverPlayback() || !attachedAudio) return;

    const audio = attachedAudio;
    const now = Date.now();
    const tick = audio.currentTime;

    if (!audio.paused && tick !== lastAudioTick) {
      lastAudioTick = tick;
      lastTickAt = now;
    }

    const stallLimit = isBackground() ? BG_STALL_MS : BG_WATCH_MS * 2;
    const stalled =
      !audio.paused &&
      (audio.readyState <= 2 || (lastTickAt > 0 && now - lastTickAt > stallLimit));

    if (audio.paused || stalled) {
      if (isBackground()) {
        scheduleBackgroundResume();
      } else {
        recoverStream(stalled ? 'foreground-stall' : 'foreground-paused');
      }
    } else if (isBackground()) {
      setPlaybackState(true);
      updatePositionState(audio);
    }
  }

  function startBackgroundWatch() {
    if (!isNative() || bgWatchTimer) return;
    bgWatchTimer = window.setInterval(tickBackgroundWatch, BG_WATCH_MS);
  }

  function stopBackgroundWatch() {
    if (bgWatchTimer) {
      window.clearInterval(bgWatchTimer);
      bgWatchTimer = null;
    }
    clearResumeTimer();
    stopCompeteWatch();
  }

  async function onEnterBackground() {
    if (!shouldRecoverPlayback()) return;
    await setMetadata();
    await setPlaybackState(true);
    await updatePositionState(attachedAudio);
    scheduleBackgroundResume();
  }

  function onEnterForeground() {
    if (!shouldRecoverPlayback() || !attachedAudio?.paused) return;
    recoverStream('foreground');
  }

  function setupBackgroundKeepAlive(audio) {
    if (!isNative() || attachedAudio === audio) return;
    attachedAudio = audio;
    setupAudioFocusListener();
    startBackgroundWatch();

    const app = window.Capacitor?.Plugins?.App;
    app?.addListener?.('appStateChange', ({ isActive }) => {
      if (isActive) onEnterForeground();
      else onEnterBackground();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) onEnterBackground();
      else onEnterForeground();
    });

    document.addEventListener('pause', () => onEnterBackground(), false);
    document.addEventListener('resume', () => onEnterForeground(), false);

    audio.addEventListener('stalled', () => scheduleBackgroundResume());
    audio.addEventListener('waiting', () => scheduleBackgroundResume());
    audio.addEventListener('suspend', () => scheduleBackgroundResume());

    audio.addEventListener('pause', () => {
      if (focusDucked) return;
      if (shouldRecoverPlayback() && isBackground()) {
        scheduleBackgroundResume();
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (!audio.paused) {
        lastAudioTick = audio.currentTime;
        lastTickAt = Date.now();
      }
    });
  }

  async function bindNativeHandlers(plugin) {
    if (nativeHandlersBound || !plugin) return;
    nativeHandlersBound = true;

    const pluginMs = getPlugin();
    const onPlay = async () => {
      if (focusDucked) return;
      playbackStopped = false;
      userPaused = false;
      await plugin.resume();
      await setPlaybackState(true);
    };
    const onPause = async () => {
      userPaused = true;
      focusDucked = false;
      await plugin.pause();
      await setPlaybackState(false);
    };
    const onStop = async () => {
      playbackStopped = true;
      userPaused = true;
      focusDucked = false;
      await plugin.stop();
      await setPlaybackState(false);
    };

    if (pluginMs) {
      await pluginMs.setActionHandler({ action: 'play' }, onPlay);
      await pluginMs.setActionHandler({ action: 'pause' }, onPause);
      await pluginMs.setActionHandler({ action: 'stop' }, onStop);
    }
  }

  async function bindHandlers(audio) {
    if (handlersBound || !audio) return;
    handlersBound = true;

    const plugin = getPlugin();
    const web = webSession();

    const onPlay = async () => {
      playbackStopped = false;
      userPaused = false;
      focusDucked = false;
      await requestAudioFocus();
      audio.play().catch(() => {});
    };
    const onPause = async () => {
      userPaused = true;
      focusDucked = false;
      audio.pause();
      await abandonAudioFocus();
    };
    const onStop = async () => {
      playbackStopped = true;
      userPaused = true;
      focusDucked = false;
      audio.pause();
      await abandonAudioFocus();
    };

    if (plugin) {
      await plugin.setActionHandler({ action: 'play' }, onPlay);
      await plugin.setActionHandler({ action: 'pause' }, onPause);
      await plugin.setActionHandler({ action: 'stop' }, onStop);
      return;
    }

    if (web) {
      try {
        web.setActionHandler('play', onPlay);
        web.setActionHandler('pause', onPause);
        web.setActionHandler('stop', onStop);
      } catch {
        /* noop */
      }
    }
  }

  async function setMetadata(meta) {
    const m = meta || stationMetaFromDom();
    const plugin = getPlugin();
    if (plugin) {
      await plugin.setMetadata(m);
      return;
    }
    const web = webSession();
    if (web) {
      try {
        web.metadata = new MediaMetadata(m);
      } catch {
        /* noop */
      }
    }
  }

  async function setPlaybackState(playing) {
    const state = playbackStopped ? 'none' : playing ? 'playing' : 'paused';
    const plugin = getPlugin();
    if (plugin) {
      await plugin.setPlaybackState({ playbackState: state });
      return;
    }
    const web = webSession();
    if (web) web.playbackState = state;
  }

  window.VivordRadioMedia = {
    async attachNative(_plugin) {
      usingNativePlayer = true;
      playbackStopped = false;
      // Reproductor nativo: notificación y audio focus los gestiona RadioPlaybackService.
      // No usar @jofr/capacitor-media-session en Android (evita bucles play/pause).
    },

    async attach(audio) {
      if (usingNativePlayer) return;
      if (!audio) return;
      await bindHandlers(audio);
      setupBackgroundKeepAlive(audio);

      audio.addEventListener('play', async () => {
        playbackStopped = false;
        userPaused = false;
        focusDucked = false;
        lastAudioTick = audio.currentTime;
        lastTickAt = Date.now();
        await requestAudioFocus();
        startCompeteWatch();
        await setMetadata();
        await setPlaybackState(true);
        await updatePositionState(audio);
      });

      audio.addEventListener('pause', async () => {
        if (shouldRecoverPlayback() && isBackground()) return;
        stopCompeteWatch();
        if (!focusDucked) await abandonAudioFocus();
        await setPlaybackState(false);
      });

      audio.addEventListener('ended', async () => {
        await abandonAudioFocus();
        await setPlaybackState(false);
      });

      audio.addEventListener('timeupdate', () => {
        if (!audio.paused && isNative()) updatePositionState(audio);
      });
    },

    markUserPaused() {
      userPaused = true;
      focusDucked = false;
      if (usingNativePlayer) return;
      stopCompeteWatch();
      abandonAudioFocus();
    },

    markExternalPause() {
      if (usingNativePlayer) return;
      userPaused = false;
      playbackStopped = false;
      focusDucked = true;
      setPlaybackState(false);
    },

    markUserPlaying() {
      userPaused = false;
      playbackStopped = false;
      focusDucked = false;
      if (usingNativePlayer) return;
      setMetadata();
      setPlaybackState(true);
      requestAudioFocus();
      startCompeteWatch();
    },

    async refreshMetadata() {
      await setMetadata();
    },

    async clear() {
      playbackStopped = true;
      userPaused = true;
      focusDucked = false;
      if (usingNativePlayer) {
        await nativeRadioPlugin?.stop?.();
        usingNativePlayer = false;
        nativeRadioPlugin = null;
      } else {
        stopBackgroundWatch();
        await abandonAudioFocus();
      }
      await setPlaybackState(false);
    },
  };
})();
