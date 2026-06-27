const slugs = ['ritmo96', 'la91', 'disco106', 'z101', 'hits', 'kq94'];

async function fromSource(slug) {
  const res = await fetch(`https://canalesdominicanos.live/radio/${slug}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VivoRD/1.0)' },
  });
  const html = await res.text();
  const m = html.match(/<source src="([^"]+)"(?:\s+type="([^"]+)")?/);
  return { stream: m?.[1], streamType: m?.[2] };
}

async function probe(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Icy-MetaData': '0' },
    });
    return {
      status: res.status,
      type: res.headers.get('content-type'),
      final: res.url,
    };
  } catch (e) {
    return { error: e.message };
  }
}

const data = JSON.parse(
  await (await import('node:fs/promises')).readFile('data/radios-all.json', 'utf8')
);

for (const slug of slugs) {
  const stored = data.radios.find((r) => r.slug === slug);
  const live = await fromSource(slug);
  console.log('\n===', slug, '===');
  console.log('stored', stored?.stream);
  console.log('source', live.stream, live.streamType);
  console.log('probe stored', await probe(stored?.stream));
  if (live.stream && live.stream !== stored?.stream) {
    console.log('probe source', await probe(live.stream));
  }
}
