document.querySelectorAll('.player-official-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const url = btn.dataset.officialUrl;
    if (!url) return;

    const isNative = Boolean(window.Capacitor?.isNativePlatform?.());

    if (isNative) {
      window.location.href = url;
      return;
    }

    const w = 1200;
    const h = 680;
    const left = Math.max(0, (screen.width - w) / 2);
    const top = Math.max(0, (screen.height - h) / 2);
    const popup = window.open(
      url,
      'VivoRD_Official',
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    if (!popup) window.location.href = url;
  });
});
