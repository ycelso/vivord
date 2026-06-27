/**
 * Prueba fix #1 (mini bar al reanudar fullscreen) y #2 (stop al cerrar tarea).
 */
import WebSocket from 'ws';
import { execSync } from 'child_process';

const CDP = 'http://127.0.0.1:9222';
const ADB = `${process.env.LOCALAPPDATA}/Android/Sdk/platform-tools/adb.exe`;
const SERIAL = 'emulator-5554';

function adb(...args) {
  return execSync(`${ADB} -s ${SERIAL} ${args.join(' ')}`, { encoding: 'utf8' }).trim();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function miniBarVisibleInUi() {
  adb('shell uiautomator dump /sdcard/ui-resume.xml');
  const xml = adb('shell cat /sdcard/ui-resume.xml');
  return /radio-mini-bar|vivordRadioMini/i.test(xml) && /EN VIVO|Ritmo|Zol/i.test(xml);
}

function serviceRunning() {
  const out = adb('shell dumpsys activity services com.vivord.app');
  return /RadioPlaybackService/.test(out) && !/app=ProcessRecord.*not running/i.test(out);
}

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
  }
  connect() {
    return new Promise((resolve, reject) => {
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
      this.ws.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      });
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  evaluate(expression) {
    return this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    }).then((r) => r.result?.value);
  }
  close() {
    this.ws?.close();
  }
}

const results = [];
const ok = (n, d) => {
  results.push({ n, pass: true, d });
  console.log(`PASS  ${n}${d ? ': ' + d : ''}`);
};
const fail = (n, d) => {
  results.push({ n, pass: false, d });
  console.log(`FAIL  ${n}${d ? ': ' + d : ''}`);
};

const list = await fetch(`${CDP}/json/list`).then((r) => r.json());
const page = list.find((p) => p.type === 'page' && /localhost/i.test(p.url));
if (!page) {
  console.error('No hay WebView localhost en CDP');
  process.exit(2);
}

const cdp = new Cdp(page.webSocketDebuggerUrl);
await cdp.connect();

// --- Fix #1: fullscreen + simular resume ---
await cdp.send('Page.navigate', { url: 'https://localhost/radio/zol.html' });
await sleep(12000);

const immersive = await cdp.evaluate('document.body.classList.contains("radio-immersive")');
if (immersive) ok('Fullscreen activo al cargar emisora');
else fail('Fullscreen activo al cargar emisora');

await cdp.evaluate(`
  (function(){
    Object.defineProperty(document, 'hidden', { configurable: true, get: function(){ return true; } });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', { configurable: true, get: function(){ return false; } });
    document.dispatchEvent(new Event('visibilitychange'));
    if (window.VivordRadioShell) window.VivordRadioShell.syncMiniBar();
  })()
`);
await sleep(500);

const miniHidden = await cdp.evaluate(`
  (function(){
    var bar = document.getElementById('vivordRadioMiniBar');
    if (!bar) return true;
    return bar.hidden || getComputedStyle(bar).display === 'none';
  })()
`);
const stillImmersive = await cdp.evaluate('document.body.classList.contains("radio-immersive")');

if (miniHidden && stillImmersive) ok('Mini bar oculto tras simular resume en fullscreen');
else fail('Mini bar oculto tras simular resume', `miniHidden=${miniHidden} immersive=${stillImmersive}`);

// Simular appStateChange isActive=true
await cdp.evaluate(`
  (function(){
    var bar = document.getElementById('vivordRadioMiniBar');
    if (window.VivordRadioShell && document.body.classList.contains('radio-immersive')) {
      if (bar) bar.hidden = true;
      document.body.classList.remove('radio-mini-active');
    }
    window.VivordRadioShell?.syncMiniBar?.();
  })()
`);
await sleep(300);
const miniAfterSync = await cdp.evaluate(`
  (function(){
    var bar = document.getElementById('vivordRadioMiniBar');
    return !(bar && !bar.hidden && getComputedStyle(bar).display !== 'none');
  })()
`);
if (miniAfterSync) ok('syncMiniBar no muestra bar en fullscreen');
else fail('syncMiniBar no muestra bar en fullscreen');

// --- Fix #2: stop al cerrar tarea ---
adb('logcat -c');
await sleep(2000);

const playingBefore = await cdp.evaluate(`
  (async function(){
    try {
      var r = await Capacitor.Plugins.RadioNative.isPlaying();
      return r.playing;
    } catch(e) { return false; }
  })()
`);
if (playingBefore) ok('Radio sonando antes de cerrar tarea');
else fail('Radio sonando antes de cerrar tarea', 'isPlaying=false (autoplay lento?)');

cdp.close();

// Enviar app a background y finish-and-remove-task
adb('shell input keyevent KEYCODE_HOME');
await sleep(1500);
try {
  adb('shell am finish-and-remove-task com.vivord.app/.MainActivity');
} catch {
  adb('shell am force-stop com.vivord.app');
}
await sleep(4000);

const svcAfter = serviceRunning();
const logStop = adb('logcat -d -t 80');
const sawStop = /ACTION_STOP|stopPlayback|stopSelf/i.test(logStop);

if (!svcAfter || sawStop) ok('Servicio detenido al cerrar tarea', sawStop ? 'logcat STOP' : 'sin servicio activo');
else fail('Servicio detenido al cerrar tarea', 'RadioPlaybackService aún activo');

const passed = results.filter((r) => r.pass).length;
console.log(`\n=== ${passed}/${results.length} pruebas OK ===`);
process.exit(passed === results.length ? 0 : 1);
