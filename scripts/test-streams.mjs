const urls = [
  'http://mek4.mekstream.com/telesistema/smil:telesistema.smil/chunklist_w965232534_b464000.m3u8',
  'http://mek4.mekstream.com/telesistema/smil:telesistema.smil/chunklist_w547403028_b764000.m3u8',
  'http://mek4.mekstream.com/telesistema/smil:telesistema.smil/chunklist_w1084487987_b214000.m3u8',
  'http://mek4.mekstream.com/telesistema/smil:telesistema.smil/playlist.m3u8',
  'https://mek4.mekstream.com/telesistema/smil:telesistema.smil/playlist.m3u8',
];

for (const url of urls) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Referer: 'https://telesistema11.com.do/',
      },
      redirect: 'follow',
    });
    const text = (await res.text()).slice(0, 120);
    console.log(res.status, url.split('/').pop(), '->', text.replace(/\n/g, ' '));
  } catch (e) {
    console.log('ERR', url, e.message);
  }
}
