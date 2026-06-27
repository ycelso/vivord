import { serveProxy } from './proxy-handler.mjs';
import { setProxyAllowlist } from './proxy-security.mjs';

setProxyAllowlist(['5.135.183.124', '72.29.87.97', 'protvradiostream.com']);

const tests = [
  ['rocka', 'http://5.135.183.124:8243/;stream/1', 'https://larocka917.com/'],
  ['kiss-http', 'http://72.29.87.97:8015/stream', 'https://www.kiss949.com/'],
];
for (const [name, url, ref] of tests) {
  const res = await serveProxy(url, ref, '');
  console.log(name, res.status, res.headers.get('content-type'));
  res.body?.cancel?.();
}
