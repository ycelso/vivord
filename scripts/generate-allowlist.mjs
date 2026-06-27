import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  collectHostsFromStreamUrl,
  mergeAllowlistHosts,
} from './proxy-security.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

async function readJson(rel) {
  try {
    return JSON.parse(await fs.readFile(path.join(ROOT, rel), 'utf8'));
  } catch {
    return null;
  }
}

function hostsFromM3u8Manifest(text, baseUrl) {
  const hosts = new Set();
  if (!text || !baseUrl) return hosts;
  try {
    const base = new URL(baseUrl);
    for (const line of text.split(/\r?\n/)) {
      if (!line || line.startsWith('#')) continue;
      const trimmed = line.trim().split('#')[0];
      if (!trimmed) continue;
      try {
        hosts.add(new URL(trimmed, base).hostname.toLowerCase());
      } catch {
        /* skip */
      }
    }
  } catch {
    /* skip */
  }
  return hosts;
}

export async function generateAllowlist() {
  const hosts = new Set();
  const catalog = await readJson('data/catalog.json');
  const radios = await readJson('data/radios-all.json');

  if (catalog?.channels) {
    for (const ch of catalog.channels) {
      for (const h of collectHostsFromStreamUrl(ch.stream)) hosts.add(h);
    }
  }

  if (radios?.radios) {
    for (const r of radios.radios) {
      for (const h of collectHostsFromStreamUrl(r.stream)) hosts.add(h);
    }
  }

  const merged = mergeAllowlistHosts([...hosts]);
  const out = {
    updatedAt: new Date().toISOString(),
    count: merged.length,
    hosts: merged,
  };

  await fs.mkdir(path.join(ROOT, 'data'), { recursive: true });
  await fs.writeFile(
    path.join(ROOT, 'data', 'proxy-allowlist.json'),
    JSON.stringify(out, null, 2)
  );

  console.log(`Allowlist proxy: ${merged.length} hosts → data/proxy-allowlist.json`);
  return out;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  generateAllowlist().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
