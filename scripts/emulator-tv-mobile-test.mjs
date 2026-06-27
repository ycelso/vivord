/**
 * Verifica grid 3 columnas y recientes (máx. 3) en index.html — TV en vivo.
 */
import WebSocket from 'ws';
import { execSync } from 'child_process';

const CDP = 'http://127.0.0.1:9222';
const ADB = `${process.env.LOCALAPPDATA}/Android/Sdk/platform-tools/adb.exe`;

function adb(...args) {
  return execSync(`${ADB} -s emulator-5554 ${args.join(' ')}`, { encoding: 'utf8' }).trim();
}

function ensureCdpForward() {
  const out = adb('shell cat /proc/net/unix');
  const line = out.split('\n').find((l) => l.includes('webview_devtools_remote'));
  if (!line) throw new Error('Sin socket webview_devtools_remote — abre la app debug');
  const sock = line.split('@').pop().trim();
  try {
    adb('forward --remove tcp:9222');
  } catch {
    /* ok */
  }
  adb(`forward tcp:9222 localabstract:${sock}`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const results = [];
const ok = (n, d) => {
  results.push({ pass: true, n, d });
  console.log(`PASS  ${n}${d ? ': ' + d : ''}`);
};
const fail = (n, d) => {
  results.push({ pass: false, n, d });
  console.log(`FAIL  ${n}${d ? ': ' + d : ''}`);
};

ensureCdpForward();

let list;
try {
  list = await fetch(`${CDP}/json/list`).then((r) => r.json());
} catch (e) {
  console.error('CDP no disponible:', e.message);
  process.exit(2);
}

const page = list.find((p) => p.type === 'page' && /localhost/i.test(p.url));
if (!page) {
  console.error('Sin WebView localhost');
  process.exit(2);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.on('open', r));
let id = 0;
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const i = ++id;
    const t = setTimeout(() => reject(new Error('timeout')), 30000);
    ws.on('message', function h(raw) {
      const msg = JSON.parse(raw.toString());
      if (msg.id === i) {
        clearTimeout(t);
        ws.off('message', h);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      }
    });
    ws.send(JSON.stringify({ id: i, method, params }));
  });

const evaluate = (expression) =>
  send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }).then(
    (r) => r.result?.value
  );

await send('Page.navigate', { url: 'https://localhost/index.html' });
await sleep(7000);

const gridMetrics = await evaluate(`
  (function(){
    var grid = document.getElementById('priorityChannels') || document.querySelector('.channel-grid');
    if (!grid) return JSON.stringify({ error: 'no grid' });
    var cs = getComputedStyle(grid);
    var card = grid.querySelector('.channel-card');
    var name = card && card.querySelector('.channel-name');
    return JSON.stringify({
      viewport: window.innerWidth + 'x' + window.innerHeight,
      columns: cs.gridTemplateColumns,
      colCount: cs.gridTemplateColumns.split(' ').filter(Boolean).length,
      gap: cs.gap,
      nameSize: name ? getComputedStyle(name).fontSize : null,
      cardsInFirstRow: Array.from(grid.children).filter(function(el){
        if (!card) return false;
        return el.getBoundingClientRect().top === card.getBoundingClientRect().top;
      }).length
    });
  })()
`);

const g = JSON.parse(gridMetrics);
console.log('Grid TV:', g);

if (g.colCount === 3 || g.cardsInFirstRow === 3) ok('Grid TV 3 columnas', `cols=${g.colCount} primeraFila=${g.cardsInFirstRow}`);
else fail('Grid TV 3 columnas', JSON.stringify(g));

if (parseFloat(g.nameSize) <= 13) ok('Texto canal compacto', g.nameSize);
else fail('Texto canal compacto', g.nameSize || 'n/a');

const seedResult = await evaluate(`
  (function(){
    var KEY = 'vivord:user-state:v1';
    var tv = [
      { slug: 'test-tv1', name: 'Test TV 1', img: '', url: './canal/test-tv1.html', t: 5 },
      { slug: 'test-tv2', name: 'Test TV 2', img: '', url: './canal/test-tv2.html', t: 4 },
      { slug: 'test-tv3', name: 'Test TV 3', img: '', url: './canal/test-tv3.html', t: 3 },
      { slug: 'test-tv4', name: 'Test TV 4', img: '', url: './canal/test-tv4.html', t: 2 },
      { slug: 'test-tv5', name: 'Test TV 5', img: '', url: './canal/test-tv5.html', t: 1 }
    ];
    localStorage.setItem(KEY, JSON.stringify({ recent: { tv: tv, radio: [] } }));
    document.dispatchEvent(new CustomEvent('vivord:recent-changed', { detail: { kind: 'tv' } }));
    return 'seeded';
  })()
`);

if (seedResult === 'seeded') ok('Seed 5 recientes TV');
else fail('Seed 5 recientes TV', String(seedResult));

await sleep(500);

const recentMetrics = await evaluate(`
  (function(){
    var KEY = 'vivord:user-state:v1';
    var st = JSON.parse(localStorage.getItem(KEY) || '{}');
    var stored = (st.recent && st.recent.tv) ? st.recent.tv.length : 0;
    var grid = document.getElementById('recentTvGrid');
    var section = document.getElementById('recentTvSection');
    if (!grid) return JSON.stringify({ error: 'no recent grid' });
    var wraps = Array.from(grid.querySelectorAll('[data-recent-wrap="1"]'));
    var tops = wraps.map(function(w){ return Math.round(w.getBoundingClientRect().top); });
    var uniqueTops = tops.filter(function(t, i, a){ return a.indexOf(t) === i; });
    return JSON.stringify({
      storedCount: stored,
      visibleCount: wraps.length,
      sectionHidden: section ? section.hasAttribute('hidden') : null,
      uniqueRowTops: uniqueTops.length,
      slugs: wraps.map(function(w){
        var btn = w.querySelector('[data-slug]');
        return btn ? btn.getAttribute('data-slug') : null;
      })
    });
  })()
`);

const r = JSON.parse(recentMetrics);
console.log('Recientes TV:', r);

if (r.storedCount === 5) ok('Historial TV interno intacto', '5 en localStorage');
else fail('Historial TV interno intacto', `stored=${r.storedCount}`);

if (r.visibleCount === 3) ok('Recientes TV solo 3 visibles', r.slugs?.join(', '));
else fail('Recientes TV solo 3 visibles', `visible=${r.visibleCount}`);

if (r.uniqueRowTops === 1) ok('Recientes TV una sola fila');
else fail('Recientes TV una sola fila', `tops=${r.uniqueRowTops}`);

if (!r.sectionHidden) ok('Sección Recientes TV visible');
else fail('Sección Recientes TV visible');

ws.close();

adb(`exec-out screencap -p > "${process.env.TEMP}\\vivord-tv-mobile.png"`);
console.log(`Screenshot: ${process.env.TEMP}\\vivord-tv-mobile.png`);

const passed = results.filter((x) => x.pass).length;
console.log(`\n=== ${passed}/${results.length} pruebas OK ===`);
process.exit(passed === results.length ? 0 : 1);
