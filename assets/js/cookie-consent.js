(function () {
  if (window.VIVORD_IS_NATIVE) return;

  const STORAGE_KEY = 'vivord_cookie_consent';
  const banner = document.getElementById('cookieConsent');
  const acceptBtn = document.getElementById('cookieAccept');
  const rejectBtn = document.getElementById('cookieReject');

  function readConsent() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function saveConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* private mode */
    }
  }

  function updateConsentMode(granted) {
    const status = granted ? 'granted' : 'denied';
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = window.gtag || gtag;
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
    gtag('consent', 'update', {
      ad_storage: status,
      ad_user_data: status,
      ad_personalization: status,
    });
  }

  function hideBanner() {
    if (!banner) return;
    // Evita warning de aria-hidden: si un hijo tiene foco, quítaselo antes de ocultar.
    try {
      const active = document.activeElement;
      if (active && banner.contains(active) && typeof active.blur === 'function') active.blur();
    } catch {
      /* noop */
    }
    banner.hidden = true;
    banner.setAttribute('aria-hidden', 'true');
    banner.style.display = 'none';
    banner.style.pointerEvents = 'none';
    // Remoción final para evitar overlays persistentes por CSS/transform.
    setTimeout(() => {
      try {
        banner.remove();
      } catch {
        /* noop */
      }
    }, 0);
  }

  function showBanner() {
    if (!banner) return;
    banner.hidden = false;
    banner.setAttribute('aria-hidden', 'false');
    banner.style.display = '';
    banner.style.pointerEvents = '';
  }

  function applyConsent(value) {
    const granted = value === 'accepted';
    saveConsent(value);
    updateConsentMode(granted);
    hideBanner();
    if (granted) {
      document.dispatchEvent(new CustomEvent('vivord:ads-consent', { detail: { granted: true } }));
    }
  }

  const saved = readConsent();
  if (saved === 'accepted' || saved === 'rejected') {
    updateConsentMode(saved === 'accepted');
    hideBanner();
    if (saved === 'accepted') {
      document.dispatchEvent(new CustomEvent('vivord:ads-consent', { detail: { granted: true } }));
    }
  } else {
    updateConsentMode(false);
    showBanner();
  }

  acceptBtn?.addEventListener('click', (e) => {
    e.preventDefault?.();
    e.stopPropagation?.();
    applyConsent('accepted');
  });
  rejectBtn?.addEventListener('click', (e) => {
    e.preventDefault?.();
    e.stopPropagation?.();
    applyConsent('rejected');
  });
})();
