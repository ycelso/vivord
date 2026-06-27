import { spawn } from 'node:child_process';

/** Solo para scripts locales en Node (no usar en Workers). */
export function curlFetch(url, extraHeaders = {}) {
  const bin = process.platform === 'win32' ? 'curl.exe' : 'curl';
  const origin = (() => {
    try {
      return new URL(url).origin + '/';
    } catch {
      return 'https://www.dailymotion.com/';
    }
  })();
  const headers = {
    Referer: origin,
    Origin: origin.replace(/\/$/, ''),
    ...extraHeaders,
  };
  const args = [
    '-sL',
    '--max-time',
    '45',
    '-A',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  ];
  for (const [k, v] of Object.entries(headers)) {
    args.push('-H', `${k}: ${v}`);
  }
  args.push(url);

  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { windowsHide: true });
    const chunks = [];
    const err = [];
    proc.stdout.on('data', (d) => chunks.push(d));
    proc.stderr.on('data', (d) => err.push(d));
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`curl ${code}: ${Buffer.concat(err).toString('utf8').slice(0, 200)}`));
        return;
      }
      resolve(Buffer.concat(chunks));
    });
  });
}
