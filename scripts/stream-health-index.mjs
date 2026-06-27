import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

/** Fallos duros: señal realmente ausente. No incluir falsos negativos del checker server-side. */
const HARD_STREAM_ISSUES = new Set(['http_404']);

let failedSet = null;

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  } catch {
    return null;
  }
}

function inferKind(item) {
  if (item.kind === 'radio' || item.kind === 'tv') return item.kind;
  const page = String(item.page || '');
  if (page.startsWith('radio/')) return 'radio';
  if (page.startsWith('canal/')) return 'tv';
  return 'tv';
}

function healthKey(slug, kind) {
  return `${kind}:${slug}`;
}

function normalizeIssue(issue) {
  return String(issue || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

/** Solo fallos que indican señal caída, no bloqueo CORS ni URL de página oficial. */
export function isHardStreamFailure(item) {
  const issue = normalizeIssue(item?.issue);
  if (HARD_STREAM_ISSUES.has(issue)) return true;
  const issues = item?.issues;
  if (Array.isArray(issues) && issues.some((i) => HARD_STREAM_ISSUES.has(normalizeIssue(i)))) {
    return true;
  }
  return false;
}

/**
 * Slugs no indexables por salud de stream.
 * - stream-health / embed-health: solo http_404 (u otros HARD_STREAM_ISSUES).
 * - tv-not-playing.json: confirmaciones de TV que no reproduce (todas las entradas).
 * Excluye: url_pagina_no_audio, fetch failed (status 0), http_403, timeouts, etc.
 */
export function buildHealthSet() {
  const failed = new Set();

  const stream = readJson('data/stream-health.json');
  for (const item of stream?.failed || []) {
    if (item?.slug && isHardStreamFailure(item)) {
      failed.add(healthKey(item.slug, inferKind(item)));
    }
  }

  const embed = readJson('data/embed-health.json');
  for (const item of embed?.failed || []) {
    if (item?.slug && isHardStreamFailure(item)) {
      failed.add(healthKey(item.slug, inferKind(item)));
    }
  }

  const tvNp = readJson('data/tv-not-playing.json');
  for (const item of tvNp?.items || []) {
    if (item?.slug) failed.add(healthKey(item.slug, 'tv'));
  }

  return failed;
}

export function loadHealthIndex() {
  failedSet = buildHealthSet();
  return failedSet;
}

function getSet() {
  if (!failedSet) loadHealthIndex();
  return failedSet;
}

/** Ficha publicada sin URL de stream en catálogo → no indexar. */
export function hasPublishedStream(item, kind) {
  if (kind === 'radio') return Boolean(item?.stream);
  if (kind === 'tv') {
    if (item?.hasStream === false) return false;
    if (item?.hasStream === true) return true;
    return Boolean(item?.stream);
  }
  return true;
}

export function isHealthy(slug, kind, catalogItem = null) {
  if (!slug || !kind) return true;
  if (catalogItem && !hasPublishedStream(catalogItem, kind)) return false;
  return !getSet().has(healthKey(slug, kind));
}

export function isFailedSlug(slug, kind, catalogItem = null) {
  return !isHealthy(slug, kind, catalogItem);
}

export function getFailedEntryCount() {
  return getSet().size;
}

export function streamHealthSummary() {
  const stream = readJson('data/stream-health.json');
  return stream?.summary || {};
}

export function streamHealthIssueBreakdown() {
  const stream = readJson('data/stream-health.json');
  const counts = {};
  for (const item of stream?.failed || []) {
    const key = item?.issue || 'unknown';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}
