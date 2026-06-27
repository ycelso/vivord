import { handleApiRequest } from '../scripts/proxy-handler.mjs';
import { setProxyAllowlist, setAllowedOrigins } from '../scripts/proxy-security.mjs';

let allowlistReady = false;
let allowlistOrigin = '';

async function ensureAllowlist(origin) {
  const base = origin.replace(/\/$/, '');
  if (allowlistReady && allowlistOrigin === base) return;
  allowlistOrigin = base;
  try {
    const res = await fetch(`${base}/data/proxy-allowlist.json`, { cf: { cacheTtl: 300 } });
    if (res.ok) {
      const data = await res.json();
      setProxyAllowlist(data.hosts);
    } else {
      setProxyAllowlist([]);
    }
  } catch {
    setProxyAllowlist([]);
  }
  allowlistReady = true;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      if (env.ALLOWED_ORIGINS) setAllowedOrigins(env.ALLOWED_ORIGINS);
      else {
        setAllowedOrigins(
          'https://vivord2.pages.dev,https://vivord.pages.dev,https://vivo-rd.com,https://www.vivo-rd.com'
        );
      }
      await ensureAllowlist(url.origin);
      const res = await handleApiRequest(request);
      return res ?? new Response('Not found', { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
};
