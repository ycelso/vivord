import { getTelesistemaMasterUrl } from './dm-stream.mjs';

const master = await getTelesistemaMasterUrl();
const tests = [
  {
    name: 'embedder',
    headers: {
      Referer: 'https://telesistema11.com.do/en-vivo/',
      Origin: 'https://telesistema11.com.do',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0 Safari/537.36',
    },
  },
  {
    name: 'dm-video',
    headers: {
      Referer: 'https://www.dailymotion.com/video/x80ac48',
      Origin: 'https://www.dailymotion.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0 Safari/537.36',
      Cookie: 'family_filter=off; ff=off',
    },
  },
];
for (const t of tests) {
  const r = await fetch(master, { headers: t.headers });
  const body = await r.text();
  console.log(t.name, r.status, body.slice(0, 60));
}
