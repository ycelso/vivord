/**
 * Verifica que Recientes (radios) muestre máx. 3 emisoras en una sola fila.
 */
import WebSocket from 'ws';
import { execSync } from 'child_process';

const CDP = 'http://127.0.0.1:9222';
const ADB = `${process.env.LOCALAPPDATA}/Android/Sdk/platform-tools/adb.exe`;

function adb(...args) {
  return execSync(`${ADB} -s emulator-5554 ${args.join(' ')}`, { encoding: 'utf8' }).trim();
}

function ensureCdpForward() {
  try {
    fetch(`${CDP}/json/list`).then((r) => r.json());
    return;
  } catch {
    /* re-forward below */
  }
  const out = adb('shell cat /proc/net/unix');
  const line = out.split('\n').find((l) => l.includes('webview_devtools_remote'));
  if (!line) throw new Error('Sin socket webview_devtools_remote — abre la app debug');
  const sock = line.split('@').pop().trim();
  try {
    adb('forward --remove tcp:9222');
  } catch {
    /* ok if missing */
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
  console.error('Sin WebView localhost — abre la app en radios.html');
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

await send('Page.navigate', { url: 'https://localhost/radios.html' });
await sleep(5000);

const seedResult = await evaluate(`
  (function(){
    var KEY = 'vivord:user-state:v1';
    var radios = [
      { slug: 'test-r1', name: 'Test R1', img: '', url: './radio/test-r1.html', t: 5 },
      { slug: 'test-r2', name: 'Test R2', img: '', url: './radio/test-r2.html', t: 4 },
      { slug: 'test-r3', name: 'Test R3', img: '', url: './radio/test-r3.html', t: 3 },
      { slug: 'test-r4', name: 'Test R4', img: '', url: './radio/test-r4.html', t: 2 },
      { slug: 'test-r5', name: 'Test R5', img: '', url: './radio/test-r5.html', t: 1 }
    ];
    localStorage.setItem(KEY, JSON.stringify({ recent: { tv: [], radio: radios } }));
    document.dispatchEvent(new CustomEvent('vivord:recent-changed', { detail: { kind: 'radio' } }));
    return 'seeded';
  })()
`);

if (seedResult !== 'seeded') fail('Seed recientes', String(seedResult));
else ok('Seed 5 recientes en localStorage');

await sleep(500);

const metrics = await evaluate(`
  (function(){
    var KEY = 'vivord:user-state:v1';
    var st = JSON.parse(localStorage.getItem(KEY) || '{}');
    var stored = (st.recent && st.recent.radio) ? st.recent.radio.length : 0;
    var grid = document.getElementById('recentRadiosGrid');
    var section = document.getElementById('recentRadiosSection');
    if (!grid) return JSON.stringify({ error: 'no grid' });
    var wraps = Array.from(grid.querySelectorAll('[data-recent-wrap="1"]'));
    var tops = wraps.map(function(w){ return Math.round(w.getBoundingClientRect().top); });
    var uniqueTops = tops.filter(function(t, i, a){ return a.indexOf(t) === i; });
    var cs = getComputedStyle(grid);
    return JSON.stringify({
      storedCount: stored,
      visibleCount: wraps.length,
      sectionHidden: section ? section.hasAttribute('hidden') : null,
      uniqueRowTops: uniqueTops.length,
      columns: cs.gridTemplateColumns,
      colCount: cs.gridTemplateColumns.split(' ').filter(Boolean).length,
      slugs: wraps.map(function(w){
        var btn = w.querySelector('[data-slug]');
        return btn ? btn.getAttribute('data-slug') : null;
      })
    });
  })()
`);

const m = JSON.parse(metrics);
console.log('Métricas:', m);

if (m.storedCount === 5) ok('Historial interno intacto', '5 en localStorage');
else fail('Historial interno intacto', `stored=${m.storedCount}`);

if (m.visibleCount === 3) ok('Solo 3 visibles en UI', m.slugs?.join(', '));
else fail('Solo 3 visibles en UI', `visible=${m.visibleCount} slugs=${JSON.stringify(m.slugs)}`);

if (m.uniqueRowTops === 1) ok('Una sola fila', `tops=${m.uniqueRowTops}`);
else fail('Una sola fila', `tops distintos=${m.uniqueRowTops}`);

if (!m.sectionHidden) ok('Sección Recientes visible');
else fail('Sección Recientes visible', 'hidden');

if (m.slugs && m.slugs[0] === 'test-r1' && m.slugs[2] === 'test-r3') {
  ok('Orden más reciente primero', m.slugs.join(' → '));
} else {
  fail('Orden más reciente primero', JSON.stringify(m.slugs));
}

ws.close();

adb(`exec-out screencap -p > "${process.env.TEMP}\\vivord-radio-recents.png"`);
console.log(`Screenshot: ${process.env.TEMP}\\vivord-radio-recents.png`);

const passed = results.filter((r) => r.pass).length;
console.log(`\n=== ${passed}/${results.length} pruebas OK ===`);
process.exit(passed === results.length ? 0 : 1);
