const urls = [
  'https://telesistema11.com.do/en-vivo/',
  'https://www.telesistema11.com.do/en-vivo/',
];
for (const url of urls) {
  try {
    const html = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
    const hits = [...html.matchAll(/https?:\/\/[^\s"'<>]+/g)]
      .map((m) => m[0])
      .filter((u) => /dailymotion|m3u8|vimeo|youtube|embed|live|stream|player/i.test(u));
    console.log('\n==', url);
    [...new Set(hits)].slice(0, 20).forEach((u) => console.log(' ', u));
  } catch (e) {
    console.log(url, e.message);
  }
}
