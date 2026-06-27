import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, '..');
export const IMAGE_BASE = 'https://canalesdominicanos.live';
export const MEDIA_DIR = path.join(ROOT, 'assets', 'media');

export function localMediaFile(slug, kind) {
  const dir = path.join(MEDIA_DIR, kind);
  for (const ext of ['webp', 'png', 'jpg', 'jpeg']) {
    const file = path.join(dir, `${slug}.${ext}`);
    if (fs.existsSync(file)) return { file, ext };
  }
  return null;
}

export function localMediaUrl(slug, kind, depth = 0) {
  const hit = localMediaFile(slug, kind);
  if (!hit) return null;
  const prefix = depth ? '../'.repeat(depth) : './';
  return `${prefix}assets/media/${kind}/${slug}.${hit.ext}`;
}

export function resolveRemoteImg(img) {
  if (!img) return '';
  let s = String(img).trim();
  if (s.startsWith('assets/media/')) return s;
  if (s.startsWith('./assets/media/') || s.startsWith('../assets/media/')) return s;

  if (s.startsWith('//images/')) {
    s = `${IMAGE_BASE}${s.slice(1)}`;
  } else if (s.startsWith('//') && !s.includes('canalesdominicanos')) {
    s = `https:${s}`;
  }

  if (s.startsWith('http://') || s.startsWith('https://')) {
    try {
      const u = new URL(s);
      return `${u.protocol}//${u.host}${u.pathname.replace(/\/+/g, '/')}`;
    } catch {
      return s;
    }
  }

  const rel = s.startsWith('/') ? s : `/${s}`;
  return `${IMAGE_BASE}${rel}`;
}

/** Prefiere archivo local espejado; si no, URL remota normalizada. */
export function resolveImg(img, slug, kind = 'canales', depth = 0) {
  const local = slug ? localMediaUrl(slug, kind, depth) : null;
  if (local) return local;
  return resolveRemoteImg(img);
}
