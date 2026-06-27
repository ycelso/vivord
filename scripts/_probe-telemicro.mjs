const q = process.argv[2] || 'telemicro en vivo';
const r = await fetch(
  `https://api.dailymotion.com/videos?search=${encodeURIComponent(q)}&limit=8&fields=id,title,live_status`
);
const j = await r.json();
for (const v of j.list || []) {
  const meta = await fetch(
    `https://www.dailymotion.com/player/metadata/video/${v.id}?embedder=${encodeURIComponent('https://telemicro.com.do/')}`,
    { headers: { 'User-Agent': 'Mozilla/5.0', Cookie: 'family_filter=off; ff=off' } }
  ).then((x) => x.json());
  const hls = meta?.qualities?.auto?.[0]?.url;
  console.log(v.id, v.live_status, v.title?.slice(0, 55), hls ? 'HLS' : '—');
}
