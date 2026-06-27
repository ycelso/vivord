/**
 * Sube AAB a Play Console usando perfil Edge persistente (sin extensión MCP).
 * Requiere sesión activa: npm run browser:login:play
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PROFILE = process.env.PLAYWRIGHT_PROFILE_DIR
  || path.join(process.env.USERPROFILE || process.env.HOME || ROOT, '.cursor', 'playwright-profile', 'msedge');

const version = process.argv[2] || '1.0.10';
const aabPath = path.join(ROOT, 'dist', 'android-release', `vivord-${version}.aab`);
const notesPath = path.join(ROOT, 'dist', 'android-release', `PLAY-STORE-NOTES-${version}.txt`);

const PRODUCTION_PREPARE_URL =
  'https://play.google.com/console/u/0/developers/5128434565666649650/app/4972310708423508362/tracks/4697976229765189255/releases/3/prepare';

function extractReleaseNotes(raw) {
  const lines = raw.split(/\r?\n/);
  const bullets = [];
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('•')) bullets.push(t);
  }
  return bullets.join('\n');
}

if (!fs.existsSync(aabPath)) {
  console.error('AAB no encontrado:', aabPath);
  process.exit(1);
}

const releaseNotes = fs.existsSync(notesPath)
  ? extractReleaseNotes(fs.readFileSync(notesPath, 'utf8'))
  : `• Mejoras de estabilidad (v${version})`;

console.log('Perfil:', PROFILE);
console.log('AAB:', aabPath);
console.log('Notas:', releaseNotes.replace(/\n/g, ' | '));

const context = await chromium.launchPersistentContext(PROFILE, {
  channel: 'msedge',
  headless: false,
  viewport: null,
  args: ['--start-maximized'],
});

const page = context.pages()[0] || (await context.newPage());

try {
  await page.goto(PRODUCTION_PREPARE_URL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForTimeout(3000);

  if (await page.getByText('Inicia sesión').isVisible().catch(() => false)) {
    throw new Error('No hay sesión en Play Console. Ejecuta: npm run browser:login:play');
  }

  const uploaded = page.locator('text=11 (1.0.10)').or(page.locator('text=1.0.10'));
  if (!(await uploaded.first().isVisible().catch(() => false))) {
    const uploadBtn = page.getByRole('button', { name: 'Subir' });
    await uploadBtn.waitFor({ state: 'visible', timeout: 60_000 });
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 30_000 }),
      uploadBtn.click(),
    ]);
    await fileChooser.setFiles(aabPath);
    console.log('Subiendo AAB…');
    await page.getByText('11 (1.0.10)').or(page.getByText('1.0.10')).first()
      .waitFor({ state: 'visible', timeout: 180_000 });
    console.log('AAB procesado.');
  } else {
    console.log('AAB ya presente en la versión.');
  }

  const nameInput = page.getByRole('textbox', { name: 'Nombre de la versión' });
  await nameInput.waitFor({ state: 'visible', timeout: 30_000 });
  await nameInput.fill(`11 (${version})`);

  const notesBox = page.getByRole('textbox', { name: 'Notas de la versión' });
  await notesBox.click();
  await notesBox.fill(`<es-419>\n${releaseNotes}\n</es-419>`);

  const saveDraft = page.getByRole('button', { name: 'Guardar como borrador' });
  await saveDraft.waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForFunction(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('Guardar como borrador'));
    return btn && !btn.disabled;
  }, null, { timeout: 120_000 });
  await saveDraft.click();
  await page.waitForTimeout(2000);

  const nextBtn = page.getByRole('button', { name: 'Siguiente' });
  await nextBtn.waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForFunction(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('Siguiente'));
    return btn && !btn.disabled;
  }, null, { timeout: 60_000 });
  await nextBtn.click();
  await page.waitForTimeout(3000);

  const rollout = page.getByRole('button', { name: /Iniciar implementaci/i });
  if (await rollout.isVisible().catch(() => false)) {
    await rollout.click();
    const confirm = page.getByRole('button', { name: /Implementar|Confirmar|Iniciar/i }).last();
    if (await confirm.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirm.click();
    }
    console.log('Implementación iniciada en Producción.');
  } else {
    console.log('Borrador guardado. Revisa paso 2 en Play Console para publicar.');
  }

  console.log('Listo. URL:', page.url());
} catch (err) {
  console.error('Error:', err.message);
  process.exitCode = 1;
} finally {
  await page.waitForTimeout(5000);
  await context.close();
}
