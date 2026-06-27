/**
 * Genera capturas de Play Store sin banner AdMob.
 * Compila APK debug con ADMOB_BANNER_ENABLED=false, instala en emulador y guarda PNGs.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ANDROID = path.join(ROOT, 'android');
const NATIVE_JS = path.join(ROOT, 'assets', 'js', 'capacitor-native.js');
const OUT_DIR = path.join(ROOT, 'dist', 'play-store', 'screenshots');
const DEBUG_APK = path.join(ANDROID, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const ADB = path.join(
  process.env.LOCALAPPDATA || '',
  'Android',
  'Sdk',
  'platform-tools',
  process.platform === 'win32' ? 'adb.exe' : 'adb'
);
const EMU = path.join(
  process.env.LOCALAPPDATA || '',
  'Android',
  'Sdk',
  'emulator',
  process.platform === 'win32' ? 'emulator.exe' : 'emulator'
);

const FLAG_ON = 'var ADMOB_BANNER_ENABLED = true;';
const FLAG_OFF = 'var ADMOB_BANNER_ENABLED = false;';
const CAPTURE_ON = 'var PLAY_STORE_CAPTURE_MODE = true;';
const CAPTURE_OFF = 'var PLAY_STORE_CAPTURE_MODE = false;';

function setCaptureFlags(captureMode) {
  let src = fs.readFileSync(NATIVE_JS, 'utf8');
  src = src.replace(captureMode ? FLAG_ON : FLAG_OFF, captureMode ? FLAG_OFF : FLAG_ON);
  src = src.replace(captureMode ? CAPTURE_OFF : CAPTURE_ON, captureMode ? CAPTURE_ON : CAPTURE_OFF);
  fs.writeFileSync(NATIVE_JS, src);
}

function javaHome() {
  const candidates = [
    process.env.JAVA_HOME,
    'C:\\Program Files\\Android\\Android Studio\\jbr',
  ].filter(Boolean);
  for (const c of candidates) {
    const java = path.join(c, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
    if (fs.existsSync(java)) return c;
  }
  return process.env.JAVA_HOME || '';
}

function run(cmd, args, cwd = ROOT, env = {}) {
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, JAVA_HOME: javaHome(), ...env },
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

function adb(...args) {
  const r = spawnSync(ADB, args, { encoding: 'utf8' });
  if (r.status !== 0) {
    const msg = r.stderr || r.stdout || `adb ${args.join(' ')} falló`;
    throw new Error(msg.trim());
  }
  return (r.stdout || '').trim();
}

function sleep(ms) {
  return delay(ms);
}

async function ensureEmulator() {
  const devices = adb('devices');
  if (/emulator-\d+\s+device/.test(devices)) return;

  if (!fs.existsSync(EMU)) {
    console.error('No hay emulador en ejecución. Abre uno en Android Studio.');
    process.exit(1);
  }

  const list = spawnSync(EMU, ['-list-avds'], { encoding: 'utf8' });
  const avd = (list.stdout || '').trim().split('\n')[0];
  if (!avd) {
    console.error('No hay AVD configurado.');
    process.exit(1);
  }

  console.log(`Iniciando emulador ${avd}…`);
  spawnSync(EMU, ['-avd', avd, '-no-boot-anim'], { detached: true, stdio: 'ignore' });
  adb('wait-for-device');
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (adb('shell', 'getprop', 'sys.boot_completed') === '1') break;
    await sleep(3000);
  }
}

function capture(name) {
  const dest = path.join(OUT_DIR, name);
  adb('shell', 'screencap', '-p', '/sdcard/vivord_cap.png');
  adb('pull', '/sdcard/vivord_cap.png', dest);
  adb('shell', 'rm', '/sdcard/vivord_cap.png');
  console.log(`  → ${name}`);
}

async function dismissLaunchDialogs() {
  await sleep(1500);
  adb('shell', 'input', 'tap', '540', '1280');
  await sleep(800);
  adb('shell', 'input', 'tap', '540', '1280');
  await sleep(800);
}

async function navigateAndCapture() {
  adb('shell', 'am', 'force-stop', 'com.vivord.app');
  adb('shell', 'pm', 'clear', 'com.vivord.app');
  adb('shell', 'am', 'start', '-n', 'com.vivord.app/.MainActivity');
  await sleep(4000);
  await dismissLaunchDialogs();
  await sleep(1500);

  capture('01-inicio.png');

  adb('shell', 'input', 'tap', '780', '395');
  await sleep(2500);
  capture('02-radios.png');

  adb('shell', 'input', 'swipe', '540', '1800', '540', '900', '400');
  await sleep(1200);
  capture('03-radios-scroll.png');

  adb('shell', 'input', 'tap', '300', '395');
  await sleep(2000);
  adb('shell', 'input', 'swipe', '540', '1200', '540', '400', '350');
  await sleep(1000);
  capture('04-tv-scroll.png');
}

async function main() {
  if (!fs.existsSync(ADB)) {
    console.error('ADB no encontrado. Instala Android SDK platform-tools.');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('Activando modo captura (sin anuncios ni changelog)…');
  setCaptureFlags(true);

  try {
    console.log('Sincronizando web + Capacitor…');
    run('npm', ['run', 'build:quick']);
    run('npm', ['run', 'build:radios:quick']);
    run('npm', ['run', 'android:sync']);

    console.log('Compilando APK debug…');
    const gradlew = path.join(ANDROID, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
    run(gradlew, ['assembleDebug'], ANDROID, { JAVA_HOME: javaHome() });

    await ensureEmulator();
    console.log('Instalando APK sin anuncios…');
    adb('uninstall', 'com.vivord.app');
    adb('install', DEBUG_APK);

    console.log('Capturando pantallas…');
    await navigateAndCapture();

    console.log(`\nListo: ${OUT_DIR}`);
  } finally {
    console.log('Restaurando flags de captura…');
    setCaptureFlags(false);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
