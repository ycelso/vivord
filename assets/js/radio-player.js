const HLS_JS = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js';

const RADIO_GESTURE_KEY = 'vivord-radio-autoplay';
const RADIO_GESTURE_MS = 8000;

function markRadioPlayGesture() {
  try {
    sessionStorage.setItem(RADIO_GESTURE_KEY, String(Date.now()));
  } catch {
    /* private mode */
  }
}

function hadRecentRadioGesture() {
  try {
    const t = Number(sessionStorage.getItem(RADIO_GESTURE_KEY) || 0);
    return t > 0 && Date.now() - t < RADIO_GESTURE_MS;
  } catch {
    return false;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

if (!window.__vivordRadioGestureBound) {
  window.__vivordRadioGestureBound = true;
  document.addEventListener(
    'click',
    (e) => {
      const link = e.target.closest('a[href*="radio/"]');
      if (link) markRadioPlayGesture();
    },
    true
  );
}

// Zeno: el navegador sigue redirects y reproduce sin proxy (el proxy devuelve 502/403)
const ZENO_HOSTS = ['zeno.fm', 'zenolive.com'];

// Emisoras que permiten reproducción directa (sin /api/proxy)
const DIRECT_STREAM_HOSTS = [...ZENO_HOSTS];

// Radiojar redirige a MP3 directo (nXX.radiojar.com), no a HLS
const HLS_HOSTS = ['streamgato', 'cf.dmcdn.net'];



function isDirectStream(url) {
  const u = (url || '').toLowerCase();
  return DIRECT_STREAM_HOSTS.some((h) => u.includes(h));
}

function isHlsStream(url, mimeType) {

  if (!url) return false;

  if (isZenoStream(url) || (url || '').toLowerCase().includes('radiojar.com')) return false;

  if (mimeType?.startsWith('audio/')) return false;

  const u = url.toLowerCase();

  if (u.includes('.m3u8')) return true;

  if (HLS_HOSTS.some((h) => u.includes(h))) return true;

  if (u.endsWith(';') || /:\d{3,5}\/;/.test(u)) return false;

  if (

    u.includes('z101digital') ||

    u.includes('shoutcast') ||

    u.includes('icecast') ||

    u.includes('radiord') ||

    u.includes('domint.net') ||

    u.includes('domiplay') ||

    u.includes('grupointernet') ||

    u.includes('brlogic.com') ||

    u.includes('sonicpanel')

  ) {

    return false;

  }

  if (mimeType?.includes('mpegURL') && !u.includes('m3u8')) return false;

  return Boolean(mimeType?.includes('mpegURL'));

}



function isZenoStream(url) {
  const u = (url || '').toLowerCase();
  return ZENO_HOSTS.some((h) => u.includes(h));
}

function proxiedUrl(url, referer) {
  if (!url) return url;
  if (url.startsWith('/api/')) return window.apiUrl ? window.apiUrl(url) : url;
  let out = `/api/proxy?url=${encodeURIComponent(url)}`;
  if (referer) out += `&referer=${encodeURIComponent(referer)}`;
  return window.apiUrl ? window.apiUrl(out) : out;
}

function playbackUrl(streamUrl, streamReferer) {
  if (isDirectStream(streamUrl)) return streamUrl;
  return proxiedUrl(streamUrl, streamReferer);
}

async function followZenoRedirects(initialUrl) {
  let url = initialUrl;
  for (let i = 0; i < 10; i++) {
    let res;
    try {
      res = await fetch(url, { redirect: 'manual', referrerPolicy: 'no-referrer' });
    } catch {
      break;
    }
    if ([301, 302, 307, 308].includes(res.status)) {
      const loc = res.headers.get('location');
      res.body?.cancel?.();
      if (!loc) break;
      url = new URL(loc, url).href;
      continue;
    }
    res.body?.cancel?.();
    if (res.ok || url.includes('zt=')) return url;
    break;
  }
  return url;
}

async function resolvePlayUrl(streamUrl, streamReferer, zenoSlug) {
  let url = streamUrl;
  if (zenoSlug) {
    try {
      let api = `/api/zeno-resolve?slug=${encodeURIComponent(zenoSlug)}`;
      if (streamReferer) api += `&referer=${encodeURIComponent(streamReferer)}`;
      if (window.apiUrl) api = window.apiUrl(api);
      const res = await fetch(api);
      if (res.ok) {
        const data = await res.json();
        if (data.playUrl) url = data.playUrl;
      }
    } catch {
      /* sigue con stream del catálogo */
    }
  }
  if (isZenoStream(url)) url = await followZenoRedirects(url);
  return url;
}

async function playAudioElement(audio) {
  try {
    await audio.play();
    return true;
  } catch {
    try {
      audio.muted = true;
      await audio.play();
      audio.muted = false;
      return true;
    } catch {
      audio.muted = false;
      return false;
    }
  }
}

function loadScript(src) {

  return new Promise((resolve, reject) => {

    if (document.querySelector(`script[src="${src}"]`)) {

      resolve();

      return;

    }

    const el = document.createElement('script');

    el.src = src;

    el.onload = () => resolve();

    el.onerror = () => reject(new Error(`No se pudo cargar ${src}`));

    document.head.appendChild(el);

  });

}



function setNowPlaying(text) {

  const now = document.getElementById('radioNowPlaying');

  if (!now) return;

  if (text) {

    now.textContent = text;

    now.hidden = false;

  } else {

    now.textContent = '';

    now.hidden = true;

  }

  window.VivordRadioShell?.onPlayingChange?.(
    document.getElementById('radioStage')?.classList.contains('is-playing'),
    { nowPlaying: text || '', metadataOnly: true }
  );

}



function syncVolumeSlider(el) {

  if (!el) return;

  const max = Number(el.max) || 1;

  const pct = (Number(el.value) / max) * 100;

  el.style.setProperty('--vol-pct', `${pct}%`);

  const dock = el.closest('.radio-dock');

  if (dock) dock.style.setProperty('--vol-pct', `${pct}%`);

}



function setPlayingUi(playing, errorMsg = '') {

  const btn = document.getElementById('radioToggleBtn');

  const viz = document.getElementById('radioVisualizer');

  const stage = document.getElementById('radioStage');

  const status = document.getElementById('radioStatus');

  const now = document.getElementById('radioNowPlaying');



  if (btn) {

    btn.classList.toggle('is-playing', playing);

    btn.setAttribute('aria-label', playing ? 'Detener' : 'Reproducir');

    btn.setAttribute('aria-pressed', playing ? 'true' : 'false');

  }

  viz?.classList.toggle('is-playing', playing);

  stage?.classList.toggle('is-playing', playing);



  if (status && !errorMsg) {

    if (!playing) {

      setNowPlaying('');

      status.textContent = status.dataset.default || status.textContent;

    } else if (!now?.textContent) {

      status.textContent = 'Reproduciendo en vivo ahora';

    }

  }



  const err = document.getElementById('radioError');

  if (err) {

    err.textContent = errorMsg;

    err.hidden = !errorMsg;

  }

  window.VivordRadioShell?.onPlayingChange?.(playing, {
    nowPlaying: now?.textContent?.trim() || '',
  });

}



function resolveCapacitorPlugin(name) {
  const cap = window.Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  if (typeof cap.registerPlugin === 'function') {
    return cap.registerPlugin(name);
  }
  // El bridge nativo inyectado no siempre expone registerPlugin:
  // los plugins registrados en MainActivity están en Capacitor.Plugins.
  return cap.Plugins?.[name] || null;
}

function getNativeRadioPlugin() {
  try {
    if (!window.__vivordRadioNativePlugin) {
      window.__vivordRadioNativePlugin = resolveCapacitorPlugin('RadioNative');
    }
    return window.__vivordRadioNativePlugin;
  } catch {
    return null;
  }
}

function toAbsoluteUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (window.apiUrl) return window.apiUrl(url);
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
}

function stationTitleFromDom() {
  return (
    document.querySelector('.radio-stage__title')?.textContent?.trim() || 'VivoRD Radio'
  );
}

function blockWebAudioElement(el) {
  if (!el || el.__vivordBlocked) return;
  el.__vivordBlocked = true;
  el.muted = true;
  el.volume = 0;
  el.pause();
  el.removeAttribute('autoplay');
  el.removeAttribute('src');
  el.load();
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

function createDebouncedPlayingUi(delayMs = 350) {
  let timer = null;
  let lastPlaying = null;
  return (playing, errorMsg = '') => {
    if (lastPlaying === playing && !errorMsg) {
      return;
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      lastPlaying = playing;
      setPlayingUi(playing, errorMsg);
    }, delayMs);
  };
}

async function initNativeRadioPlayer(streamUrl, streamType, streamReferer, zenoSlug, native) {
  const audio = document.getElementById('radio-player');
  const toggleBtn = document.getElementById('radioToggleBtn');
  const volume = document.getElementById('radioVolume');
  if (!audio) return;

  markRadioPlayGesture();
  blockWebAudioElement(audio);

  await window.VivordRadioMedia?.attachNative?.(native);

  let started = false;
  let userPaused = false;
  let pausedByExternal = false;
  let reconnectTimer = null;
  let reconnectAttempt = 0;
  let metadataTimer = null;
  let nativePlaying = false;
  const MAX_RECONNECT = 4;

  function setUiPlaying(playing, errorMsg = '') {
    nativePlaying = playing;
    setPlayingUi(playing, errorMsg);
    if (playing && !errorMsg) {
      window.VivordRadioShell?.onPlaybackStarted?.();
    }
  }

  function clearReconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function scheduleReconnect(reason) {
    if (userPaused || pausedByExternal || !started || reconnectAttempt >= MAX_RECONNECT) return;
    clearReconnect();
    reconnectAttempt += 1;
    const waitMs = Math.min(1500 * reconnectAttempt, 8000);
    reconnectTimer = window.setTimeout(async () => {
      reconnectTimer = null;
      if (userPaused || pausedByExternal || !started) return;
      console.warn('Radio nativa reconectando…', reason, reconnectAttempt);
      try {
        await start();
        reconnectAttempt = 0;
      } catch (e) {
        console.warn('Radio nativa reconexión fallida', e);
        scheduleReconnect('retry');
      }
    }, waitMs);
  }

  async function refreshNowPlaying() {
    if (!nativePlaying || !streamUrl) return;
    try {
      let metaUrl = `/api/radio-now-playing?url=${encodeURIComponent(streamUrl)}`;
      if (streamReferer) {
        metaUrl += `&referer=${encodeURIComponent(streamReferer)}`;
      }
      if (window.apiUrl) metaUrl = window.apiUrl(metaUrl);
      const res = await fetch(metaUrl);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.title) {
        setNowPlaying(data.title);
        const status = document.getElementById('radioStatus');
        if (status) status.textContent = 'Sonando ahora';
      } else {
        setNowPlaying('');
      }
    } catch {
      /* sin metadatos */
    }
  }

  function startMetadataPoll() {
    stopMetadataPoll();
    refreshNowPlaying();
    metadataTimer = window.setInterval(refreshNowPlaying, 15000);
  }

  function stopMetadataPoll() {
    if (metadataTimer) {
      clearInterval(metadataTimer);
      metadataTimer = null;
    }
    setNowPlaying('');
  }

  async function resolveThisStationSrc() {
    const playUrl = await resolvePlayUrl(streamUrl, streamReferer, zenoSlug);
    return toAbsoluteUrl(playbackUrl(playUrl, streamReferer));
  }

  function streamSourcesMatch(a, b) {
    if (!a || !b) return false;
    try {
      return new URL(a).href === new URL(b).href;
    } catch {
      return a === b;
    }
  }

  async function isThisStationActive() {
    if (!native.getStatus) return false;
    const status = await native.getStatus();
    if (!status?.playing || !status.url) return false;
    const src = await resolveThisStationSrc();
    const ref = streamReferer || '';
    const statusRef = status.referer || '';
    return streamSourcesMatch(status.url, src) && statusRef === ref;
  }

  async function start() {
    clearReconnect();
    const src = await resolveThisStationSrc();
    window.VivordRadioShell?.setStreamMeta?.({
      streamUrl: src,
      streamType,
      streamReferer: streamReferer || '',
      zenoSlug: zenoSlug || '',
    });
    const title = stationTitleFromDom();
    const artist =
      document.getElementById('radioStatus')?.textContent?.trim() || 'En vivo';

    await native.play({
      url: src,
      referer: streamReferer || '',
      title,
      artist,
    });

    await delay(600);
    const status = await native.isPlaying();
    if (!status?.playing) {
      throw new Error('El reproductor nativo no arrancó');
    }

    userPaused = false;
    pausedByExternal = false;
    reconnectAttempt = 0;
    started = true;
    setUiPlaying(true);
    startMetadataPoll();
  }

  async function syncUiFromNative() {
    if (userPaused || pausedByExternal) return;
    try {
      if (await isThisStationActive()) {
        started = true;
        setUiPlaying(true);
        startMetadataPoll();
        return;
      }
      const status = await native.isPlaying();
      if (status?.playing) {
        started = false;
        setUiPlaying(false);
        stopMetadataPoll();
        return;
      }
      if (started) {
        await native.resume();
        await delay(400);
        const again = await native.isPlaying();
        if (again?.playing) {
          setUiPlaying(true);
          startMetadataPoll();
          return;
        }
      }
      setUiPlaying(false);
      stopMetadataPoll();
    } catch {
      /* noop */
    }
  }

  async function toggle() {
    if (!nativePlaying) {
      try {
        if (!started) {
          await start();
        } else {
          pausedByExternal = false;
          userPaused = false;
          await native.resume();
          await delay(600);
          const status = await native.isPlaying();
          if (!status?.playing) {
            pausedByExternal = true;
            setUiPlaying(false);
            stopMetadataPoll();
            throw new Error('No se pudo reanudar');
          }
          setUiPlaying(true);
          startMetadataPoll();
        }
      } catch (e) {
        console.warn('Radio nativa play error', e);
        setUiPlaying(false, 'No se pudo reproducir. Pulsa de nuevo o prueba otra emisora.');
        stopMetadataPoll();
      }
    } else {
      userPaused = true;
      nativePlaying = false;
      clearReconnect();
      await native.pause();
      setUiPlaying(false);
      stopMetadataPoll();
    }
  }

  toggleBtn?.addEventListener('click', toggle);

  window.VivordRadioShell?.registerToggle?.(toggle);

  syncVolumeSlider(volume);
  volume?.addEventListener('input', () => {
    const vol = Number(volume.value);
    native.setVolume({ value: vol }).catch(() => {});
    syncVolumeSlider(volume);
  });

  native.addListener('radioEvent', ({ event, message }) => {
    if (event === 'externalPause') {
      pausedByExternal = true;
      userPaused = false;
      clearReconnect();
      setUiPlaying(false);
      stopMetadataPoll();
      return;
    }
    if (event === 'error') {
      if (userPaused || pausedByExternal) return;
      setUiPlaying(false, message || 'Señal no disponible');
      stopMetadataPoll();
      scheduleReconnect('error');
      return;
    }
    if (event === 'started' && !userPaused && !pausedByExternal) {
      pausedByExternal = false;
      setUiPlaying(true);
      startMetadataPoll();
      return;
    }
    if (event === 'paused') {
      userPaused = true;
      pausedByExternal = false;
      clearReconnect();
      setUiPlaying(false);
      stopMetadataPoll();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      syncUiFromNative();
    }
  });

  const capApp = window.Capacitor?.Plugins?.App;
  capApp?.addListener?.('appStateChange', ({ isActive }) => {
    if (isActive) syncUiFromNative();
  });

  const status = document.getElementById('radioStatus');
  if (status) status.dataset.default = status.textContent;

  async function tryAutoplay() {
    try {
      if (await isThisStationActive()) {
        started = true;
        userPaused = false;
        pausedByExternal = false;
        setUiPlaying(true);
        startMetadataPoll();
        return;
      }
    } catch {
      /* seguir con autoplay normal */
    }
    const retryDelays = hadRecentRadioGesture()
      ? [300, 700, 1200, 2000, 3000]
      : [500, 1200, 2500];
    for (const waitMs of retryDelays) {
      if (waitMs) await delay(waitMs);
      try {
        await start();
        return;
      } catch (e) {
        console.warn('Autoplay nativo intento', waitMs, e);
      }
    }
    setUiPlaying(false, 'Pulsa ▶ para escuchar en vivo');
    stopMetadataPoll();
  }

  tryAutoplay();
}

