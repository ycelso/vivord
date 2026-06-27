/** @param {string[]} prioritySlugs */
export function buildParentStreamIndex(channels, prioritySlugs) {
  const PRIORITY_SET = new Set(prioritySlugs);
  const index = new Map();
  for (const ch of channels) {
    if (!PRIORITY_SET.has(ch.slug)) continue;
    const key = streamKey(ch.stream);
    if (key && !index.has(key)) index.set(key, ch.slug);
  }
  return index;
}

const PARENT_BY_SLUG = {
  'telemicro-canal-5': { label: 'Telemicro (Canal 5)', dial: 5 },
  'telesistema-canal-11': { label: 'Telesistema (Canal 11)', dial: 11 },
  'color-vision-canal-9': { label: 'Color Visión (Canal 9)', dial: 9 },
  'antena-latina-canal-7': { label: 'Antena 7', dial: 7 },
  'telecentro-canal-13': { label: 'Telecentro (Canal 13)', dial: 13 },
  'cdn-canal-37': { label: 'CDN (Canal 37)', dial: 37 },
  'teleantillas-canal-2': { label: 'Teleantillas (Canal 2)', dial: 2 },
  'televida-canal-41-santo-domingo': { label: 'Televida / Univisión (41)', dial: 41 },
  'digital-15': { label: 'Digital 15', dial: 15 },
  'teleradio-america-canal-45': { label: 'América TV (45)', dial: 45 },
  'certv-canal-4': { label: 'CERTV / 4RD (Canal 4)', dial: 4 },
  'cdn-sports-max-canal-67': { label: 'CDN Deportes (67)', dial: 67 },
  'vtv-canal-32': { label: 'VTV (32)', dial: 32 },
  'coral-39': { label: 'Coral 39', dial: 39 },
};

/** Nombre/slug que indican partido, cobertura puntual o torneo (no canal 24/7) */
const EVENT_PATTERNS = [
  /\bvs\.?\b/i,
  /\bversus\b/i,
  /serie del caribe/i,
  /clásico mundial/i,
  /clasico mundial/i,
  /mundial de b[eé]isbol/i,
  /\bwbc\b/i,
  /playoff/i,
  /semifinal/i,
  /final del/i,
  /partido de/i,
  /c[aá]maras en vivo en/i,
  /live cameras in/i,
  /ucrania/i,
  /ukraine/i,
  /loter[ií]a nacional/i,
  /premios soberano/i,
  /got talent/i,
  /aguilas/i,
  /toros del este/i,
  /gigantes del cibao/i,
  /estrellas orientales/i,
  /tigres del licey/i,
  /escogido tv/i,
  /bameso vs/i,
];

/** Slug/nombre que suelen ser programas, no señales propias */
const PROGRAM_NAME_PATTERNS = [
  /^noticias /i,
  /noticias sin/i,
  /noticiero/i,
  /en vivo$/i,
  /show del/i,
  /show$/i,
  /es un show/i,
  /con [A-ZÁÉÍÓÚ]/,
  /noche de /i,
  /despertador/i,
  /despierta con/i,
  /informativos /i,
  /primer impacto/i,
  /al rojo vivo/i,
  /chévere nights/i,
  /chevere nights/i,
  /the voice/i,
  /zona 5/i,
  /oye pa[ií]s/i,
  /re[ií]r con/i,
  /informe con/i,
  /divertido con/i,
  /opción de la mañana/i,
  /extremo a extremo/i,
  /una nueva mañana/i,
  /aqu[ií] se habla espa/i,
  /nuria piera/i,
  /temprano todav/i,
  /antinoti/i,
  /yadira morel/i,
  /panorama social/i,
  /central noticias/i,
  /de [uú]ltimo minuto/i,
];

/** Señal venezolana (catálogo RD rara vez tiene canales VE 24/7; sí hay eventos RD vs VE) */
const VENEZUELA_CHANNEL_PATTERNS = [
  /^venevisi[oó]n/i,
  /^globovisi[oó]n/i,
  /^televen\b/i,
  /^vtv venezuela/i,
  /canal venezolano/i,
  /televisi[oó]n venezolana/i,
];

/**
 * Curación: iframes de terceros suelen ser inestables/bloqueados.
 * Permitimos solo hosts grandes/confiables.
 */
const IFRAME_ALLOW_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'www.dailymotion.com',
  'geo.dailymotion.com',
  'player.twitch.tv',
  'player.castr.com',
]);

