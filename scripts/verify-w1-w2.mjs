import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadHealthIndex, isHealthy, getFailedEntryCount } from './stream-health-index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

function listHtml(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter((f) => f.endsWith('.html'));
}

function robotsMeta(html) {
  const m = html.match(/<meta name="robots" content="([^"]+)"/i);
  return m?.[1] || null;
}

loadHealthIndex();

const channels = readJson('data/channels.json').channels || [];
const radios = (readJson('data/radios.json').radios || []);

let noindexTv = 0;
let noindexRadio = 0;
let indexTv = 0;
let indexRadio = 0;
const noindexSlugs = [];

for (const c of channels) {
  const file = path.join(ROOT, 'canal', `${c.slug}.html`);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const robots = robotsMeta(html);
  const failed = !isHealthy(c.slug, 'tv', c);
  if (robots?.includes('noindex')) {
    noindexTv++;
    noindexSlugs.push(`tv:${c.slug}`);
  } else if (robots?.includes('index')) indexTv++;
  if (failed !== robots?.includes('noindex')) {
    console.warn('MISMATCH tv', c.slug, { failed, robots });
  }
}

for (const r of radios) {
  const file = path.join(ROOT, 'radio', `${r.slug}.html`);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const robots = robotsMeta(html);
  const failed = !isHealthy(r.slug, 'radio', r);
  if (robots?.includes('noindex')) {
    noindexRadio++;
    noindexSlugs.push(`radio:${r.slug}`);
  } else if (robots?.includes('index')) indexRadio++;
  if (failed !== robots?.includes('noindex')) {
    console.warn('MISMATCH radio', r.slug, { failed, robots });
  }
}

const publishedFailed = [
  ...channels.filter((c) => !isHealthy(c.slug, 'tv', c)).map((c) => `tv:${c.slug}`),
  ...radios.filter((r) => !isHealthy(r.slug, 'radio', r)).map((r) => `radio:${r.slug}`),
];

const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const locCount = (sitemap.match(/<loc>/g) || []).length;
const unhealthyInSitemap = [
  ...channels.filter((c) => {
    if (isHealthy(c.slug, 'tv', c)) return false;
    const pathPart = c.url || `canal/${c.slug}.html`;
    return sitemap.includes(pathPart);
  }),
  ...radios.filter((r) => {
    if (isHealthy(r.slug, 'radio', r)) return false;
    const pathPart = r.url || `radio/${r.slug}.html`;
    return sitemap.includes(pathPart);
  }),
];

const sobre = fs.readFileSync(path.join(ROOT, 'sobre-vivord.html'), 'utf8');
const sobreWords = sobre
  .replace(/<[^>]+>/g, ' ')
  .split(/\s+/)
  .filter(Boolean).length;

console.log('=== W1 ===');
console.log('stream-health failed:', readJson('data/stream-health.json').failed.length);
console.log('health union entries:', getFailedEntryCount());
console.log('published fichas noindex (tv):', noindexTv);
console.log('published fichas noindex (radio):', noindexRadio);
console.log('published fichas noindex (total):', noindexTv + noindexRadio);
console.log('published failed expected:', publishedFailed.length);
console.log('published fichas index (tv):', indexTv);
console.log('published fichas index (radio):', indexRadio);
console.log('unhealthy slugs still in sitemap:', unhealthyInSitemap.length);
console.log('sitemap <loc> count:', locCount);

console.log('\n=== W2 ===');
console.log('sobre-vivord palabras:', sobreWords);
console.log('sobre-vivord en sitemap:', sitemap.includes('sobre-vivord.html'));
console.log('z101 in sitemap:', sitemap.includes('/radio/z101.html'));
console.log('cdn in sitemap:', sitemap.includes('/radio/cdn.html'));
console.log('z101 robots:', robotsMeta(fs.readFileSync(path.join(ROOT, 'radio/z101.html'), 'utf8')));
