/** Utilidades HLS compartidas (web + app Capacitor). */
(function () {
  const HLS_JS = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js';

  function isNativeApp() {
    try {
      return Boolean(window.Capacitor?.isNativePlatform?.());
    } catch {
      return false;
    }
  }

  function hlsJsOptions() {
    return {
      enableWorker: !isNativeApp(),
      lowLatencyMode: true,
      maxBufferLength: 45,
    };
  }

  function proxiedHlsUrl(streamUrl, referer) {
    if (!streamUrl) return streamUrl;
    if (streamUrl.startsWith('/api/')) {
      return window.apiUrl ? window.apiUrl(streamUrl) : streamUrl;
    }
    if (!streamUrl.includes('.m3u8')) return streamUrl;
    let path = `/api/proxy?url=${encodeURIComponent(streamUrl)}`;
    if (referer) path += `&referer=${encodeURIComponent(referer)}`;
    return window.apiUrl ? window.apiUrl(path) : path;
  }

  function loadHlsJs() {
    return new Promise((resolve, reject) => {
      if (window.Hls) {
        resolve();
        return;
      }
      if (document.querySelector(`script[src="${HLS_JS}"]`)) {
        const wait = setInterval(() => {
          if (window.Hls) {
            clearInterval(wait);
            resolve();
          }
        }, 50);
        setTimeout(() => {
          clearInterval(wait);
          if (window.Hls) resolve();
          else reject(new Error('HLS.js timeout'));
        }, 15000);
        return;
      }
      const el = document.createElement('script');
      el.src = HLS_JS;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error('No se pudo cargar HLS.js'));
      document.head.appendChild(el);
    });
  }

  /**
   * @param {HTMLVideoElement} video
   * @param {string} src URL lista para el reproductor (proxy o directa)
   * @param {{ onFatal?: () => void }} opts
   */
  async function playHlsVideo(video, src, opts = {}) {
    const onFatal = opts.onFatal;

    function attachHlsJs() {
      if (!window.Hls?.isSupported?.()) {
        onFatal?.();
        return null;
      }
      const hls = new Hls(hlsJsOptions());
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        console.warn('HLS fatal', data);
        hls.destroy();
        onFatal?.();
      });
      return hls;
    }

    const canNative =
      video.canPlayType('application/vnd.apple.mpegurl') ||
      video.canPlayType('application/x-mpegURL');

    if (canNative && isNativeApp()) {
      return new Promise((resolve) => {
        let hlsInstance = null;
        const fallback = () => {
          video.removeAttribute('src');
          video.load();
          loadHlsJs()
            .then(() => {
              hlsInstance = attachHlsJs();
              resolve(hlsInstance);
            })
            .catch(() => onFatal?.());
        };
        video.addEventListener('error', fallback, { once: true });
        video.src = src;
        video.play().catch(fallback);
        resolve(null);
      });
    }

    try {
      if (!window.Hls) await loadHlsJs();
      return attachHlsJs();
    } catch (e) {
      console.warn('HLS.js load', e);
      onFatal?.();
      return null;
    }
  }

  window.VivordHls = {
    isNativeApp,
    hlsJsOptions,
    proxiedHlsUrl,
    loadHlsJs,
    playHlsVideo,
  };
})();
