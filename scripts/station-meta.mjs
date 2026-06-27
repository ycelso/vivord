import { escapeHtml } from './description-format.mjs';
import {
  plainText,
  extractFmFrequency,
  extractTvChannelLabel,
  stationFacts,
} from './station-facts.mjs';

function resolveOfficialUrl(item, kind) {
  if (item.streamType === 'official' && item.stream) {
    return String(item.stream).trim();
  }
  const ref = String(item.streamReferer || '').trim();
  if (ref) {
    try {
      const u = new URL(ref);
      return `${u.protocol}//${u.host}/`;
    } catch {
      /* ignore */
    }
  }
  if (kind === 'tv' && item.stream && /^https?:\/\//i.test(item.stream)) {
    if (item.streamType === 'official' || /\.com\.do\//i.test(item.stream)) {
      try {
        const u = new URL(item.stream);
        if (!/\.m3u8|embed|stream/i.test(u.pathname)) return item.stream;
        return `${u.protocol}//${u.host}/`;
      } catch {
        /* ignore */
      }
    }
  }
  return '';
}

function metaRow(label, valueHtml) {
  if (!valueHtml) return '';
  return `<div class="station-meta__row">
  <dt>${escapeHtml(label)}</dt>
  <dd>${valueHtml}</dd>
</div>`;
}

export function collectStationMeta(item, kind) {
  const k = kind === 'radio' ? 'radio' : 'tv';
  const { city, freq, signal } = stationFacts(item, k);
  const rows = [];

  if (k === 'radio') {
    if (city) rows.push(['Ciudad', city]);
    else rows.push(['Cobertura', 'República Dominicana']);
    if (freq) rows.push(['Frecuencia', freq]);
  } else if (signal) {
    rows.push(['Señal', signal]);
  } else {
    rows.push(['País', 'República Dominicana']);
  }

  const official = resolveOfficialUrl(item, k);
  if (official) rows.push(['__official__', official]);

  return rows;
}

export function buildStationMetaHtml(item, kind) {
  const rows = collectStationMeta(item, kind);
  if (!rows.length) return '';

  const body = rows
    .map(([label, value]) => {
      if (label === '__official__') {
        const safe = escapeHtml(value);
        return metaRow(
          'Web oficial',
          `<a href="${safe}" target="_blank" rel="noopener noreferrer">${safe}</a>`
        );
      }
      return metaRow(label, escapeHtml(value));
    })
    .filter(Boolean)
    .join('\n');

  if (!body) return '';

  const title = kind === 'radio' ? 'Datos de la emisora' : 'Datos del canal';
  return `<section class="station-meta" aria-label="${escapeHtml(title)}">
  <h2 class="station-meta__title">${escapeHtml(title)}</h2>
  <dl class="station-meta__list">
${body}
  </dl>
</section>`;
}

export { extractFmFrequency, extractTvChannelLabel, plainText };
