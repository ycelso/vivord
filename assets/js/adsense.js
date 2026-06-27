(function () {
  if (window.VIVORD_IS_NATIVE) return;

  function getClientId() {
    const meta =
      document.querySelector('meta[name="vivord-adsense-client"]') ||
      document.querySelector('meta[name="google-adsense-account"]');
    const id = meta?.getAttribute('content')?.trim() || '';
    return /^ca-pub-\d+$/i.test(id) ? id : '';
  }

  function hasConsent() {
    try {
      return localStorage.getItem('vivord_cookie_consent') === 'accepted';
    } catch {
      return false;
    }
  }

  function loadAdsenseScript(client) {
    return new Promise(function (resolve, reject) {
      if (window.adsbygoogle) {
        resolve();
        return;
      }
      var existing = document.querySelector('script[src*="adsbygoogle.js"]');
      if (existing) {
        existing.addEventListener('load', function () { resolve(); }, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      var s = document.createElement('script');
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.src =
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
        encodeURIComponent(client);
      s.onload = function () { resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function fillAdSlots() {
    const client = getClientId();
    if (!client || !hasConsent()) return;

    loadAdsenseScript(client)
      .then(function () {
        const units = document.querySelectorAll('ins.adsbygoogle:not([data-ads-fill])');
        units.forEach((el) => {
          if (!el.getAttribute('data-ad-client')) {
            el.setAttribute('data-ad-client', client);
          }
          el.setAttribute('data-ads-fill', '1');
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          } catch (e) {
            console.warn('AdSense fill', e);
          }
        });
      })
      .catch(function () {});
  }

  function init() {
    if (getClientId() && hasConsent()) fillAdSlots();
  }

  document.addEventListener('vivord:ads-consent', (e) => {
    if (e.detail?.granted) fillAdSlots();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
