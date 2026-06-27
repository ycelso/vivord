import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hostnameFromUrl } from './proxy-security.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TIMEOUT_MS = Number(process.env.STREAM_CHECK_TIMEOUT) || 12_000;
const CONCURRENCY = Number(process.env.STREAM_CHECK_CONCURRENCY) || 8;

function classifyStream(url, streamType) {
  if (!url) return 'missing';
  if (url.startsWith('/api/')) return 'api';
  if (streamType === 'iframe') return 'iframe';
  const lower = url.toLowerCase();
  if (lower.includes('.m3u8')) return 'hls';
  if (lower.includes('zeno.fm') || lower.includes('zenolive.com')) return 'zeno-direct';
  if (/\.(mp3|aac|ogg)(\?|$)/i.test(lower)) return 'audio-file';
  try {
    const u = new URL(url);
    const pathLower = u.pathname.toLowerCase();
    if (
      !pathLower.match(/\.(m3u8|mp3|aac|ogg|pls)$/) &&
      (pathLower === '/' || pathLower.endsWith('.html') || pathLower.endsWith('.php') || !pathLower.includes('.'))
    ) {
      return 'webpage';
    }
  } catch {
    return 'invalid-url';
  }
  return 'stream';
}

async function probeUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; VivoRD-StreamCheck/1.0)',
        'Icy-MetaData': '0',
        Range: 'bytes=0-2048',
      },
    });
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    res.body?.cancel?.();
    const ok = res.ok || res.status === 206;
    return {
      ok,
      status: res.status,
      contentType: ct,
      looksLikeAudio:
        ct.startsWith('audio/') ||
        ct.includes('mpeg') ||
        ct.includes('octet-stream') ||
        ct.includes('application/vnd.apple.mpegurl'),
    };
  } catch (e) {
    return { ok: false, status: 0, error: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally {
    clearTimeout(timer);
  }
}

async function checkItem(item, kind) {
  const { slug, name, stream, streamType } = item;
  const kindLabel = kind === 'tv' ? 'canal' : 'radio';
  const page = `${kindLabel}/${slug}.html`;
  const classification = classifyStream(stream, streamType);

  const result = {
    slug,
    name,
    kind,
    page,
    stream: stream || null,
    streamType: streamType || null,
    classification,
    host: stream ? hostnameFromUrl(stream) : null,
    ok: null,
    status: null,
    issue: null,
  };

  if (classification === 'missing') {
    result.ok = false;
    result.issue = 'sin_stream';
    return result;
  }
  if (classification === 'iframe' || classification === 'api') {
    result.ok = true;
    result.issue = null;
    return result;
  }
  if (classification === 'webpage') {
    result.ok = false;
    result.issue = 'url_pagina_no_audio';
    return result;
  }
  if (classification === 'zeno-direct') {
    result.ok = true;
    result.issue = 'zeno_cliente_directo';
    return result;
  }

  const probe = await probeUrl(stream);
  result.status = probe.status;
  result.ok = probe.ok && (probe.looksLikeAudio !== false || classification === 'hls');
  if (!probe.ok) {
    result.issue = probe.error || `http_${probe.status || 'fail'}`;
  } else if (classification === 'webpage' || (!probe.looksLikeAudio && classification === 'stream')) {
    result.ok = false;
    result.issue = 'respuesta_no_parece_audio';
  }
  return result;
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

export async function verifyStreams({ writeReport = true } = {}) {
  const catalog = await readJson('data/catalog.json');
  const radios = await readJson('data/radios-all.json');

  const items = [];
  if (catalog?.channels) {
    for (const ch of catalog.channels) {
      if (ch.stream) items.push({ ...ch, kind: 'tv' });
      else items.push({ slug: ch.slug, name: ch.name, stream: null, streamType: ch.streamType, kind: 'tv' });
    }
  }
  if (radios?.radios) {
    for (const r of radios.radios) {
      items.push({ slug: r.slug, name: r.name, stream: r.stream, streamType: r.streamType, kind: 'radio' });
    }
  }

  const withStream = items.filter((i) => i.stream);
  const missing = items.filter((i) => !i.stream);

  console.log(`Verificando ${withStream.length} streams (${CONCURRENCY} en paralelo)…`);
  const checked = await pool(withStream, CONCURRENCY, (item) => checkItem(item, item.kind));

  const failed = checked.filter((r) => !r.ok);
  const webpage = checked.filter((r) => r.issue === 'url_pagina_no_audio');
  const broken = checked.filter((r) => r.issue && r.issue.startsWith('http_'));

  const report = {
    updatedAt: new Date().toISOString(),
    summary: {
      total: items.length,
      withStream: withStream.length,
      missingStream: missing.length,
      checked: checked.length,
      failed: failed.length,
      webpageUrls: webpage.length,
      httpErrors: broken.length,
    },
    failed: failed.slice(0, 500),
    missing: missing.slice(0, 200).map((m) => ({
      slug: m.slug,
      name: m.name,
      kind: m.kind,
      page: `${m.kind === 'tv' ? 'canal' : 'radio'}/${m.slug}.html`,
    })),
  };

  if (writeReport) {
    await fs.mkdir(path.join(ROOT, 'data'), { recursive: true });
    await fs.writeFile(
      path.join(ROOT, 'data', 'stream-health.json'),
      JSON.stringify(report, null, 2)
    );
  }

  console.log('\n--- Resumen ---');
  console.log(`  Total entradas: ${report.summary.total}`);
  console.log(`  Sin stream:     ${report.summary.missingStream}`);
  console.log(`  Con stream:     ${report.summary.withStream}`);
  console.log(`  Fallos:         ${report.summary.failed}`);
  console.log(`  URL es web:     ${report.summary.webpageUrls}`);
  console.log(`  Errores HTTP:   ${report.summary.httpErrors}`);
  console.log(`\nInforme → data/stream-health.json`);

  if (failed.length) {
    console.log('\nPrimeros 15 problemas:');
    for (const r of failed.slice(0, 15)) {
      console.log(`  [${r.kind}] ${r.slug} — ${r.issue} (${r.stream?.slice(0, 60) || ''})`);
    }
  }

  return report;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  verifyStreams().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
