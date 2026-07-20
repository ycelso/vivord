/** Ajustes solo en app nativa (barra de estado, splash, atrás, conectividad). */
(function () {
  function isNative() {
    try {
      return Boolean(window.Capacitor?.isNativePlatform?.());
    } catch {
      return false;
    }
  }

  if (!isNative()) return;

  window.VIVORD_IS_NATIVE = true;
  document.documentElement.classList.add('capacitor-app');

  function isAppRadioOnly() {
    return (
      document.documentElement.classList.contains('app-radio-only') ||
      document.querySelector('meta[name="vivord-app-mode"][content="radio-only"]') != null
    );
  }

  if (
    isAppRadioOnly() ||
    document.querySelector('meta[name="vivord-app-mode"][content="radio-only"]')
  ) {
    document.documentElement.classList.add('app-radio-only');
  }

  function hideSplash() {
    const splash = window.Capacitor?.Plugins?.SplashScreen;
    if (splash?.hide) splash.hide().catch(function () {});
  }

  function setupStatusBar() {
    const bar = window.Capacitor?.Plugins?.StatusBar;
    if (!bar) return;
    if (bar.setOverlaysWebView) {
      bar.setOverlaysWebView({ overlay: true }).catch(function () {});
    }
    bar.setStyle({ style: 'DARK' }).catch(function () {});
    bar.setBackgroundColor({ color: '#0a0a0b' }).catch(function () {});
  }

  function setupBackButton() {
    const app = window.Capacitor?.Plugins?.App;
    if (!app?.addListener) return;
    app.addListener('backButton', function () {
      if (window.VivordRadioShell?.handleBackButton?.()) return;
      if (window.history.length > 1) {
        window.history.back();
      } else {
        app.exitApp();
      }
    });
  }

  function setupOfflineBanner() {
    var banner = document.getElementById('nativeOffline');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'nativeOffline';
      banner.className = 'native-offline';
      banner.setAttribute('role', 'status');
      banner.hidden = true;
      banner.textContent = 'Sin conexión — comprueba tu internet';
      document.body.appendChild(banner);
    }

    function sync() {
      banner.hidden = navigator.onLine;
    }

    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    sync();
  }

  var CHANGELOG_1_0_10 = {
    version: '1.0.10',
    storageKey: 'vivord_changelog_seen_11',
    title: 'VivoRD 1.0.10',
    subtitle: '¿Qué hay de nuevo?',
    items: [
      {
        title: 'Banner optimizado',
        text: 'El anuncio inferior se adapta al ancho de tu pantalla.',
      },
      {
        title: 'Mejoras generales',
        text: 'Ajustes de estabilidad y experiencia en la app.',
      },
    ],
    button: 'Entendido',
  };

  var CHANGELOG_1_0_9 = {
    version: '1.0.9',
    storageKey: 'vivord_changelog_seen_10',
    title: 'VivoRD 1.0.9',
    subtitle: '¿Qué hay de nuevo?',
    items: [
      {
        title: 'Mejoras de rendimiento',
        text: 'Optimizaciones al cargar emisoras de radio dominicanas.',
      },
      {
        title: 'Experiencia más fluida',
        text: 'Ajustes de estabilidad al reproducir y navegar por la app.',
      },
    ],
    button: 'Entendido',
  };

  var CHANGELOG_1_0_8 = {
    version: '1.0.8',
    storageKey: 'vivord_changelog_seen_9',
    title: 'VivoRD 1.0.8',
    subtitle: '¿Qué hay de nuevo?',
    items: [
      {
        title: 'Logo renovado',
        text: 'Icono de la app, splash de inicio y marca actualizados en toda la interfaz.',
      },
      {
        title: 'Icono en el launcher',
        text: 'El icono circular se muestra correctamente en la pantalla de inicio.',
      },
      {
        title: 'Mejoras de estabilidad',
        text: 'Ajustes al reproductor de radio y al navegar por TV y emisoras.',
      },
    ],
    button: 'Entendido',
  };

  function showChangelogModal(config) {
    if (document.getElementById('vivordChangelog')) return;

    var overlay = document.createElement('div');
    overlay.id = 'vivordChangelog';
    overlay.className = 'vivord-changelog';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'vivordChangelogTitle');

    var panel = document.createElement('div');
    panel.className = 'vivord-changelog__panel';

    var header = document.createElement('header');
    header.className = 'vivord-changelog__header';

    var title = document.createElement('h2');
    title.id = 'vivordChangelogTitle';
    title.className = 'vivord-changelog__title';
    title.textContent = config.title;

    var subtitle = document.createElement('p');
    subtitle.className = 'vivord-changelog__subtitle';
    subtitle.textContent = config.subtitle;

    header.appendChild(title);
    header.appendChild(subtitle);

    var list = document.createElement('ul');
    list.className = 'vivord-changelog__list';

    config.items.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'vivord-changelog__item';

      var itemTitle = document.createElement('strong');
      itemTitle.className = 'vivord-changelog__item-title';
      itemTitle.textContent = item.title;

      var itemText = document.createElement('p');
      itemText.className = 'vivord-changelog__item-text';
      itemText.textContent = item.text;

      li.appendChild(itemTitle);
      li.appendChild(itemText);
      list.appendChild(li);
    });

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'vivord-changelog__btn';
    btn.textContent = config.button;

    function dismiss() {
      try {
        localStorage.setItem(config.storageKey, '1');
      } catch {
        /* ignore */
      }
      overlay.remove();
    }

    btn.addEventListener('click', dismiss);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) dismiss();
    });

    panel.appendChild(header);
    panel.appendChild(list);
    panel.appendChild(btn);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  async function setupChangelogModal() {
    if (PLAY_STORE_CAPTURE_MODE) return;
    var app = window.Capacitor?.Plugins?.App;
    if (!app?.getInfo) return;

    try {
      var info = await app.getInfo();
      if (info.version !== CHANGELOG_1_0_10.version) return;
      if (localStorage.getItem(CHANGELOG_1_0_10.storageKey)) return;
      showChangelogModal(CHANGELOG_1_0_10);
    } catch {
      /* ignore */
    }
  }

  // false en builds de capturas Play Store (npm run play-store:screenshots).
  var ADMOB_BANNER_ENABLED = true;
  var PLAY_STORE_CAPTURE_MODE = false;
  // false = anuncios reales de AdMob (cuenta vinculada a Play Store).
  var ADMOB_TEST_MODE = false;
  var ADMOB_BANNER_UNIT_REAL = 'ca-app-pub-9983636461587656/1239527684';
  var ADMOB_BANNER_UNIT_TEST = 'ca-app-pub-3940256099942544/6300978111';

  var admobInitialized = false;
  var admobBannerVisible = false;
  var ADMOB_SESSION_KEY = 'vivord_admob_banner_ready';

  function readAdmobSessionReady() {
    try {
      return sessionStorage.getItem(ADMOB_SESSION_KEY) === '1';
    } catch {
      return false;
    }
  }

  function markAdmobSessionReady() {
    try {
      sessionStorage.setItem(ADMOB_SESSION_KEY, '1');
    } catch {
      /* ignore */
    }
  }

  function getAdMobPlugin() {
    var AdMob = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
    if (!AdMob || !AdMob.initialize) return null;
    return AdMob;
  }

  function shouldHideNativeBanner() {
    if (window.__vivordAdForceHide) return true;
    if (document.getElementById('radioStage')) {
      return (
        document.body.classList.contains('radio-immersive') ||
        document.documentElement.classList.contains('radio-immersive-boot')
      );
    }
    return false;
  }

  async function ensureAdMobInitialized() {
    var AdMob = getAdMobPlugin();
    if (!AdMob) return null;
    if (!admobInitialized) {
      await AdMob.initialize({ initializeForTesting: ADMOB_TEST_MODE });
      admobInitialized = true;
    }
    return AdMob;
  }

  async function hideNativeBanner() {
    try {
      var AdMob = await ensureAdMobInitialized();
      if (!AdMob || !AdMob.hideBanner) return;
      await AdMob.hideBanner();
      admobBannerVisible = false;
    } catch {
      /* ignore */
    }
  }

  async function showNativeBanner() {
    try {
      if (!ADMOB_BANNER_ENABLED) return;
      var AdMob = await ensureAdMobInitialized();
      if (!AdMob) return;
      if (shouldHideNativeBanner()) {
        await hideNativeBanner();
        return;
      }
      var hadBanner = readAdmobSessionReady();
      if (hadBanner && AdMob.resumeBanner) {
        await AdMob.resumeBanner();
        admobBannerVisible = true;
        return;
      }
      if (!AdMob.showBanner) return;
      await AdMob.showBanner({
        adId: ADMOB_TEST_MODE ? ADMOB_BANNER_UNIT_TEST : ADMOB_BANNER_UNIT_REAL,
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: 0,
        isTesting: ADMOB_TEST_MODE,
      });
      admobBannerVisible = true;
      markAdmobSessionReady();
    } catch {
      /* ignore */
    }
  }

  async function syncNativeBanner() {
    if (!ADMOB_BANNER_ENABLED || shouldHideNativeBanner()) {
      window.__vivordAdForceHide = true;
      await hideNativeBanner();
      return;
    }
    window.__vivordAdForceHide = false;
    await showNativeBanner();
  }

  window.VivordAds = {
    hide: function () {
      window.__vivordAdForceHide = true;
      return hideNativeBanner();
    },
    show: function () {
      window.__vivordAdForceHide = false;
      return showNativeBanner();
    },
    sync: syncNativeBanner,
  };

  document.addEventListener('DOMContentLoaded', function () {
    hideSplash();
    setupStatusBar();
    setupBackButton();
    setupOfflineBanner();
    if (ADMOB_BANNER_ENABLED) syncNativeBanner();
    setupChangelogModal();
  });

  if (document.readyState !== 'loading') {
    hideSplash();
    setupStatusBar();
  }
})();
