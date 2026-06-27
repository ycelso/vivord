import { escapeHtml } from './description-format.mjs';
import { plainText } from './station-facts.mjs';

/** slug → título corto para enlaces en fichas */
export const GUIDE_LINKS = {
  'como-escuchar-radio-dominicana-en-vivo': 'Cómo escuchar radio dominicana online',
  'mejores-emisoras-merengue-y-bachata': 'Guía de merengue, bachata y tropical',
  'ver-tv-dominicana-desde-el-extranjero': 'Ver TV dominicana desde el extranjero',
  'canales-tv-noticias-republica-dominicana': 'Canales de TV de noticias',
  'mejores-radios-noticias-republica-dominicana': 'Radios de noticias en RD',
  'radio-urbana-y-reggaeton-dominicano': 'Radio urbana y reggaetón',
  'deportes-en-tv-y-radio-dominicana': 'Deportes en TV y radio',
  'diferencias-entre-z101-y-cdn': 'Z 101 vs CDN 92.5',
  'que-es-vivord-y-como-usarlo': 'Qué es VivoRD y cómo usarlo',
};

const NEWS_RADIO = new Set(['z101', 'cdn', 'independencia', 'be997', 'listin']);
const URBAN_RADIO = new Set(['kq94', 'ritmo96', 'lakalle963', 'la103', 'oxigeno']);
const TROPICAL_RADIO = new Set([
  'caliente',
  'primera',
  'fuego90',
  'labakana',
  'kiss949',
  'la91',
  'hits92',
]);
const SPORTS_SLUGS = new Set([
  'cdn-sports-max-canal-67',
  'cdn-deportes',
  'z101',
  'cdn',
]);
const NEWS_TV = new Set([
  'color-vision-canal-9',
  'antena-latina-canal-7',
  'telemicro-canal-5',
  'telecentro-canal-13',
  'telesistema-canal-11',
  'cdn-canal-37',
  'teleantillas-canal-2',
  'teleradio-america-canal-45',
  'antena-21',
  'canal-4',
]);

function textBlob(item) {
  return plainText(`${item.name} ${item.description || ''}`).toLowerCase();
}

export function pickGuideSlugs(item, kind) {
  const slug = item.slug;
  const text = textBlob(item);
  const picks = [];

  if (kind === 'radio') {
    if (slug === 'z101' || slug === 'cdn') {
      picks.push('diferencias-entre-z101-y-cdn');
    }
    if (
      NEWS_RADIO.has(slug) ||
      /\bnoticias\b|\bactualidad\b|\binformativ|\btalk\b|\bopini[oó]n\b/.test(text)
    ) {
      picks.push('mejores-radios-noticias-republica-dominicana');
    }
    if (
      URBAN_RADIO.has(slug) ||
      /\breggaet[oó]n\b|\burbano\b|\bdembow\b|\btrap\b/.test(text)
    ) {
      picks.push('radio-urbana-y-reggaeton-dominicano');
    }
    if (
      TROPICAL_RADIO.has(slug) ||
      /\bmerengue\b|\bbachata\b|\bsalsa\b|\btropical\b/.test(text)
    ) {
      picks.push('mejores-emisoras-merengue-y-bachata');
    }
    if (/\bdeportes\b|\bb[eé]isbol\b|\bnba\b|\bmlb\b|\blmb\b/.test(text)) {
      picks.push('deportes-en-tv-y-radio-dominicana');
    }
    if (!picks.length) picks.push('como-escuchar-radio-dominicana-en-vivo');
  } else {
    if (SPORTS_SLUGS.has(slug) || /deportes?|b[eé]isbol|nba|mlb|sports/i.test(slug + text)) {
      picks.push('deportes-en-tv-y-radio-dominicana');
    }
    if (
      NEWS_TV.has(slug) ||
      /\bnoticias\b|\bactualidad\b|\binformativ|\bnoticier/.test(text)
    ) {
      picks.push('canales-tv-noticias-republica-dominicana');
    }
    if (!picks.length) picks.push('ver-tv-dominicana-desde-el-extranjero');
  }

  return [...new Set(picks)].slice(0, 2);
}

export function buildGuideLinksHtml(item, kind, depth = 1) {
  const slugs = pickGuideSlugs(item, kind);
  if (!slugs.length) return '';

  const p = depth ? '../'.repeat(depth) : './';
  const links = slugs
    .map((s) => {
      const label = GUIDE_LINKS[s] || s;
      return `<a href="${p}guias/${s}.html" class="station-guide-link__anchor">${escapeHtml(label)}</a>`;
    })
    .join('\n');

  return `<aside class="station-guide-link" aria-label="Guía relacionada">
  <p class="station-guide-link__label">Guía relacionada</p>
  <div class="station-guide-link__list">
${links}
  </div>
</aside>`;
}

const HUB_GUIDE_MAP = {
  noticias: ['mejores-radios-noticias-republica-dominicana', 'como-escuchar-radio-dominicana-en-vivo'],
  'urbano-reggaeton': ['radio-urbana-y-reggaeton-dominicano', 'como-escuchar-radio-dominicana-en-vivo'],
  merengue: ['mejores-emisoras-merengue-y-bachata', 'como-escuchar-radio-dominicana-en-vivo'],
  bachata: ['mejores-emisoras-merengue-y-bachata', 'como-escuchar-radio-dominicana-en-vivo'],
  'salsa-tropical': ['mejores-emisoras-merengue-y-bachata', 'como-escuchar-radio-dominicana-en-vivo'],
  'baladas-romantica': ['mejores-emisoras-merengue-y-bachata', 'como-escuchar-radio-dominicana-en-vivo'],
  cristiana: ['como-escuchar-radio-dominicana-en-vivo', 'que-es-vivord-y-como-usarlo'],
  deportes: ['deportes-en-tv-y-radio-dominicana', 'como-escuchar-radio-dominicana-en-vivo'],
};

export function pickGuideSlugsForHub(hubKind, hubSlug) {
  if (hubKind === 'genero') {
    return (HUB_GUIDE_MAP[hubSlug] || ['como-escuchar-radio-dominicana-en-vivo']).slice(0, 2);
  }
  return ['como-escuchar-radio-dominicana-en-vivo', 'mejores-emisoras-merengue-y-bachata'].slice(0, 2);
}

export function buildHubGuideLinksHtml(hubKind, hubSlug, depth = 2) {
  const slugs = pickGuideSlugsForHub(hubKind, hubSlug);
  const p = depth ? '../'.repeat(depth) : './';
  const links = slugs
    .map((s) => {
      const label = GUIDE_LINKS[s] || s;
      return `<a href="${p}guias/${s}.html" class="station-guide-link__anchor">${escapeHtml(label)}</a>`;
    })
    .join('\n');

  return `<aside class="station-guide-link hub-guides" aria-label="Guías relacionadas">
  <p class="station-guide-link__label">Guías relacionadas</p>
  <div class="station-guide-link__list">
${links}
  </div>
</aside>`;
}
