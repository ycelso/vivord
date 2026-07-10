import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { organizeRadios } from './radio-priority.mjs';
import { resolveImg, resolveRemoteImg } from './image-paths.mjs';
import { radioReferer } from './radio-referers.mjs';
import { siteHeader as header } from './site-header.mjs';
import { siteFooter } from './site-footer.mjs';
import {
  seoHead,
  radiosIndexJsonLd,
  radioPageJsonLd,
  canonicalUrl,
  absoluteAssetUrl,
  ensureSeoAssets,
} from './seo-head.mjs';
import { buildSeoDiscoverSection, toSeoLinkItems } from './seo-static-links.mjs';
import { generateSitemap } from './generate-sitemap.mjs';
import { generateLegalPages } from './legal-pages.mjs';
import { applyRadioStreamFixes } from './radio-stream-fixes.mjs';
import { adSlotMarkup } from './adsense.mjs';
import { affiliateBanner } from './affiliate.mjs';
import { formatDescription, escapeHtml } from './description-format.mjs';
import { buildStationMetaHtml } from './station-meta.mjs';
import { assertAllValidInternalLinks } from './validate-internal-links.mjs';
import { buildStationDescription } from './description-enrich.mjs';
import { buildGuideLinksHtml } from './guide-links.mjs';
import { buildHubCatalog, writeHubPages } from './hubs-build.mjs';
import { loadHealthIndex, isHealthy } from './stream-health-index.mjs';
import { wrapPlayerWithHealthNotice } from './stream-health-notice.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ORIGIN = 'https://canalesdominicanos.live/';
const BRAND = 'VivoRD';
const RADIO_CARD_RE =
  /<a href="https:\/\/canalesdominicanos\.live\/radio\/([^"]+)" class="channel-card radio">[\s\S]*?<img src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>[\s\S]*?<div class="channel-name">([^<]+)<\/div>/g;

