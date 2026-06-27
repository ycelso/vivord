import { handleApiRequest } from '../scripts/proxy-handler.mjs';
import { setProxyAllowlist, setAllowedOrigins } from '../scripts/proxy-security.mjs';

let allowlistReady = false;
let allowlistSiteUrl = '';

async function ensureAllowlist(siteUrl) {
  const base = (siteUrl || '').replace(/\/$/, '');
  if (allowlistReady && allowlistSiteUrl === base) return;
  allowlistSiteUrl = base;
  try {
    const res = await fetch(`${base}/data/proxy-allowlist.json`, {
      cf: { cacheTtl: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      setProxyAllowlist(data.hosts);
    }
  } catch {
    setProxyAllowlist([]);
  }
  allowlistReady = true;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      return new Response('Not found', { status: 404 });
    }

    if (env.ALLOWED_ORIGINS) setAllowedOrigins(env.ALLOWED_ORIGINS);
    await ensureAllowlist(env.SITE_URL || url.origin);
    return handleApiRequest(request);
  },
};
