import {
  assertProxyTargetAllowed,
  corsHeaders,
  ProxyDeniedError,
  securityHeaders,
} from './proxy-security.mjs';
import { DM_HEADERS, fetchTelesistemaManifest, rewriteM3u8 } from './dm-stream.mjs';
import { fetchIcyNowPlaying } from './icy-metadata.mjs';

const STREAM_REFERERS = {
  'sonicpanel.streaming10.net': 'https://www.cima100fm.com/',
  'sonicpanelradio.com': 'https://www.cima100fm.com/',
  '5.135.183.124': 'https://larocka917.com/',
  '72.29.87.97': 'https://www.kiss949.com/',
  'live4.telemicro.com.do': 'https://telemicro.com.do/',
  '1001.do': 'https://1001.do/escuchar/',
};

function isZenoHost(url) {
  const h = new URL(url).hostname.toLowerCase();
  return h.includes('zeno.fm') || h.includes('zenolive.com');
}

export async function resolveZenoPlayUrl(initialUrl, refererOverride = '') {
  const headers = upstreamHeaders(initialUrl, refererOverride);
  let url = initialUrl;
  for (let i = 0; i < 6; i++) {
    let res;
    try {
      res = await fetch(url, { headers, redirect: 'manual' });
    } catch {
      return null;
    }
    if ([301, 302, 307, 308].includes(res.status)) {
      const loc = res.headers.get('location');
      res.body?.cancel?.();
      if (!loc) break;
      url = new URL(loc, url).href;
      continue;
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    res.body?.cancel?.();
    if (res.ok && (ct.startsWith('audio/') || ct.includes('mpeg'))) return url;
    if (url.includes('zt=')) return url;
    break;
  }
  return url.includes('zt=') ? url : null;
}

function upstreamHeaders(targetUrl, refererOverride = '') {
  const url = new URL(targetUrl);
  const host = url.hostname.toLowerCase();
  const refererKey = Object.keys(STREAM_REFERERS).find((h) => host.includes(h));
  let referer = refererKey ? STREAM_REFERERS[refererKey] : `${url.origin}/`;
  let origin = refererKey ? new URL(referer).origin : url.origin;
  if (refererOverride) {
    try {
      referer = refererOverride;
      origin = new URL(refererOverride).origin;
    } catch {
      /* keep defaults */
    }
  }
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    Referer: referer,
    Origin: origin,
    'Icy-MetaData': '0',
  };
}

function jsonResponse(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...securityHeaders(),
      ...corsHeaders(origin),
    },
  });
}

function textResponse(body, status, origin, extra = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      ...securityHeaders(),
      ...corsHeaders(origin),
      ...extra,
    },
  });
}

export async function serveTelesistemaMaster(origin) {
  const { text, masterUrl } = await fetchTelesistemaManifest();
  const rewritten = rewriteM3u8(text, masterUrl);
  return new Response(rewritten, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'no-cache',
      ...securityHeaders(),
      ...corsHeaders(origin),
    },
  });
}

export async function serveProxy(targetUrl, refererOverride, origin) {
  await assertProxyTargetAllowed(targetUrl);

  const lower = targetUrl.toLowerCase();
  const isM3u8 = lower.includes('.m3u8');

  if (isM3u8) {
    const m3u8Res = await fetch(targetUrl, { headers: upstreamHeaders(targetUrl, refererOverride) });
    if (!m3u8Res.ok) throw new Error(`Manifest HTTP ${m3u8Res.status}`);
    const body = rewriteM3u8(await m3u8Res.text(), targetUrl);
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache',
        ...securityHeaders(),
        ...corsHeaders(origin),
      },
    });
  }

  let playUrl = targetUrl;
  if (isZenoHost(targetUrl)) {
    playUrl = (await resolveZenoPlayUrl(targetUrl, refererOverride)) || targetUrl;
    await assertProxyTargetAllowed(playUrl);
  }

  return streamProxy(playUrl, refererOverride, origin);
}

async function streamProxy(targetUrl, refererOverride, origin) {
  let upstream;
  try {
    upstream = await fetch(targetUrl, {
      headers: upstreamHeaders(targetUrl, refererOverride),
      redirect: 'follow',
    });
  } catch {
    return textResponse('Stream no disponible temporalmente', 502, origin);
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(null, { status: upstream.status || 502, headers: corsHeaders(origin) });
  }

  const rawType = upstream.headers.get('content-type') || 'application/octet-stream';
  const contentType = rawType.split(';')[0].trim();

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      ...securityHeaders(),
      ...corsHeaders(origin),
    },
  });
}

export async function serveRadioNowPlaying(streamUrl, referer, origin) {
  await assertProxyTargetAllowed(streamUrl);
  const meta = await fetchIcyNowPlaying(streamUrl, referer);
  return jsonResponse(meta || { title: null, station: null }, 200, origin);
}

/** Adaptador Fetch API (Node 18+ y Cloudflare Workers). */
export async function handleApiRequest(request) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin') || '';

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders(origin),
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        ...securityHeaders(),
      },
    });
  }

  if (request.method !== 'GET') {
    return textResponse('Method not allowed', 405, origin);
  }

  try {
    if (url.pathname === '/api/live/telesistema.m3u8') {
      return await serveTelesistemaMaster(origin);
    }

    if (url.pathname === '/api/proxy') {
      const target = url.searchParams.get('url');
      if (!target) return textResponse('Missing url', 400, origin);
      const referer = url.searchParams.get('referer') || '';
      return await serveProxy(target, referer, origin);
    }

    if (url.pathname === '/api/radio-now-playing') {
      const streamUrl = url.searchParams.get('url');
      if (!streamUrl) return jsonResponse({ title: null, station: null }, 400, origin);
      const referer = url.searchParams.get('referer') || '';
      return await serveRadioNowPlaying(streamUrl, referer, origin);
    }

    if (url.pathname === '/api/zeno-resolve') {
      const slug = url.searchParams.get('slug');
      const referer = url.searchParams.get('referer') || '';
      if (!slug) return jsonResponse({ error: 'Missing slug' }, 400, origin);
      const metaRes = await fetch(`https://zeno.fm/api/stations/${encodeURIComponent(slug)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VivoRD/1.0)' },
      });
      if (!metaRes.ok) return jsonResponse({ error: 'Zeno metadata failed' }, 502, origin);
      const meta = await metaRes.json();
      const streamURL = meta?.streamURL;
      if (!streamURL) return jsonResponse({ error: 'No stream URL' }, 502, origin);
      const playUrl = (await resolveZenoPlayUrl(streamURL, referer)) || streamURL;
      return jsonResponse({ playUrl, streamURL, title: meta?.title || null }, 200, origin);
    }

    return textResponse('Not found', 404, origin);
  } catch (e) {
    if (e instanceof ProxyDeniedError) {
      return textResponse(e.message, e.status, origin);
    }
    console.error('API error', e);
    return textResponse('Stream no disponible temporalmente', 502, origin);
  }
}

