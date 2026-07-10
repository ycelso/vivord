import { spawnSync } from 'node:child_process';

/**
 * Deploy a Cloudflare Pages (rama de producción `main`).
 *
 * `--use-system-ca`: en Windows Node no confía en el almacén de certificados del
 * sistema, donde vive la CA del antivirus/proxy que intercepta TLS. Sin esto,
 * wrangler aborta la subida con SELF_SIGNED_CERT_IN_CHAIN. Sigue verificando la
 * cadena; no es NODE_TLS_REJECT_UNAUTHORIZED=0.
 */
const nodeOptions = [process.env.NODE_OPTIONS, '--use-system-ca'].filter(Boolean).join(' ');

const { status } = spawnSync(
  'npx',
  ['wrangler', 'pages', 'deploy', 'dist/vivord-pages',
   '--project-name=vivord2', '--branch=main', '--commit-dirty=true'],
  { stdio: 'inherit', shell: true, env: { ...process.env, NODE_OPTIONS: nodeOptions } },
);

process.exit(status ?? 1);
