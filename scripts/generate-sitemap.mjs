import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_URL } from './site-config.mjs';
import { GUIDES } from './guias-build.mjs';
import { loadHealthIndex, isHealthy } from './stream-health-index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function urlEntry(loc, { changefreq = 'weekly', priority = '0.6' } = {}) {
  const lastmod = new Date().toISOString().slice(0, 10);
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function readJson(rel) {
  return JSON.parse(await fs.readFile(path.join(ROOT, rel), 'utf8'));
}

export async function generateSitemap() {
  loadHealthIndex();
  const base = SITE_URL.replace(/\/$/, '');
  const entries = [
    urlEntry(`${base}/`, { changefreq: 'daily', priority: '1.0' }),
    urlEntry(`${base}/radios.html`, { changefreq: 'daily', priority: '0.9' }),
    urlEntry(`${base}/sobre-vivord.html`, { changefreq: 'monthly', priority: '0.5' }),
    urlEntry(`${base}/aviso-legal.html`, { changefreq: 'yearly', priority: '0.3' }),
    urlEntry(`${base}/privacidad.html`, { changefreq: 'yearly', priority: '0.3' }),
    urlEntry(`${base}/terminos.html`, { changefreq: 'yearly', priority: '0.3' }),
    urlEntry(`${base}/contacto.html`, { changefreq: 'yearly', priority: '0.4' }),
    urlEntry(`${base}/guias/`, { changefreq: 'weekly', priority: '0.7' }),
  ];

  for (const g of GUIDES) {
    entries.push(
      urlEntry(`${base}/guias/${g.slug}.html`, { changefreq: 'monthly', priority: '0.65' })
    );
  }

  let channels = [];
  let radios = [];
  try {
    const ch = await readJson('data/channels.json');
    channels = ch.channels || [];
  } catch {
    /* empty */
  }
  try {
    const rd = await readJson('data/radios.json');
    radios = rd.radios || rd.stations || [];
  } catch {
    try {
      const all = await readJson('data/radios-all.json');
      radios = (all.radios || []).map((r) => ({ slug: r.slug, url: `radio/${r.slug}.html` }));
    } catch {
      /* empty */
    }
  }

  for (const c of channels) {
    if (!isHealthy(c.slug, 'tv', c)) continue;
    const pathPart = c.url || `canal/${c.slug}.html`;
    entries.push(urlEntry(`${base}/${pathPart}`, { priority: c.featured ? '0.8' : '0.6' }));
  }

  for (const r of radios) {
    if (!isHealthy(r.slug, 'radio', r)) continue;
    const pathPart = r.url || `radio/${r.slug}.html`;
    entries.push(urlEntry(`${base}/${pathPart}`, { priority: '0.5' }));
  }

  try {
    const hubData = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'radio-hubs.json'), 'utf8'));
    for (const h of [...(hubData.cityHubs || []), ...(hubData.genreHubs || [])]) {
      if (!h.indexable) continue;
      entries.push(
        urlEntry(`${base}${h.pathname}`, { changefreq: 'weekly', priority: '0.55' })
      );
    }
    entries.push(
      urlEntry(`${base}/radios/index.html`, { changefreq: 'weekly', priority: '0.6' })
    );
  } catch {
    /* hubs aún no generados */
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  const robots = `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`;

  await fs.writeFile(path.join(ROOT, 'sitemap.xml'), sitemap);
  await fs.writeFile(path.join(ROOT, 'robots.txt'), robots);

  console.log(`Sitemap: ${entries.length} URLs → sitemap.xml`);
  console.log(`robots.txt → Sitemap: ${base}/sitemap.xml`);
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  generateSitemap().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
