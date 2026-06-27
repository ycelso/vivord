import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, MEDIA_DIR, resolveRemoteImg } from './image-paths.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONCURRENCY = 8;
const force = process.argv.includes('--force');

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('Instala sharp: npm install --no-save sharp');
  process.exit(1);
}

async function pool(items, limit, fn) {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
}

function isRemote(url) {
  return /^https?:\/\//i.test(url || '');
}

function collectFromList(list, kind, map) {
  for (const item of list) {
    if (!item?.slug || !item?.img) continue;
    const remote = resolveRemoteImg(item.img);
    if (!isRemote(remote) && !isRemote(item.img)) continue;
    const url = isRemote(item.img) ? item.img : remote;
    map.set(`${kind}:${item.slug}`, { slug: item.slug, url: resolveRemoteImg(url), kind });
  }
}

async function loadJson(rel) {
  const p = path.join(ROOT, rel);
  try {
    return JSON.parse(await fs.readFile(p, 'utf8'));
  } catch {
    return null;
  }
}

async function downloadOne({ slug, url, kind }) {
  const dir = path.join(MEDIA_DIR, kind);
  await fs.mkdir(dir, { recursive: true });
  const outWebp = path.join(dir, `${slug}.webp`);

  if (!force && fsSync.existsSync(outWebp)) {
    return { slug, kind, path: `assets/media/${kind}/${slug}.webp`, skipped: true };
  }

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; VivoRD/1.0; +image-mirror)',
      Referer: 'https://canalesdominicanos.live/',
    },
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 80) throw new Error('respuesta demasiado pequeña');

  await sharp(buf)
    .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(outWebp);

  return { slug, kind, path: `assets/media/${kind}/${slug}.webp`, skipped: false };
}

function applyLocalToEntry(item, kind) {
  const rel = `assets/media/${kind}/${item.slug}.webp`;
  const full = path.join(ROOT, rel);
  if (fsSync.existsSync(full)) {
    item.img = rel;
    return true;
  }
  return false;
}

async function patchJsonFiles() {
  const homeTv = await loadJson('data/home-tv.json');
  if (homeTv) {
    for (const list of [homeTv.priority, homeTv.catalog]) {
      list?.forEach((item) => applyLocalToEntry(item, 'canales'));
    }
    await fs.writeFile(path.join(ROOT, 'data/home-tv.json'), JSON.stringify(homeTv));
  }

  const homeRadios = await loadJson('data/home-radios.json');
  if (homeRadios) {
    for (const list of [homeRadios.featured, homeRadios.priority, homeRadios.catalog]) {
      list?.forEach((item) => applyLocalToEntry(item, 'radios'));
    }
    await fs.writeFile(path.join(ROOT, 'data/home-radios.json'), JSON.stringify(homeRadios));
  }

  const search = await loadJson('data/search-index.json');
  if (search) {
    search.channels?.forEach((item) => applyLocalToEntry(item, 'canales'));
    search.stations?.forEach((item) => applyLocalToEntry(item, 'radios'));
    await fs.writeFile(path.join(ROOT, 'data/search-index.json'), JSON.stringify(search));
  }

  const catalog = await loadJson('data/catalog.json');
  if (catalog?.channels) {
    let n = 0;
    for (const ch of catalog.channels) {
      if (applyLocalToEntry(ch, 'canales')) n++;
    }
    catalog.updatedAt = new Date().toISOString();
    await fs.writeFile(path.join(ROOT, 'data/catalog.json'), JSON.stringify(catalog));
    console.log(`  catalog.json: ${n} imágenes locales`);
  }
}

async function main() {
  const map = new Map();

  const homeTv = await loadJson('data/home-tv.json');
  if (homeTv) {
    collectFromList(homeTv.priority, 'canales', map);
    collectFromList(homeTv.catalog, 'canales', map);
  }

  const homeRadios = await loadJson('data/home-radios.json');
  if (homeRadios) {
    collectFromList(homeRadios.featured, 'radios', map);
    collectFromList(homeRadios.priority, 'radios', map);
    collectFromList(homeRadios.catalog, 'radios', map);
  }

  const catalog = await loadJson('data/catalog.json');
  if (catalog?.channels) {
    collectFromList(catalog.channels, 'canales', map);
  }

  const items = [...map.values()];
  console.log(`Espejando ${items.length} logos (${CONCURRENCY} en paralelo)…`);

  const failed = [];
  let done = 0;
  let skipped = 0;
  let ok = 0;

  await pool(items, CONCURRENCY, async (item) => {
    try {
      const result = await downloadOne(item);
      if (result.skipped) skipped++;
      else ok++;
    } catch (e) {
      failed.push({ ...item, error: e.message });
    }
    done++;
    if (done % 40 === 0 || done === items.length) {
      console.log(`  ${done}/${items.length} (${ok} nuevos, ${skipped} ya existían, ${failed.length} fallos)`);
    }
  });

  await patchJsonFiles();

  const manifest = {
    updatedAt: new Date().toISOString(),
    total: items.length,
    ok,
    skipped,
    failed: failed.length,
    failures: failed.slice(0, 30),
  };
  await fs.writeFile(
    path.join(ROOT, 'data', 'image-mirror-log.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`Listo: ${ok} descargados, ${skipped} omitidos, ${failed.length} fallos`);
  if (failed.length) {
    console.log('  Detalle en data/image-mirror-log.json');
    console.log('  Ejecuta npm run retheme para regenerar HTML con rutas locales');
  } else {
    console.log('  Ejecuta: npm run retheme && npm run retheme:radios');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
