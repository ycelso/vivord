/**
 * Genera gráficos de ficha Play Store desde el logo nuevo.
 * - play-store-icon-512.png      (ícono de la app, 512×512)
 * - play-store-feature-1024x500.png (gráfico de funciones)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist', 'play-store');
const BG = { r: 10, g: 10, b: 11, alpha: 1 };

const SOURCES = [
  path.join(ROOT, 'assets/img/vivord-logo-1024.png'),
  path.join(ROOT, 'assets/img/pwa-icon-512.png'),
  path.join(ROOT, 'logos/1024-1024.png'),
];

async function resolveLogo() {
  for (const p of SOURCES) {
    try {
      await fs.access(p);
      return p;
    } catch {
      /* siguiente */
    }
  }
  throw new Error('No se encontró logo maestro. Ejecuta: npm run brand:sync');
}

async function writePlayStoreIcon(logoPath) {
  const size = 512;
  const logoSize = Math.round(size * 0.88);
  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const dest = path.join(OUT, 'play-store-icon-512.png');
  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(dest);

  return dest;
}

async function writeFeatureGraphic(logoPath) {
  const W = 1024;
  const H = 500;
  const logo = await sharp(logoPath)
    .resize(340, 340, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a0508"/>
      <stop offset="45%" stop-color="#0a0a0b"/>
      <stop offset="100%" stop-color="#081018"/>
    </linearGradient>
    <radialGradient id="r" cx="78%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#e63946" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#e63946" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="b" cx="18%" cy="55%" r="50%">
      <stop offset="0%" stop-color="#2563eb" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#2563eb" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect width="100%" height="100%" fill="url(#r)"/>
  <rect width="100%" height="100%" fill="url(#b)"/>
  <text x="430" y="210" fill="#ffffff" font-family="Arial,Helvetica,sans-serif" font-size="56" font-weight="700">VivoRD</text>
  <text x="430" y="270" fill="#d1d5db" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="500">Radios dominicanas en vivo</text>
  <text x="430" y="320" fill="#9ca3af" font-family="Arial,Helvetica,sans-serif" font-size="22">Gratis · Rápido · Desde tu Android</text>
</svg>`;

  const dest = path.join(OUT, 'play-store-feature-1024x500.png');
  await sharp({
    create: { width: W, height: H, channels: 4, background: BG },
  })
    .composite([
      { input: Buffer.from(svg), top: 0, left: 0 },
      { input: logo, top: 80, left: 52 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(dest);

  return dest;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const logoPath = await resolveLogo();
  console.log(`Origen: ${path.relative(ROOT, logoPath)}\n`);

  const icon = await writePlayStoreIcon(logoPath);
  const feature = await writeFeatureGraphic(logoPath);

  for (const p of [icon, feature]) {
    const st = await fs.stat(p);
    const meta = await sharp(p).metadata();
    console.log(
      `${path.basename(p)} → ${meta.width}×${meta.height}, ${Math.round(st.size / 1024)} KB`
    );
  }

  console.log(`\nCarpeta: ${OUT}`);
  console.log('Sube estos archivos en Play Console → Ficha de Play Store → Gráficos');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
