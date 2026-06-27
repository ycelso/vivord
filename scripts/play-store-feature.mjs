import fs from 'node:fs/promises';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const W = 1024;
const H = 500;

const logoSource = path.join(ROOT, 'assets/img/vivord-logo-1024.png');
const logo = await sharp(logoSource)
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
  <text x="430" y="270" fill="#d1d5db" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="500">TV y radios dominicanas en vivo</text>
  <text x="430" y="320" fill="#9ca3af" font-family="Arial,Helvetica,sans-serif" font-size="22">Gratis · Rápido · Desde tu Android</text>
</svg>`;

await fs.mkdir(path.join(ROOT, 'dist'), { recursive: true });

await sharp({
  create: { width: W, height: H, channels: 4, background: { r: 10, g: 10, b: 11, alpha: 1 } },
})
  .composite([
    { input: Buffer.from(svg), top: 0, left: 0 },
    { input: logo, top: 80, left: 52 },
  ])
  .png()
  .toFile(path.join(ROOT, 'dist/play-store-feature-1024x500.png'));

console.log('Listo: dist/play-store-feature-1024x500.png');
