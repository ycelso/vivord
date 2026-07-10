/**
 * Check del loader de Adsterra: `node scripts/adsterra.test.mjs`
 * Lo crítico es que el script de Adsterra NUNCA se inyecte en la app nativa
 * (mezclarlo con AdMob en el WebView puede costar la cuenta de AdMob)
 * ni antes del consentimiento de cookies.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = 'https://pl12345.profitablecpmgate.com/ab/cd/ef/invoke.js';
const code = fs.readFileSync(path.join(ROOT, 'assets/js/adsterra.js'), 'utf8');

/** Ejecuta adsterra.js en un DOM falso y devuelve los scripts inyectados. */
function run({ native = false, consent = null, fireConsentEvent = false } = {}) {
  const injected = [];
  const listeners = {};
  const scriptTag = { getAttribute: (a) => (a === 'data-adsterra-src' ? SRC : null) };

  const sandbox = {
    window: { VIVORD_IS_NATIVE: native },
    localStorage: { getItem: (k) => (k === 'vivord_cookie_consent' ? consent : null) },
    document: {
      currentScript: scriptTag,
      querySelector: () => scriptTag,
      body: { appendChild: (s) => injected.push(s) },
      addEventListener: (name, fn) => { (listeners[name] ||= []).push(fn); },
      createElement: () => ({ attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } }),
    },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  if (fireConsentEvent) {
    for (const fn of listeners['vivord:ads-consent'] || []) fn({ detail: { granted: true } });
  }
  return injected;
}

// 1. App nativa: jamás inyectar, aunque haya consentimiento.
assert.equal(run({ native: true, consent: 'accepted' }).length, 0, 'nativo no debe inyectar');
assert.equal(run({ native: true, consent: 'accepted', fireConsentEvent: true }).length, 0, 'nativo ignora el evento');

// 2. Web sin consentimiento: no inyectar.
assert.equal(run({ consent: null }).length, 0, 'sin consentimiento no inyecta');
assert.equal(run({ consent: 'rejected' }).length, 0, 'rechazado no inyecta');

// 3. Web con consentimiento previo: inyecta una vez, con el src y async.
const ok = run({ consent: 'accepted' });
assert.equal(ok.length, 1, 'con consentimiento inyecta');
assert.equal(ok[0].src, SRC);
assert.equal(ok[0].async, true);
assert.equal(ok[0].attrs['data-cfasync'], 'false');

// 4. Consentimiento durante la sesión: inyecta al recibir el evento, sin duplicar.
assert.equal(run({ consent: 'accepted', fireConsentEvent: true }).length, 1, 'no duplica');

// 5. Acepta en modo privado: localStorage no persiste, pero el evento sí llega.
assert.equal(run({ consent: null, fireConsentEvent: true }).length, 1, 'el evento basta como consentimiento');

// 6. El guard nativo gana sobre el evento incluso en modo privado.
assert.equal(run({ native: true, consent: null, fireConsentEvent: true }).length, 0, 'nativo gana siempre');

console.log('OK — adsterra: nunca en app nativa, nunca sin consentimiento, nunca duplicado');
