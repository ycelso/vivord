import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteHeader } from './site-header.mjs';
import { siteFooter } from './site-footer.mjs';
import { seoHead } from './seo-head.mjs';
import { SITE_NAME } from './site-config.mjs';
import { escapeHtml } from './description-format.mjs';
import { assertAllValidInternalLinks } from './validate-internal-links.mjs';
import { RAW_GUIDES } from './guias-content.mjs';
import { affiliateBanner } from './affiliate.mjs';
import { enrichGuide, countBodyWords } from './guias-wordcount.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'guias');

const UPDATED = '2026-06-02';
const MIN_GUIDE_WORDS = 700;

const GUIDES = RAW_GUIDES.map(enrichGuide);

function scriptsBlock(depth) {
  const p = depth ? '../'.repeat(depth) : './';
  return `<script>window.BASE_URL = '${p}';</script>
<script src="${p}assets/js/api-config.js"></script>
<script src="${p}assets/js/mobile.js" defer></script>
<script src="${p}assets/js/capacitor-native.js" defer></script>`;
}

function guidePageHtml(guide, depth = 1) {
  const p = depth ? '../'.repeat(depth) : './';
  const pathname = `/guias/${guide.slug}.html`;
  return `${seoHead({
    title: `${guide.title} · ${SITE_NAME}`,
    description: guide.description,
    depth,
    pathname,
    ogType: 'article',
  })}
${siteHeader('tv', depth, 'Buscar canal o radio…')}
<main class="site-main container guia-page" id="main-content">
  <a href="${p}guias/" class="back-link">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
    Todas las guías
  </a>
  <article class="guia-article">
    <header class="guia-article__head">
      <p class="guia-article__eyebrow">Guía · ${guide.readMin} min de lectura</p>
      <h1>${escapeHtml(guide.title)}</h1>
      <p class="guia-article__lead">${escapeHtml(guide.description)}</p>
      <p class="guia-article__updated">Actualizado: ${UPDATED}</p>
    </header>
    <div class="guia-article__body description-content">
      ${guide.body.trim()}
    </div>
  </article>
  ${affiliateBanner()}
</main>
${siteFooter(depth)}
${scriptsBlock(depth)}
</body>
</html>`;
}

function indexHtml() {
  const cards = GUIDES.map(
    (g) => `<a href="${g.slug}.html" class="guia-card">
  <h2 class="guia-card__title">${escapeHtml(g.title)}</h2>
  <p class="guia-card__excerpt">${escapeHtml(g.description)}</p>
  <span class="guia-card__meta">${g.readMin} min de lectura</span>
</a>`
  ).join('\n');

  const body = `${seoHead({
    title: `Guías de TV y radio dominicana · ${SITE_NAME}`,
    description:
      'Artículos y guías sobre cómo escuchar radio y ver televisión de República Dominicana en vivo: consejos, emisoras y canales recomendados.',
    depth: 1,
    pathname: '/guias/',
    ogType: 'website',
  })}
${siteHeader('tv', 1, 'Buscar canal o radio…')}
<main class="site-main container guias-index" id="main-content">
  <a href="../index.html" class="back-link">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
    Inicio
  </a>
  <header class="guias-index__head">
    <h1>Guías</h1>
    <p class="guias-index__lead">Recursos editoriales sobre TV y radio dominicana: cómo escuchar en vivo, emisoras recomendadas y canales de noticias. Contenido redactado por el equipo de ${SITE_NAME}.</p>
  </header>
  <div class="guia-grid">
${cards}
  </div>
</main>
${siteFooter(1)}
${scriptsBlock(1)}
</body>
</html>`;

  return body;
}

export function buildGuiasTeaserHtml() {
  const featured = GUIDES.slice(0, 3);
  const cards = featured
    .map(
      (g) => `<a href="./guias/${g.slug}.html" class="guia-card guia-card--compact">
  <h3 class="guia-card__title">${escapeHtml(g.title)}</h3>
  <span class="guia-card__meta">${g.readMin} min</span>
</a>`
    )
    .join('\n');

  return `<section class="section container section-guias-teaser">
  <div class="section-head">
    <div>
      <h2 class="section-title">Guías</h2>
      <p class="section-sub">Artículos sobre TV y radio dominicana</p>
    </div>
    <a href="./guias/" class="section-head__link">Ver todas</a>
  </div>
  <div class="guia-grid guia-grid--teaser">
${cards}
  </div>
</section>`;
}

export async function generateGuias() {
  // Asegura OG + favicons antes de validar/enlazar páginas
  try {
    const { ensureSeoAssets } = await import('./seo-head.mjs');
    await ensureSeoAssets();
  } catch {
    /* ignore */
  }
  await fs.mkdir(OUT_DIR, { recursive: true });

  for (const g of GUIDES) {
    const words = countBodyWords(g.body);
    if (words < MIN_GUIDE_WORDS) {
      console.warn(`  AVISO: ${g.slug} tiene ${words} palabras (mínimo ${MIN_GUIDE_WORDS})`);
    }
  }

  const index = indexHtml();
  const pages = [{ html: index, pageRelPath: 'guias/index.html', outName: 'index.html' }];

  for (const guide of GUIDES) {
    pages.push({
      html: guidePageHtml(guide),
      pageRelPath: `guias/${guide.slug}.html`,
      outName: `${guide.slug}.html`,
    });
  }

  await assertAllValidInternalLinks(
    pages.map(({ html, pageRelPath }) => ({ html, pageRelPath })),
    ROOT
  );

  for (const { html, outName } of pages) {
    await fs.writeFile(path.join(OUT_DIR, outName), html);
  }

  const stats = GUIDES.map((g) => `${g.slug}: ${countBodyWords(g.body)} palabras, ${g.readMin} min`);
  console.log(`Guías: ${GUIDES.length} artículos + índice → guias/ (enlaces validados)`);
  for (const line of stats) console.log(`  ${line}`);
  return GUIDES;
}

export { GUIDES };

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  generateGuias().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
