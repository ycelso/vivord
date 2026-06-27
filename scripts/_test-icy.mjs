const urls = [
  'https://stream.zeno.fm/eym18zp7cyptv',
  'https://n10.radiojar.com/x84tcy2wm2zuv',
  'https://radio.yaservers.com:9990/stream?icy=http',
];
for (const url of urls) {
  const res = await fetch(url, {
    headers: { 'Icy-MetaData': '1', 'User-Agent': 'Mozilla/5.0' },
    redirect: 'follow',
  });
  console.log('\n', url);
  console.log('icy-name', res.headers.get('icy-name'));
  console.log('icy-metaint', res.headers.get('icy-metaint'));
  console.log('icy-br', res.headers.get('icy-br'));
  res.body?.cancel();
}
