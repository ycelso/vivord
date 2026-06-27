const html = await (
  await fetch('https://puravidafm.net/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' },
  })
).text();
for (const re of [
  /src=["']([^"']+)["']/gi,
  /https?:\/\/[^"'\s]+\.(?:m3u8|mp3|pls)[^"'\s]*/gi,
  /stream[^"'\s]{0,80}/gi,
]) {
  const m = [...html.matchAll(re)].slice(0, 20);
  if (m.length) console.log(re.source, m.map((x) => x[1] || x[0]).slice(0, 8));
}
