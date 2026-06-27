/**
 * Prioridad emisoras RD (audiencia, influencia mediática, listados sector).
 * Fuentes: Linkatomic top 18, Z101 como #1 nacional, FUCIMDRES 2024-2025 (Alofoke, ZFM).
 */
import { classifyAllRadios, getAutoExcludedRadios } from './radio-classify.mjs';

export const RADIO_PRIORITY_ORDER = [
  'z101',
  'alofoke-fm',
  'cdn',
  'amanecer',
  'kq94',
  'ritmo96',
  'disco106',
  'escape',
  'labakana',
  'lakalle963',
  'hits',
  'la91',
  'kiss',
  'larocka',
  'mortal1049',
  '1001fm',
  'primera',
  'caliente',
  'mixx1045',
  'estrella',
  'mortal1041',
  'turbo',
  'exa',
  'puravida',
  'cima',
  'superq',
  'extremo',
  'bachata',
  'fuego90',
  'la997',
  'disco',
  'kissme',
  'quisqueya',
  'superk',
  'lanota',
];

export const RADIO_FEATURED_SLUGS = new Set(
  RADIO_PRIORITY_ORDER.slice(0, 15)
);

export const RADIO_EXCLUDED_MANUAL = new Set([
  'lakalle',
  'aguilascibaenas',
  '30kilosdesalsa',
  'estudio46',
  'fuego',
  'ke-bonita-radio',
  'millenium',
  'genesis',
]);

export const RADIO_EXCLUDE_REASONS_MANUAL = {
  lakalle: 'Reemplazada por La Kalle 96.3 FM',
  aguilascibaenas: 'Radio LIDOM por juego → no es emisora 24/7',
  '30kilosdesalsa': 'Programa en KQ 94.5 FM (domingos)',
  estudio46: 'Show de bachata → usar Bachata Radio',
  fuego: 'Duplicado de Fuego 90',
  'ke-bonita-radio': 'Duplicado de Ke Bonita Radio',
  millenium: 'Misma señal que Al Aire Libre',
  genesis: 'Misma señal que Radio Bávaro',
};

function mergeExcluded(radios) {
  const classified = classifyAllRadios(radios, RADIO_PRIORITY_ORDER);
  const excluded = [];
  const seen = new Set();
  const bySlug = new Map(radios.map((r) => [r.slug, r]));

  function add(slug, reason, meta = {}) {
    if (seen.has(slug) || RADIO_PRIORITY_ORDER.includes(slug)) return;
    const r = bySlug.get(slug);
    if (!r) return;
    seen.add(slug);
    excluded.push({ ...r, excludeReason: reason, ...meta });
  }

  for (const slug of RADIO_EXCLUDED_MANUAL) {
    add(slug, RADIO_EXCLUDE_REASONS_MANUAL[slug] || 'Excluido manualmente', {
      kind: 'manual',
      country: 'rd',
    });
  }

  for (const row of getAutoExcludedRadios(classified, RADIO_PRIORITY_ORDER)) {
    add(row.slug, row.excludeReason, {
      kind: row.kind,
      country: row.country,
      parentSlug: row.parentSlug,
      parentLabel: row.parentLabel,
    });
  }

  return { classified, excluded };
}

export function organizeRadios(radios) {
  const { classified, excluded } = mergeExcluded(radios);
  const excludedSet = new Set(excluded.map((r) => r.slug));
  const pool = radios.filter((r) => !excludedSet.has(r.slug));

  const bySlug = new Map(pool.map((r) => [r.slug, r]));
  const priority = [];

  for (const slug of RADIO_PRIORITY_ORDER) {
    const r = bySlug.get(slug);
    if (!r) continue;
    r.featured = RADIO_FEATURED_SLUGS.has(slug);
    const meta = classified.find((c) => c.slug === slug);
    r.catalogMeta = meta
      ? { kind: meta.kind, country: meta.country }
      : { kind: 'emisora', country: 'rd' };
    priority.push(r);
    bySlug.delete(slug);
  }

  const rest = [...bySlug.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  );

  for (const r of rest) {
    const meta = classified.find((c) => c.slug === r.slug);
    if (meta) {
      r.catalogMeta = {
        kind: meta.kind,
        country: meta.country,
        parentSlug: meta.parentSlug,
        parentLabel: meta.parentLabel,
      };
    }
  }

  return {
    priority,
    rest,
    excluded,
    classified,
    published: [...priority, ...rest],
  };
}
