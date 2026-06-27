const html = await (
  await fetch('https://puravidafm.net/', { headers: { 'User-Agent': 'Mozilla/5.0' } })
).text();
if (html.includes('8294')) console.log('found 8294');
if (html.includes('protvradio')) console.log('found protvradio');
if (html.includes('zeno')) console.log('found zeno');
const ports = [];
for (const m of html.matchAll(/:(\d{4})\//g)) ports.push(m[1]);
console.log('ports', [...new Set(ports)].slice(0, 20));

for (const p of [8294, 8295, 8290, 8288, 8300, 8310, 8320, 8620, 8350]) {
  const u = `https://protvradiostream.com:${p}/stream`;
  try {
    const r = await fetch(u, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (r.ok) console.log('OK', p, r.headers.get('content-type'));
  } catch {
    /* skip */
  }
}