function parseRadios(html) {
  const map = new Map();
  let m;
  RADIO_CARD_RE.lastIndex = 0;
  while ((m = RADIO_CARD_RE.exec(html))) {
    map.set(m[1], {
      slug: m[1],
      name: m[4].trim(),
      img: resolveRemoteImg(m[2]),
      stream: null,
      streamType: null,
      city: '',
      description: '',
    });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

async function loadRadioListHtml() {
  const local = path.join(ROOT, '_radio-source.html');
  try {
    return await fs.readFile(local, 'utf8');
  } catch {
    const res = await fetch(`${ORIGIN}radio`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VivoRD/1.0)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al descargar /radio`);
    const html = await res.text();
    await fs.writeFile(local, html);
    return html;
  }
}

async function fetchRadioStream(slug) {
  const url = `${ORIGIN}radio/${slug}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VivoRD/1.0)' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const source = html.match(/<source src="([^"]+)"(?:\s+type="([^"]+)")?/);
    const city = html.match(/<p style="margin-top: 5px; color: var\(--text-secondary\);">([^<]+)<\/p>/);
    const block = html.match(/<div class="description-content"[^>]*>([\s\S]*?)<\/div>\s*<!-- Contact/);
    const description = block ? block[1].trim() : '';

    return {
      stream: source?.[1] || null,
      streamType: source?.[2] || null,
      city: city?.[1]?.trim() || '',
      description,
    };
  } catch {
    return null;
  }
}

async function pool(items, limit, fn) {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
}

const footer = siteFooter;


function scriptsBlock(depth = 0, extra = '') {
  const p = depth ? '../'.repeat(depth) : './';
  const defer = ' defer';
  return `<script>window.BASE_URL = '${depth ? '../' : './'}';</script>
<script src="${p}assets/js/search.js"${defer}></script>
<script src="${p}assets/js/user-state.js"${defer}></script>
<script src="${p}assets/js/mobile.js"${defer}></script>
<script src="${p}assets/js/radio-mini-player.js"></script>
${extra}`;
}

function radioEntry(r) {
  return {
    slug: r.slug,
    name: r.name,
    img: resolveImg(r.img, r.slug, 'radios', 0),
    featured: Boolean(r.featured),
  };
}

async function saveHomeRadios(priority, rest, stats) {
  await fs.mkdir(path.join(ROOT, 'data'), { recursive: true });
  const featured = priority.filter((r) => r.featured);
  await fs.writeFile(
    path.join(ROOT, 'data', 'home-radios.json'),
    JSON.stringify({
      updatedAt: new Date().toISOString(),
      stats,
      featured: featured.map(radioEntry),
      priority: priority.map(radioEntry),
      catalog: rest.map(radioEntry),
    })
  );
}

function radioCard(r, depth = 0) {
  const img = resolveImg(r.img, r.slug, 'radios', depth);
  return `<a href="./radio/${r.slug}.html" class="radio-card" data-name="${escapeHtml(r.name.toLowerCase())}">
  <div class="radio-card__img"><img src="${img}" alt="${escapeHtml(r.name)}" loading="lazy" width="96" height="96" referrerpolicy="no-referrer"></div>
  <span class="radio-card__name">${escapeHtml(r.name)}</span>
</a>`;
}

function buildRadiosIndex(priority, rest, hubsTeaser = '') {
  const published = [...priority, ...rest];
  const total = published.length;
  const live = published.filter((r) => r.stream).length;
  const radiosDesc =
    'Escucha emisoras de radio de República Dominicana en directo. FM, AM y streaming online gratis en VivoRD.';
  return `${seoHead({
    title: `${BRAND} — Radios dominicanas en vivo`,
    description: radiosDesc,
    pathname: '/radios.html',
    jsonLd: radiosIndexJsonLd(radiosDesc),
  })}
${header('radios', 0, 'Buscar canal o radio…')}
<main class="site-main" id="main-content">
  <section class="hero container hero--radio">
    <div class="hero-badge"><span class="dot"></span> Radio en directo</div>
    <h1>Emisoras dominicanas, en tu navegador</h1>
    <p>Sintoniza cientos de radios nacionales y regionales desde cualquier dispositivo. Gratis y sin instalar nada.</p>
    <div class="hero-search nav-search">
      <svg class="nav-search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      <input type="search" id="heroRadioSearch" placeholder="¿Qué emisora quieres escuchar?" autocomplete="off">
    </div>
    <div class="hero-stats">
      <div class="hero-stat"><strong>${total}+</strong><span>Emisoras</span></div>
      <div class="hero-stat"><strong>${live}</strong><span>En vivo</span></div>
      <div class="hero-stat"><strong>24/7</strong><span>Sin cortes</span></div>
    </div>
  </section>

  <section class="section container" id="recentRadiosSection" hidden>
    <div class="section-head">
      <div>
        <h2 class="section-title">Recientes</h2>
        <p class="section-sub">Lo último que escuchaste</p>
      </div>
    </div>
    <div class="radio-grid" id="recentRadiosGrid"></div>
  </section>

  <section class="section container">
    <div class="section-head">
      <div>
        <h2 class="section-title">Destacadas</h2>
        <p class="section-sub">Las más escuchadas en República Dominicana</p>
      </div>
    </div>
    <div class="radio-featured" aria-busy="true"></div>
  </section>

  ${hubsTeaser}

  ${adSlotMarkup(0)}
  ${affiliateBanner()}

  <section class="section container" id="emisoras-principales">
    <div class="section-head">
      <div>
        <h2 class="section-title">Emisoras principales</h2>
        <p class="section-sub">Ordenadas por popularidad e influencia nacional</p>
      </div>
    </div>
    <div class="radio-grid radio-grid--priority" id="priorityRadios" aria-busy="true"></div>
  </section>

  <section class="section container" id="radios-secundarias">
    <div class="section-head">
      <div>
        <h2 class="section-title">Radios secundarias</h2>
        <p class="section-sub">Catálogo extendido — <span id="radioCatalogShownCount">cargando…</span></p>
      </div>
      <input type="search" class="filter-input" id="radioFilter" placeholder="Filtrar secundarias…" autocomplete="off">
    </div>
    <p id="radioCatalogLoader" class="catalog-loader">Cargando emisoras…</p>
    <div class="radio-grid" id="allRadios" aria-busy="true"></div>
    <p id="radioFilterEmpty" class="section-sub" style="text-align:center;margin-top:24px;" hidden>No hay emisoras con ese nombre.</p>
    <div class="catalog-more">
      <button type="button" class="btn-load-more" id="loadMoreRadios" hidden>Cargar más emisoras</button>
    </div>
  </section>
${buildSeoDiscoverSection({
    title: 'Radios dominicanas en vivo',
    subtitle: 'Enlaces directos a emisoras principales de FM y AM en República Dominicana.',
    items: toSeoLinkItems(priority, './radio/'),
    crossLinks: [{ href: './index.html', label: 'Ver canales de TV en vivo' }],
  })}
</main>
${footer()}
${scriptsBlock(0, '<script src="./assets/js/catalog-utils.js" defer></script>\n<script src="./assets/js/catalog-radios.js" defer></script>')}
</body>
</html>`;
}

const RADIO_IMMERSIVE_BOOT_SCRIPT = `<script>!function(){try{var n=window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform();var m=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'');if(n||(m&&!document.documentElement.classList.contains('is-desktop'))){document.documentElement.classList.add('radio-immersive-boot');if(!n){var s=sessionStorage.getItem('vivord_radio_session');if(!s||JSON.parse(s).playing===false)document.documentElement.classList.remove('radio-immersive-boot');}}}catch(e){}}();</script>`;

function buildRadioPlayerBlock(r, img) {
  const city = r.city ? `${escapeHtml(r.city)} · ` : '';
  return `<button type="button" class="radio-immersive-minimize" id="radioMinimizeBtn" aria-label="Minimizar reproductor" hidden>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>
</button>
<div class="radio-stage" id="radioStage">
  <div class="radio-stage__bg" style="--radio-art: url('${escapeHtml(img)}')"></div>
  <div class="radio-stage__shade"></div>
  <div class="radio-stage__glow"></div>
  <div class="radio-stage__inner">
    <div class="radio-stage__header">
      <span class="radio-stage__brand">VivoRD · Radio</span>
      <span class="radio-live-pill" id="radioLivePill"><span class="radio-live-pill__dot"></span>En vivo</span>
    </div>
    <div class="radio-stage__center">
      <div class="radio-disc" id="radioDisc">
        <span class="radio-disc__ring" aria-hidden="true"></span>
        <span class="radio-disc__ring radio-disc__ring--2" aria-hidden="true"></span>
        <img class="radio-disc__logo" src="${img}" alt="${escapeHtml(r.name)}" width="168" height="168" referrerpolicy="no-referrer">
      </div>
      <div class="radio-visualizer" id="radioVisualizer" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span><span></span>
      </div>
    </div>
    <div class="radio-stage__meta">
      <h2 class="radio-stage__title">${escapeHtml(r.name)}</h2>
      <p class="radio-stage__now" id="radioNowPlaying" hidden aria-live="polite"></p>
      <p class="radio-stage__subtitle" id="radioStatus">${city}Transmisión en directo</p>
    </div>
    <div class="radio-stage__dock radio-dock">
      <div class="radio-dock__station">
        <img class="radio-dock__art" src="${img}" alt="" width="52" height="52" referrerpolicy="no-referrer">
      </div>
      <div class="radio-dock__center">
        <button type="button" class="radio-toggle-btn" id="radioToggleBtn" aria-label="Reproducir">
          <svg class="radio-toggle-btn__icon radio-toggle-btn__icon--play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7L8 5z"/></svg>
          <svg class="radio-toggle-btn__icon radio-toggle-btn__icon--stop" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 7h10v10H7z"/></svg>
        </button>
      </div>
      <div class="radio-dock__volume">
        <label class="radio-volume">
          <svg class="radio-volume__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4V5z"/></svg>
          <input type="range" id="radioVolume" min="0" max="1" step="0.05" value="0.9" aria-label="Volumen">
        </label>
        <p class="radio-error" id="radioError" hidden></p>
      </div>
    </div>
    <audio id="radio-player" preload="auto" autoplay playsinline webkit-playsinline x-webkit-airplay="allow"></audio>
  </div>
</div>`;
}

function buildRadioPage(r, sidebar) {
  const img = resolveImg(r.img, r.slug, 'radios', 1);
  const healthy = isHealthy(r.slug, 'radio', r);
  const desc = r.description
    ? buildStationDescription(r, 'radio', r.description)
    : buildStationDescription(r, 'radio', `<p>Escucha ${escapeHtml(r.name)} en vivo.</p>`);
  const cityLine = r.city ? `<p class="radio-city">${escapeHtml(r.city)}</p>` : '';
  const recentItemJson = escapeHtml(
    JSON.stringify({
      slug: r.slug,
      name: r.name,
      img,
      url: `./radio/${r.slug}.html`,
    })
  );

  const playerBlockRaw = r.stream
    ? buildRadioPlayerBlock(r, img)
    : `<div class="radio-stage radio-stage--offline">
  <img class="radio-stage__logo" src="${img}" alt="" width="120" height="120" referrerpolicy="no-referrer">
  <p>Señal no disponible temporalmente</p>
</div>`;

  const playerBlock = wrapPlayerWithHealthNotice(playerBlockRaw, healthy);

  const sidebarHtml = sidebar
    .map((s) => {
      const simg = resolveImg(s.img, s.slug, 'radios', 1);
      return `<a href="${s.slug}.html" class="mini-card mini-card--radio"><img src="${simg}" alt="" loading="lazy" referrerpolicy="no-referrer"><span>${escapeHtml(s.name)}</span></a>`;
    })
    .join('\n');

  const ref = r.streamReferer || radioReferer(r.slug) || '';
  const playerScripts = r.stream
    ? `<script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js"></script>
<script src="../assets/js/radio-media-session.js"></script>
<script src="../assets/js/radio-player.js"></script>
<script>initRadioPlayer(${JSON.stringify(r.stream)}, ${JSON.stringify(r.streamType || '')}, ${JSON.stringify(ref)}, ${JSON.stringify(r.zenoSlug || '')});</script>`
    : '';

  const pathname = `/radio/${r.slug}.html`;
  const metaDesc = `Escucha ${r.name} en vivo online desde República Dominicana. Radio en directo gratis en ${BRAND}.`;
  const canonical = canonicalUrl(pathname);
  return `${seoHead({
    title: `${r.name} en vivo · ${BRAND}`,
    description: metaDesc,
    depth: 1,
    pathname,
    ogImage: img,
    ogType: 'website',
    jsonLd: radioPageJsonLd(r, canonical, metaDesc, absoluteAssetUrl(img, 1)),
    robots: healthy ? 'index, follow' : 'noindex, follow',
  })}
${r.stream ? RADIO_IMMERSIVE_BOOT_SCRIPT : ''}
${header('radios', 1, 'Buscar canal o radio…')}
<main class="site-main container" id="main-content">
  <div data-recent-item="1" data-kind="radio" data-item="${recentItemJson}" hidden></div>
  <a href="../radios.html" class="back-link">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
    Volver a radios
  </a>
  <div class="player-layout player-layout--radio">
    <div>
      ${playerBlock}
      ${adSlotMarkup(1, { belowPlayer: true })}
      ${affiliateBanner()}
      <article class="player-meta">
        <div class="channel-header">
          <div class="card-img-container card-img-container--round">
            <img src="${img}" alt="${escapeHtml(r.name)}" width="56" height="56">
          </div>
          <div>
            <h1 class="channel-title">${escapeHtml(r.name)} <span class="live-badge">En vivo</span></h1>
            ${cityLine}
          </div>
        </div>
        ${buildStationMetaHtml(r, 'radio')}
        ${buildGuideLinksHtml(r, 'radio', 1)}
        <div class="description-content">${desc}</div>
      </article>
    </div>
    <aside class="player-sidebar">
      <p class="sidebar-label">Más emisoras</p>
      <div class="sidebar-list">${sidebarHtml}</div>
    </aside>
  </div>
</main>
${footer(1)}
${scriptsBlock(1, playerScripts)}
</body>
</html>`;
}

async function loadRadioCatalog() {
  const allPath = path.join(ROOT, 'data', 'radios-all.json');
  const pubPath = path.join(ROOT, 'data', 'radios.json');
  let file = pubPath;
  try {
    await fs.access(allPath);
    file = allPath;
  } catch {
    /* solo publicadas */
  }
  const data = JSON.parse(await fs.readFile(file, 'utf8'));
  const radios = data.radios.map((r) => ({ ...r, img: resolveImg(r.img, r.slug, 'radios', 0) }));
  return applyRadioStreamFixes(radios);
}

async function saveRadioCatalogAll(radios) {
  await fs.mkdir(path.join(ROOT, 'data'), { recursive: true });
  await fs.writeFile(
    path.join(ROOT, 'data', 'radios-all.json'),
    JSON.stringify({ radios, updatedAt: new Date().toISOString() }, null, 2)
  );
}

async function saveRadioCatalog(radios) {
  await fs.mkdir(path.join(ROOT, 'data'), { recursive: true });
  await fs.writeFile(
    path.join(ROOT, 'data', 'radios.json'),
    JSON.stringify({ radios, updatedAt: new Date().toISOString() }, null, 2)
  );
}

async function saveRadioMeta(excluded, classified) {
  const summary = { emisora: 0, programa: 0, evento: 0, internacional: 0, rd: 0 };
  for (const row of classified) {
    if (row.kind === 'emisora') summary.emisora++;
    if (row.kind === 'programa') summary.programa++;
    if (row.kind === 'evento') summary.evento++;
    if (row.kind === 'internacional') summary.internacional++;
    if (row.country === 'rd') summary.rd++;
  }

  await fs.writeFile(
    path.join(ROOT, 'data', 'radios-classified.json'),
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        summary,
        radios: classified.map((row) => ({
          slug: row.slug,
          name: row.name,
          kind: row.kind,
          country: row.country,
          parentSlug: row.parentSlug,
          parentLabel: row.parentLabel,
          shouldExclude: row.shouldExclude,
          excludeReason: row.excludeReason,
          published: !row.shouldExclude,
        })),
      },
      null,
      2
    )
  );

  await fs.writeFile(
    path.join(ROOT, 'data', 'radios-excluded.json'),
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        count: excluded.length,
        radios: excluded.map(
          ({
            slug,
            name,
            img,
            stream,
            city,
            excludeReason,
            kind,
            country,
            parentSlug,
            parentLabel,
          }) => ({
            slug,
            name,
            img: resolveRemoteImg(img),
            city: city || '',
            hasStream: Boolean(stream),
            kind: kind || 'auto',
            country: country || 'rd',
            parentSlug: parentSlug || null,
            parentLabel: parentLabel || null,
            reason: excludeReason,
          })
        ),
      },
      null,
      2
    )
  );
}

