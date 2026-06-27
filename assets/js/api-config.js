/**
 * Base URL del API en app Android (Capacitor). En web relativo = mismo origen.
 * Override: localStorage.setItem('vivord_api_base', 'https://tu-servidor.com')
 */
(function () {
  const DEFAULT_APP_API = 'https://vivo-rd.com';

  function isNativeApp() {
    try {
      return Boolean(window.Capacitor?.isNativePlatform?.());
    } catch {
      return false;
    }
  }

  function fromMeta() {
    const el = document.querySelector('meta[name="vivord-api-base"]');
    const v = el?.getAttribute('content')?.trim();
    return v || '';
  }

  function fromStorage() {
    try {
      return (localStorage.getItem('vivord_api_base') || '').trim();
    } catch {
      return '';
    }
  }

  let base = fromStorage() || fromMeta();
  if (!base && isNativeApp()) base = DEFAULT_APP_API;
  base = base.replace(/\/$/, '');

  window.API_BASE = base;

  window.apiUrl = function apiUrl(path) {
    if (!path) return path;
    if (/^https?:\/\//i.test(path)) return path;
    const p = path.startsWith('/') ? path : `/${path}`;
    return base ? `${base}${p}` : p;
  };

  if (isNativeApp()) {
    window.VIVORD_IS_NATIVE = true;
    document.documentElement.classList.add('capacitor-app');
  }
})();
