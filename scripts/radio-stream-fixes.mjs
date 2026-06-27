/** Radios extra que no vienen en la fuente original (canalesdominicanos.live). */
export const EXTRA_RADIOS = [
  {
    slug: 'mortal1049',
    name: 'Mortal 104.9 FM',
    img: './assets/media/radios/mortal1049.webp',
    stream: 'https://n10.radiojar.com/x84tcy2wm2zuv',
    streamType: 'audio/mpeg',
    city: 'Santo Domingo',
    description:
      '<p>Escucha <b>Mortal 104.9 FM en vivo</b>, emisora urbana de Santo Domingo. Reggaetón, dembow y hip hop 24/7.</p>',
    featured: true,
  },
];

/** URLs de stream verificadas (Zeno API, emisora oficial, etc.). */
export const RADIO_STREAM_FIXES = {
  lakalle963: {
    stream: 'https://radio.telemicro.com.do/lakallelavega',
    streamType: 'audio/mpeg',
    streamReferer: 'https://emisorastelemicro.com/',
  },
  kiss: {
    stream: 'https://stream.zeno.fm/hv8e2ms3v7zuv',
    streamType: 'audio/mpeg',
    streamReferer: 'https://www.kiss949.com/',
  },
  larocka: {
    stream: 'https://stream.zeno.fm/x1ussc8gtnhvv',
    streamType: 'audio/mpeg',
    streamReferer: 'https://larocka917.com/',
    zenoSlug: 'la-rocka-91-7',
  },
  '1001fm': {
    stream: 'https://1001.do/live',
    streamType: 'audio/mpeg',
    streamReferer: 'https://1001.do/escuchar/',
    description:
      '<p>Escucha <b>100.1 FM Santo Domingo en vivo</b>, la emisora de hits, pop, dance y urbano las 24 horas. Programación en directo desde la capital dominicana.</p>',
  },
  puravida: {
    stream: 'https://cast10.plugstreaming.com/stream/pvsdq',
    streamType: 'audio/aacp',
    streamReferer: 'https://puravidafm.net/',
  },
  superq: {
    stream: 'http://cast10.plugstreaming.com:8060/stream',
    streamType: 'audio/aacp',
    streamReferer: 'https://superqfm.net/',
  },
};

export function applyRadioStreamFixes(radios) {
  const out = radios.map((r) => {
    const fix = RADIO_STREAM_FIXES[r.slug];
    if (!fix) return r;
    const merged = { ...r, ...fix };
    if (!('zenoSlug' in fix)) delete merged.zenoSlug;
    return merged;
  });

  const existing = new Set(out.map((r) => r.slug));
  for (const extra of EXTRA_RADIOS) {
    if (!extra?.slug || existing.has(extra.slug)) continue;
    out.push({ ...extra });
  }

  return out;
}
