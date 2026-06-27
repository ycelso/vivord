/**
 * Intenta obtener "now playing" de streams ICY (Shoutcast/Icecast/Radiojar).
 */
function parseStreamTitle(text) {
  const match = text.match(/StreamTitle='([^']*)'/i) || text.match(/StreamTitle="([^"]*)"/i);
  if (!match) return null;
  const title = match[1].trim();
  if (!title || title === '-') return null;
  return title;
}

export async function fetchIcyNowPlaying(streamUrl, referer = '', timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    'Icy-MetaData': '1',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  };
  if (referer) {
    try {
      headers.Referer = referer;
      headers.Origin = new URL(referer).origin;
    } catch {
      /* noop */
    }
  }

  try {
    const res = await fetch(streamUrl, {
      headers,
      redirect: 'follow',
      signal: controller.signal,
    });

    const station = res.headers.get('icy-name')?.trim() || null;
    const metaint = Number.parseInt(res.headers.get('icy-metaint') || '', 10);

    if (!res.body) return station ? { title: null, station } : null;

    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;
    const maxBytes = metaint > 0 ? metaint * 4 + 8192 : 65536;

    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.length;
    }

    const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    const text = buf.toString('binary');
    const title = parseStreamTitle(text);

    return { title, station };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    try {
      controller.abort();
    } catch {
      /* noop */
    }
  }
}
