const pages = [
  ['kiss949', 'https://www.kiss949.com/'],
  ['puravida', 'https://puravidafm.net/'],
  ['zeno-larocka', 'https://zeno.fm/radio/la-rocka-91-7/'],
];

for (const [name, url] of pages) {
  try {
    const html = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
    const streams = [
      ...html.matchAll(/https?:\/\/[^\s"'<>]+/g),
    ]
      .map((m) => m[0])
      .filter((u) => /stream|listen|radio|cast|zeno|mp3|m3u8|pls|:\d{4}/i.test(u));
    console.log('\n', name, 'hits:', [...new Set(streams)].slice(0, 10));
  } catch (e) {
    console.log(name, e.message);
  }
}
