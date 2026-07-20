/**
 * Sincroniza www/ para app Android (radio-only).
 * El sitio web en la raíz y deploy Pages siguen usando sync-www.mjs completo.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APP_INDEX_HTML,
  patchAppWww,
} from './app-www-patch.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');

/** Sin canal/ ni index.html TV — home = radios.html + redirect en index. */
export const APP_COPY_PATHS = [
  '404.html',
  'radios.html',
  'sobre-vivord.html',
  'aviso-legal.html',
  'privacidad.html',
  'terminos.html',
  'contacto.html',
  'manifest.webmanifest',
  'assets',
  'data',
  'radio',
  'radios',
  'guias',
];

export async function syncWwwApp() {
  await fs.rm(WWW, { recursive: true, force: true });
  await fs.mkdir(WWW, { recursive: true });

  for (const rel of APP_COPY_PATHS) {
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

  await fs.writeFile(path.join(WWW, 'index.html'), APP_INDEX_HTML, 'utf8');
  console.log('  index.html (redirect → radios.html)');

  const patch = await patchAppWww(WWW);
  console.log(`\nParches app: ${patch.patched}/${patch.htmlFiles} HTML, search-index sin TV, JSON TV eliminados`);
  console.log(`www/ app listo → ${APP_COPY_PATHS.length + 1} entradas`);
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  console.log('Sincronizando www/ para app Android (radio-only)…\n');
  syncWwwApp().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
