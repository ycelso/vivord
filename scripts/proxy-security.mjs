import { ALLOWED_ORIGINS as CONFIG_ORIGINS } from './site-config.mjs';

/** Dominios CDN / emisoras que siempre pueden pasar por el proxy. */
export const BASE_PROXY_HOSTS = [
  'dailymotion.com',
  'www.dailymotion.com',
  'dmcdn.net',
  'cf.dmcdn.net',
  'mediatiquestream.com',
  'streamgato.com',
  'streamgato.us',
  'radiojar.com',
  'zeno.fm',
  'zenolive.com',
  '1001.do',
  'sonicpanelradio.com',
  'sonicpanel.streaming10.net',
  'icecast.streamingdeluxe.com',
  'shoutcast.com',
  'centova.com',
  'livestream.com',
  'akamaized.net',
  'cloudfront.net',
  'amazonaws.com',
];

let cachedAllowlist = null;

/** Precarga allowlist (p. ej. Worker de Cloudflare al arrancar). */
export function setProxyAllowlist(hosts) {
  cachedAllowlist = mergeAllowlistHosts(hosts || []);
}

export function hostMatchesPattern(hostname, pattern) {
  const host = hostname.toLowerCase();
  const pat = pattern.toLowerCase();
  if (pat.startsWith('*.')) {
    const suffix = pat.slice(1);
    return host === pat.slice(2) || host.endsWith(suffix);
  }
  return host === pat || host.endsWith(`.${pat}`);
}

export function hostnameFromUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isBlockedTarget(hostname) {
  if (!hostname) return true;
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) return true;
  if (hostname.endsWith('.local')) return true;

  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [, a, b] = ipv4.map(Number);
    if (a === 127 || a === 0) return true;
    if (a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }

  if (hostname.includes(':') && (hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd')))
    return true;

  return false;
}

export function collectHostsFromStreamUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return [];
  if (rawUrl.startsWith('/api/')) return [];
  const host = hostnameFromUrl(rawUrl);
  return host ? [host] : [];
}

export function mergeAllowlistHosts(...lists) {
  const set = new Set(BASE_PROXY_HOSTS.map((h) => h.toLowerCase()));
  for (const list of lists) {
    for (const item of list) {
      if (typeof item === 'string' && item.trim()) set.add(item.trim().toLowerCase());
    }
  }
  return [...set].sort();
}

export async function loadProxyAllowlist() {
  if (cachedAllowlist) return cachedAllowlist;
  cachedAllowlist = mergeAllowlistHosts();
  return cachedAllowlist;
}

export function isHostAllowed(hostname, allowlist) {
  if (!hostname || isBlockedTarget(hostname)) return false;
  const host = hostname.toLowerCase();
  return allowlist.some((pattern) => hostMatchesPattern(host, pattern));
}

export async function assertProxyTargetAllowed(targetUrl) {
  const hostname = hostnameFromUrl(targetUrl);
  if (!hostname) {
    throw new ProxyDeniedError('URL no válida');
  }
  if (isBlockedTarget(hostname)) {
    throw new ProxyDeniedError('Destino no permitido');
  }
  const allowlist = await loadProxyAllowlist();
  if (!isHostAllowed(hostname, allowlist)) {
    throw new ProxyDeniedError('Dominio no autorizado para proxy');
  }
}

export class ProxyDeniedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProxyDeniedError';
    this.status = 403;
  }
}

export function securityHeaders(extra = {}) {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    ...extra,
  };
}

let runtimeOrigins = null;

/** Configura CORS en runtime (Cloudflare Worker env vars). */
export function setAllowedOrigins(value) {
  if (!value) return;
  runtimeOrigins = String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function activeOrigins() {
  return runtimeOrigins?.length ? runtimeOrigins : CONFIG_ORIGINS;
}

// Orígenes del WebView nativo (Capacitor Android/iOS). La app no corre en un
// dominio web, así que su Origin no está en la allowlist de producción.
const APP_ORIGINS = [
  'https://localhost',
  'http://localhost',
  'capacitor://localhost',
  'ionic://localhost',
];

export function corsHeaders(requestOrigin) {
  const ALLOWED_ORIGINS = activeOrigins();
  if (!ALLOWED_ORIGINS.length) {
    return { 'Access-Control-Allow-Origin': '*' };
  }
  if (
    requestOrigin &&
    (ALLOWED_ORIGINS.includes(requestOrigin) || APP_ORIGINS.includes(requestOrigin))
  ) {
    return { 'Access-Control-Allow-Origin': requestOrigin, Vary: 'Origin' };
  }
  return { 'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0], Vary: 'Origin' };
}

export function createRateLimiter({ windowMs = 60_000, max = 150 } = {}) {
  const hits = new Map();

  return function rateLimit(clientKey) {
    const key = clientKey || 'unknown';
    const now = Date.now();
    let bucket = hits.get(key);
    if (!bucket || now - bucket.start > windowMs) {
      bucket = { start: now, count: 0 };
      hits.set(key, bucket);
    }
    bucket.count += 1;
    if (hits.size > 10_000) {
      for (const [k, v] of hits) {
        if (now - v.start > windowMs) hits.delete(k);
      }
    }
    return bucket.count <= max;
  };
}

export function clientIp(req) {
  const cf = req.headers.get?.('cf-connecting-ip') || req.headers['cf-connecting-ip'];
  if (cf) return String(cf);
  const xff = req.headers.get?.('x-forwarded-for') || req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || 'local';
}
