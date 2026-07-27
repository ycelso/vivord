import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteHeader } from './site-header.mjs';
import { siteFooter } from './site-footer.mjs';
import { seoHead } from './seo-head.mjs';
import { SITE_NAME } from './site-config.mjs';
import { escapeHtml } from './description-format.mjs';
import { resolveImg } from './image-paths.mjs';
import { assertAllValidInternalLinks } from './validate-internal-links.mjs';
import { isHealthy, loadHealthIndex } from './stream-health-index.mjs';
import { plainText } from './station-facts.mjs';
import {
  RADIO_GENRES,
  detectRadioGenres,
  hubSlug,
  cityDisplayLabel,
} from './radio-genre.mjs';
import { getCityIntro, getGenreIntro } from './hubs-content.mjs';
import { buildHubGuideLinksHtml } from './guide-links.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CITY_DIR = path.join(ROOT, 'radios', 'ciudad');
const GENRE_DIR = path.join(ROOT, 'radios', 'genero');
const INDEX_DIR = path.join(ROOT, 'radios');

const MIN_STATIONS = 5;
const MIN_INTRO_WORDS = 180;
const HUB_PAGE_DEPTH = 2;
const HUB_INDEX_DEPTH = 1;

function scriptsBlock(depth) {
  const p = '../'.repeat(depth);
  return `<script>window.BASE_URL = '${p}';</script>
<script src="${p}assets/js/api-config.js"></script>
<script src="${p}assets/js/mobile.js" defer></script>
<script src="${p}assets/js/capacitor-native.js" defer></script>`;
}

function countIntroWords(introHtml) {
  return plainText(introHtml).split(/\s+/).filter(Boolean).length;
}

function hubRadioCard(r, showCity) {
  const p = '../'.repeat(HUB_PAGE_DEPTH);
  const img = resolveImg(r.img, r.slug, 'radios', HUB_PAGE_DEPTH);
  const city = showCity && r.city ? `<span class="radio-card__city">${escapeHtml(r.city)}</span>` : '';
  return `<a href="${p}radio/${r.slug}.html" class="radio-card" data-name="${escapeHtml(r.name.toLowerCase())}">
  <div class="radio-card__img"><img src="${img}" alt="${escapeHtml(r.name)}" loading="lazy" width="96" height="96" referrerpolicy="no-referrer"></div>
  <span class="radio-card__name">${escapeHtml(r.name)}</span>
  ${city}
</a>`;
}

function buildHubPage({
  kind,
  slug,
  title,
  metaDescription,
  introHtml,
  stations,
  indexable,
  pathname,
}) {
  const p = '../'.repeat(HUB_PAGE_DEPTH);
  const sorted = [...stations].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const showCity = kind !== 'ciudad';
  const grid = sorted.map((r) => hubRadioCard(r, showCity)).join('\n');
  const guides = buildHubGuideLinksHtml(kind, slug, HUB_PAGE_DEPTH);
  const countLabel =
    sorted.length === 1 ? '1 emisora' : `${sorted.length} emisoras`;

  return `${seoHead({
    title: `${title} · ${SITE_NAME}`,
    description: metaDescription,
    depth: HUB_PAGE_DEPTH,
    pathname,
    ogType: 'website',
    robots: indexable ? 'index, follow' : 'noindex, follow',
  })}
${siteHeader('radios', HUB_PAGE_DEPTH, 'Buscar canal o radio…')}
<main class="site-main container hub-page" id="main-content">
  <a href="${p}radios.html" class="back-link">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
    Todas las radios
  </a>
  <header class="hub-page__head">
    <p class="hub-page__eyebrow">${kind === 'ciudad' ? 'Hub · Ciudad' : 'Hub · Género'}</p>
    <h1>${escapeHtml(title)}</h1>
    <p class="hub-page__count">${countLabel} en vivo en VivoRD</p>
  </header>
  <div class="hub-intro description-content">
    ${introHtml}
  </div>
  <section class="hub-stations" aria-label="Emisoras del listado">
    <h2 class="hub-stations__title">Emisoras</h2>
    <div class="radio-grid hub-stations__grid">
${grid}
    </div>
  </section>
  ${guides}
  <p class="hub-page__index-link"><a href="${p}radios/index.html">Ver todos los hubs por ciudad y género</a></p>
</main>
${siteFooter(HUB_PAGE_DEPTH)}
${scriptsBlock(HUB_PAGE_DEPTH)}
</body>
</html>`;
}

