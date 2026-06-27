import { getTelesistemaMasterUrl, DM_HEADERS, fetchTelesistemaManifest } from './dm-stream.mjs';

const master = await getTelesistemaMasterUrl({ forceFresh: true });
console.log('url', master.slice(0, 90));
const r1 = await fetch(master, { headers: { ...DM_HEADERS, Accept: '*/*' } });
console.log('direct', r1.status, (await r1.text()).slice(0, 40));

try {
  const x = await fetchTelesistemaManifest();
  console.log('manifest fn', x.text.slice(0, 40));
} catch (e) {
  console.log('manifest fn fail', e.message);
}
