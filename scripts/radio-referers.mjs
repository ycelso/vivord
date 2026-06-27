/** Sitio oficial por slug — referer correcto para proxy / metadatos Zeno. */
export const RADIO_REFERERS = {
  la91: 'https://la91fm.com/',
  ritmo96: 'https://ritmo96.com/',
  z101: 'https://z101digital.com/',
  hits: 'https://hits97.com/',
  disco106: 'https://disco106.com/',
  cima100: 'https://www.cima100fm.com/',
};

export function radioReferer(slug) {
  return RADIO_REFERERS[slug] || null;
}