function buildHubIndex(cityHubs, genreHubs) {
  const p = '../'.repeat(HUB_INDEX_DEPTH);
  const cityCards = cityHubs
    .map(
      (h) => `<a href="./ciudad/${h.slug}.html" class="guia-card guia-card--compact">
  <h2 class="guia-card__title">${escapeHtml(h.title)}</h2>
  <span class="guia-card__meta">${h.stationCount} emisoras</span>
</a>`
    )
    .join('\n');
  const genreCards = genreHubs
    .map(
      (h) => `<a href="./genero/${h.slug}.html" class="guia-card guia-card--compact">
  <h2 class="guia-card__title">${escapeHtml(h.title)}</h2>
  <span class="guia-card__meta">${h.stationCount} emisoras</span>
</a>`
    )
    .join('\n');

  return `${seoHead({
    title: `Explorar radios por ciudad y género · ${SITE_NAME}`,
    description:
      'Directorio de hubs de radio dominicana en VivoRD: emisoras agrupadas por ciudad y por género musical o formativo, con reproductor en cada ficha.',
    depth: HUB_INDEX_DEPTH,
    pathname: '/radios/index.html',
    ogType: 'website',
  })}
${siteHeader('radios', HUB_INDEX_DEPTH, 'Buscar canal o radio…')}
<main class="site-main container hub-index" id="main-content">
  <a href="${p}radios.html" class="back-link">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
    Todas las radios
  </a>
  <header class="hub-index__head">
    <h1>Explorar radios</h1>
    <p class="hub-index__lead">Páginas editoriales que agrupan emisoras dominicanas por ciudad declarada en nuestro catálogo o por género detectado en nombre y descripción. Solo listamos streams verificados.</p>
  </header>
  <section class="hub-index__section">
    <h2 class="section-title">Por ciudad</h2>
    <div class="guia-grid guia-grid--teaser">
${cityCards}
    </div>
  </section>
  <section class="hub-index__section">
    <h2 class="section-title">Por género</h2>
    <div class="guia-grid guia-grid--teaser">
${genreCards}
    </div>
  </section>
</main>
${siteFooter(HUB_INDEX_DEPTH)}
${scriptsBlock(HUB_INDEX_DEPTH)}
</body>
</html>`;
}

export function buildHubsTeaserHtml(cityHubs, genreHubs) {
  const topCities = cityHubs.slice(0, 6);
  const topGenres = genreHubs.slice(0, 4);
  const cityLinks = topCities
    .map(
      (h) =>
        `<a href="./radios/ciudad/${h.slug}.html" class="hub-teaser__chip">${escapeHtml(h.shortLabel || h.title)}</a>`
    )
    .join('\n');
  const genreLinks = topGenres
    .map(
      (h) =>
        `<a href="./radios/genero/${h.slug}.html" class="hub-teaser__chip">${escapeHtml(h.shortLabel || h.title)}</a>`
    )
    .join('\n');

  return `<section class="section container section-hubs-teaser">
  <div class="section-head">
    <div>
      <h2 class="section-title">Explora por ciudad y género</h2>
      <p class="section-sub">Páginas editoriales con listados de emisoras verificadas</p>
    </div>
    <a href="./radios/index.html" class="section-head__link">Ver todos los hubs</a>
  </div>
  <div class="hub-teaser">
    <p class="hub-teaser__label">Ciudades</p>
    <div class="hub-teaser__chips">${cityLinks}</div>
    <p class="hub-teaser__label">Géneros</p>
    <div class="hub-teaser__chips">${genreLinks}</div>
  </div>
</section>`;
}

function groupHealthyByCity(radios) {
  const healthy = radios.filter((r) => isHealthy(r.slug, 'radio', r));
  const map = new Map();
  for (const r of healthy) {
    const city = String(r.city || '').trim();
    if (!city) continue;
    if (!map.has(city)) map.set(city, []);
    map.get(city).push(r);
  }
  return map;
}

function groupHealthyByGenre(radios) {
  const healthy = radios.filter((r) => isHealthy(r.slug, 'radio', r));
  const map = new Map(RADIO_GENRES.map((g) => [g.slug, []]));
  for (const r of healthy) {
    for (const slug of detectRadioGenres(r)) {
      map.get(slug)?.push(r);
    }
  }
  return map;
}

