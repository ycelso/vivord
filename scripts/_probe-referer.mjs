import https from 'node:https';

const tests = [
  ['ritmo96 zenolive', 'https://stream.zenolive.com/y0br5ck4ququv', 'https://ritmo96.com/'],
  ['la91 zeno', 'https://stream.zeno.fm/859cd7buqg8uv', 'https://la91fm.com/'],
  ['ritmo no ref', 'https://stream.zenolive.com/y0br5ck4ququv', null],
];

function head(url, referer) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Icy-MetaData': '0',
          ...(referer ? { Referer: referer, Origin: new URL(referer).origin } : {}),
        },
      },
      (res) => {
        resolve({
          status: res.statusCode,
          type: res.headers['content-type'],
          location: res.headers.location,
        });
        res.resume();
      }
    );
    req.on('error', reject);
    req.end();
  });
}

for (const [name, url, ref] of tests) {
  try {
    const r = await head(url, ref);
    console.log(name, ref || '(none)', r);
  } catch (e) {
    console.log(name, e.message);
  }
}
