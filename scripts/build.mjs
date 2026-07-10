import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { organizeChannels, PRIORITY_ORDER } from './channel-priority.mjs';
import { resolveImg, resolveRemoteImg, IMAGE_BASE } from './image-paths.mjs';
import { siteHeader as header } from './site-header.mjs';
import { siteFooter } from './site-footer.mjs';
import { adSlotMarkup } from './adsense.mjs';
import { affiliateBanner } from './affiliate.mjs';
import {
  seoHead,
  webSiteJsonLd,
  channelPageJsonLd,
  canonicalUrl,
  absoluteAssetUrl,
  ensureSeoAssets,
} from './seo-head.mjs';
import { buildSeoDiscoverSection, toSeoLinkItems } from './seo-static-links.mjs';
import { generateSitemap } from './generate-sitemap.mjs';
import { formatDescription, escapeHtml } from './description-format.mjs';
import { buildStationMetaHtml } from './station-meta.mjs';
import { generateGuias, buildGuiasTeaserHtml } from './guias-build.mjs';
import { generateLegalPages } from './legal-pages.mjs';
import { assertAllValidInternalLinks } from './validate-internal-links.mjs';
import { buildStationDescription } from './description-enrich.mjs';
import { buildGuideLinksHtml } from './guide-links.mjs';
import { loadHealthIndex, isHealthy } from './stream-health-index.mjs';
import { wrapPlayerWithHealthNotice } from './stream-health-notice.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SOURCE = 'https://canalesdominicanos.live';
const ORIGIN = SOURCE + '/';
const BRAND = 'VivoRD';

/** Fuentes oficiales cuando el scraper no devuelve señal */
const TELEMICRO_REFERER = 'https://telemicro.com.do/';
const TELESISTEMA_LIVE_URL = 'https://telesistema11.com.do/en-vivo/';

const STREAM_OVERRIDES = {
  'telesistema-canal-11': {
    // Dailymotion bloquea embed en dominios no autorizados (solo en telesistema11.com.do).
    stream: TELESISTEMA_LIVE_URL,
    streamType: 'official',
    officialMsg:
      'Telesistema usa Dailymotion con restricción de dominio: no se puede incrustar en VivoRD. Abre la transmisión en el sitio oficial.',
  },
  'telemicro-canal-5': {
    stream: 'https://live4.telemicro.com.do/live/55/playlist.m3u8',
    streamType: 'hls',
    streamReferer: TELEMICRO_REFERER,
  },
  'telecentro-canal-13': {
    stream: 'https://live4.telemicro.com.do/live/13/playlist.m3u8',
    streamType: 'hls',
    streamReferer: TELEMICRO_REFERER,
  },
  'digital-15': {
    stream: 'https://live4.telemicro.com.do/live/15/playlist.m3u8',
    streamType: 'hls',
    streamReferer: TELEMICRO_REFERER,
  },
  'cinevision-canal-19': {
    stream: 'https://5790d294af2dc.streamlock.net/tvhdlive/tvhdlive/playlist.m3u8',
    streamType: 'hls',
  },
  'la-voz-de-maria-la-vega': {
    stream: 'https://live.lavozdemaria.com:3436/live/lavozdemarialive.m3u8',
    streamType: 'hls',
  },
  'romana-tv-canal-42': {
    stream: 'https://videoserver.tmcreativos.com:19360/cvmhbyrcat/cvmhbyrcat.m3u8',
    streamType: 'hls',
  },
  'planeta-alofoke': {
    stream: 'https://www.youtube.com/embed/OAqh7KV-r3I?autoplay=1&rel=0&modestbranding=1',
    streamType: 'iframe',
  },
};

/** Canales que no vienen del scraper (YouTube, etc.) */
const EXTRA_TV_CHANNELS = [
  {
    slug: 'planeta-alofoke',
    name: 'Planeta Alofoke',
    img: './assets/media/canales/planeta-alofoke.png',
    featured: true,
    stream: 'https://www.youtube.com/embed/OAqh7KV-r3I?autoplay=1&rel=0&modestbranding=1',
    streamType: 'iframe',
    description:
      '<p><b>Planeta Alofoke</b> en vivo por YouTube. Entretenimiento, conversación y la energía del equipo de Alofoke en transmisión directa.</p>',
  },
];

