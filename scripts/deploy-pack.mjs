import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncWww } from './sync-www.mjs';
import { generateSitemap } from './generate-sitemap.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist', 'vivord-pages');

/** Sin 404.html, Pages asume SPA y devuelve index.html para /assets/* (rompe CSS). */
const EXTRA = ['404.html', 'robots.txt', 'sitemap.xml', 'manifest.webmanifest', '_redirects', 'ads.txt', 'app-ads.txt'];

/** Direct Upload: API vía _worker.js (modo avanzado), no /functions. */
async function buildPagesWorker(outDir) {
  const workerOut = path.join(ROOT, 'dist', '.pages-worker-build');
  await fs.rm(workerOut, { recursive: true, force: true });
  const entry = path.join(ROOT, 'cloudflare', 'pages-worker.mjs');
  const { execSync } = await import('node:child_process');
  execSync(
    `npx esbuild "${entry}" --bundle --format=esm --platform=browser --target=es2022 --outfile="${path.join(workerOut, '_worker.js')}"`,
    { stdio: 'inherit', cwd: ROOT }
  );
  await fs.copyFile(path.join(workerOut, '_worker.js'), path.join(outDir, '_worker.js'));
  console.log('  + _worker.js (API /api/* + estáticos)');
}

export async function packPagesDeploy() {
  console.log('Empaquetando sitio para Cloudflare Pages…\n');

  await generateSitemap();
  await syncWww();

  await fs.rm(OUT, { recursive: true, force: true });
  await fs.cp(path.join(ROOT, 'www'), OUT, { recursive: true });

  for (const file of EXTRA) {
    try {
      await fs.copyFile(path.join(ROOT, file), path.join(OUT, file));
      console.log(`  + ${file}`);
    } catch {
      console.warn(`  (sin ${file} — ejecuta npm run deploy:prep)`);
    }
  }

  await buildPagesWorker(OUT);

  const zipPath = path.join(ROOT, 'dist', 'vivord-pages.zip');
  await fs.mkdir(path.dirname(zipPath), { recursive: true });

  if (process.platform === 'win32') {
    const { execSync } = await import('node:child_process');
    await fs.rm(zipPath, { force: true }).catch(() => {});
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${OUT}\\*' -DestinationPath '${zipPath}' -Force"`,
      { stdio: 'inherit' }
    );
  } else {
    const { execSync } = await import('node:child_process');
    execSync(`cd "${OUT}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });
  }

  console.log(`\nListo para Cloudflare Pages:`);
  console.log(`  Carpeta (RECOMENDADO subir esto): ${OUT}`);
  console.log(`  ZIP (solo si la UI pide carpeta comprimida): ${zipPath}`);
  console.log(`\nIMPORTANTE — en el navegador de archivos:`);
  console.log(`  1. Abre la carpeta dist\\vivord-pages`);
  console.log(`  2. Ctrl+A (seleccionar TODO lo de DENTRO: index.html, assets, canal, radio…)`);
  console.log(`  3. Arrastra esos archivos a Cloudflare (NO arrastres vivord-pages.zip)`);
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  packPagesDeploy().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
