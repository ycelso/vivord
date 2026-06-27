const html = await (
  await fetch('https://puravidafm.net/', { headers: { 'User-Agent': 'Mozilla/5.0' } })
).text();
const idx = html.indexOf('presto');
console.log('presto idx', idx);
if (idx >= 0) console.log(html.slice(idx, idx + 1200));
for (const re of [/data-src=["']([^"']+)["']/gi, /https:\/\/[^"'\s]+\/stream[^"'\s]*/gi]) {
  const m = [...html.matchAll(re)].map((x) => x[1] || x[0]);
  if (m.length) console.log(re.source, [...new Set(m)].slice(0, 8));
}
