/**
 * Abre Microsoft Edge (Playwright) con perfil persistente para iniciar sesión
 * en Google Play Console, AdMob, etc. Usa el mismo directorio que Playwright MCP.
 *
 * Uso:
 *   npm run browser:login
 *   npm run browser:login:play
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PROFILE = process.env.PLAYWRIGHT_PROFILE_DIR
  || path.join(process.env.USERPROFILE || process.env.HOME || ROOT, '.cursor', 'playwright-profile', 'msedge');
const DEFAULT_URL = 'https://play.google.com/console';

const url = process.argv[2] || DEFAULT_URL;

console.log('Perfil:', PROFILE);
console.log('URL:', url);
console.log('Inicia sesión en el navegador. Cierra la ventana cuando termines.\n');

const context = await chromium.launchPersistentContext(PROFILE, {
  channel: 'msedge',
  headless: false,
  viewport: null,
  args: ['--start-maximized'],
});

const page = context.pages()[0] || (await context.newPage());
await page.goto(url, { waitUntil: 'domcontentloaded' });

await new Promise((resolve) => context.on('close', resolve));