async function initRadioPlayer(streamUrl, streamType = '', streamReferer = '', zenoSlug = '') {
  const native = getNativeRadioPlugin();
  if (native) {
    await initNativeRadioPlayer(streamUrl, streamType, streamReferer, zenoSlug, native);
    return;
  }

  const pageAudio = document.getElementById('radio-player');
  const shellAudio = window.VivordRadioShell?.bindPageAudio?.(pageAudio);
  const audio = shellAudio || pageAudio;

  const toggleBtn = document.getElementById('radioToggleBtn');

  const volume = document.getElementById('radioVolume');

  if (!audio) return;

  audio.autoplay = true;
  audio.setAttribute('playsinline', '');
  audio.setAttribute('webkit-playsinline', '');

  window.VivordRadioMedia?.attach?.(audio);

  let hls = null;

  let started = false;

  let userPaused = false;

  let reconnectTimer = null;

  let reconnectAttempt = 0;

  const MAX_RECONNECT = 4;



  function clearReconnect() {

    if (reconnectTimer) {

      clearTimeout(reconnectTimer);

      reconnectTimer = null;

    }

  }



  function scheduleReconnect(reason) {

    if (userPaused || !started || reconnectAttempt >= MAX_RECONNECT) return;

    clearReconnect();

    reconnectAttempt += 1;

    const waitMs = Math.min(1500 * reconnectAttempt, 8000);

    reconnectTimer = window.setTimeout(async () => {

      reconnectTimer = null;

      if (userPaused || !started) return;

      console.warn('Radio reconectando…', reason, reconnectAttempt);

      try {

        await start();

        reconnectAttempt = 0;

      } catch (e) {

        console.warn('Radio reconexión fallida', e);

        scheduleReconnect('retry');

      }

    }, waitMs);

  }
  let metadataTimer = null;



  async function refreshNowPlaying() {

    if (audio.paused || !streamUrl) return;

    try {

      let metaUrl = `/api/radio-now-playing?url=${encodeURIComponent(streamUrl)}`;
      if (streamReferer) {
        metaUrl += `&referer=${encodeURIComponent(streamReferer)}`;
      }
      if (window.apiUrl) metaUrl = window.apiUrl(metaUrl);
      const res = await fetch(metaUrl);

      if (!res.ok) return;

      const data = await res.json();

      if (data?.title) {

        setNowPlaying(data.title);
        window.VivordRadioMedia?.refreshMetadata?.();

        const status = document.getElementById('radioStatus');

        if (status) status.textContent = 'Sonando ahora';

      } else {

        setNowPlaying('');

      }

    } catch {

      /* sin metadatos */

    }

  }



  function startMetadataPoll() {

    stopMetadataPoll();

    refreshNowPlaying();

    metadataTimer = window.setInterval(refreshNowPlaying, 15000);

  }



  function stopMetadataPoll() {

    if (metadataTimer) {

      clearInterval(metadataTimer);

      metadataTimer = null;

    }

    setNowPlaying('');

  }



  async function start() {

    setPlayingUi(false, '');

    clearReconnect();

    const useHls = isHlsStream(streamUrl, streamType);

    const playUrl = await resolvePlayUrl(streamUrl, streamReferer, zenoSlug);
    const src = playbackUrl(playUrl, streamReferer);

    window.VivordRadioShell?.setStreamMeta?.({
      streamUrl: toAbsoluteUrl(src),
      streamType,
      streamReferer: streamReferer || '',
      zenoSlug: zenoSlug || '',
    });

    if (useHls) {

      if (!window.Hls) await loadScript(HLS_JS);

      if (window.Hls && Hls.isSupported()) {

        hls?.destroy();

        hls = new Hls({ enableWorker: true, liveDurationInfinity: true });

        hls.loadSource(src);

        hls.attachMedia(audio);

        await new Promise((resolve, reject) => {

          hls.on(Hls.Events.MANIFEST_PARSED, resolve);

          hls.on(Hls.Events.ERROR, (_, data) => {

            if (data.fatal) reject(data);

          });

        });

      } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {

        audio.src = src;

      } else {

        throw new Error('HLS no soportado en este navegador');

      }

    } else {
      if (isZenoStream(streamUrl)) {
        audio.referrerPolicy = 'no-referrer';
      }
      audio.src = src;
    }



    const played = await playAudioElement(audio);
    if (!played) throw new Error('Autoplay bloqueado');

    window.VivordRadioMedia?.markUserPlaying?.();

    userPaused = false;

    reconnectAttempt = 0;

    started = true;

    setPlayingUi(true);

    window.VivordRadioShell?.onPlaybackStarted?.();

    startMetadataPoll();

  }



  async function toggle() {

    if (audio.paused) {

      try {

        if (!started) await start();

        else {

          const played = await playAudioElement(audio);
          if (!played) throw new Error('Reproducción bloqueada');

          window.VivordRadioMedia?.markUserPlaying?.();

          setPlayingUi(true);

          startMetadataPoll();

        }

      } catch (e) {

        console.warn('Radio play error', e);

        setPlayingUi(false, 'No se pudo reproducir. Pulsa de nuevo o prueba otra emisora.');

        stopMetadataPoll();

      }

    } else {

      window.VivordRadioMedia?.markUserPaused?.();

      userPaused = true;

      clearReconnect();

      audio.pause();

      setPlayingUi(false);

      stopMetadataPoll();

    }

  }



  toggleBtn?.addEventListener('click', toggle);

  window.VivordRadioShell?.registerToggle?.(toggle);

  syncVolumeSlider(volume);

  volume?.addEventListener('input', () => {

    audio.volume = Number(volume.value);

    syncVolumeSlider(volume);

  });



  audio.addEventListener('play', () => {

    setPlayingUi(true);

    startMetadataPoll();

  });

  audio.addEventListener('pause', () => {

    if (started && !userPaused) setPlayingUi(false);

    if (userPaused) stopMetadataPoll();

  });

  audio.addEventListener('error', () => {

    if (userPaused) return;

    setPlayingUi(

      false,

      reconnectAttempt >= MAX_RECONNECT ? 'Señal no disponible. Intenta de nuevo.' : 'Reconectando…'

    );

    stopMetadataPoll();

    scheduleReconnect('error');

  });



  if (volume) audio.volume = Number(volume.value);



  const status = document.getElementById('radioStatus');

  if (status) status.dataset.default = status.textContent;

  if (window.VivordRadioMedia) {
    window.VivordRadioMedia.recoverStream = async (reason) => {
      if (userPaused || !started) return;
      console.warn('Radio recuperando stream…', reason);
      try {
        await start();
        reconnectAttempt = 0;
        setPlayingUi(true);
        startMetadataPoll();
      } catch (e) {
        console.warn('Radio recuperación fallida', e);
        scheduleReconnect('recover');
      }
    };
  }

  window.addEventListener('vivord-radio-focus-lost', () => {
    clearReconnect();
    userPaused = false;
    setPlayingUi(false);
    stopMetadataPoll();
  });

  async function tryAutoplay() {
    const retryDelays = hadRecentRadioGesture() ? [0, 350, 700, 1200, 2000] : [0, 500];
    for (const waitMs of retryDelays) {
      if (waitMs) await delay(waitMs);
      try {
        await start();
        return;
      } catch (e) {
        console.warn('Autoplay intento', waitMs, e);
      }
    }
    setPlayingUi(false, 'Pulsa ▶ para escuchar en vivo');
    stopMetadataPoll();
  }

  tryAutoplay();
}


