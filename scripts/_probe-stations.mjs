import { DM_HEADERS, getTelesistemaMasterUrl } from './dm-stream.mjs';

const sites = [
  'https://larocka917.com/',
  'https://puravidafm.net/',
  'https://superqfm.net/',
  'https://kiss949.com/',
];

for (const url of sites) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' },
    });
    const t = await r.text();
    const hits = [...t.matchAll(/https?:\/\/[^\s"'<>]+/g)]
      .map((m) => m[0])
      .filter((u) => /stream|m3u8|mp3|pls|icecast|listen|radio|cast|:\d{4}/i.test(u));
    console.log('\n==', url, r.status);
    [...new Set(hits)].slice(0, 12).forEach((u) => console.log(' ', u));
  } catch (e) {
    console.log(url, 'ERR', e.message);
  }
}

const master = await getTelesistemaMasterUrl();
console.log('\nTelesistema master:', master.slice(0, 80) + '...');
const dm = await fetch(master, { headers: DM_HEADERS });
console.log('DM master fetch:', dm.status, dm.headers.get('content-type'));
