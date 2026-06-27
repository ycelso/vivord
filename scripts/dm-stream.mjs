export const DM_HEADERS = {
  Referer: 'https://www.dailymotion.com/video/x80ac48',
  Origin: 'https://www.dailymotion.com',
  priority: 'u=1, i',
  Cookie: 'family_filter=off; ff=off',
};

const TELESISTEMA = {
  videoId: 'x80ac48',
  embedder: 'https://telesistema11.com.do/en-vivo/',
};

let cachedMaster = { url: null, expires: 0 };

export async function getTelesistemaMasterUrl({ forceFresh = false } = {}) {
  const now = Date.now();
  if (!forceFresh && cachedMaster.url && cachedMaster.expires > now) return cachedMaster.url;

  const q = new URLSearchParams({
    embedder: TELESISTEMA.embedder,
  });
  const metaUrl = `https://www.dailymotion.com/player/metadata/video/${TELESISTEMA.videoId}?${q}`;
  const res = await fetch(metaUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Cookie: DM_HEADERS.Cookie,
    },
  });
  if (!res.ok) throw new Error(`metadata HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.raw_message || data.error.message || 'DM error');

  const master = data?.qualities?.auto?.[0]?.url;
  if (!master) throw new Error('No HLS URL in metadata');

  cachedMaster = { url: master, expires: now + 20_000 };
  return master;
}

/** Descarga manifest HLS de Telesistema (reintenta si el token expiró). */
export async function fetchTelesistemaManifest() {
  const headers = {
    ...DM_HEADERS,
    Accept: '*/*',
  };
  for (let attempt = 0; attempt < 3; attempt++) {
    const masterUrl = await getTelesistemaMasterUrl({ forceFresh: attempt > 0 });
    const dmRes = await fetch(masterUrl, { headers });
    if (dmRes.ok) {
      return { text: await dmRes.text(), masterUrl };
    }
    if (dmRes.status !== 403 && dmRes.status !== 410) {
      throw new Error(`Telesistema manifest HTTP ${dmRes.status}`);
    }
    cachedMaster = { url: null, expires: 0 };
  }
  throw new Error('Telesistema manifest HTTP 403');
}

export function rewriteM3u8(body, manifestUrl, proxyPath = '/api/proxy') {
  const base = new URL(manifestUrl);
  const prefix = (u) => `${proxyPath}?url=${encodeURIComponent(u)}`;

  return body
    .split(/\r?\n/)
    .map((line) => {
      if (!line) return line;
      if (line.startsWith('#')) {
        return line.replace(/URI="([^"]+)"/g, (_, uri) => {
          const abs = new URL(uri, base).href;
          return `URI="${prefix(abs)}"`;
        });
      }
      const trimmed = line.trim();
      const hashIdx = trimmed.indexOf('#');
      const pathPart = hashIdx >= 0 ? trimmed.slice(0, hashIdx) : trimmed;
      const suffix = hashIdx >= 0 ? trimmed.slice(hashIdx) : '';
      const abs = new URL(pathPart, base).href + suffix;
      return prefix(abs);
    })
    .join('\n');
}
