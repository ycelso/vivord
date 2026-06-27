const url = process.argv[2] || 'https://telemicro.com.do/players/5bot/';
const r = await fetch(url, {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36',
    Referer: 'https://telemicro.com.do/',
  },
});
const t = await r.text();
console.log('status', r.status, 'len', t.length);
const urls = [...t.matchAll(/https?:\/\/[^\s"'<>]+/g)].map((m) => m[0]);
const top = urls.filter((u) => !u.includes('schema.org')).slice(0, 80);
if (top.length) console.log('urls', top);
for (const re of [/m3u8[^"'\s]*/gi, /https?:\/\/[^"'\s]+(?:stream|live|player)[^"'\s]*/gi, /src="([^"]+)"/gi]) {
  const m = [...t.matchAll(re)].slice(0, 8).map((x) => x[0] || x[1]);
  if (m.length) console.log(re, m);
}
