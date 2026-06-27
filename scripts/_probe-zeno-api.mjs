import { resolveZenoPlayUrl } from './proxy-handler.mjs';

async function testSlug(slug) {
  const meta = await fetch(`https://zeno.fm/api/stations/${slug}`);
  if (!meta.ok) return console.log(slug, 'api', meta.status);
  const { streamURL } = await meta.json();
  const play = await resolveZenoPlayUrl(streamURL, '');
  console.log(slug, streamURL, '->', play);
}

await testSlug('la-rocka-91-7');
await testSlug('pura-vida-fm');
await testSlug('kiss-94-9');
