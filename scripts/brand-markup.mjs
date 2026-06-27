export function brandMark(depth = 0) {
  const p = depth ? '../'.repeat(depth) : './';
  return `<span class="brand-mark"><img src="${p}assets/img/vivord-logo.png" alt="VivoRD" width="52" height="52" decoding="async" fetchpriority="high"></span>`;
}

export function brandWordmark() {
  return `<span class="brand-wordmark"><span class="brand-vivo">Vivo</span><span class="brand-rd">RD</span></span>`;
}
