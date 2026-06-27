/**
 * Compila APK y AAB firmados para Play Store.
 * Requiere: android/keystore.properties (npm run android:keystore)
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ANDROID = path.join(ROOT, 'android');
const PROPS = path.join(ANDROID, 'keystore.properties');
const OUT_APK = path.join(ANDROID, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const OUT_AAB = path.join(
  ANDROID,
  'app',
  'build',
  'outputs',
  'bundle',
  'release',
  'app-release.aab'
);
const DIST = path.join(ROOT, 'dist', 'android-release');

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

function run(cmd, args, cwd, env = {}) {
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, JAVA_HOME: javaHome(), ...env },
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

function main() {
  if (!fs.existsSync(PROPS)) {
    console.error('Falta android/keystore.properties');
    console.error('Ejecuta primero: npm run android:keystore');
    process.exit(1);
  }

  const jhome = javaHome();
  if (!jhome) {
    console.error('Configura JAVA_HOME (JDK 17, p. ej. Android Studio jbr).');
    process.exit(1);
  }

  console.log('Preparando assets de marca…');
  run('npm', ['run', 'brand:sync'], ROOT);
  run('npm', ['run', 'android:icons'], ROOT);

  console.log('Sincronizando web + Capacitor…');
  run('npm', ['run', 'android:sync'], ROOT);

  console.log('\nCompilando release (APK + AAB)…');
  const gradlew = path.join(ANDROID, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
  run(gradlew, ['bundleRelease', 'assembleRelease'], ANDROID, { JAVA_HOME: jhome });

  fs.mkdirSync(DIST, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const version = '1.0.10';
  const apkDest = path.join(DIST, `vivord-${version}.apk`);
  const aabDest = path.join(DIST, `vivord-${version}.aab`);
  const apkDated = path.join(DIST, `vivord-${stamp}.apk`);
  const aabDated = path.join(DIST, `vivord-${stamp}.aab`);

  if (fs.existsSync(OUT_APK)) {
    fs.copyFileSync(OUT_APK, apkDest);
    fs.copyFileSync(OUT_APK, apkDated);
    console.log(`\nAPK (instalar en el móvil): ${apkDest}`);
  }
  if (fs.existsSync(OUT_AAB)) {
    fs.copyFileSync(OUT_AAB, aabDest);
    fs.copyFileSync(OUT_AAB, aabDated);
    console.log(`AAB (subir a Play Console): ${aabDest}`);
  }

  console.log('\nInstalar en el teléfono (USB + depuración):');
  console.log(`  adb install -r "${apkDest}"`);
}

main();
