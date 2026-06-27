import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKIP_HREF = /^(https?:|mailto:|tel:|#|javascript:|data:)/i;

/**
 * Resuelve un href relativo respecto a una página bajo `root`.
 * @returns {string|null} Ruta absoluta al archivo destino, o null si se omite.
 */
export function resolveInternalHref(href, root, pageRelPath) {
  const raw = String(href || '').trim();
  if (!raw || SKIP_HREF.test(raw)) return null;

  const withoutQuery = raw.split('?')[0].split('#')[0];
  const pageDir = path.dirname(pageRelPath);
  const joined = path.normalize(path.join(root, pageDir, withoutQuery));

  if (withoutQuery.endsWith('/') || withoutQuery === '.' || withoutQuery === './') {
    return path.join(joined, 'index.html');
  }
  if (path.extname(joined)) {
    return joined;
  }
  return `${joined}.html`;
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Prueba rutas candidatas (archivo .html o directorio/index.html). */
async function hrefTargetExists(href, root, pageRelPath, knownRelPaths) {
  const primary = resolveInternalHref(href, root, pageRelPath);
  if (!primary) return true;

  const rel = path.relative(root, primary).replace(/\\/g, '/');
  if (knownRelPaths?.has(rel)) return true;

  const candidates = [primary];
  if (primary.endsWith('.html')) {
    const stem = primary.slice(0, -'.html'.length);
    candidates.push(path.join(stem, 'index.html'));
  }

  for (const candidate of candidates) {
    if (await pathExists(candidate)) return true;
  }
  return false;
}

/**
 * Extrae hrefs internos de un fragmento HTML.
 */
export function extractHrefs(html) {
  const hrefs = [];
  const re = /href="([^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) hrefs.push(m[1]);
  return hrefs;
}

/**
 * Valida que cada href interno apunte a un archivo existente bajo `root`.
 * @param {string} html
 * @param {{ root: string, pageRelPath: string }} opts
 * @returns {Promise<Array<{ href: string, page: string, resolved: string }>>}
 */
export async function findBrokenInternalLinks(html, { root, pageRelPath, knownRelPaths }) {
  const broken = [];
  const seen = new Set();

  for (const href of extractHrefs(html)) {
    const resolved = resolveInternalHref(href, root, pageRelPath);
    if (!resolved) continue;

    const key = `${pageRelPath}\0${href}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const ok = await hrefTargetExists(href, root, pageRelPath, knownRelPaths);
    if (!ok) {
      broken.push({ href, page: pageRelPath, resolved });
    }
  }

  return broken;
}

/**
 * @throws {Error} si hay enlaces rotos
 */
export async function assertValidInternalLinks(html, opts) {
  const broken = await findBrokenInternalLinks(html, opts);
  if (!broken.length) return;

  const lines = broken.map(
    (b) => `  ${b.page}: href="${b.href}" → ${path.relative(opts.root, b.resolved)}`
  );
  throw new Error(`Enlaces internos rotos (${broken.length}):\n${lines.join('\n')}`);
}

/**
 * Valida varias páginas HTML generadas.
 * @param {Array<{ html: string, pageRelPath: string }>} pages
 */
export async function assertAllValidInternalLinks(pages, root, opts = {}) {
  const knownRelPaths = opts.knownRelPaths ?? new Set(pages.map((p) => p.pageRelPath.replace(/\\/g, '/')));
  const allBroken = [];
  for (const { html, pageRelPath } of pages) {
    const broken = await findBrokenInternalLinks(html, { root, pageRelPath, knownRelPaths });
    allBroken.push(...broken);
  }
  if (!allBroken.length) return;

  const lines = allBroken.map(
    (b) => `  ${b.page}: href="${b.href}" → ${path.relative(root, b.resolved)}`
  );
  throw new Error(`Enlaces internos rotos (${allBroken.length}):\n${lines.join('\n')}`);
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

async function validateGuiasOnDisk() {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const guiasDir = path.join(root, 'guias');
  const entries = await fs.readdir(guiasDir);
  const pages = [];

  for (const name of entries) {
    if (!name.endsWith('.html')) continue;
    const html = await fs.readFile(path.join(guiasDir, name), 'utf8');
    pages.push({ html, pageRelPath: `guias/${name}` });
  }

  await assertAllValidInternalLinks(pages, root);
  console.log(`Enlaces OK en ${pages.length} páginas de guias/`);
}

if (isMain) {
  validateGuiasOnDisk().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
}
