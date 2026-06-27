import { plainText } from './station-facts.mjs';

/** Géneros de radio detectados por regex en nombre + descripción (sin inventar). */
export const RADIO_GENRES = [
  {
    slug: 'noticias',
    label: 'Noticias y talk',
    test: (text) =>
      /\bnoticias\b|\bactualidad\b|\binformativ|\btalk\b|\bopini[oó]n\b|\bperiodism|\bboletin/.test(
        text
      ),
  },
  {
    slug: 'urbano-reggaeton',
    label: 'Urbano y reggaetón',
    test: (text) =>
      /\breggaet[oó]n\b|\burbano\b|\bdembow\b|\btrap\b|\bperreo\b|\bhip-hop\b|\brap\b/.test(text),
  },
  {
    slug: 'merengue',
    label: 'Merengue',
    test: (text) => /\bmerengue\b/.test(text),
  },
  {
    slug: 'bachata',
    label: 'Bachata',
    test: (text) => /\bbachata\b/.test(text),
  },
  {
    slug: 'salsa-tropical',
    label: 'Salsa y tropical',
    test: (text) => /\bsalsa\b|\btropical\b|\bm[uú]sica tropical\b|\bson\b|\bmambo\b/.test(text),
  },
  {
    slug: 'baladas-romantica',
    label: 'Baladas y romántica',
    test: (text) =>
      /\bbalada\b|\brom[aá]ntic|\bsentimental\b|\blove songs\b|\bcanciones de amor\b/.test(text),
  },
  {
    slug: 'cristiana',
    label: 'Cristiana y gospel',
    test: (text) =>
      /\bcristian|\bevangel|\bgospel\b|\bibl|\badventist|\bcat[oó]lic|\bfe\b|\bespiritual/.test(text),
  },
  {
    slug: 'deportes',
    label: 'Deportes',
    test: (text) =>
      /\bdeportes\b|\bb[eé]isbol\b|\bnba\b|\bmlb\b|\blmb\b|\bf[uú]tbol\b|\bmls\b/.test(text),
  },
];

export function radioTextBlob(item) {
  return plainText(`${item.name} ${item.description || ''}`).toLowerCase();
}

export function detectRadioGenres(item) {
  const text = radioTextBlob(item);
  return RADIO_GENRES.filter((g) => g.test(text)).map((g) => g.slug);
}

export function genreBySlug(slug) {
  return RADIO_GENRES.find((g) => g.slug === slug);
}

export function hubSlug(text) {
  return String(text)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Etiqueta corta para títulos cuando el nombre oficial es largo. */
export const CITY_SHORT_LABELS = {
  'santo-domingo': 'Santo Domingo',
  'santiago-de-los-caballeros': 'Santiago',
  'san-pedro-de-macoris': 'San Pedro de Macorís',
  'santa-cruz-de-barahona': 'Barahona',
  'san-felipe-de-puerto-plata': 'Puerto Plata',
  'concepcion-de-la-vega': 'La Vega',
  'santo-domingo-oeste': 'Santo Domingo Oeste',
  'la-romana': 'La Romana',
  'salvaleon-de-higuey': 'Higüey',
  'san-francisco-de-macoris': 'San Francisco de Macorís',
  sabaneta: 'Sabaneta',
  'san-fernando-de-monte-cristi': 'Monte Cristi',
  moca: 'Moca',
  bani: 'Baní',
};

export function cityDisplayLabel(cityName) {
  const slug = hubSlug(cityName);
  return CITY_SHORT_LABELS[slug] || cityName;
}
