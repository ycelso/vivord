import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const cityDir = path.join(ROOT, 'radios', 'ciudad');
const genreDir = path.join(ROOT, 'radios', 'genero');

const city = fs.readdirSync(cityDir).filter((f) => f.endsWith('.html'));
const genre = fs.readdirSync(genreDir).filter((f) => f.endsWith('.html'));
console.log('hubs ciudad:', city.length, 'genero:', genre.length, 'total:', city.length + genre.length);

let min = 1e9;
let bad = 0;
for (const dir of ['radios/ciudad', 'radios/genero']) {
  for (const f of fs.readdirSync(path.join(ROOT, dir)).filter((x) => x.endsWith('.html'))) {
    const t = fs.readFileSync(path.join(ROOT, dir, f), 'utf8');
    const m = t.match(/<div class="hub-intro[^"]*">([\s\S]*?)<\/div>/);
    const inner = m ? m[1] : '';
    const w = inner
      .replace(/<[^>]+>/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    if (w < 180) bad++;
    min = Math.min(min, w);
  }
}
console.log('hubs con intro <180:', bad, 'min intro:', min);

const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
console.log('hubs en sitemap:', (sitemap.match(/radios\/(ciudad|genero)\//g) || []).length);
