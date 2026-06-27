export function plainText(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractFmFrequency(name, description) {
  const combined = `${name} ${plainText(description)}`;
  const fm = combined.match(/(\d{2,3}(?:\.\d)?)\s*FM\b/i);
  if (fm) return `${fm[1]} FM`;
  const z = String(name).match(/^Z\s*(\d{2,3})\b/i);
  if (z) return `${z[1]} FM`;
  const cdn = /cdn\s*92\.?5/i.test(combined) ? '92.5 FM' : '';
  if (cdn && /cdn/i.test(name)) return cdn;
  return '';
}

export function extractTvChannelLabel(name, slug) {
  const fromName = String(name).match(/canal\s*(\d+)/i);
  if (fromName) return `Canal ${fromName[1]}`;
  const fromSlug = String(slug || '').match(/canal-(\d+)/i);
  if (fromSlug) return `Canal ${fromSlug[1]}`;
  return '';
}

export function stationFacts(item, kind) {
  const k = kind === 'radio' ? 'radio' : 'tv';
  const city = String(item.city || '').trim();
  const freq = k === 'radio' ? extractFmFrequency(item.name, item.description) : '';
  const signal = k === 'tv' ? extractTvChannelLabel(item.name, item.slug) : '';
  return { city, freq, signal, kind: k };
}

function slugHash(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (Math.imul(31, h) + slug.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export { slugHash };

export function buildFactLeadParagraph(item, kind) {
  const name = String(item.name || '').trim();
  const { city, freq, signal } = stationFacts(item, kind);
  const parts = [];
  if (kind === 'radio') {
    if (freq) parts.push(freq);
    if (city) parts.push(city);
    const detail = parts.length ? ` (${parts.join(' · ')})` : '';
    const d = detail ? escape(parts.join(', ')) : '';
    const variants = [
      `<strong>${escape(name)}</strong>${detail} está disponible en streaming por internet en VivoRD, además de su señal FM cuando corresponda.`,
      `Desde esta ficha puedes escuchar <strong>${escape(name)}</strong> en directo${detail ? ` — datos verificados: ${d}` : ''}.`,
      `<strong>${escape(name)}</strong> forma parte del catálogo de radios dominicanas en VivoRD${detail ? `; referencia de dial: ${d}` : ''}.`,
      `En VivoRD, <strong>${escape(name)}</strong>${detail ? ` (${d})` : ''} se reproduce por streaming sin instalar apps adicionales en el navegador.`,
      `Ficha de <strong>${escape(name)}</strong>${detail ? `: ${d}` : ''} — audio en directo y descripción editorial en un solo lugar.`,
      `Oyentes de <strong>${escape(name)}</strong>${detail ? `, ${d}` : ''}, pueden escuchar aquí la señal online mantenida por VivoRD.`,
      `<strong>${escape(name)}</strong>${detail ? ` · ${d}` : ''} — emisora del directorio VivoRD con reproductor integrado.`,
      `Para escuchar <strong>${escape(name)}</strong> hoy${detail ? ` (${d})` : ''}, usa el reproductor de esta página.`,
    ];
    return `<p class="description-lead">${variants[slugHash(item.slug) % variants.length]}</p>`;
  }
  const detail = [signal, city || 'República Dominicana'].filter(Boolean).join(' · ');
  const variants = [
    `<strong>${escape(name)}</strong> (${escape(detail)}) se puede ver en vivo online desde VivoRD cuando la señal del titular lo permite.`,
    `Esta ficha de <strong>${escape(name)}</strong> —${escape(detail)}— centraliza la reproducción y la información del canal en un solo lugar.`,
    `<strong>${escape(name)}</strong>, ${escape(detail)}, está en el directorio de TV dominicana de VivoRD con descripción y enlace en directo.`,
    `En VivoRD, <strong>${escape(name)}</strong> (${escape(detail)}) agrupa reproductor, datos de señal y texto informativo.`,
    `Televidentes que buscan <strong>${escape(name)}</strong> —${escape(detail)}— pueden abrir la señal desde esta ficha.`,
    `Canal <strong>${escape(name)}</strong> (${escape(detail)}): acceso en vivo y contexto editorial en VivoRD.`,
    `La señal de <strong>${escape(name)}</strong>, ${escape(detail)}, se consulta aquí cuando el stream está disponible.`,
    `Ficha de TV: <strong>${escape(name)}</strong> · ${escape(detail)} · reproducción web en VivoRD.`,
  ];
  return `<p class="description-lead">${variants[slugHash(item.slug) % variants.length]}</p>`;
}

function escape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
