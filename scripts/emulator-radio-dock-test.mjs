/**
 * Verifica que el dock del reproductor no tenga línea de tiempo (live stream).
 */
import WebSocket from 'ws';
import { execSync } from 'child_process';

const CDP = 'http://127.0.0.1:9222';
const ADB = `${process.env.LOCALAPPDATA}/Android/Sdk/platform-tools/adb.exe`;
const RADIO_URL = 'https://localhost/radio/amanecer.html';

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

await send('Page.navigate', { url: RADIO_URL });
await sleep(5500);

const metrics = await evaluate(`
  (function(){
    var dock = document.querySelector('.radio-dock');
    if (!dock) return JSON.stringify({ error: 'no dock' });
    return JSON.stringify({
      url: location.pathname,
      timeline: !!dock.querySelector('.radio-dock__timeline'),
      timeLabel: !!dock.querySelector('.radio-dock__time'),
      track: !!dock.querySelector('.radio-dock__track'),
      liveLabel: !!dock.querySelector('.radio-dock__live-label'),
      toggle: !!document.getElementById('radioToggleBtn'),
      volume: !!document.getElementById('radioVolume'),
      livePill: !!document.getElementById('radioLivePill'),
      visualizer: !!document.getElementById('radioVisualizer'),
      immersive: document.documentElement.classList.contains('radio-immersive-boot') ||
        document.body.classList.contains('radio-immersive'),
      dockChildren: dock.querySelector('.radio-dock__center')?.children.length || 0
    });
  })()
`);

const m = JSON.parse(metrics);
console.log('Métricas:', m);

if (!m.timeline) ok('Sin .radio-dock__timeline');
else fail('Sin .radio-dock__timeline', 'aún presente');

if (!m.timeLabel && !m.track && !m.liveLabel) ok('Sin elementos 00:00 / track / EN VIVO del dock');
else fail('Sin elementos legacy del dock', JSON.stringify({ timeLabel: m.timeLabel, track: m.track, liveLabel: m.liveLabel }));

if (m.toggle) ok('Botón play/stop presente');
else fail('Botón play/stop presente');

if (m.volume) ok('Control de volumen presente');
else fail('Control de volumen presente');

if (m.livePill) ok('Pill En vivo presente');
else fail('Pill En vivo presente');

if (m.visualizer) ok('Visualizador presente');
else fail('Visualizador presente');

if (m.dockChildren === 1) ok('Dock center solo con toggle', 'children=' + m.dockChildren);
else fail('Dock center solo con toggle', 'children=' + m.dockChildren);

ws.close();

adb(`exec-out screencap -p > "${process.env.TEMP}\\vivord-radio-dock.png"`);
console.log(`Screenshot: ${process.env.TEMP}\\vivord-radio-dock.png`);

const passed = results.filter((r) => r.pass).length;
console.log(`\n=== ${passed}/${results.length} pruebas OK ===`);
process.exit(passed === results.length ? 0 : 1);
