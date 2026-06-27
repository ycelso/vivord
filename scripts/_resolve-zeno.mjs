import { curlFetch } from './dm-curl-node.mjs';

const RADIO_REFERERS = {
  ritmo96: 'https://ritmo96.com/',
  la91: 'https://la91fm.com/',
};

async function resolve(url, referer) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Icy-MetaData': '0',
    Accept: '*/*',
  };
  if (referer) {
    headers.Referer = referer;
    headers.Origin = new URL(referer).origin;
  }
  try {
    const res = await fetch(url, { headers, redirect: 'follow' });
    return { status: res.status, type: res.headers.get('content-type'), url: res.url };
  } catch (e) {
    return { error: e.message };
  }
}

async function curlHead(url, referer) {
  const args = ['-sI', '-L', '-A', 'Mozilla/5.0'];
  if (referer) args.push('-H', `Referer: ${referer}`, '-H', `Origin: ${new URL(referer).origin}`);
  args.push(url);
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const exec = promisify(execFile);
  try {
    const { stdout } = await exec('curl', args, { maxBuffer: 2e6 });
    const lines = stdout.split('\n');
    const status = lines.find((l) => l.startsWith('HTTP'))?.trim();
    const type = lines.find((l) => l.toLowerCase().startsWith('content-type:'))?.split(':').slice(1).join(':').trim();
    return { status, type };
  } catch (e) {
    return { error: String(e.stderr || e.message) };
  }
}

for (const [slug, ref] of Object.entries(RADIO_REFERERS)) {
  const data = JSON.parse(
    await (await import('node:fs/promises')).readFile('data/radios-all.json', 'utf8')
  );
  const r = data.radios.find((x) => x.slug === slug);
  console.log('\n===', slug, '===');
  console.log('fetch', await resolve(r.stream, ref));
  console.log('curl', await curlHead(r.stream, ref));
}
