(function () {
  // La app nativa monetiza con AdMob. Cargar otra red en el WebView puede
  // costar la suspensión de la cuenta AdMob. Nunca quitar este guard.
  if (window.VIVORD_IS_NATIVE) return;

  var tag = document.currentScript || document.querySelector('script[data-adsterra-src]');
  var src = tag && tag.getAttribute('data-adsterra-src');
  if (!src || !/^https:\/\//i.test(src)) return;

  var injected = false;

  function hasConsent() {
    try {
      return localStorage.getItem('vivord_cookie_consent') === 'accepted';
    } catch {
      return false;
    }
  }

  // `granted` viene del evento de consentimiento, que solo se emite tras aceptar.
  // Sin él exigimos localStorage; con él basta, porque en modo privado el
  // setItem falla en silencio y el usuario ya dijo que sí.
  function inject(granted) {
    if (injected || window.VIVORD_IS_NATIVE) return;
    if (!granted && !hasConsent()) return;
    injected = true;
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.setAttribute('data-cfasync', 'false');
    document.body.appendChild(s);
  }

  document.addEventListener('vivord:ads-consent', function (e) {
    if (e.detail && e.detail.granted) inject(true);
  });

  // cookie-consent.js puede haber emitido el evento antes de que registremos
  // el listener (ambos son defer). Leer el estado guardado cubre ese caso.
  if (hasConsent()) inject(false);
})();
