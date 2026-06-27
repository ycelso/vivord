import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncBrandAssets } from './sync-brand-assets.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'assets', 'img');
const LOGOS_DIR = path.join(ROOT, 'logos');

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function svgDataUrl(svgText) {
  const normalized = String(svgText)
    .replace(/\r\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
  const encoded = encodeURIComponent(normalized)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml,${encoded}`;
}

/**
 * Distribuye logos del diseñador (logos/) a assets/img/.
 * No genera OG ni iconos desde SVG — evita deformaciones.
 */
export async function ensureSocialAssets() {
  await fs.mkdir(IMG_DIR, { recursive: true });

  if (!(await exists(LOGOS_DIR))) {
    throw new Error(
      'No se encontró logos/. Coloca ahí los exports del diseñador y vuelve a ejecutar el build.'
    );
  }

  const { warnings } = await syncBrandAssets();
  if (warnings.length) {
    for (const w of warnings) console.warn(`[brand] ${w}`);
  }

  const ogJpg = path.join(IMG_DIR, 'og-vivord-1200x630.jpg');
  const faviconSvg = path.join(IMG_DIR, 'favicon.svg');

  if (!(await exists(ogJpg))) {
    throw new Error('Tras sync, falta assets/img/og-vivord-1200x630.jpg');
  }

  let fallbackSvgDataUrl = '';
  if (await exists(faviconSvg)) {
    fallbackSvgDataUrl = svgDataUrl(await fs.readFile(faviconSvg, 'utf8'));
  }

  return {
    ogImagePath: './assets/img/og-vivord-1200x630.jpg',
    ogWidth: 1200,
    ogHeight: 630,
    fallbackSvgDataUrl,
  };
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  ensureSocialAssets()
    .then(() => console.log('Social assets: OK'))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
