/**
 * Genera icono de launcher y splash Android desde assets/img/vivord-logo-1024.png
 * (o vivord-logo-icon.png / vivord-logo.png como respaldo).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const IMG = path.join(ROOT, 'assets', 'img');

const BG = { r: 10, g: 10, b: 11, alpha: 1 };

const SOURCES = [
  'vivord-logo-1024.png',
  'vivord-logo-icon.png',
  'vivord-logo.png',
];

const FOREGROUND_DP = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

const LAUNCHER_DP = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

async function resolveSource() {
  for (const name of SOURCES) {
    const p = path.join(IMG, name);
    try {
      await fs.access(p);
      return p;
    } catch {
      /* siguiente */
    }
  }
  console.error(
    'No se encontró logo. Coloca uno de estos en assets/img/:\n  ' +
      SOURCES.join('\n  ')
  );
  process.exit(1);
}

/** Capa foreground adaptativa: logo transparente (safe zone ~66 %). */
async function renderAdaptiveForeground(sizePx, logoScale = 0.58) {
  const logoSize = Math.round(sizePx * logoScale);
  const logo = await sharp(sourcePath)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: sizePx,
      height: sizePx,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 });
}

/** Iconos legacy (API < 26): cuadrado con fondo de marca. */
async function renderLegacyLauncher(sizePx, logoScale = 0.88) {
  const logoSize = Math.round(sizePx * logoScale);
  const logo = await sharp(sourcePath)
    .resize(logoSize, logoSize, { fit: 'contain', background: BG })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: sizePx,
      height: sizePx,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 });
}

async function writePng(pipeline, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await pipeline.toFile(dest);
}

let sourcePath;

async function main() {
  sourcePath = await resolveSource();
  console.log(`Origen: ${path.relative(ROOT, sourcePath)}`);

  for (const [folder, px] of Object.entries(FOREGROUND_DP)) {
    const dir = path.join(RES, folder);
    await writePng(
      await renderAdaptiveForeground(px),
      path.join(dir, 'ic_launcher_foreground.png')
    );
    console.log(`  ${folder}/ic_launcher_foreground.png (${px}px, transparente)`);
  }

  for (const [folder, px] of Object.entries(LAUNCHER_DP)) {
    const dir = path.join(RES, folder);
    const pipeline = await renderLegacyLauncher(px);
    await writePng(pipeline, path.join(dir, 'ic_launcher.png'));
    await writePng(pipeline, path.join(dir, 'ic_launcher_round.png'));
    console.log(`  ${folder}/ic_launcher.png (${px}px)`);
  }

  const splashDir = path.join(RES, 'drawable-nodpi');
  // Icono transparente para Android 12+ (windowSplashScreenAnimatedIcon no admite layer-list).
  const splashIconSize = 512;
  const splashLogoSize = Math.round(splashIconSize * 0.62);
  const splashLogo = await sharp(sourcePath)
    .resize(splashLogoSize, splashLogoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await writePng(
    sharp({
      create: {
        width: splashIconSize,
        height: splashIconSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: splashLogo, gravity: 'center' }])
      .png({ compressionLevel: 9 }),
    path.join(splashDir, 'vivord_splash_icon.png')
  );
  console.log('  drawable-nodpi/vivord_splash_icon.png (512px, transparente)');

  await writePng(await renderLegacyLauncher(512, 0.78), path.join(splashDir, 'vivord_splash_logo.png'));
  console.log('  drawable-nodpi/vivord_splash_logo.png (512px)');

  console.log('\nListo. En Android Studio: Build → Clean Project → Run');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
