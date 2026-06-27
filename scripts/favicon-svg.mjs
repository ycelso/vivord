/**
 * Genera favicon.svg a color desde el PNG de marca (no el logo.svg potrace en B/N).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const IMG = path.join(ROOT, 'assets', 'img');

const SOURCES = [
  'logo-icon-128.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'pwa-icon-512.png',
];

export async function writeFaviconSvg() {
  let srcPath = null;
  for (const name of SOURCES) {
    const p = path.join(IMG, name);
    try {
      await fs.access(p);
      srcPath = p;
      break;
    } catch {
      /* try next */
    }
  }
  if (!srcPath) {
    throw new Error('No hay PNG de icono en assets/img para generar favicon.svg');
  }

  const meta = await sharp(srcPath).metadata();
  const size = Math.min(Math.max(meta.width || 128, meta.height || 128), 128);

  const png = await sharp(srcPath)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();

  const b64 = png.toString('base64');
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="VivoRD">`,
    `  <image width="${size}" height="${size}" href="data:image/png;base64,${b64}"/>`,
    '</svg>',
    '',
  ].join('\n');

  const dest = path.join(IMG, 'favicon.svg');
  await fs.writeFile(dest, svg, 'utf8');
  return {
    dest: 'favicon.svg',
    source: path.basename(srcPath),
    bytes: Buffer.byteLength(svg),
  };
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  writeFaviconSvg()
    .then((r) => console.log(`OK ${r.dest} from ${r.source} (${Math.round(r.bytes / 1024)} KB)`))
    .catch((e) => {
      console.error(e.message || e);
      process.exit(1);
    });
}
