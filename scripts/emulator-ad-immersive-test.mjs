import WebSocket from 'ws';
import { execSync } from 'child_process';

const CDP = 'http://127.0.0.1:9222';
const ADB = `${process.env.LOCALAPPDATA}/Android/Sdk/platform-tools/adb.exe`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function nativeAdVisible() {
  execSync(`${ADB} -s emulator-5554 shell uiautomator dump /sdcard/ui-ad.xml`, { stdio: 'ignore' });
  const xml = execSync(`${ADB} -s emulator-5554 shell cat /sdcard/ui-ad.xml`, { encoding: 'utf8' });
  return /Test Ad/i.test(xml);
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
    return this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }).then(
      (r) => r.result?.value
    );
  }
  close() {
    this.ws.close();
  }
}

const list = await fetch(`${CDP}/json/list`).then((r) => r.json());
const page = list.find((p) => p.type === 'page' && /localhost/i.test(p.url));
const cdp = new Cdp(page.webSocketDebuggerUrl);
await cdp.connect();

await cdp.send('Page.navigate', { url: 'https://localhost/radio/zol.html' });
await sleep(10000);

const immersive = await cdp.evaluate('document.body.classList.contains("radio-immersive")');
const adImmersive = nativeAdVisible();
console.log(`Inmersivo=${immersive} | Banner en fullscreen=${adImmersive} → ${adImmersive ? 'FAIL' : 'OK'}`);

await cdp.evaluate('window.VivordRadioShell.minimizeToRadios()');
await sleep(8000);

const path = await cdp.evaluate('location.pathname');
const adRadios = nativeAdVisible();
console.log(`Path=${path} | Banner en radios=${adRadios} → ${adRadios ? 'OK' : 'WARN (puede tardar en cargar)'}`);

cdp.close();
process.exit(adImmersive ? 1 : 0);
