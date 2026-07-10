import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAllowlist } from './generate-allowlist.mjs';
import { generateSitemap } from './generate-sitemap.mjs';
import { generateLegalPages } from './legal-pages.mjs';
import { generateAdsTxt, generateAppAdsTxt, isAdsenseEnabled } from './adsense.mjs';
import { generateGuias } from './guias-build.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

console.log('Preparación de despliegue VivoRD\n');

await generateAllowlist();
await generateGuias();
await generateSitemap();
await generateLegalPages();

const adsTxt = generateAdsTxt();
await fs.writeFile(path.join(ROOT, 'ads.txt'), adsTxt);
const appAdsTxt = generateAppAdsTxt();
await fs.writeFile(path.join(ROOT, 'app-ads.txt'), appAdsTxt);
console.log(isAdsenseEnabled() ? 'ads.txt → AdSense configurado' : 'ads.txt → AdSense desactivado');
console.log(appAdsTxt.startsWith('#') ? 'app-ads.txt → plantilla (falta ADMOB_PUBLISHER_ID)' : 'app-ads.txt → AdMob configurado');

console.log('\nListo. Sube el proyecto a Cloudflare Pages y despliega el Worker en cloudflare/.');
