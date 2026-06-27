import { SITE_NAME, SITE_URL, TWITTER_SITE } from './site-config.mjs';
import { adsenseHeadSnippet, ASSET_VER } from './adsense.mjs';
import { ensureSocialAssets } from './social-assets.mjs';

/** Clase is-desktop / is-mobile antes del primer paint (evita flash de pestañas móviles). */
export function deviceClassScript() {
  return `  <script>!function(){var m=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||''),r=document.documentElement;r.classList.toggle('is-mobile',m);r.classList.toggle('is-desktop',!m)}();</script>\n`;
}

// OG por defecto (se asegura en build con ensureSocialAssets()).
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/img/og-vivord-1200x630.jpg`;

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Ruta pública absoluta (pathname empieza con /). */
export function canonicalUrl(pathname) {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (path === '/index.html') return `${SITE_URL}/`;
  return `${SITE_URL}${path}`;
}

/** Convierte ruta relativa del HTML (./ ../) a URL absoluta para OG. */
export function absoluteAssetUrl(relativePath, depth = 0) {
  if (!relativePath) return DEFAULT_OG_IMAGE;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  let rel = relativePath;
  while (depth > 0 && rel.startsWith('../')) {
    rel = rel.slice(3);
    depth -= 1;
  }
  rel = rel.replace(/^\.\//, '');
  return `${SITE_URL}/${rel}`;
}

function jsonLdScript(data) {
  if (!data) return '';
  const items = Array.isArray(data) ? data : [data];
  return (
    items
      .map((item) => `  <script type="application/ld+json">${JSON.stringify(item)}</script>`)
      .join('\n') + '\n'
  );
}

export function radiosIndexJsonLd(description) {
  return [
    webSiteJsonLd(description),
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Radios dominicanas en vivo',
      description,
      url: `${SITE_URL}/radios.html`,
      inLanguage: 'es-DO',
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    },
  ];
}

export function webSiteJsonLd(description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description,
    inLanguage: 'es-DO',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: DEFAULT_OG_IMAGE,
    },
  };
}

export function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function channelPageJsonLd(ch, canonical, description, imageUrl) {
  const blocks = [
    breadcrumbJsonLd([
      { name: 'Inicio', url: `${SITE_URL}/` },
      { name: 'TV en vivo', url: `${SITE_URL}/` },
      { name: ch.name, url: canonical },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `${ch.name} en vivo`,
      description,
      url: canonical,
      inLanguage: 'es-DO',
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    },
  ];
  if (ch.stream) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: `${ch.name} en vivo`,
      description,
      thumbnailUrl: imageUrl,
      url: canonical,
    });
  }
  return blocks;
}

export function radioPageJsonLd(r, canonical, description, imageUrl) {
  return [
    breadcrumbJsonLd([
      { name: 'Inicio', url: `${SITE_URL}/` },
      { name: 'Radios', url: `${SITE_URL}/radios.html` },
      { name: r.name, url: canonical },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'RadioStation',
      name: r.name,
      description,
      url: canonical,
      image: imageUrl,
      broadcastDisplayName: r.name,
      ...(r.city ? { areaServed: r.city } : {}),
    },
  ];
}

/**
 * Bloque <head> con SEO: canonical, Open Graph, Twitter Card, JSON-LD opcional.
 * @param {object} opts
 * @param {string} opts.pathname - ej. `/`, `/radios.html`, `/canal/foo.html`
 */
export function seoHead({
  title,
  description,
  depth = 0,
  pathname = '/',
  ogImage,
  ogType = 'website',
  jsonLd = null,
  robots = 'index, follow',
  withVideoJs = false,
}) {
  const p = depth ? '../'.repeat(depth) : './';
  const canonical = canonicalUrl(pathname);
  const image = ogImage ? absoluteAssetUrl(ogImage, depth) : DEFAULT_OG_IMAGE;
  const isDefaultImage = !ogImage;
  const videoJsCss = withVideoJs
    ? `  <link href="https://vjs.zencdn.net/8.3.0/video-js.css" rel="stylesheet">\n`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="sitemap" type="application/xml" href="${SITE_URL}/sitemap.xml">
  <meta name="theme-color" content="#0a0a0b">
  <meta name="vivord-api-base" content="">
  <link rel="manifest" href="${p}manifest.webmanifest">
  <meta property="og:type" content="${escapeHtml(ogType)}">
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  ${isDefaultImage ? `<meta property="og:image:width" content="1200">` : ''}
  ${isDefaultImage ? `<meta property="og:image:height" content="630">` : ''}
  ${isDefaultImage ? `<meta property="og:image:alt" content="${escapeHtml(`${SITE_NAME} — TV y radios dominicanas en vivo`)}">` : ''}
  <meta property="og:locale" content="es_DO">
  <meta name="twitter:card" content="summary_large_image">
  ${TWITTER_SITE ? `<meta name="twitter:site" content="${escapeHtml(TWITTER_SITE)}">` : ''}
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <link rel="icon" href="${p}assets/img/favicon.svg" type="image/svg+xml">
  <link rel="icon" type="image/png" sizes="32x32" href="${p}assets/img/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="${p}assets/img/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="${p}assets/img/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
${deviceClassScript()}${videoJsCss}  <link rel="stylesheet" href="${p}assets/css/style.css?v=${ASSET_VER}">
  <script src="${p}assets/js/api-config.js"></script>
${adsenseHeadSnippet()}  <script src="${p}assets/js/capacitor-native.js" defer></script>
${jsonLdScript(jsonLd)}</head>
<body>`;
}

/**
 * Asegura assets usados por seoHead.
 * Llamar una vez al inicio del build (TV o Radios).
 */
export async function ensureSeoAssets() {
  await ensureSocialAssets();
}
