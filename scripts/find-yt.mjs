import fs from 'fs';
const h = fs.readFileSync('_yt.html', 'utf8');
const ids = [...h.matchAll(/"channelId":"(UC[^"]+)"/g)].map((m) => m[1]);
const unique = [...new Set(ids)];
console.log('channelIds', unique);
const vids = [...h.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map((m) => m[1]);
console.log('videoIds sample', [...new Set(vids)].slice(0, 10));
