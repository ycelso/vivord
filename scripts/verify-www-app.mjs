/**
 * Validación técnica del bundle www/ app radio-only.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TV_DATA_FILES } from './app-www-patch.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');

let failed = 0;

function fail(msg) {
  console.error(`  ✗ ${msg}`);
  failed++;
}

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function countFiles(dir) {
  let n = 0;
  async function walk(d) {
    for (const ent of await fs.readdir(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) await walk(p);
      else n++;
    }
  }
  await walk(dir);
  return n;
}

async function main() {
  console.log('Verificando www/ app radio-only…\n');

  if (!(await exists(WWW))) {
    fail('No existe carpeta www/ — ejecuta npm run www:sync:app');
    process.exit(1);
  }

  if (await exists(path.join(WWW, 'canal'))) {
    fail('www/canal/ no debe existir');
  } else {
    ok('Sin www/canal/');
  }

  const index = await fs.readFile(path.join(WWW, 'index.html'), 'utf8');
  if (!index.includes('radios.html')) fail('index.html no redirige a radios.html');
  else ok('index.html → radios.html');

  if (!(await exists(path.join(WWW, 'radios.html')))) fail('Falta radios.html');
  else ok('radios.html presente');

  const radioCount = await countFiles(path.join(WWW, 'radio'));
  if (radioCount < 300) fail(`Pocas páginas radio (${radioCount})`);
  else ok(`${radioCount} páginas en www/radio/`);

  for (const f of TV_DATA_FILES) {
    if (await exists(path.join(WWW, 'data', f))) fail(`JSON TV presente: data/${f}`);
  }
  ok('Sin JSON TV en www/data/');

  const searchIdx = JSON.parse(await fs.readFile(path.join(WWW, 'data', 'search-index.json'), 'utf8'));
  if (searchIdx.channels?.length) fail(`search-index aún tiene ${searchIdx.channels.length} canales`);
  else ok(`search-index solo radios (${searchIdx.stations?.length ?? 0} emisoras)`);

  const radiosHtml = await fs.readFile(path.join(WWW, 'radios.html'), 'utf8');
  if (/>TV en Vivo</i.test(radiosHtml)) fail('radios.html aún tiene enlace nav TV en Vivo');
  else ok('Nav sin TV en radios.html');

  if (!radiosHtml.includes('vivord-app-mode')) fail('Falta meta vivord-app-mode');
  else ok('Meta vivord-app-mode en radios.html');

  if (radiosHtml.includes('href="./index.html" class="brand"')) {
    fail('Brand aún apunta a index.html TV');
  } else ok('Brand apunta a radios.html');

  const sampleRadio = await fs.readdir(path.join(WWW, 'radio')).then((f) => f[0]);
  if (sampleRadio) {
    const sample = await fs.readFile(path.join(WWW, 'radio', sampleRadio), 'utf8');
    if (/>TV en Vivo</i.test(sample)) fail(`Ficha radio ${sampleRadio} aún tiene nav TV`);
    else ok(`Nav OK en muestra radio/${sampleRadio}`);
  }

  const cap = JSON.parse(await fs.readFile(path.join(ROOT, 'capacitor.config.json'), 'utf8'));
  const nav = cap.server?.allowNavigation || [];
  if (nav.some((h) => /dailymotion|dmcdn/i.test(h))) {
    fail('capacitor.config.json aún lista Dailymotion');
  } else ok('capacitor.config sin dominios Dailymotion TV');

  console.log(failed ? `\n${failed} error(es)` : '\nTodas las comprobaciones OK');
  process.exit(failed ? 1 : 0);
}

main();
