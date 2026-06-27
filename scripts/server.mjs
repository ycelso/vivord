import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { handleApiRequest } from './proxy-handler.mjs';
import {
  clientIp,
  createRateLimiter,
  corsHeaders,
  securityHeaders,
  setProxyAllowlist,
} from './proxy-security.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;
const rateLimit = createRateLimiter({ max: Number(process.env.RATE_LIMIT_MAX) || 150 });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
};

function cacheHeaders(filePath, ext) {
  const rel = filePath.slice(ROOT.length).replace(/\\/g, '/');
  if (rel.startsWith('/assets/')) {
    return 'public, max-age=31536000, immutable';
  }
  if (ext === '.html') {
    return 'public, max-age=120, must-revalidate';
  }
  if (ext === '.json' && rel.startsWith('/data/')) {
    return 'public, max-age=300, must-revalidate';
  }
  if (['.png', '.jpg', '.webp', '.svg', '.ico'].includes(ext)) {
    return 'public, max-age=86400';
  }
  return 'public, max-age=3600';
}

async function serveStatic(urlPath, res) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, securityHeaders()).end();
    return;
  }
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': cacheHeaders(filePath, ext),
      ...securityHeaders(),
    });
    res.end(data);
  } catch {
    res.writeHead(404, securityHeaders()).end('Not found');
  }
}

async function sendWebResponse(res, response) {
  const headers = Object.fromEntries(response.headers.entries());
  res.writeHead(response.status, headers);
  if (!response.body) {
    res.end();
    return;
  }
  Readable.fromWeb(response.body).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);
    const origin = req.headers.origin || '';

    if (url.pathname.startsWith('/api/')) {
      if (!rateLimit(clientIp(req))) {
        res.writeHead(429, {
          'Content-Type': 'text/plain; charset=utf-8',
          ...securityHeaders(),
          ...corsHeaders(origin),
        });
        res.end('Demasiadas solicitudes');
        return;
      }

      const webReq = new Request(`http://127.0.0.1${url.pathname}${url.search}`, {
        method: req.method,
        headers: req.headers,
      });
      const apiRes = await handleApiRequest(webReq);
      if (apiRes) {
        await sendWebResponse(res, apiRes);
        return;
      }
      res.writeHead(404, securityHeaders()).end('Not found');
      return;
    }

    await serveStatic(url.pathname, res);
  } catch (e) {
    console.error(e);
    res.writeHead(502, {
      'Content-Type': 'text/plain; charset=utf-8',
      ...securityHeaders(),
    });
    res.end('Error del servidor');
  }
});

async function loadAllowlistOnStart() {
  try {
    const raw = await fs.readFile(path.join(ROOT, 'data', 'proxy-allowlist.json'), 'utf8');
    const data = JSON.parse(raw);
    setProxyAllowlist(data.hosts || []);
  } catch {
    setProxyAllowlist([]);
  }
}

await loadAllowlistOnStart();

server.listen(PORT, () => {
  console.log(`VivoRD → http://localhost:${PORT}`);
  console.log('API: /api/proxy · /api/live/telesistema.m3u8 · /api/radio-now-playing');
});
