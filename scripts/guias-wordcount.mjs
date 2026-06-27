/** Cuenta palabras del cuerpo HTML de una guía (sin etiquetas). */
export function countBodyWords(html) {
  const text = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/** ~200 palabras/minuto de lectura en español. */
export function computeReadMin(body) {
  return Math.max(1, Math.ceil(countBodyWords(body) / 200));
}

export function enrichGuide(guide) {
  const readMin = computeReadMin(guide.body);
  return { ...guide, readMin, wordCount: countBodyWords(guide.body) };
}
