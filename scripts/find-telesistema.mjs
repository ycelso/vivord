import fs from 'fs';
const j = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));
const hits = j.channels.filter(
  (c) =>
    /telesistema/i.test(c.name) ||
    /telesistema/i.test(c.slug) ||
    /telesistema/i.test(c.description || '')
);
console.log('hits', hits.length);
hits.forEach((c) => console.log(c.slug, c.stream?.slice(0, 80)));

const teleantillas = j.channels.find((c) => c.slug === 'teleantillas-canal-2');
console.log('teleantillas stream', teleantillas?.stream);
