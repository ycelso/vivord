const html = await (
  await fetch('https://puravidafm.net/', { headers: { 'User-Agent': 'Mozilla/5.0' } })
).text();
for (const pat of [
  /presto-player[^>]+id=["'](\d+)["']/gi,
  /data-video-id=["'](\d+)["']/gi,
  /"provider_video_id":"([^"]+)"/gi,
  /wp:presto-player\/presto-player[^}]+}/gi,
]) {
  const m = [...html.matchAll(pat)];
  if (m.length) console.log(pat.source, m.slice(0, 3).map((x) => x[0].slice(0, 120)));
}
const r = await fetch('https://puravidafm.net/wp-json/presto-player/v1/player/1', {
  headers: { 'User-Agent': 'Mozilla/5.0' },
});
console.log('api', r.status, (await r.text()).slice(0, 300));
