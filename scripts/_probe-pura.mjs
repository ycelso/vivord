const html = await (
  await fetch('https://puravidafm.net/', { headers: { 'User-Agent': 'Mozilla/5.0' } })
).text();
const patterns = [
  /src=["']([^"']+)["']/gi,
  /(https?:\/\/[^"'\s]+)/gi,
];
const all = new Set();
for (const re of patterns) {
  for (const m of html.matchAll(re)) all.add(m[1] || m[0]);
}
[...all]
  .filter((u) => /stream|radio|cast|zeno|mp3|m3u8|proto|plug|listen|8294|8620/i.test(u))
  .slice(0, 30)
  .forEach((u) => console.log(u));
