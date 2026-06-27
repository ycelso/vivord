/**
 * Prueba E2E del mini reproductor vía Chrome DevTools Protocol (WebView Android).
 * Requiere: emulador con app instalada, adb forward tcp:9222 localabstract:chrome_devtools_remote
 */
import WebSocket from 'ws';

const CDP = 'http://127.0.0.1:9222';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class Cdp {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.id = 0;
    this.pending = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
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

async function pickPage() {
  const list = await fetch(`${CDP}/json/list`).then((r) => r.json());
  const page =
    list.find((p) => p.type === 'page' && /localhost/i.test(p.url)) ||
    list.find((p) => p.type === 'page' && /vivord/i.test(p.title || '')) ||
    list.find((p) => p.type === 'page');
  if (!page) throw new Error('No WebView page in CDP list: ' + JSON.stringify(list));
  return page;
}

async function main() {
  const results = [];
  const ok = (name, detail) => {
    results.push({ name, pass: true, detail });
    console.log(`PASS  ${name}${detail ? ': ' + detail : ''}`);
  };
  const fail = (name, detail) => {
    results.push({ name, pass: false, detail });
    console.log(`FAIL  ${name}${detail ? ': ' + detail : ''}`);
  };

  let page;
  try {
    page = await pickPage();
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }

  const cdp = new Cdp(page.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');

  await cdp.send('Page.navigate', { url: 'https://localhost/radio/zol.html' });
  await sleep(8000);

  let path = await cdp.evaluate('location.pathname');
  if (!/\/radio\/zol\.html$/i.test(String(path))) {
    fail('Navegar a Zol FM', `pathname=${path}`);
  } else {
    ok('Navegar a Zol FM', path);
  }

  await sleep(12000);

  const immersive = await cdp.evaluate(
    'document.body.classList.contains("radio-immersive")'
  );
  if (immersive) ok('Modo inmersivo activo');
  else fail('Modo inmersivo activo', 'body sin clase radio-immersive');

  const headerHidden = await cdp.evaluate(
    'getComputedStyle(document.querySelector(".site-header")).display === "none"'
  );
  if (headerHidden) ok('Header oculto en inmersivo');
  else fail('Header oculto en inmersivo');

  const bootOrImmersive = await cdp.evaluate(
    'document.body.classList.contains("radio-immersive") || document.documentElement.classList.contains("radio-immersive-boot")'
  );
  if (bootOrImmersive) ok('Inmersivo activo al cargar (boot o body)');
  else fail('Inmersivo activo al cargar', 'sin radio-immersive ni boot');

  await new Promise((r) => setTimeout(r, 3000));

  const played = await cdp.evaluate(
    'JSON.stringify(window.Capacitor?.Plugins?.RadioNative ? "native" : "no-native")'
  );
  ok('Plugin RadioNative', played);

  await cdp.evaluate(`
    (function(){
      var btn = document.getElementById('radioMinimizeBtn');
      if (btn) btn.click();
      else if (window.VivordRadioShell) window.VivordRadioShell.minimizeToRadios();
    })()
  `);
  await sleep(5000);

  path = await cdp.evaluate('location.pathname');
  if (/\/radios\.html$/i.test(String(path))) ok('Minimizar → radios.html', path);
  else fail('Minimizar → radios.html', `pathname=${path}`);

  const miniVisible = await cdp.evaluate(`
    (function(){
      var bar = document.getElementById('vivordRadioMiniBar');
      if (!bar) return false;
      var s = getComputedStyle(bar);
      return s.display !== 'none' && s.visibility !== 'hidden';
    })()
  `);
  if (miniVisible) ok('Mini bar visible');
  else fail('Mini bar visible');

  const session = await cdp.evaluate('sessionStorage.getItem("vivord_radio_session")');
  if (session && /zol/i.test(String(session))) ok('Sesión guardada', 'slug zol');
  else fail('Sesión guardada', session || 'vacía');

  await cdp.evaluate(`
    (function(){
      var main = document.querySelector('#vivordRadioMiniBar .radio-mini-bar__main');
      if (main) main.click();
    })()
  `);
  await sleep(6000);

  path = await cdp.evaluate('location.pathname');
  if (/\/radio\/zol\.html$/i.test(String(path))) ok('Expandir mini bar → emisora', path);
  else fail('Expandir mini bar → emisora', `pathname=${path}`);

  await cdp.evaluate(`
    (function(){
      var btn = document.getElementById('radioMinimizeBtn');
      if (btn) btn.click();
    })()
  `);
  await sleep(4000);

  await cdp.send('Page.navigate', { url: 'https://localhost/radio/lakalle963.html' });
  await sleep(15000);

  path = await cdp.evaluate('location.pathname');
  if (/\/radio\/lakalle963\.html$/i.test(String(path))) ok('Cambiar emisora', path);
  else fail('Cambiar emisora', `pathname=${path}`);

  const session2 = await cdp.evaluate('sessionStorage.getItem("vivord_radio_session")');
  if (session2 && /lakalle963/i.test(String(session2)))
    ok('Sesión actualizada', 'lakalle963');
  else fail('Sesión actualizada', session2 || 'vacía');

  // Botón Atrás Android en modo inmersivo → minimizar
  await cdp.evaluate(`
    (function(){
      if (window.VivordRadioShell && document.body.classList.contains('radio-immersive')) {
        window.VivordRadioShell.handleBackButton();
      }
    })()
  `);
  await sleep(5000);

  path = await cdp.evaluate('location.pathname');
  if (/\/radios\.html$/i.test(String(path))) ok('Atrás → minimizar', path);
  else fail('Atrás → minimizar', `pathname=${path}`);

  // Simular volver a emisora fullscreen y resume (bug mini bar al reentrar)
  await cdp.send('Page.navigate', { url: 'https://localhost/radio/zol.html' });
  await sleep(8000);
  await cdp.evaluate(`
    (function(){
      document.body.classList.add('radio-immersive');
      if (window.VivordRadioShell) window.VivordRadioShell.syncMiniBar();
    })()
  `);
  await sleep(500);
  const miniOnFull = await cdp.evaluate(`
    (function(){
      var bar = document.getElementById('vivordRadioMiniBar');
      return !!(bar && !bar.hidden && getComputedStyle(bar).display !== 'none');
    })()
  `);
  if (!miniOnFull) ok('Mini bar oculto en fullscreen tras sync (resume)');
  else fail('Mini bar oculto en fullscreen tras sync', 'mini bar visible');

  cdp.close();

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log(`\n=== ${passed}/${total} pruebas OK ===`);
  process.exit(passed === total ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
