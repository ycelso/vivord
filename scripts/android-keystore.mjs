/**
 * Crea el keystore de firma para Play Store (una sola vez).
 * Contraseñas por variables de entorno (no se guardan en el repo):
 *   KEYSTORE_PASSWORD, KEY_PASSWORD (opcional, misma que store)
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ANDROID = path.join(ROOT, 'android');
const RELEASE_DIR = path.join(ANDROID, 'release');
const KEYSTORE = path.join(RELEASE_DIR, 'vivord-upload.jks');
const PROPS = path.join(ANDROID, 'keystore.properties');
const ALIAS = 'vivord';

function javaHome() {
  const candidates = [
    process.env.JAVA_HOME,
    'C:\\Program Files\\Android\\Android Studio\\jbr',
    process.env.ANDROID_STUDIO_JBR,
  ].filter(Boolean);
  for (const c of candidates) {
    const keytool = path.join(c, 'bin', process.platform === 'win32' ? 'keytool.exe' : 'keytool');
    if (fs.existsSync(keytool)) return c;
  }
  return process.env.JAVA_HOME || '';
}

function promptHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function getPasswords() {
  let storePass = process.env.KEYSTORE_PASSWORD || '';
  let keyPass = process.env.KEY_PASSWORD || '';

  if (!storePass && process.stdin.isTTY) {
    storePass = await promptHidden('Contraseña del keystore (guárdala bien): ');
  }
  if (!keyPass) keyPass = storePass;

  if (!storePass) {
    console.error(
      'Define KEYSTORE_PASSWORD en PowerShell o ejecuta en una terminal interactiva.\n' +
        '  $env:KEYSTORE_PASSWORD="tu-contraseña-segura"'
    );
    process.exit(1);
  }
  return { storePass, keyPass };
}

async function main() {
  if (fs.existsSync(KEYSTORE)) {
    console.log(`Ya existe: ${path.relative(ROOT, KEYSTORE)}`);
    if (!fs.existsSync(PROPS)) {
      const { storePass, keyPass } = await getPasswords();
      writeProps(storePass, keyPass);
    } else {
      console.log(`Ya existe: ${path.relative(ROOT, PROPS)}`);
    }
    return;
  }

  const { storePass, keyPass } = await getPasswords();
  fs.mkdirSync(RELEASE_DIR, { recursive: true });

  const jhome = javaHome();
  const keytool = path.join(jhome, 'bin', process.platform === 'win32' ? 'keytool.exe' : 'keytool');
  if (!fs.existsSync(keytool)) {
    console.error('No se encontró keytool. Configura JAVA_HOME (JDK 17 de Android Studio).');
    process.exit(1);
  }

  const dname =
    'CN=VivoRD, OU=Mobile, O=VivoRD, L=Santo Domingo, ST=DN, C=DO';

  console.log('Creando keystore…');
  const r = spawnSync(
    keytool,
    [
      '-genkeypair',
      '-v',
      '-keystore',
      KEYSTORE,
      '-alias',
      ALIAS,
      '-keyalg',
      'RSA',
      '-keysize',
      '2048',
      '-validity',
      '10000',
      '-storepass',
      storePass,
      '-keypass',
      keyPass,
      '-dname',
      dname,
    ],
    { stdio: 'inherit' }
  );

  if (r.status !== 0) process.exit(r.status || 1);

  writeProps(storePass, keyPass);
  console.log(`\nKeystore: ${path.relative(ROOT, KEYSTORE)}`);
  console.log(`Config:   ${path.relative(ROOT, PROPS)}`);
  console.log('\n⚠️  Guarda las contraseñas y haz copia de seguridad del archivo .jks');
  console.log('    Si lo pierdes, no podrás actualizar la app en Play Store.');
}

function writeProps(storePass, keyPass) {
  const body = `storeFile=release/vivord-upload.jks
storePassword=${storePass}
keyAlias=${ALIAS}
keyPassword=${keyPass}
`;
  fs.writeFileSync(PROPS, body, 'utf8');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