function mergeExtraTvChannels(channels) {
  const list = [...channels];
  const bySlug = new Map(list.map((c, i) => [c.slug, i]));
  for (const extra of EXTRA_TV_CHANNELS) {
    const i = bySlug.get(extra.slug);
    if (i !== undefined) Object.assign(list[i], extra);
    else list.push({ ...extra });
  }
  return list;
}

function applyStreamOverrides(channels) {
  for (const ch of channels) {
    const o = STREAM_OVERRIDES[ch.slug];
    if (o) Object.assign(ch, o);
  }
  return channels;
}

const CARD_RE =
  /<a href="https:\/\/canalesdominicanos\.live\/([^"]+)" class="channel-card tv">[\s\S]*?<img src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>[\s\S]*?<div class="channel-name">([^<]+)<\/div>\s*<\/a>/g;

function parseChannels(html) {
  const popularEnd = html.indexOf('<!-- Todos los Canales -->');
  const popularHtml = popularEnd > 0 ? html.slice(0, popularEnd) : html;
  const allHtml = popularEnd > 0 ? html.slice(popularEnd) : html;
  const map = new Map();
  const featured = [];

  function ingest(chunk, isFeatured) {
    let m;
    CARD_RE.lastIndex = 0;
    while ((m = CARD_RE.exec(chunk))) {
      const slug = m[1];
      const ch = {
        slug,
        img: resolveRemoteImg(m[2]),
        name: m[4].trim(),
        featured: false,
        stream: null,
        streamType: null,
        description: '',
      };
      if (!map.has(slug)) map.set(slug, ch);
      if (isFeatured && !featured.includes(slug)) featured.push(slug);
    }
  }

  ingest(popularHtml, true);
  ingest(allHtml, false);
  for (const slug of featured) {
    if (map.has(slug)) map.get(slug).featured = true;
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

async function fetchStream(slug) {
  const url = `${ORIGIN}${slug}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VivoRD/1.0)' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m3u8 = html.match(/<source src="([^"]+\.m3u8[^"]*)"/);
    if (m3u8) return { stream: m3u8[1], description: extractDescription(html) };
    const iframe = html.match(/<iframe[^>]+src="([^"]+)"/);
    if (iframe) return { stream: iframe[1], streamType: 'iframe', description: extractDescription(html) };
    return { stream: null, description: extractDescription(html) };
  } catch {
    return null;
  }
}

function extractDescription(html) {
  const block = html.match(
    /<div class="description-content"[^>]*>([\s\S]*?)<\/div>\s*<!-- Contact/
  );
  return block ? block[1].trim() : '';
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

function needsVideoJsCss(ch) {
  return (
    Boolean(ch.stream) &&
    ch.streamType !== 'iframe' &&
    ch.streamType !== 'official' &&
    ch.streamType !== 'proxy' &&
    ch.streamType !== 'hls'
  );
}


function scriptsBlock(depth = 0, extra = '') {
  const p = depth ? '../'.repeat(depth) : './';
  const defer = ' defer';
  return `<script>window.BASE_URL = '${depth ? '../' : './'}';</script>
<script src="${p}assets/js/search.js"${defer}></script>
<script src="${p}assets/js/user-state.js"${defer}></script>
<script src="${p}assets/js/mobile.js"${defer}></script>
${extra}`;
}

function homeTvEntry(ch) {
  return {
    slug: ch.slug,
    name: ch.name,
    img: resolveImg(ch.img, ch.slug, 'canales', 0),
  };
}

async function saveHomeTv(priority, rest, stats) {
  await fs.mkdir(path.join(ROOT, 'data'), { recursive: true });
  await fs.writeFile(
    path.join(ROOT, 'data', 'home-tv.json'),
    JSON.stringify({
      updatedAt: new Date().toISOString(),
      stats,
      priority: priority.map(homeTvEntry),
      catalog: rest.map(homeTvEntry),
    })
  );
}

async function saveSearchIndex(jsonChannels, stations = null) {
  const file = path.join(ROOT, 'data', 'search-index.json');
  let existingStations = [];
  if (stations == null) {
    try {
      const prev = JSON.parse(await fs.readFile(file, 'utf8'));
      existingStations = Array.isArray(prev?.stations) ? prev.stations : [];
    } catch {
      existingStations = [];
    }
  }

  const finalStations = stations == null ? existingStations : stations;

  await fs.writeFile(
    file,
    JSON.stringify({
      channels: jsonChannels.map((c) => ({
        slug: c.slug,
        name: c.name,
        img: c.img,
        url: c.url,
      })),
      stations: finalStations.map((s) => ({
        slug: s.slug,
        name: s.name,
        img: s.img,
        url: s.url,
      })),
    })
  );
}

function channelCard(ch, prefix = './canal/', depth = 0) {
  const img = resolveImg(ch.img, ch.slug, 'canales', depth);
  return `<a href="${prefix}${ch.slug}.html" class="channel-card" data-name="${escapeHtml(ch.name.toLowerCase())}">
  <div class="card-img-container">
    <img src="${img}" alt="${escapeHtml(ch.name)}" loading="lazy" width="120" height="120" referrerpolicy="no-referrer">
  </div>
  <div class="channel-name">${escapeHtml(ch.name)}</div>
</a>`;
}

function plainDescription(html, maxLen = 180) {
  const text = (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 'Sintoniza la señal en vivo desde República Dominicana, gratis y en HD.';
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

function buildFeaturedCarousel(slides) {
  const items = slides.slice(0, 9);
  if (items.length === 0) return '';

  const first = items[0];
  const firstImg = resolveImg(first.img, first.slug, 'canales', 0);
  const firstHref = `./canal/${first.slug}.html`;
  const firstDesc = plainDescription(first.description);
  const firstMeta = first.stream ? 'Televisión • En vivo' : 'Televisión • República Dominicana';

  const thumbs = items
    .map((ch, i) => {
      const img = resolveImg(ch.img, ch.slug, 'canales', 0);
      return `<button type="button" class="hero-carousel__thumb${i === 0 ? ' is-active' : ''}" data-index="${i}"
        data-href="./canal/${ch.slug}.html"
        data-title="${escapeHtml(ch.name)}"
        data-img="${escapeHtml(img)}"
        data-desc="${escapeHtml(plainDescription(ch.description))}"
        data-meta="${ch.stream ? 'Televisión • En vivo' : 'Televisión • RD'}"
        data-live="${ch.stream ? '1' : '0'}"
        aria-label="${escapeHtml(ch.name)}"
        aria-selected="${i === 0 ? 'true' : 'false'}">
        <img ${i === 0 ? `src="${img}"` : `data-src="${img}" src=""`} alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">
      </button>`;
    })
    .join('\n');

  return `<div class="hero-carousel" id="featuredCarousel" data-autoplay="7000">
  <div class="hero-carousel__stage">
    <div class="hero-carousel__backdrop" aria-hidden="true">
      <img class="hero-carousel__bg" src="${firstImg}" alt="">
      <div class="hero-carousel__gradient"></div>
    </div>
    <div class="hero-carousel__content">
      <a href="${firstHref}" class="hero-carousel__cta" id="heroCarouselCta">Ver ahora</a>
      <h2 class="hero-carousel__title" id="heroCarouselTitle">${escapeHtml(first.name)}</h2>
      <p class="hero-carousel__desc" id="heroCarouselDesc">${escapeHtml(firstDesc)}</p>
      <div class="hero-carousel__meta">
        <span id="heroCarouselMeta">${firstMeta}</span>
        <span class="hero-carousel__badge" id="heroCarouselBadge"${first.stream ? '' : ' hidden'}>EN VIVO</span>
      </div>
    </div>
  </div>
  <div class="hero-carousel__picker" role="tablist" aria-label="Canales destacados">
    ${thumbs}
  </div>
  <div class="hero-carousel__progress" aria-hidden="true">
    <div class="hero-carousel__progress-bar" id="heroCarouselProgress"></div>
  </div>
</div>`;
}

const CAROUSEL_EXCLUDE = new Set(['certv-canal-4', 'rtvd-canal-4']);
const CAROUSEL_LEAD_SLUG = 'color-vision-canal-9';
const CAROUSEL_SLOTS = [
  { slug: 'color-vision-canal-9', position: 0 },
  { slug: 'telesistema-canal-11', position: 1 },
  { slug: 'antena-latina-canal-7', position: 2 },
  { slug: 'telemicro-canal-5', position: 3 },
];

function getCarouselChannels(channels) {
  const bySlug = new Map(channels.map((c) => [c.slug, c]));
  const featured = channels.filter((c) => c.featured && !CAROUSEL_EXCLUDE.has(c.slug));
  let list = featured.length ? featured : channels.filter((c) => !CAROUSEL_EXCLUDE.has(c.slug));

  for (const { slug, position } of [...CAROUSEL_SLOTS].sort((a, b) => a.position - b.position)) {
    const ch = bySlug.get(slug);
    if (!ch) continue;
    list = list.filter((c) => c.slug !== slug);
    const at = Math.min(position, list.length);
    list.splice(at, 0, ch);
  }

  const withStream = list.filter((c) => c.stream);
  const without = list.filter((c) => !c.stream);
  return [...withStream, ...without].slice(0, 9);
}

function buildIndex(priority, rest) {
  const carouselList = getCarouselChannels(priority);
  const total = priority.length + rest.length;
  const live = [...priority, ...rest].filter((c) => c.stream).length;
  const excludedNote = '';

  const homeDesc =
    'Mira canales de televisión y escucha emisoras de radio de República Dominicana en directo. Gratis en el navegador con VivoRD.';
  return `${seoHead({
    title: `${BRAND} — TV y radios dominicanas en vivo`,
    description: homeDesc,
    pathname: '/',
    jsonLd: webSiteJsonLd(homeDesc),
  })}
${header('tv')}
<main class="site-main" id="main-content">
  <section class="hero container">
    <div class="hero-badge"><span class="dot"></span> Transmisión en directo</div>
    <h1>Tu TV y radio dominicana, sin complicaciones</h1>
    <p>Accede a canales de televisión y emisoras de radio nacionales desde el navegador. Gratis, rápido y con una experiencia pensada para ti.</p>
    <div class="hero-search nav-search">
      <svg class="nav-search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      <input type="search" id="heroSearch" placeholder="¿Qué quieres ver o escuchar hoy?" autocomplete="off">
    </div>
    <div class="hero-stats">
      <div class="hero-stat"><strong>${total}+</strong><span>Canales</span></div>
      <div class="hero-stat"><strong>${live}</strong><span>En vivo</span></div>
      <div class="hero-stat"><strong>HD</strong><span>Calidad</span></div>
    </div>
  </section>

  <section class="section section-featured container">
    <div class="section-head">
      <div>
        <h2 class="section-title">Destacados</h2>
        <p class="section-sub">Selecciona un canal para ver la vista previa</p>
      </div>
    </div>
    ${buildFeaturedCarousel(carouselList)}
  </section>

  <section class="section container" id="recentTvSection" hidden>
    <div class="section-head">
      <div>
        <h2 class="section-title">Recientes</h2>
        <p class="section-sub">Lo último que reproduciste</p>
      </div>
    </div>
    <div class="channel-grid" id="recentTvGrid"></div>
  </section>

  ${adSlotMarkup(0)}
  ${affiliateBanner()}

  ${buildGuiasTeaserHtml()}

  <section class="section container" id="canales-principales">
    <div class="section-head">
      <div>
        <h2 class="section-title">Canales principales</h2>
        <p class="section-sub">Ordenados por audiencia y relevancia nacional</p>
      </div>
    </div>
    <div class="channel-grid channel-grid--priority" id="priorityChannels" aria-busy="true"></div>
    <div class="catalog-more">
      <button type="button" class="btn-load-more" id="loadMorePriorityChannels" hidden>Cargar más principales</button>
    </div>
  </section>

  <section class="section container" id="canales">
    <div class="section-head">
      <div>
        <h2 class="section-title">Más canales</h2>
        <p class="section-sub">Catálogo extendido — <span id="catalogShownCount">cargando…</span></p>
      </div>
      <input type="search" class="filter-input" id="channelFilter" placeholder="Filtrar por nombre…" autocomplete="off">
    </div>
    ${excludedNote}
    <p id="catalogLoader" class="catalog-loader">Cargando catálogo…</p>
    <div class="channel-grid" id="allChannels" aria-busy="true"></div>
    <p id="filterEmpty" class="section-sub" style="text-align:center;margin-top:24px;" hidden>No hay canales con ese nombre.</p>
    <div class="catalog-more">
      <button type="button" class="btn-load-more" id="loadMoreChannels" hidden>Cargar más canales</button>
    </div>
  </section>
${buildSeoDiscoverSection({
    title: 'Canales de TV dominicana en vivo',
    subtitle: 'Acceso directo a los canales más consultados en VivoRD.',
    items: toSeoLinkItems(priority),
    crossLinks: [{ href: './radios.html', label: 'Ver radios dominicanas en vivo' }],
  })}
</main>
${footer()}
${scriptsBlock(0, '<script src="./assets/js/catalog-utils.js" defer></script>\n<script src="./assets/js/carousel.js" defer></script>\n<script src="./assets/js/catalog-home.js" defer></script>')}
</body>
</html>`;
}

function buildOfficialPlayer(ch) {
  const img = resolveImg(ch.img, ch.slug, 'canales', 1);
  const url = ch.stream;
  const msg =
    ch.officialMsg ||
    'La señal oficial no permite incrustarse en otros sitios. Reprodúcela desde el sitio de la emisora.';
  return `<div class="player-stage player-official">
  <div class="player-official-inner" style="--poster: url('${escapeHtml(img)}')">
    <div class="player-official-overlay"></div>
    <div class="player-official-content">
      <img class="player-official-logo" src="${img}" alt="" width="120" height="120" referrerpolicy="no-referrer">
      <p class="player-official-msg">${escapeHtml(msg)}</p>
      <button type="button" class="player-official-btn" data-official-url="${escapeHtml(url)}">
        <span class="player-official-play-icon" aria-hidden="true">▶</span>
        Ver transmisión en vivo
      </button>
      <a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="player-official-alt">Abrir en nueva pestaña</a>
    </div>
  </div>
</div>
<script src="../assets/js/official-player.js"></script>`;
}

function buildChannelPage(ch, sidebar) {
  const img = resolveImg(ch.img, ch.slug, 'canales', 1);
  const healthy = isHealthy(ch.slug, 'tv', ch);
  const desc = ch.description
    ? buildStationDescription(ch, 'tv', ch.description)
    : buildStationDescription(ch, 'tv', `<p>Señal en vivo de ${escapeHtml(ch.name)}.</p>`);
  const recentItemJson = escapeHtml(
    JSON.stringify({
      slug: ch.slug,
      name: ch.name,
      img,
      url: `./canal/${ch.slug}.html`,
    })
  );

  const playerBlockRaw =
    ch.streamType === 'official'
      ? buildOfficialPlayer(ch)
      : ch.streamType === 'proxy'
        ? `<div class="player-stage"><video id="main-player" class="player-video" controls playsinline preload="auto" poster="${escapeHtml(img)}"></video></div>`
        : ch.streamType === 'dm'
          ? `<div class="player-stage dm-player">
  <div class="dm-player-inner" style="--poster: url('${escapeHtml(img)}')">
    <iframe data-dm-embed="${escapeHtml(ch.stream)}" src="about:blank" allowfullscreen allow="autoplay; fullscreen; picture-in-picture; web-share" title="${escapeHtml(ch.name)}"></iframe>
    <div class="dm-overlay">
      <div class="player-official-content">
        <img class="player-official-logo" src="${img}" alt="" width="120" height="120" referrerpolicy="no-referrer">
        <p class="player-official-msg">Pulsa para iniciar la transmisión (Dailymotion).</p>
        <button type="button" class="player-official-btn" data-dm-play>
          <span class="player-official-play-icon" aria-hidden="true">▶</span>
          Reproducir en vivo
        </button>
      </div>
    </div>
  </div>
</div>
<script src="../assets/js/dm-player.js"></script>`
          : ch.streamType === 'iframe'
          ? `<div class="player-stage"><iframe src="${escapeHtml(ch.stream)}" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" title="${escapeHtml(ch.name)}"></iframe></div>`
          : ch.stream
            ? `<div class="player-stage"><video id="main-player" class="video-js vjs-default-skin vjs-big-play-centered" controls preload="auto"><source src="${escapeHtml(ch.stream)}" type="application/x-mpegURL"></video></div>`
            : `<div class="player-stage player-unavailable">Señal no disponible temporalmente</div>`;

  const playerBlock = wrapPlayerWithHealthNotice(playerBlockRaw, healthy);

  const sidebarHtml = sidebar
    .map((s) => {
      const simg = resolveImg(s.img, s.slug, 'canales', 1);
      return `<a href="${s.slug}.html" class="mini-card"><img src="${simg}" alt="" loading="lazy" referrerpolicy="no-referrer"><span>${escapeHtml(s.name)}</span></a>`;
    })
    .join('\n');

  const playerScripts =
    ch.streamType === 'proxy'
      ? `<script src="../assets/js/hls-playback.js"></script>
<script src="../assets/js/proxy-player.js"></script>
<script>initProxyPlayer(${JSON.stringify(ch.stream)});</script>`
      : ch.stream && ch.streamType !== 'iframe' && ch.streamType !== 'official' && ch.streamType !== 'dm'
        ? `<script src="../assets/js/hls-playback.js"></script>
<script src="https://vjs.zencdn.net/8.3.0/video.min.js"></script>
<script src="../assets/js/player.js"></script>
<script>initPlayer(${JSON.stringify(ch.stream)}, "auto", ${JSON.stringify(ch.streamReferer || '')});</script>`
        : '';

  const pathname = `/canal/${ch.slug}.html`;
  const metaDesc = `Mira ${ch.name} en vivo online desde República Dominicana. Señal en directo gratis en ${BRAND}.`;
  const canonical = canonicalUrl(pathname);
  return `${seoHead({
    title: `${ch.name} en vivo · ${BRAND}`,
    description: metaDesc,
    depth: 1,
    pathname,
    ogImage: img,
    ogType: 'video.other',
    withVideoJs: needsVideoJsCss(ch),
    jsonLd: channelPageJsonLd(ch, canonical, metaDesc, absoluteAssetUrl(img, 1)),
    robots: healthy ? 'index, follow' : 'noindex, follow',
  })}
${header('tv', 1)}
<main class="site-main container" id="main-content">
  <div data-recent-item="1" data-kind="tv" data-item="${recentItemJson}" hidden></div>
  <a href="../index.html" class="back-link">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
    Volver a TV en vivo
  </a>
  <div class="player-layout">
    <div>
      ${playerBlock}
      ${adSlotMarkup(1, { belowPlayer: true })}
      ${affiliateBanner()}
      <article class="player-meta">
        <div class="channel-header">
          <div class="card-img-container">
            <img src="${img}" alt="${escapeHtml(ch.name)}" width="56" height="56">
          </div>
          <h1 class="channel-title">${escapeHtml(ch.name)} <span class="live-badge">En vivo</span></h1>
        </div>
        ${buildStationMetaHtml(ch, 'tv')}
        ${buildGuideLinksHtml(ch, 'tv', 1)}
        <div class="description-content">${desc}</div>
      </article>
    </div>
    <aside class="player-sidebar">
      <p class="sidebar-label">Más canales</p>
      <div class="sidebar-list">${sidebarHtml}</div>
    </aside>
  </div>
</main>
${footer(1)}
${scriptsBlock(1, playerScripts)}
</body>
</html>`;
}

async function loadHomeHtml() {
  const local = path.join(ROOT, '_source.html');
  try {
    return await fs.readFile(local, 'utf8');
  } catch {
    console.log('Descargando página de inicio…');
    const res = await fetch(ORIGIN, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VivoRD/1.0)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }
}

async function loadCatalog() {
  const catalogPath = path.join(ROOT, 'data', 'catalog.json');
  try {
    const data = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
    if (data.channels?.length) {
      return data.channels.map((ch) => ({ ...ch, img: resolveImg(ch.img, ch.slug, 'canales', 0) }));
    }
  } catch { /* extract from pages */ }

  const listPath = path.join(ROOT, 'data', 'channels.json');
  const list = JSON.parse(await fs.readFile(listPath, 'utf8'));
  const channels = [];

  for (const c of list.channels) {
    const file = path.join(ROOT, 'canal', `${c.slug}.html`);
    let stream = null;
    let streamType = null;
    let description = '';
    try {
      const html = await fs.readFile(file, 'utf8');
      const m3u8 = html.match(/<source src="([^"]+)"/);
      const iframe = html.match(/<iframe src="([^"]+)"/);
      if (m3u8) stream = m3u8[1];
      else if (iframe) {
        stream = iframe[1];
        streamType = 'iframe';
      }
      const desc = html.match(/<div class="description-content"[^>]*>([\s\S]*?)<\/div>/);
      if (desc) description = desc[1].trim();
    } catch { /* skip */ }

    channels.push({
      slug: c.slug,
      name: c.name,
      img: resolveImg(c.img, c.slug, 'canales', 0),
      featured: c.featured,
      stream,
      streamType,
      description,
    });
  }
  return channels;
}

