/**
 * Parches post-copia en www/ para app Android radio-only.
 * No modifica el sitio en la raíz del repo.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

export const APP_INDEX_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta http-equiv="refresh" content="0;url=./radios.html">
  <meta name="vivord-app-mode" content="radio-only">
  <title>VivoRD — Radios</title>
  <script>location.replace('./radios.html');</script>
</head>
<body></body>
</html>
`;

export const TV_DATA_FILES = [
  'catalog.json',
  'channels.json',
  'home-tv.json',
  'tv-not-playing.json',
  'embed-health.json',
  'channels-classified.json',
  'channels-excluded.json',
];

const WEB_TV_ORIGIN = 'https://vivo-rd.com/canal/';

export function stripTvNav(html) {
  let out = html;

  out = out.replace(
    /<a href="[^"]*index\.html" class="nav-link[^"]*">\s*TV en Vivo\s*<\/a>\s*/gi,
    ''
  );
  out = out.replace(
    /<a href="[^"]*index\.html" class="nav-mobile-tab[^"]*"[^>]*>\s*TV en Vivo\s*<\/a>\s*/gi,
    ''
  );

  if (!/>TV en Vivo</i.test(out)) {
    out = out.replace(/<div class="nav-mobile-tabs container"[\s\S]*?<\/div>\s*/gi, '');
  }

  out = out.replace(
    /(<a href=")((?:\.\.\/|\.\/)*)index\.html(" class="brand")/gi,
    '$1$2radios.html$4'
  );

  out = out.replace(
    /<p class="seo-discover__cross"><a href="[^"]*index\.html">Ver canales de TV en vivo<\/a><\/p>\s*/gi,
    '<p class="seo-discover__cross"><a href="https://vivo-rd.com/">TV en vivo en vivo-rd.com</a></p>\n    '
  );

  out = out.replace(/Buscar canal o radio…/g, 'Buscar emisora…');
  out = out.replace(
    /Escucha cientos de radios nacionales y regionales desde cualquier dispositivo\. Gratis y sin instalar nada\./,
    'Escucha cientos de emisoras dominicanas desde la app. Gratis, en vivo y con reproducción en segundo plano.'
  );
  out = out.replace(
    /<p class="footer-tagline">TV y radio dominicana en directo<\/p>/g,
    '<p class="footer-tagline">Radios dominicanas en directo</p>'
  );

  if (!out.includes('vivord-app-mode')) {
    out = out.replace('</head>', '  <meta name="vivord-app-mode" content="radio-only">\n</head>');
  }

  return out;
}

export function externalizeCanalLinks(html) {
  return html
    .replace(/href="\.\.\/canal\//g, `href="${WEB_TV_ORIGIN}`)
    .replace(/href="\.\/canal\//g, `href="${WEB_TV_ORIGIN}`);
}

async function walkHtml(dir) {
  const out = [];
  async function walk(current) {
    for (const ent of await fs.readdir(current, { withFileTypes: true })) {
      const p = path.join(current, ent.name);
      if (ent.isDirectory()) await walk(p);
      else if (ent.name.endsWith('.html')) out.push(p);
    }
  }
  await walk(dir);
  return out;
}

export async function trimSearchIndex(wwwDir) {
  const file = path.join(wwwDir, 'data', 'search-index.json');
  try {
    const raw = await fs.readFile(file, 'utf8');
    const data = JSON.parse(raw);
    delete data.channels;
    if (!Array.isArray(data.stations)) data.stations = [];
    await fs.writeFile(file, JSON.stringify(data));
  } catch (e) {
    throw new Error(`trimSearchIndex: ${e.message}`);
  }
}

export async function removeTvDataFiles(wwwDir) {
  for (const name of TV_DATA_FILES) {
    const p = path.join(wwwDir, 'data', name);
    try {
      await fs.unlink(p);
    } catch {
      /* ok if missing */
    }
  }
}

export async function patchAppWww(wwwDir) {
  const htmlFiles = await walkHtml(wwwDir);
  let patched = 0;

  for (const file of htmlFiles) {
    const rel = path.relative(wwwDir, file).replace(/\\/g, '/');
    let html = await fs.readFile(file, 'utf8');
    const next = externalizeCanalLinks(stripTvNav(html));
    if (next !== html) {
      await fs.writeFile(file, next);
      patched++;
    }
  }

  await trimSearchIndex(wwwDir);
  await removeTvDataFiles(wwwDir);

  return { htmlFiles: htmlFiles.length, patched };
}
