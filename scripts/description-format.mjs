/**
 * Descripción completa para fichas de canal/radio (sin truncar).
 * Quita scripts y enlaces externos promocionales; conserva HTML editorial del catálogo.
 */
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatDescription(raw) {
  if (!raw || !String(raw).trim()) return '';

  let html = String(raw).trim();
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Enlaces externos → solo texto (evita spam/afiliados scrapeados en descripciones importadas).
  html = html.replace(
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (match, href, inner) => {
      if (/^https?:\/\/(?:www\.)?vivo-rd\.com/i.test(href)) return match;
      return inner;
    }
  );

  if (!/<(p|ul|ol|li|h[2-4]|blockquote)\b/i.test(html)) {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    return `<p>${escapeHtml(text)}</p>`;
  }

  return html;
}
