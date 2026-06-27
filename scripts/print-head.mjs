import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const head = html.split('<head>')[1]?.split('</head>')[0] || '';
const lines = head
  .split(/\n/)
  .map((l) => l.trim())
  .filter(
    (l) =>
      l.includes('og:image') ||
      l.includes('twitter:image') ||
      l.includes('rel="icon"') ||
      l.includes('apple-touch-icon')
  );

console.log(lines.join('\n'));

