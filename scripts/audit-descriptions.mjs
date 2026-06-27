import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const DEFAULT_THRESHOLD = 0.15;
const NGRAM_SIZES = [6, 7, 8];

function parseArgs(argv) {
  const opts = {
    threshold: DEFAULT_THRESHOLD,
    includeLead: false,
    top: 25,
    minWords: 90,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--full') opts.includeLead = true;
    else if (a === '--no-lead') opts.includeLead = false;
    else if (a.startsWith('--threshold=')) opts.threshold = Number(a.slice(12)) || DEFAULT_THRESHOLD;
    else if (a.startsWith('--top=')) opts.top = Number(a.slice(6)) || 25;
  }
  return opts;
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractDescriptionHtml(pageHtml) {
  const m = pageHtml.match(/class="description-content"[^>]*>([\s\S]*?)<\/div>\s*(?:<!--|<\/article|<aside)/i);
  if (m) return m[1].trim();
  const m2 = pageHtml.match(/class="description-content"[^>]*>([\s\S]*?)<\/div>/i);
  return m2 ? m2[1].trim() : '';
}

function removeLead(html) {
  return String(html || '').replace(/<p\s+class="description-lead"[^>]*>[\s\S]*?<\/p>/gi, ' ');
}

function normalizeWords(text) {
  const plain = stripHtml(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return [];
  return plain.split(' ').filter((w) => w.length > 0);
}

function ngramsForWords(words, size) {
  const out = new Set();
  if (words.length < size) return out;
  for (let i = 0; i <= words.length - size; i++) {
    out.add(words.slice(i, i + size).join(' '));
  }
  return out;
}

function collectFichaPaths() {
  const paths = [];
  for (const dir of ['radio', 'canal']) {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) continue;
    for (const file of fs.readdirSync(full)) {
      if (file.endsWith('.html')) paths.push({ dir, file, rel: `${dir}/${file}` });
    }
  }
  return paths.sort((a, b) => a.rel.localeCompare(b.rel));
}

function wordCountFromHtml(html) {
  const t = stripHtml(html);
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function auditDescriptions(opts) {
  const paths = collectFichaPaths();
  const ngramFichaCounts = new Map();
  for (const size of NGRAM_SIZES) ngramFichaCounts.set(size, new Map());

  let ltMinWords = 0;
  let invalidPul = 0;
  let emptyDesc = 0;
  const shortSlugs = [];

  for (const { rel } of paths) {
    const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    let descHtml = extractDescriptionHtml(html);
    if (!descHtml) {
      emptyDesc++;
      continue;
    }
    if (!opts.includeLead) descHtml = removeLead(descHtml);

    const words = wordCountFromHtml(descHtml);
    if (words > 0 && words < opts.minWords) {
      ltMinWords++;
      shortSlugs.push({ rel, words });
    }
    if (/<p[^>]*>\s*<ul\b/i.test(descHtml)) invalidPul++;

    const tokens = normalizeWords(descHtml);
    for (const size of NGRAM_SIZES) {
      const phrases = ngramsForWords(tokens, size);
      const bucket = ngramFichaCounts.get(size);
      for (const phrase of phrases) {
        bucket.set(phrase, (bucket.get(phrase) || 0) + 1);
      }
    }
  }

  const total = paths.length;
  const thresholdCount = Math.ceil(total * opts.threshold);

  return {
    total,
    threshold: opts.threshold,
    thresholdCount,
    includeLead: opts.includeLead,
    ltMinWords,
    shortSlugs,
    emptyDesc,
    invalidPul,
    ngramFichaCounts,
  };
}

function formatPct(n, total) {
  return `${((n / total) * 100).toFixed(1)}%`;
}

function printReport(result, topN) {
  const { total, threshold, thresholdCount, includeLead, ngramFichaCounts } = result;

  console.log('=== audit-descriptions.mjs ===');
  console.log(`fichas analizadas: ${total} (radio/ + canal/)`);
  console.log(`modo: ${includeLead ? 'descripción completa (con lead)' : 'cuerpo sin .description-lead'}`);
  console.log(`umbral duplicación: ${(threshold * 100).toFixed(0)}% (>${thresholdCount - 1} fichas)`);
  console.log(`fichas <${90} palabras (cuerpo${includeLead ? '' : ' sin lead'}): ${result.ltMinWords}`);
  console.log(`fichas sin description-content: ${result.emptyDesc}`);
  console.log(`description-content con <p><ul: ${result.invalidPul}`);

  if (result.shortSlugs.length) {
    console.log('\n--- fichas cortas (<90 palabras) ---');
    for (const s of result.shortSlugs.sort((a, b) => a.words - b.words)) {
      console.log(`  ${s.words}w  ${s.rel}`);
    }
  }

  let anyOver = false;

  for (const size of NGRAM_SIZES) {
    const bucket = ngramFichaCounts.get(size);
    const sorted = [...bucket.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const over = sorted.filter(([, count]) => count > thresholdCount - 1);

    console.log(`\n--- n-gramas ${size} palabras: ${over.length} superan ${(threshold * 100).toFixed(0)}% ---`);
    if (over.length) {
      anyOver = true;
      for (const [phrase, count] of over.slice(0, topN)) {
        console.log(`  ${formatPct(count, total).padStart(6)} (${count})  ${phrase}`);
      }
      if (over.length > topN) console.log(`  ... +${over.length - topN} más`);
    } else {
      console.log('  (ninguno)');
    }

    console.log(`\n--- top ${Math.min(topN, sorted.length)} n-gramas ${size} palabras (todos) ---`);
    for (const [phrase, count] of sorted.slice(0, topN)) {
      const mark = count > thresholdCount - 1 ? '>' : ' ';
      console.log(` ${mark} ${formatPct(count, total).padStart(6)} (${count})  ${phrase}`);
    }

    const watchMin = Math.ceil(total * 0.1);
    const watch = sorted.filter(([, count]) => count >= watchMin && count <= thresholdCount - 1);
    if (watch.length) {
      console.log(`\n--- vigilancia 10–${(threshold * 100).toFixed(0)}% (${size} palabras): ${watch.length} frases ---`);
      for (const [phrase, count] of watch.slice(0, 12)) {
        console.log(`  ${formatPct(count, total).padStart(6)} (${count})  ${phrase}`);
      }
      if (watch.length > 12) console.log(`  ... +${watch.length - 12} más`);
    }
  }

  console.log('\n=== resumen ===');
  console.log(
    anyOver
      ? `FALLO objetivo W4: hay frases en >${(threshold * 100).toFixed(0)}% de las fichas.`
      : `OK objetivo W4: ningún n-grama 6–8 palabras supera ${(threshold * 100).toFixed(0)}%.`,
  );
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const opts = parseArgs(process.argv);
  const result = auditDescriptions({ ...opts, minWords: 90 });
  printReport(result, opts.top);
}

export { auditDescriptions, normalizeWords, ngramsForWords, extractDescriptionHtml };