export function streamKey(stream) {
  if (!stream) return null;
  const tm = stream.match(/telemicro\.com\.do\/players\/(\d+bot)/i);
  if (tm) return `telemicro:${tm[1]}`;
  const dm = stream.match(/dailymotion\.com\/embed\/video\/([^?&]+)/i);
  if (dm) return `dm:${dm[1]}`;
  const dm2 = stream.match(/video=([^&]+)/i);
  if (stream.includes('dailymotion') && dm2) return `dm:${dm2[1]}`;
  return stream.split('?')[0].replace(/\/$/, '');
}

function plainText(ch) {
  return `${ch.name} ${(ch.description || '').replace(/<[^>]+>/g, ' ')} ${ch.slug}`;
}

export function classifyChannel(ch, parentByStream, prioritySlugs) {
  const PRIORITY_SET = new Set(prioritySlugs);
  const text = plainText(ch);
  const parentFromStream = parentByStream.get(streamKey(ch.stream));
  const parentSlug =
    parentFromStream && parentFromStream !== ch.slug ? parentFromStream : null;

  let kind = 'canal';
  let country = 'rd';
  const reasons = [];

  if (EVENT_PATTERNS.some((re) => re.test(text))) {
    kind = 'evento';
    reasons.push('Cobertura o partido puntual');
    if (/\bvs\.?\b|venezuela|pa[ií]ses bajos|holanda|cl[aá]sico mundial/i.test(text)) {
      country = 'evento_deportivo';
    }
  } else if (parentSlug || PROGRAM_NAME_PATTERNS.some((re) => re.test(ch.name) || re.test(ch.slug))) {
    kind = 'programa';
    reasons.push(parentSlug ? 'Misma señal que canal madre' : 'Nombre tipo programa/show');
  }

  if (VENEZUELA_CHANNEL_PATTERNS.some((re) => re.test(text)) && kind === 'canal') {
    country = 'venezuela';
    reasons.push('Señal venezolana');
  } else if (/ucrania|ukraine/i.test(text) && kind !== 'canal') {
    country = 'internacional';
  } else if (kind === 'evento' && country === 'rd') {
    country = 'evento_deportivo';
  }

  if (PRIORITY_SET.has(ch.slug)) {
    kind = 'canal';
    country = 'rd';
  }

  const parentLabel = parentSlug ? PARENT_BY_SLUG[parentSlug]?.label || parentSlug : null;

  let shouldExclude = kind === 'programa' || kind === 'evento';
  let excludeReason = buildExcludeReason(kind, country, parentLabel, reasons);

  // Curación adicional: fuera de prioridad, quitamos señales sin stream y iframes no confiables.
  if (!PRIORITY_SET.has(ch.slug)) {
    if (!ch.stream) {
      shouldExclude = true;
      excludeReason = 'Sin señal (sin stream)';
    } else if (ch.streamType === 'iframe') {
      try {
        const host = new URL(ch.stream).host;
        if (!IFRAME_ALLOW_HOSTS.has(host)) {
          shouldExclude = true;
          excludeReason = `Iframe de tercero no confiable (${host})`;
        }
      } catch {
        shouldExclude = true;
        excludeReason = 'Iframe inválido';
      }
    }
  }

  return {
    slug: ch.slug,
    name: ch.name,
    kind,
    country,
    parentSlug,
    parentLabel,
    reasons,
    shouldExclude,
    excludeReason,
  };
}

function buildExcludeReason(kind, country, parentLabel, reasons) {
  if (kind === 'programa' && parentLabel) {
    return `Programa duplicado → ${parentLabel}`;
  }
  if (kind === 'evento' && country === 'evento_deportivo') {
    return 'Evento deportivo puntual (ver canal madre en vivo)';
  }
  if (kind === 'evento') {
    return 'Cobertura / evento temporal';
  }
  if (country === 'venezuela') {
    return 'Señal venezolana (fuera de TV abierta RD)';
  }
  return reasons[0] || 'Clasificado para exclusión';
}

export function classifyAllChannels(channels, priorityOrder) {
  const parentByStream = buildParentStreamIndex(channels, priorityOrder);
  return channels.map((ch) => {
    const meta = classifyChannel(ch, parentByStream, priorityOrder);
    return { channel: ch, ...meta };
  });
}

export function getAutoExcluded(classified, priorityOrder) {
  const PRIORITY_SET = new Set(priorityOrder);
  return classified.filter((row) => row.shouldExclude && !PRIORITY_SET.has(row.slug));
}
