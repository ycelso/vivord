/** Clasificación de emisoras: canal 24/7, programa, evento, duplicado por stream. */

const PARENT_LABELS = {
  z101: 'Z 101',
  'alofoke-fm': 'Alofoke FM 99.3',
  cdn: 'CDN 92.5',
  amanecer: 'Radio Amanecer',
  quisqueya: 'Quisqueya FM',
  kq94: 'KQ 94.5 FM',
  disco106: 'Disco 106',
  superk: 'Super K',
  lakalle: 'La Kalle',
  hits: 'Hits 92 FM',
  la91: 'La 91 FM',
  kiss: 'Kiss 94.9 FM',
  lanota: 'La Nota Diferente',
  caliente: 'Caliente 104',
  ritmo96: 'Ritmo 96',
  mixx1045: 'Mixx 104.5',
  estrella: 'Estrella 90 FM',
  primera: 'Primera 88.1 FM',
  mortal1041: 'Mortal FM',
  mortal1049: 'Mortal 104.9 FM',
  larocka: 'La Rocka 91.7 FM',
  labakana: 'La Bakana 105.7 FM',
  turbo: 'Turbo 98 FM',
  exa: 'Exa FM',
  puravida: 'Pura Vida FM',
  cima: 'Radio Cima 100 FM',
  superq: 'Súper Q 100.9 FM',
  extremo: 'Extremo 98 FM',
  bachata: 'Bachata Radio',
  'fuego90': 'Fuego 90',
  kebonita: 'Ke Bonita Radio',
  'alairelibre': 'Al Aire Libre',
  bavaro: 'Radio Bávaro',
};

const EVENT_PATTERNS = [
  /\bvs\.?\b/i,
  /serie del caribe/i,
  /cl[aá]sico mundial/i,
  /mundial de b[eé]isbol/i,
  /playoff/i,
  /partido de/i,
  /loter[ií]a nacional/i,
  /aguilas cibae/i,
  /toros del este/i,
  /gigantes del cibao/i,
  /estrellas orientales/i,
  /tigres del licey/i,
  /escogido tv/i,
  /lidom\b/i,
];

/** Solo nombre/slug — evita falsos positivos por texto SEO en descripciones */
const PROGRAM_NAME_PATTERNS = [
  /\d+\s*kilos de/i,
  /radio show/i,
  /\bshow$/i,
  /bachatazo/i,
  /noticias sin/i,
  /despierta con/i,
];

const PROGRAM_DESC_PATTERNS = [
  /transmitida por\s+(kq|z101|cdn|super k|la kalle)/i,
  /transmitido por\s+(kq|z101|cdn)/i,
];

const INTERNATIONAL_PATTERNS = [
  /emisorascolombianas/i,
  /emisoras colombianas/i,
  /radio venezolana/i,
  /^venevisi[oó]n/i,
  /televisi[oó]n venezolana/i,
];

export function streamKey(stream) {
  if (!stream) return null;
  const z = stream.match(/zeno\.fm\/([^/]+)/i);
  if (z) return `zeno:${z[1]}`;
  const j = stream.match(/radiojar\.com\/([^/]+)/i);
  if (j) return `rj:${j[1]}`;
  const gi = stream.match(/grupointernet\.com:(\d+)/i);
  if (gi) return `gi:${gi[1]}`;
  const dp = stream.match(/domiplay\.net:(\d+)/i);
  if (dp) return `dp:${dp[1]}`;
  const rd = stream.match(/radiordomi\.com(?::\d+)?\/(\d+)/i);
  if (rd) return `rdo:${rd[1]}`;
  return stream.split('?')[0].replace(/\/$/, '');
}

export function buildParentStreamIndex(radios, prioritySlugs) {
  const set = new Set(prioritySlugs);
  const index = new Map();
  for (const r of radios) {
    if (!set.has(r.slug)) continue;
    const key = streamKey(r.stream);
    if (key && !index.has(key)) index.set(key, r.slug);
  }
  return index;
}

function plainText(r) {
  return `${r.name} ${(r.description || '').replace(/<[^>]+>/g, ' ')} ${r.slug}`;
}

export function classifyRadio(r, parentByStream, prioritySlugs) {
  const prioritySet = new Set(prioritySlugs);
  const text = plainText(r);
  const parentFromStream = parentByStream.get(streamKey(r.stream));
  const parentSlug =
    parentFromStream && parentFromStream !== r.slug ? parentFromStream : null;

  let kind = 'emisora';
  let country = 'rd';
  const reasons = [];

  if (INTERNATIONAL_PATTERNS.some((re) => re.test(text))) {
    kind = 'internacional';
    country = 'internacional';
    reasons.push('Señal o referencia fuera de RD');
  } else if (EVENT_PATTERNS.some((re) => re.test(r.name) || re.test(r.slug))) {
    kind = 'evento';
    country = 'evento_deportivo';
    reasons.push('Cobertura deportiva o evento puntual');
  } else if (
    parentSlug ||
    PROGRAM_NAME_PATTERNS.some((re) => re.test(r.name) || re.test(r.slug)) ||
    PROGRAM_DESC_PATTERNS.some((re) => re.test(text))
  ) {
    kind = 'programa';
    reasons.push(
      parentSlug ? 'Misma señal que emisora madre' : 'Bloque o programa en otra FM'
    );
  }

  if (prioritySet.has(r.slug)) {
    kind = 'emisora';
    country = 'rd';
  }

  const parentLabel = parentSlug ? PARENT_LABELS[parentSlug] || parentSlug : null;
  const shouldExclude = kind !== 'emisora' && !prioritySet.has(r.slug);

  let excludeReason = '';
  if (kind === 'programa' && parentLabel) {
    excludeReason = `Programa duplicado → ${parentLabel}`;
  } else if (kind === 'evento') {
    excludeReason = 'Evento puntual (usa la emisora madre en vivo)';
  } else if (kind === 'internacional') {
    excludeReason = 'Enlace o emisora internacional, no FM dominicana 24/7';
  } else if (shouldExclude) {
    excludeReason = reasons[0] || 'Excluido del catálogo público';
  }

  return {
    slug: r.slug,
    name: r.name,
    kind,
    country,
    parentSlug,
    parentLabel,
    reasons,
    shouldExclude,
    excludeReason,
  };
}

export function classifyAllRadios(radios, priorityOrder) {
  const parentByStream = buildParentStreamIndex(radios, priorityOrder);
  return radios.map((r) => {
    const meta = classifyRadio(r, parentByStream, priorityOrder);
    return { radio: r, ...meta };
  });
}

export function getAutoExcludedRadios(classified, priorityOrder) {
  const set = new Set(priorityOrder);
  return classified.filter((row) => row.shouldExclude && !set.has(row.slug));
}