async function saveCatalog(channels) {
  await fs.mkdir(path.join(ROOT, 'data'), { recursive: true });
  const normalized = channels.map((ch) => {
    const item = { ...ch, img: resolveImg(ch.img, ch.slug, 'canales', 0) };
    if (CAROUSEL_EXCLUDE.has(ch.slug)) item.featured = false;
    return item;
  });
  await fs.writeFile(
    path.join(ROOT, 'data', 'catalog.json'),
    JSON.stringify({ channels: normalized, updatedAt: new Date().toISOString() }, null, 2)
  );
}

async function saveExcludedList(excluded, classified) {
  const summary = { canal: 0, programa: 0, evento: 0, rd: 0, venezuela: 0, evento_deportivo: 0, internacional: 0 };
  for (const row of classified) {
    if (row.kind === 'canal') summary.canal++;
    if (row.kind === 'programa') summary.programa++;
    if (row.kind === 'evento') summary.evento++;
    if (row.country === 'rd') summary.rd++;
    if (row.country === 'venezuela') summary.venezuela++;
    if (row.country === 'evento_deportivo') summary.evento_deportivo++;
    if (row.country === 'internacional') summary.internacional++;
  }

  await fs.writeFile(
    path.join(ROOT, 'data', 'channels-classified.json'),
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        summary,
        channels: classified.map((row) => ({
          slug: row.slug,
          name: row.name,
          kind: row.kind,
          country: row.country,
          parentSlug: row.parentSlug,
          parentLabel: row.parentLabel,
          shouldExclude: row.shouldExclude,
          excludeReason: row.excludeReason,
          published: !row.shouldExclude || PRIORITY_ORDER.includes(row.slug),
        })),
      },
      null,
      2
    )
  );

  await fs.writeFile(
    path.join(ROOT, 'data', 'channels-excluded.json'),
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        count: excluded.length,
        channels: excluded.map(
          ({ slug, name, img, stream, excludeReason, kind, country, parentSlug, parentLabel }) => ({
            slug,
            name,
            img: resolveRemoteImg(img),
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

async function removeExcludedPages(slugs) {
  for (const slug of slugs) {
    try {
      await fs.unlink(path.join(ROOT, 'canal', `${slug}.html`));
    } catch {
      /* ya no existe */
    }
  }
}

async function generateSite(rawChannels) {
  loadHealthIndex();
  await ensureSeoAssets();
  const { priority, rest, excluded, published, classified } = organizeChannels(rawChannels);

  await fs.mkdir(path.join(ROOT, 'canal'), { recursive: true });
  await saveExcludedList(excluded, classified);
  await removeExcludedPages(excluded.map((c) => c.slug));

  const jsonChannels = published.map(({ slug, name, img, featured, stream, catalogMeta }) => ({
    slug,
    name,
    img: resolveImg(img, slug, 'canales', 0),
    url: `canal/${slug}.html`,
    featured,
    hasStream: Boolean(stream),
    tier: priority.some((p) => p.slug === slug) ? 'priority' : 'catalog',
    ...(catalogMeta || {}),
  }));

  await fs.writeFile(
    path.join(ROOT, 'data', 'channels.json'),
    JSON.stringify({ channels: jsonChannels, stations: [] }, null, 2)
  );

  await saveCatalog(published);
  await saveHomeTv(priority, rest, {
    total: published.length,
    live: published.filter((c) => c.stream).length,
    priority: priority.length,
    catalog: rest.length,
  });
  await saveSearchIndex(jsonChannels);

  const indexHtmlOut = buildIndex(priority, rest);
  const pagesToValidate = [{ html: indexHtmlOut, pageRelPath: 'index.html' }];
  const channelWrites = [];

  for (let i = 0; i < published.length; i++) {
    const sidebar = [];
    for (let j = 1; j <= 8; j++) sidebar.push(published[(i + j) % published.length]);
    const html = buildChannelPage(published[i], sidebar);
    pagesToValidate.push({ html, pageRelPath: `canal/${published[i].slug}.html` });
    channelWrites.push({ html, slug: published[i].slug });
  }

  await assertAllValidInternalLinks(pagesToValidate, ROOT);
  console.log(`  Enlaces validados: index + ${channelWrites.length} canales`);

  await fs.writeFile(path.join(ROOT, 'index.html'), indexHtmlOut);
  for (const { html, slug } of channelWrites) {
    await fs.writeFile(path.join(ROOT, 'canal', `${slug}.html`), html);
  }

  console.log(`  Publicados: ${published.length} (${priority.length} principales + ${rest.length} catálogo)`);
  console.log(`  Excluidos: ${excluded.length} → data/channels-excluded.json`);
  console.log(`  Clasificación completa → data/channels-classified.json`);
}

async function main() {
  const quick = process.argv.includes('--quick');
  const retheme = process.argv.includes('--retheme');

  let channels;

  if (retheme) {
    console.log('Aplicando diseño VivoRD (conservando streams)…');
    channels = await loadCatalog();
    console.log(`Catálogo: ${channels.length} canales`);
  } else {
    const html = await loadHomeHtml();
    channels = parseChannels(html);
    console.log(`Canales encontrados: ${channels.length}`);

    if (!quick) {
      console.log('Obteniendo streams…');
      let done = 0;
      await pool(channels, 6, async (ch) => {
        const data = await fetchStream(ch.slug);
        if (data?.stream) {
          ch.stream = data.stream;
          ch.streamType = data.streamType;
        }
        if (data?.description) ch.description = data.description;
        done++;
        if (done % 25 === 0) console.log(`  ${done}/${channels.length}`);
      });
      console.log(`Streams: ${channels.filter((c) => c.stream).length}/${channels.length}`);
    } else {
      const existing = await loadCatalog().catch(() => []);
      if (existing.length) {
        const bySlug = new Map(existing.map((c) => [c.slug, c]));
        channels = channels.map((ch) => ({ ...ch, ...bySlug.get(ch.slug) }));
      }
    }
  }

  channels = mergeExtraTvChannels(channels);
  applyStreamOverrides(channels);
  await generateLegalPages();
  await generateSite(channels);
  await generateGuias();
  await generateSitemap();
  console.log('Listo: index.html · marca VivoRD');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
