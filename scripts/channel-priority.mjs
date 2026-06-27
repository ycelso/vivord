/**
 * Orden de prioridad TV abierta RD + exclusiones (eventos / duplicados de señal madre).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  classifyAllChannels,
  getAutoExcluded,
} from './channel-classify.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

/** Canales de tv-not-playing.json con señal alternativa verificada (build.mjs STREAM_OVERRIDES). */
const NOT_PLAYING_KEEP_SLUGS = new Set([
  'cinevision-canal-19',
  'la-voz-de-maria-la-vega',
  'romana-tv-canal-42',
]);

function loadNotPlayingExcludeSlugs() {
  try {
    const raw = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'data', 'tv-not-playing.json'), 'utf8')
    );
    return (raw.items || [])
      .map((i) => i.slug)
      .filter((slug) => !NOT_PLAYING_KEEP_SLUGS.has(slug));
  } catch {
    return [];
  }
}

/** Tier 1–3: orden en portada y carrusel (más popular → menos) */
export const PRIORITY_ORDER = [
  'color-vision-canal-9',
  'telesistema-canal-11',
  'antena-latina-canal-7',
  'telemicro-canal-5',
  'planeta-alofoke',
  'telecentro-canal-13',
  'cdn-canal-37',
  'teleantillas-canal-2',
  'televida-canal-41-santo-domingo',
  'digital-15',
  'teleradio-america-canal-45',
  'antena-21',
  'cdn-sports-max-canal-67',
  'coral-39',
  'certv-canal-4',
  'telefuturo-canal-23',
  'vtv-canal-32',
  'microvision-canal-10',
  'teleuniverso-canal-29',
];

/** Aparecen en carrusel “Destacados” y bloque principal */
export const FEATURED_SLUGS = new Set(PRIORITY_ORDER.slice(0, 11));

/** Exclusiones manuales (refuerzo; la auto-clasificación cubre el resto por stream/nombre) */
export const EXCLUDED_SLUGS_MANUAL = new Set([
  'aguilas-cibaenas',
  'escogido-tv',
  'estrellas-orientales',
  'gigantes-del-cibao',
  'tigres-del-licey-en-vivo',
  'toros-del-este',
  'la-casa-de-alofoke',
  'zona-5-con-laura-Castellanos',
  'noticias-sin-en-vivo',
  'el-despertador-en-vivo-canal-9',
  'despierta-con-cdn',
  'informativos-teleantillas',
  'el-show-del-mediodia',
  'oye-pais-color-vision',
  'a-reir-con-miguel-y-raymond',
  'de-Ultimo-minuto',
  'central-noticias-4',
  'noticias-16-santo-domingo',
  'panorama-social-tv',
  'digital-tv-santo-domingo',
  'camaras-en-vivo-en-ucrania',
  'live-cameras-in-ukraine',
]);

export const EXCLUDE_REASONS_MANUAL = {
  'aguilas-cibaenas': 'Evento LIDOM → CDN Deportes',
  'escogido-tv': 'Evento LIDOM por juego',
  'estrellas-orientales': 'Evento LIDOM por juego',
  'gigantes-del-cibao': 'Evento LIDOM por juego',
  'tigres-del-licey-en-vivo': 'Evento LIDOM por juego',
  'toros-del-este': 'Evento LIDOM por juego',
  'la-casa-de-alofoke': 'Eliminado: señal no funciona',
  'zona-5-con-laura-Castellanos': 'Programa por horario (Telemicro)',
  'noticias-sin-en-vivo': 'Programa → Color Visión (9)',
  'el-despertador-en-vivo-canal-9': 'Programa → Color Visión (9)',
  'despierta-con-cdn': 'Programa → CDN (37)',
  'informativos-teleantillas': 'Programa → Teleantillas (2)',
  'el-show-del-mediodia': 'Programa → Color Visión (9)',
  'oye-pais-color-vision': 'Programa → Color Visión (9)',
  'a-reir-con-miguel-y-raymond': 'Programa (no canal 24/7)',
  'de-Ultimo-minuto': 'Agregador / programa puntual',
  'central-noticias-4': 'Programa → CERTV (4)',
  'noticias-16-santo-domingo': 'Programa regional puntual',
  'panorama-social-tv': 'Programa → VTV (32)',
  'digital-tv-santo-domingo': 'Duplicado → Digital 15',
  'camaras-en-vivo-en-ucrania': 'Evento internacional temporal',
  'live-cameras-in-ukraine': 'Evento internacional temporal',
};

function mergeExcluded(channels) {
  const classified = classifyAllChannels(channels, PRIORITY_ORDER);
  const excluded = [];
  const excludedSlugs = new Set();
  const bySlug = new Map(channels.map((c) => [c.slug, c]));

  function add(slug, reason, meta = {}) {
    if (excludedSlugs.has(slug) || PRIORITY_ORDER.includes(slug)) return;
    const ch = bySlug.get(slug);
    if (!ch) return;
    excludedSlugs.add(slug);
    excluded.push({
      ...ch,
      excludeReason: reason,
      ...meta,
    });
  }

  for (const slug of EXCLUDED_SLUGS_MANUAL) {
    add(slug, EXCLUDE_REASONS_MANUAL[slug] || 'Excluido manualmente', {
      kind: 'manual',
      country: 'rd',
    });
  }

  for (const row of getAutoExcluded(classified, PRIORITY_ORDER)) {
    add(row.slug, row.excludeReason, {
      kind: row.kind,
      country: row.country,
      parentSlug: row.parentSlug,
      parentLabel: row.parentLabel,
    });
  }

  for (const slug of loadNotPlayingExcludeSlugs()) {
    add(slug, 'Señal no reproduce / sin alternativa verificada', {
      kind: 'health',
      country: 'rd',
    });
  }

  return { classified, excluded };
}

export function organizeChannels(channels) {
  const { classified, excluded } = mergeExcluded(channels);
  const excludedSlugSet = new Set(excluded.map((c) => c.slug));
  const pool = channels.filter((c) => !excludedSlugSet.has(c.slug));

  const bySlug = new Map(pool.map((c) => [c.slug, c]));
  const priority = [];

  for (const slug of PRIORITY_ORDER) {
    const ch = bySlug.get(slug);
    if (!ch) continue;
    ch.featured = FEATURED_SLUGS.has(slug);
    const meta = classified.find((r) => r.slug === slug);
    ch.catalogMeta = meta
      ? { kind: meta.kind, country: meta.country }
      : { kind: 'canal', country: 'rd' };
    priority.push(ch);
    bySlug.delete(slug);
  }

  const rest = [...bySlug.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  );

  for (const ch of rest) {
    const meta = classified.find((r) => r.slug === ch.slug);
    if (meta) {
      ch.catalogMeta = {
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
