import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');

/** Contenido web completo (deploy Pages). Android app usa sync-www-app.mjs (radio-only). */
export const COPY_PATHS = [
  '404.html',
  'index.html',
  'radios.html',
  'sobre-vivord.html',
  'aviso-legal.html',
  'privacidad.html',
  'terminos.html',
  'contacto.html',
  'manifest.webmanifest',
  'assets',
  'data',
  'canal',
  'radio',
  'radios',
  'guias',
];

export async function syncWww() {
  await fs.rm(WWW, { recursive: true, force: true });
  await fs.mkdir(WWW, { recursive: true });

  for (const rel of COPY_PATHS) {
    const src = path.join(ROOT, rel);
    const dest = path.join(WWW, rel);
    try {
      await fs.access(src);
    } catch {
      console.warn(`  Omitido (no existe): ${rel}`);
      continue;
    }
    await fs.cp(src, dest, { recursive: true });
    console.log(`  ${rel}`);
  }

  console.log(`\nwww/ listo → ${COPY_PATHS.length} entradas copiadas`);
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  console.log('Sincronizando www/ para Capacitor…');
  syncWww().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
