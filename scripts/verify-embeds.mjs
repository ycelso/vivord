import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const TIMEOUT_MS = Number(process.env.EMBED_CHECK_TIMEOUT) || 12_000;
const CONCURRENCY = Number(process.env.EMBED_CHECK_CONCURRENCY) || 8;

function parseFrameAncestors(csp) {
  const m = String(csp || '').match(/frame-ancestors\s+([^;]+)/i);
  return m ? m[1].trim() : null;
}

function embedBlockReason(headers) {
  const xfo = String(headers.xFrameOptions || '').toLowerCase();
  if (xfo.includes('deny')) return 'xfo_deny';
  if (xfo.includes('sameorigin')) return 'xfo_sameorigin';
  const fa = parseFrameAncestors(headers.contentSecurityPolicy);
  if (fa) {
    const low = fa.toLowerCase();
    if (low.includes("'none'")) return 'csp_frame_ancestors_none';
    if (low.includes("'self'") && !low.includes('vivo-rd.com')) return 'csp_self_only';
  }
  return null;
}

async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VivoRD-EmbedCheck/1.0)',
        Range: 'bytes=0-512',
      },
    });
    res.body?.cancel?.();
    const headers = {
      contentType: res.headers.get('content-type') || '',
      xFrameOptions: res.headers.get('x-frame-options') || '',
      contentSecurityPolicy: res.headers.get('content-security-policy') || '',
    };
    return {
      ok: res.ok || res.status === 206,
      status: res.status,
      finalUrl: res.url,
      headers,
      blockReason: embedBlockReason(headers),
    };
  } catch (e) {
    return { ok: false, status: 0, error: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally {
    clearTimeout(timer);
  }
}

async function pool(items, limit, fn) {
  let i = 0;
  const results = new Array(items.length);
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

async function readJson(rel) {
  try {
    return JSON.parse(await fs.readFile(path.join(ROOT, rel), 'utf8'));
  } catch {
    return null;
  }
}

export async function verifyEmbeds({ writeReport = true } = {}) {
  const catalog = await readJson('data/catalog.json');
  const channels = (catalog?.channels || []).filter((c) => c.streamType === 'iframe' && c.stream);

  console.log(`Verificando ${channels.length} iframes (${CONCURRENCY} en paralelo)…`);

  const checked = await pool(channels, CONCURRENCY, async (ch) => {
    const p = await probe(ch.stream);
    return {
      slug: ch.slug,
      name: ch.name,
      page: `canal/${ch.slug}.html`,
      stream: ch.stream,
      ok: p.ok && !p.blockReason,
      status: p.status,
      issue: !p.ok ? p.error || `http_${p.status || 'fail'}` : p.blockReason,
      finalUrl: p.finalUrl,
      headers: p.headers,
    };
  });

  const failed = checked.filter((r) => !r.ok);
  const report = {
    updatedAt: new Date().toISOString(),
    summary: { total: channels.length, failed: failed.length },
    failed: failed.slice(0, 500),
  };

  if (writeReport) {
    await fs.mkdir(path.join(ROOT, 'data'), { recursive: true });
    await fs.writeFile(path.join(ROOT, 'data', 'embed-health.json'), JSON.stringify(report, null, 2));
  }

  console.log(`Fallos embed: ${report.summary.failed}/${report.summary.total}`);
  console.log(`Informe → data/embed-health.json`);
  return report;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  verifyEmbeds().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