async function removeExcludedRadioPages(slugs) {
  for (const slug of slugs) {
    try {
      await fs.unlink(path.join(ROOT, 'radio', `${slug}.html`));
    } catch {
      /* ok */
    }
  }
}

async function syncSearchStations(radios) {
  const searchPath = path.join(ROOT, 'data', 'search-index.json');
  let index = { channels: [], stations: [] };
  try {
    index = JSON.parse(await fs.readFile(searchPath, 'utf8'));
  } catch { /* new */ }
  index.stations = radios.map(({ slug, name, img }) => ({
    slug,
    name,
    img: resolveImg(img, slug, 'radios', 0),
    url: `radio/${slug}.html`,
  }));
  await fs.writeFile(searchPath, JSON.stringify(index));
}

export async function generateRadios({ quick = false, retheme = false } = {}) {
  loadHealthIndex();
  await ensureSeoAssets();
  let radios;

  if (retheme) {
    console.log('Regenerando radios (conservando streams)…');
    radios = await loadRadioCatalog();
  } else {
    const html = await loadRadioListHtml();
    radios = parseRadios(html);
    console.log(`Emisoras encontradas: ${radios.length}`);

    if (!quick) {
      console.log('Obteniendo streams de radio…');
      let done = 0;
      await pool(radios, 8, async (r) => {
        const data = await fetchRadioStream(r.slug);
        if (data?.stream) {
          r.stream = data.stream;
          r.streamType = data.streamType;
          r.city = data.city || r.city;
          r.description = data.description || r.description;
        }
        done++;
        if (done % 40 === 0) console.log(`  ${done}/${radios.length}`);
      });
      console.log(`Streams: ${radios.filter((r) => r.stream).length}/${radios.length}`);
    } else {
      try {
        const existing = await loadRadioCatalog();
        const bySlug = new Map(existing.map((r) => [r.slug, r]));
        radios = radios.map((r) => ({ ...r, ...bySlug.get(r.slug) }));
      } catch { /* first run */ }
    }
  }

  radios = applyRadioStreamFixes(radios);
  await saveRadioCatalogAll(radios);
  const { priority, rest, excluded, classified, published } = organizeRadios(radios);

  await saveRadioCatalog(published);
  await saveRadioMeta(excluded, classified);
  await removeExcludedRadioPages(excluded.map((r) => r.slug));
  await syncSearchStations(published);
  await saveHomeRadios(priority, rest, {
    total: published.length,
    live: published.filter((r) => r.stream).length,
    priority: priority.length,
    catalog: rest.length,
  });
  await fs.mkdir(path.join(ROOT, 'radio'), { recursive: true });
  await generateLegalPages();
  const hubResult = buildHubCatalog(published);
  const radiosIndexHtml = buildRadiosIndex(priority, rest, hubResult.teaserHtml);
  const pagesToValidate = [
    { html: radiosIndexHtml, pageRelPath: 'radios.html' },
    ...hubResult.pages.map(({ html, pageRelPath }) => ({ html, pageRelPath })),
  ];
  const radioWrites = [];

  for (let i = 0; i < published.length; i++) {
    const sidebar = [];
    for (let j = 1; j <= 8; j++) sidebar.push(published[(i + j) % published.length]);
    const html = buildRadioPage(published[i], sidebar);
    pagesToValidate.push({ html, pageRelPath: `radio/${published[i].slug}.html` });
    radioWrites.push({ html, slug: published[i].slug });
  }

  await assertAllValidInternalLinks(pagesToValidate, ROOT);
  console.log(
    `  Enlaces validados: radios.html + ${hubResult.pages.length} hubs + ${radioWrites.length} emisoras`
  );

  await writeHubPages(hubResult.pages, hubResult.manifest);
  await fs.writeFile(path.join(ROOT, 'radios.html'), radiosIndexHtml);
  for (const { html, slug } of radioWrites) {
    await fs.writeFile(path.join(ROOT, 'radio', `${slug}.html`), html);
  }

  console.log(
    `  Publicadas: ${published.length} (${priority.length} principales + ${rest.length} secundarias)`
  );
  console.log(`  Excluidas: ${excluded.length} → data/radios-excluded.json`);
  console.log(`  Clasificación → data/radios-classified.json`);
  await generateSitemap();
  console.log(`Listo: radios.html + ${published.length} emisoras`);
  return published;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const quick = process.argv.includes('--quick');
  const retheme = process.argv.includes('--retheme');
  generateRadios({ quick, retheme }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
