/**
 * Copia y valida logos desde /logos hacia assets/img/.
 * Fuente de verdad del diseñador — no auto-genera OG ni deforma iconos.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { writeFaviconSvg } from './favicon-svg.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const LOGOS = path.join(ROOT, 'logos');
const IMG = path.join(ROOT, 'assets', 'img');
const BRAND_BG = '#0a0a0b';

/** @type {Record<string, { w: number, h: number }>} */
const PNG_SPECS = {
  '1200-630.png': { w: 1200, h: 630 },
  '1024-1024.png': { w: 1024, h: 1024 },
  'logo-icon-512.png': { w: 512, h: 512 },
  'logo-icon-256.png': { w: 256, h: 256 },
  'logo-icon-180.png': { w: 180, h: 180 },
  'logo-icon-128.png': { w: 128, h: 128 },
  'logo-icon-32.png': { w: 32, h: 32 },
  'logo-icon-16.png': { w: 16, h: 16 },
};

const PNG_MAP = [
  { src: 'logo-icon-128.png', dest: 'vivord-logo.png' },
  { src: 'logo-icon-256.png', dest: 'vivord-logo-icon.png' },
  { src: 'logo-icon-512.png', dest: 'pwa-icon-512.png' },
  { src: 'logo-icon-32.png', dest: 'favicon-32x32.png' },
  { src: 'logo-icon-16.png', dest: 'favicon-16x16.png' },
  { src: 'logo-icon-180.png', dest: 'apple-touch-icon.png' },
  { src: '1024-1024.png', dest: 'vivord-logo-1024.png' },
];

// favicon.svg se genera a color desde PNG (scripts/favicon-svg.mjs), no desde logo.svg potrace.
const SVG_MAP = [{ src: 'logo.svg', dest: 'logo-mark.svg' }];

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function validatePng(srcName) {
  const spec = PNG_SPECS[srcName];
  if (!spec) return { ok: true, warnings: [] };

  const src = path.join(LOGOS, srcName);
  const meta = await sharp(src).metadata();
  const warnings = [];

  if (meta.width !== spec.w || meta.height !== spec.h) {
    throw new Error(
      `${srcName}: esperado ${spec.w}×${spec.h}, recibido ${meta.width}×${meta.height}`
    );
  }

  const stat = await fs.stat(src);
  const kb = Math.round(stat.size / 1024);
  if (srcName === '1200-630.png' && kb > 400) {
    warnings.push(`OG pesado (${kb} KB). Ideal < 300 KB para carga social rápida.`);
  }
  if (srcName === '1024-1024.png' && kb > 600) {
    warnings.push(`Maestro 1024 pesado (${kb} KB). Considera optimizar sin perder nitidez.`);
  }

  if (srcName === '1200-630.png') {
    const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const corners = [
      [0, 0],
      [info.width - 1, 0],
      [0, info.height - 1],
      [info.width - 1, info.height - 1],
    ];
    const transparentCorners = corners.filter(([x, y]) => {
      const i = (y * info.width + x) * 4;
      return data[i + 3] < 200;
    }).length;
    if (transparentCorners >= 3) {
      warnings.push('OG con fondo transparente: se aplanará a #0a0a0b para redes sociales.');
    }
  }

  return { ok: true, warnings, kb };
}

async function writePng(srcName, destName, { flatten = false } = {}) {
  const src = path.join(LOGOS, srcName);
  const dest = path.join(IMG, destName);
  let pipeline = sharp(src);

  if (flatten) {
    pipeline = pipeline.flatten({ background: BRAND_BG });
  }

  await pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(dest);
  const size = (await fs.stat(dest)).size;
  return { dest: destName, bytes: size };
}

async function writeOgJpeg() {
  const src = path.join(LOGOS, '1200-630.png');
  const destName = 'og-vivord-1200x630.jpg';
  const dest = path.join(IMG, destName);
  // WhatsApp is strict about OG size (<500KB). JPEG compresses far better than PNG here.
  await sharp(src)
    .flatten({ background: BRAND_BG })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(dest);
  return { dest: destName, bytes: (await fs.stat(dest)).size };
}

async function writeSvg(srcName, destName) {
  const src = path.join(LOGOS, srcName);
  const dest = path.join(IMG, destName);
  await fs.copyFile(src, dest);
  return { dest: destName };
}

async function ensurePwa192() {
  const src512 = path.join(IMG, 'pwa-icon-512.png');
  const dest192 = path.join(IMG, 'pwa-icon-192.png');
  if (!(await exists(src512))) return null;

  await sharp(src512)
    .resize(192, 192, { fit: 'contain', background: { r: 10, g: 10, b: 11, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(dest192);

  return { dest: 'pwa-icon-192.png', bytes: (await fs.stat(dest192)).size };
}

/**
 * @returns {Promise<{ copied: object[], warnings: string[] }>}
 */
export async function syncBrandAssets() {
  if (!(await exists(LOGOS))) {
    throw new Error('No existe la carpeta logos/ en la raíz del proyecto.');
  }

  const required = [...Object.keys(PNG_SPECS), 'logo.svg'];
  for (const name of required) {
    if (!(await exists(path.join(LOGOS, name)))) {
      throw new Error(`Falta logos/${name}`);
    }
  }

  await fs.mkdir(IMG, { recursive: true });

  const warnings = [];
  const copied = [];

  for (const name of Object.keys(PNG_SPECS)) {
    const { warnings: w } = await validatePng(name);
    warnings.push(...w);
  }

  for (const item of PNG_MAP) {
    copied.push(await writePng(item.src, item.dest, { flatten: item.flatten }));
  }

  // OG image: generate optimized JPEG (preferred) to satisfy WhatsApp size constraints.
  copied.push(await writeOgJpeg());

  for (const item of SVG_MAP) {
    copied.push(await writeSvg(item.src, item.dest));
  }

  copied.push(await writeFaviconSvg());

  const pwa192 = await ensurePwa192();
  if (pwa192) copied.push(pwa192);

  // Compat legacy scripts (build-logo-png / play-store)
  await fs.copyFile(path.join(IMG, 'vivord-logo-1024.png'), path.join(IMG, 'vivord-logo-store-source.png'));

  return { copied, warnings };
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  syncBrandAssets()
    .then(({ copied, warnings }) => {
      console.log('Brand sync OK:');
      for (const c of copied) {
        console.log(`  → ${c.dest}${c.bytes ? ` (${Math.round(c.bytes / 1024)} KB)` : ''}`);
      }
      if (warnings.length) {
        console.log('\nAvisos:');
        for (const w of warnings) console.log(`  ⚠ ${w}`);
      }
    })
    .catch((e) => {
      console.error(e.message || e);
      process.exit(1);
    });
}
