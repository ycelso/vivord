/**
 * Reproductor inmersivo + mini bar (app nativa y web móvil).
 * Minimizar → radios.html; audio sigue (nativo o audio global en web).
 */
(function () {
  const SESSION_KEY = 'vivord_radio_session';
  const GLOBAL_AUDIO_ID = 'vivord-radio-global-audio';

  function isMobileUa() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  }

  function isNativeApp() {
    try {
      return Boolean(window.Capacitor?.isNativePlatform?.());
    } catch {
      return false;
    }
  }

  function isEnabled() {
    return (
      document.documentElement.classList.contains('is-mobile') ||
      document.documentElement.classList.contains('capacitor-app') ||
      isNativeApp() ||
      (isMobileUa() && !document.documentElement.classList.contains('is-desktop'))
    );
  }

  function readSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeSession(data) {
    try {
      if (!data) sessionStorage.removeItem(SESSION_KEY);
      else sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }

  let streamMeta = null;

  function setStreamMeta(meta) {
    streamMeta = meta;
    const session = readSession();
    if (session && meta) {
      writeSession({ ...session, ...meta });
    }
  }

  function readStationFromPage() {
    const el = document.querySelector('[data-recent-item][data-kind="radio"]');
    if (!el) return null;
    try {
      const item = JSON.parse(el.getAttribute('data-item') || '{}');
      const slug = item.slug || '';
      const base = window.BASE_URL || './';
      const pageUrl = isRadioPlayerPage()
        ? location.pathname
        : item.url || (slug ? `${base}radio/${slug}.html` : location.pathname);
      const img = item.img || document.querySelector('.radio-disc__logo')?.getAttribute('src') || '';
      const name =
        item.name || document.querySelector('.radio-stage__title')?.textContent?.trim() || 'Radio';
      return { slug, name, img, pageUrl };
    } catch {
      return null;
    }
  }

  function resolveRadiosUrl() {
    try {
      const rel = /\/radio\//i.test(location.pathname) ? '../radios.html' : 'radios.html';
      return new URL(rel, location.href).pathname + location.search;
    } catch {
      return '/radios.html';
    }
  }

  function resolvePageUrl(pageUrl) {
    try {
      return new URL(pageUrl, location.href).href;
    } catch {
      return pageUrl;
    }
  }

  function isRadioPlayerPage() {
    return Boolean(document.getElementById('radioStage'));
  }

  function isRadiosIndexPage() {
    return /radios\.html$/i.test(location.pathname);
  }

  /** Mini bar solo en el listado de radios, nunca en la página fullscreen de emisora. */
  function shouldShowMiniBar(session) {
    return Boolean(session) && isRadiosIndexPage();
  }

  function hideMiniBar() {
    const bar = miniBarEl || document.getElementById('vivordRadioMiniBar');
    if (bar) bar.hidden = true;
    document.body.classList.remove('radio-mini-active');
  }

  function getNativePlugin() {
    try {
      const cap = window.Capacitor;
      if (!cap?.isNativePlatform?.()) return null;
      if (!window.__vivordRadioNativePlugin) {
        if (typeof cap.registerPlugin === 'function') {
          window.__vivordRadioNativePlugin = cap.registerPlugin('RadioNative');
        } else {
          window.__vivordRadioNativePlugin = cap.Plugins?.RadioNative || null;
        }
      }
      return window.__vivordRadioNativePlugin;
    } catch {
      return null;
    }
  }

  function ensureGlobalAudio() {
    let audio = document.getElementById(GLOBAL_AUDIO_ID);
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = GLOBAL_AUDIO_ID;
      audio.preload = 'auto';
      audio.setAttribute('playsinline', '');
      audio.setAttribute('webkit-playsinline', '');
      audio.hidden = true;
      document.body.appendChild(audio);
    }
    return audio;
  }

  function blockPageAudio(el) {
    if (!el || el.__vivordBlocked) return;
    el.__vivordBlocked = true;
    el.muted = true;
    el.volume = 0;
    el.pause();
    el.removeAttribute('autoplay');
    el.addEventListener(
      'play',
      (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        el.pause();
      },
      true
    );
  }

  let miniBarEl = null;
  let toggleHandler = null;
  let immersiveBound = false;

  function ensureMiniBar() {
    if (miniBarEl) return miniBarEl;
    miniBarEl = document.createElement('div');
    miniBarEl.id = 'vivordRadioMiniBar';
    miniBarEl.className = 'radio-mini-bar';
    miniBarEl.hidden = true;
    miniBarEl.innerHTML =
      '<button type="button" class="radio-mini-bar__main" id="vivordRadioMiniExpand">' +
      '<img class="radio-mini-bar__art" id="vivordRadioMiniArt" alt="" width="48" height="48" referrerpolicy="no-referrer">' +
      '<span class="radio-mini-bar__text">' +
      '<strong class="radio-mini-bar__name" id="vivordRadioMiniName"></strong>' +
      '<span class="radio-mini-bar__sub" id="vivordRadioMiniSub">EN VIVO</span>' +
      '</span></button>' +
      '<button type="button" class="radio-mini-bar__play" id="vivordRadioMiniToggle" aria-label="Reproducir">' +
      '<svg class="radio-mini-bar__icon radio-mini-bar__icon--play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7L8 5z"/></svg>' +
      '<svg class="radio-mini-bar__icon radio-mini-bar__icon--pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 7h4v10H7V7zm6 0h4v10h-4V7z"/></svg>' +
      '</button>' +
      '<button type="button" class="radio-mini-bar__expand" id="vivordRadioMiniChevron" aria-label="Abrir reproductor">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>' +
      '</button>';

    document.body.appendChild(miniBarEl);

    miniBarEl.querySelector('#vivordRadioMiniExpand')?.addEventListener('click', () => {
      expandCurrentStation();
    });
    miniBarEl.querySelector('#vivordRadioMiniChevron')?.addEventListener('click', () => {
      expandCurrentStation();
    });
    miniBarEl.querySelector('#vivordRadioMiniToggle')?.addEventListener('click', (e) => {
      e.stopPropagation();
      void toggleMiniPlayback();
    });

    return miniBarEl;
  }

  function updateMiniBarUi(session, playing) {
    const bar = ensureMiniBar();
    if (!shouldShowMiniBar(session)) {
      hideMiniBar();
      return;
    }
    bar.hidden = false;
    document.body.classList.add('radio-mini-active');
    const art = bar.querySelector('#vivordRadioMiniArt');
    const name = bar.querySelector('#vivordRadioMiniName');
    const sub = bar.querySelector('#vivordRadioMiniSub');
    if (art) {
      art.src = session.img || '';
      art.alt = session.name || '';
    }
    if (name) name.textContent = session.name || 'Radio';
    if (sub) {
      sub.textContent = session.nowPlaying || (playing ? 'EN VIVO' : 'Pausado');
    }
    bar.classList.toggle('is-playing', Boolean(playing));
    const toggle = bar.querySelector('#vivordRadioMiniToggle');
    if (toggle) {
      toggle.setAttribute('aria-label', playing ? 'Pausar' : 'Reproducir');
      toggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
    }
  }

  async function toggleMiniPlayback() {
    if (toggleHandler) {
      toggleHandler();
      return;
    }
    const native = getNativePlugin();
    if (native?.isPlaying) {
      try {
        const st = await native.isPlaying();
        if (st?.playing) await native.pause();
        else await native.resume();
        const session = readSession();
        if (session) writeSession({ ...session, playing: !st?.playing });
        updateMiniBarUi(readSession(), !st?.playing);
      } catch {
        syncMiniBarFromNative();
      }
      return;
    }
    const audio = ensureGlobalAudio();
    if (audio.paused) {
      try {
        await audio.play();
        const session = readSession();
        if (session) writeSession({ ...session, playing: true });
        updateMiniBarUi(readSession(), true);
      } catch {
        syncMiniBarFromNative();
      }
    } else {
      audio.pause();
      const session = readSession();
      if (session) writeSession({ ...session, playing: false });
      updateMiniBarUi(readSession(), false);
    }
  }

  async function resumeWebStreamFromSession() {
    if (isNativeApp()) return;
    const session = readSession();
    if (!session?.streamUrl || session.playing === false) return;
    const audio = ensureGlobalAudio();
    if (!audio.paused && audio.src) return;
    try {
      audio.src = session.streamUrl;
      await audio.play();
      updateMiniBarUi(session, true);
    } catch {
      updateMiniBarUi(session, false);
    }
  }

  async function syncMiniBarFromNative() {
    const session = readSession();
    if (!session) {
      updateMiniBarUi(null, false);
      return;
    }
    const native = getNativePlugin();
    if (native?.isPlaying) {
      try {
        const st = await native.isPlaying();
        updateMiniBarUi(session, Boolean(st?.playing));
        return;
      } catch {
        /* fall through */
      }
    }
    const audio = document.getElementById(GLOBAL_AUDIO_ID);
    if (audio) {
      updateMiniBarUi(session, !audio.paused);
      return;
    }
    updateMiniBarUi(session, session.playing !== false);
  }

  function enterImmersive() {
    if (!isEnabled() || !isRadioPlayerPage()) return;
    document.documentElement.classList.remove('radio-immersive-boot');
    document.body.classList.add('radio-immersive');
    hideMiniBar();
    const btn = document.getElementById('radioMinimizeBtn');
    if (btn) btn.hidden = false;
    bindImmersiveControls();
    if (isNativeApp()) {
      window.VivordAds?.hide?.();
    }
  }

  function exitImmersive() {
    document.body.classList.remove('radio-immersive');
    document.documentElement.classList.remove('radio-immersive-boot');
    const btn = document.getElementById('radioMinimizeBtn');
    if (btn) btn.hidden = true;
    if (isNativeApp()) {
      window.VivordAds?.show?.();
    }
  }

  function bindImmersiveControls() {
    if (immersiveBound) return;
    immersiveBound = true;
    document.getElementById('radioMinimizeBtn')?.addEventListener('click', () => {
      minimizeToRadios();
    });
  }

  function minimizeToRadios() {
    const station = readStationFromPage() || readSession();
    if (!station) {
      location.href = resolveRadiosUrl();
      return;
    }
    const nowPlaying = document.getElementById('radioNowPlaying')?.textContent?.trim() || '';
    const playing = document.getElementById('radioStage')?.classList.contains('is-playing');
    writeSession({
      ...station,
      ...(streamMeta || {}),
      pageUrl: station.pageUrl || location.pathname,
      nowPlaying,
      playing: playing !== false,
    });
    location.href = resolveRadiosUrl();
  }

  function expandCurrentStation() {
    const session = readSession();
    if (!session?.pageUrl) return;
    location.href = resolvePageUrl(session.pageUrl);
  }

  function onPlaybackStarted(stationOverride) {
    if (!isEnabled()) return;
    const station = stationOverride || readStationFromPage();
    if (!station) return;
    const nowPlaying = document.getElementById('radioNowPlaying')?.textContent?.trim() || '';
    writeSession({
      ...station,
      ...(streamMeta || {}),
      pageUrl: station.pageUrl || location.pathname,
      nowPlaying,
      playing: true,
    });
    if (isRadioPlayerPage()) enterImmersive();
    else updateMiniBarUi(readSession(), true);
  }

  function onPlayingChange(playing, meta) {
    if (!isEnabled()) return;
    const session = readSession() || readStationFromPage();
    if (!session) return;
    const nowPlaying =
      meta?.nowPlaying ||
      document.getElementById('radioNowPlaying')?.textContent?.trim() ||
      session.nowPlaying ||
      '';
    writeSession({
      ...session,
      pageUrl: session.pageUrl || (isRadioPlayerPage() ? location.pathname : session.pageUrl),
      nowPlaying,
      playing: Boolean(playing),
    });
    if (meta?.metadataOnly) {
      if (isRadiosIndexPage()) updateMiniBarUi(readSession(), readSession()?.playing !== false);
      return;
    }
    if (playing && isRadioPlayerPage()) enterImmersive();
    if (isRadiosIndexPage()) updateMiniBarUi(readSession(), playing);
  }

  function bindPageAudio(pageAudio) {
    if (!isEnabled() || isNativeApp()) return null;
    if (pageAudio) blockPageAudio(pageAudio);
    return ensureGlobalAudio();
  }

  function registerToggle(fn) {
    toggleHandler = fn;
  }

  function handleBackButton() {
    if (!isEnabled()) return false;
    if (document.body.classList.contains('radio-immersive')) {
      minimizeToRadios();
      return true;
    }
    if (isRadioPlayerPage() && readSession()?.playing) {
      minimizeToRadios();
      return true;
    }
    return false;
  }

  function bootImmersiveIfRadioPage() {
    if (!isEnabled() || !isRadioPlayerPage()) return;
    if (isNativeApp()) {
      document.documentElement.classList.add('radio-immersive-boot');
      enterImmersive();
      return;
    }
    const session = readSession();
    if (session?.playing !== false) {
      document.documentElement.classList.add('radio-immersive-boot');
    }
  }

  function initOnLoad() {
    if (!isEnabled()) return;
    bindImmersiveControls();
    bootImmersiveIfRadioPage();

    const session = readSession();
    if (isRadiosIndexPage() && session) {
      updateMiniBarUi(session, session.playing !== false);
      if (!isNativeApp()) resumeWebStreamFromSession();
      syncMiniBarFromNative();
      window.setInterval(syncMiniBarFromNative, 4000);
      if (isNativeApp()) {
        window.VivordAds?.show?.();
      }
    }

    if (isRadioPlayerPage() && session?.playing && !isNativeApp()) {
      enterImmersive();
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      if (isRadioPlayerPage() && document.body.classList.contains('radio-immersive')) {
        hideMiniBar();
        if (isNativeApp()) {
          window.VivordAds?.hide?.();
        }
        return;
      }
      if (isRadiosIndexPage()) {
        syncMiniBarFromNative();
      }
    });

    if (isNativeApp()) {
      const capApp = window.Capacitor?.Plugins?.App;
      capApp?.addListener?.('appStateChange', ({ isActive }) => {
        if (!isActive) return;
        if (isRadioPlayerPage() && document.body.classList.contains('radio-immersive')) {
          hideMiniBar();
          window.VivordAds?.hide?.();
        } else if (isRadiosIndexPage()) {
          syncMiniBarFromNative();
        }
      });
    }
  }

  window.VivordRadioShell = {
    isEnabled,
    enterImmersive,
    exitImmersive,
    minimizeToRadios,
    expandCurrentStation,
    onPlaybackStarted,
    onPlayingChange,
    bindPageAudio,
    registerToggle,
    handleBackButton,
    readSession,
    writeSession,
    setStreamMeta,
    syncMiniBar: syncMiniBarFromNative,
    getGlobalAudio: ensureGlobalAudio,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOnLoad);
  } else {
    initOnLoad();
  }
})();
