/**
 * Vincula vivo-rd.com al proyecto Pages vivord2.
 *
 * Opción A (recomendada): panel Cloudflare → Pages → vivord2 → Custom domains
 *
 * Opción B: token API con permiso "Cloudflare Pages · Edit"
 *   set CLOUDFLARE_API_TOKEN=...
 *   node scripts/cloudflare-domain.mjs
 */
import { SITE_URL } from './site-config.mjs';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '0bbe0f2133c2dbde18cba6a4506e7279';
const PROJECT = process.env.CLOUDFLARE_PAGES_PROJECT || 'vivord2';
const DOMAINS = ['vivo-rd.com', 'www.vivo-rd.com'];
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

const host = new URL(SITE_URL).hostname;

async function api(path, init = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const data = await res.json();
  if (!data.success) {
    const msg = data.errors?.map((e) => e.message).join('; ') || res.statusText;
    throw new Error(msg);
  }
  return data.result;
}

async function listDomains() {
  return api(`/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}/domains`);
}

async function addDomain(name) {
  return api(`/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}/domains`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

function printDashboardSteps() {
  console.log(`
=== Vincular ${host} a Cloudflare Pages ===

1. Entra en https://dash.cloudflare.com
2. Si ${host} NO está en tu cuenta:
   - "Add a site" → ${host} → plan Free
   - Cambia los nameservers en tu registrador a los que indique Cloudflare
3. Workers & Pages → Pages → proyecto "${PROJECT}"
4. Custom domains → Set up a custom domain
5. Añade: ${DOMAINS.join('  y  ')}
6. Espera estado "Active" (SSL puede tardar unos minutos)
7. Prueba: ${SITE_URL}/

Proyecto Pages actual: https://${PROJECT}.pages.dev
Cuenta (wrangler whoami): ${ACCOUNT_ID}

Sigue editando en este repo y despliega con: npm run pages:deploy
`);
}

async function main() {
  if (!TOKEN) {
    printDashboardSteps();
    console.log('Tip: con CLOUDFLARE_API_TOKEN puedes ejecutar este script para añadir dominios por API.\n');
    return;
  }

  const existing = await listDomains();
  const names = new Set((existing || []).map((d) => d.name));

  for (const name of DOMAINS) {
    if (names.has(name)) {
      console.log(`OK ya existe: ${name}`);
      continue;
    }
    try {
      await addDomain(name);
      console.log(`Añadido: ${name}`);
    } catch (e) {
      console.warn(`No se pudo añadir ${name}:`, e.message);
    }
  }

  console.log('\nDominios del proyecto:');
  for (const d of await listDomains()) {
    console.log(`  - ${d.name} (${d.status || 'pending'})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
