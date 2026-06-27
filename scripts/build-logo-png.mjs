import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imgDir = path.join(__dirname, '..', 'assets', 'img');
const masterPath = path.join(imgDir, 'vivord-logo-full.png');
const iconPath = path.join(imgDir, 'vivord-logo-icon.png');
const outPath = path.join(imgDir, 'vivord-logo.png');
const faviconPath = path.join(imgDir, 'favico.png');

if (!fs.existsSync(masterPath)) {
  console.error(
    'Falta assets/img/vivord-logo-full.png — coloca ahí el logo maestro (PNG) y vuelve a ejecutar.'
  );
  process.exit(1);
}

const bg = { r: 10, g: 10, b: 11, alpha: 1 };
const meta = await sharp(masterPath).metadata();
const w = meta.width;
const h = meta.height;

// Recorte: centro del medallón (mapa + DR + antenas), sin texto inferior
const cropSize = Math.round(h * 0.48);
const left = Math.round((w - cropSize) / 2);
const top = Math.round(h * 0.14);

const emblem = sharp(masterPath).extract({
  left: Math.max(0, left),
  top: Math.max(0, top),
  width: Math.min(cropSize, w - left),
  height: Math.min(cropSize, h - top),
});

await emblem
  .resize(256, 256, { fit: 'contain', background: bg })
  .png({ compressionLevel: 9 })
  .toFile(iconPath);

await sharp(iconPath)
  .resize(128, 128, { fit: 'contain', background: bg })
  .png({ compressionLevel: 9 })
  .toFile(outPath);

await sharp(iconPath)
  .resize(128, 128, { fit: 'contain', background: bg })
  .png({ compressionLevel: 9 })
  .toFile(faviconPath);

console.log(`Crop ${cropSize}px @ (${left},${top})`);
console.log(`Wrote ${iconPath} (${fs.statSync(iconPath).size} bytes)`);
console.log(`Wrote ${outPath} (${fs.statSync(outPath).size} bytes)`);
console.log(`Wrote ${faviconPath} (${fs.statSync(faviconPath).size} bytes)`);
