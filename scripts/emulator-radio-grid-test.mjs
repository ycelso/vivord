/**
 * Verifica grid de 3 columnas en radios.html (móvil ≤480px).
 */
import WebSocket from 'ws';
import { execSync } from 'child_process';

const CDP = 'http://127.0.0.1:9222';
const ADB = `${process.env.LOCALAPPDATA}/Android/Sdk/platform-tools/adb.exe`;

function adb(...args) {
  return execSync(`${ADB} -s emulator-5554 ${args.join(' ')}`, { encoding: 'utf8' }).trim();
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

await send('Page.navigate', { url: 'https://localhost/radios.html' });
await sleep(6000);

const metrics = await evaluate(`
  (function(){
    var grid = document.querySelector('.radio-grid') || document.getElementById('priorityRadios');
    if (!grid) return JSON.stringify({ error: 'no grid' });
    var cs = getComputedStyle(grid);
    var card = grid.querySelector('.radio-card');
    var img = card && card.querySelector('.radio-card__img');
    var name = card && card.querySelector('.radio-card__name');
    return JSON.stringify({
      viewport: window.innerWidth + 'x' + window.innerHeight,
      columns: cs.gridTemplateColumns,
      colCount: cs.gridTemplateColumns.split(' ').filter(Boolean).length,
      gap: cs.gap,
      imgW: img ? getComputedStyle(img).width : null,
      nameSize: name ? getComputedStyle(name).fontSize : null,
      cardsInFirstRow: Array.from(grid.children).filter(function(el, i){
        if (!card) return false;
        return el.getBoundingClientRect().top === card.getBoundingClientRect().top;
      }).length
    });
  })()
`);

const m = JSON.parse(metrics);
console.log('Métricas:', m);

if (m.colCount === 3 || m.cardsInFirstRow === 3) ok('Grid 3 columnas', `cols=${m.colCount} primeraFila=${m.cardsInFirstRow}`);
else fail('Grid 3 columnas', JSON.stringify(m));

const imgPx = m.imgW ? parseFloat(m.imgW) : 0;
if (imgPx >= 52 && imgPx <= 74) ok('Icono tamaño móvil', m.imgW);
else fail('Icono tamaño móvil', m.imgW || 'n/a');

if (parseFloat(m.nameSize) <= 13) ok('Texto compacto', m.nameSize);
else fail('Texto compacto', m.nameSize);

ws.close();

adb(`exec-out screencap -p > "${process.env.TEMP}\\vivord-radio-3col.png"`);
console.log(`Screenshot: ${process.env.TEMP}\\vivord-radio-3col.png`);

const passed = results.filter((r) => r.pass).length;
console.log(`\n=== ${passed}/${results.length} pruebas OK ===`);
process.exit(passed === results.length ? 0 : 1);