export function buildHubCatalog(radios) {
  loadHealthIndex();

  const cityMap = groupHealthyByCity(radios);
  const genreMap = groupHealthyByGenre(radios);

  const cityHubs = [];
  const genreHubs = [];
  const pages = [];

  for (const [cityName, stations] of cityMap) {
    if (stations.length < MIN_STATIONS) continue;
    const slug = hubSlug(cityName);
    const introHtml = getCityIntro(slug);
    if (!introHtml) {
      console.warn(`  AVISO hub ciudad sin intro: ${cityName} (${slug})`);
      continue;
    }
    const label = cityDisplayLabel(cityName);
    const title = `Radios en ${label}`;
    const metaDescription = `Emisoras de radio en ${label}, República Dominicana: escucha en vivo online las fichas verificadas de VivoRD.`;
    const pathname = `/radios/ciudad/${slug}.html`;
    const html = buildHubPage({
      kind: 'ciudad',
      slug,
      title,
      metaDescription,
      introHtml,
      stations,
      indexable: stations.length >= MIN_STATIONS,
      pathname,
    });
    const words = countIntroWords(introHtml);
    if (words < MIN_INTRO_WORDS) {
      console.warn(`  AVISO intro corta (${words}w): ciudad ${slug}`);
    }
    cityHubs.push({
      kind: 'ciudad',
      slug,
      title,
      shortLabel: label,
      stationCount: stations.length,
      pathname,
      indexable: stations.length >= MIN_STATIONS,
      introWords: words,
    });
    pages.push({ html, pageRelPath: `radios/ciudad/${slug}.html`, outPath: path.join(CITY_DIR, `${slug}.html`) });
  }

  for (const genre of RADIO_GENRES) {
    const stations = genreMap.get(genre.slug) || [];
    if (stations.length < MIN_STATIONS) continue;
    const introHtml = getGenreIntro(genre.slug);
    if (!introHtml) {
      console.warn(`  AVISO hub género sin intro: ${genre.slug}`);
      continue;
    }
    const title = `Radios de ${genre.label.toLowerCase()}`;
    const metaDescription = `Emisoras dominicanas de ${genre.label.toLowerCase()}: listado verificado con enlace para escuchar en vivo en VivoRD.`;
    const pathname = `/radios/genero/${genre.slug}.html`;
    const html = buildHubPage({
      kind: 'genero',
      slug: genre.slug,
      title,
      metaDescription,
      introHtml,
      stations,
      indexable: stations.length >= MIN_STATIONS,
      pathname,
    });
    const words = countIntroWords(introHtml);
    if (words < MIN_INTRO_WORDS) {
      console.warn(`  AVISO intro corta (${words}w): genero ${genre.slug}`);
    }
    genreHubs.push({
      kind: 'genero',
      slug: genre.slug,
      title,
      shortLabel: genre.label,
      stationCount: stations.length,
      pathname,
      indexable: stations.length >= MIN_STATIONS,
      introWords: words,
    });
    pages.push({
      html,
      pageRelPath: `radios/genero/${genre.slug}.html`,
      outPath: path.join(GENRE_DIR, `${genre.slug}.html`),
    });
  }

  cityHubs.sort((a, b) => b.stationCount - a.stationCount);
  genreHubs.sort((a, b) => b.stationCount - a.stationCount);

  const indexHtml = buildHubIndex(cityHubs, genreHubs);
  pages.push({
    html: indexHtml,
    pageRelPath: 'radios/index.html',
    outPath: path.join(INDEX_DIR, 'index.html'),
  });

  const manifest = {
    updatedAt: new Date().toISOString(),
    cityHubs,
    genreHubs,
    total: cityHubs.length + genreHubs.length,
  };

  return {
    cityHubs,
    genreHubs,
    pages,
    manifest,
    teaserHtml: buildHubsTeaserHtml(cityHubs, genreHubs),
  };
}

export async function writeHubPages(pages, manifest) {
  await fs.rm(CITY_DIR, { recursive: true, force: true });
  await fs.rm(GENRE_DIR, { recursive: true, force: true });
  await fs.mkdir(CITY_DIR, { recursive: true });
  await fs.mkdir(GENRE_DIR, { recursive: true });

  for (const { html, outPath } of pages) {
    await fs.writeFile(outPath, html);
  }

  await fs.writeFile(path.join(ROOT, 'data', 'radio-hubs.json'), JSON.stringify(manifest, null, 2));
}

export async function generateHubs(radios) {
  const result = buildHubCatalog(radios);

  await assertAllValidInternalLinks(
    result.pages.map(({ html, pageRelPath }) => ({ html, pageRelPath })),
    ROOT
  );

  await writeHubPages(result.pages, result.manifest);

  console.log(
    `Hubs: ${result.cityHubs.length} ciudades + ${result.genreHubs.length} géneros + índice → radios/ (enlaces validados)`
  );
  for (const h of result.cityHubs) {
    console.log(`  ciudad/${h.slug}.html — ${h.stationCount} emisoras, intro ${h.introWords}w`);
  }
  for (const h of result.genreHubs) {
    console.log(`  genero/${h.slug}.html — ${h.stationCount} emisoras, intro ${h.introWords}w`);
  }

  return result;
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const radios = JSON.parse(
    await fs.readFile(path.join(ROOT, 'data', 'radios.json'), 'utf8')
  ).radios;
  generateHubs(radios).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
