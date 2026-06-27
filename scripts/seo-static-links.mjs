import { escapeHtml } from './seo-head.mjs';

/**
 * Bloque HTML de enlaces internos visibles sin JS (rastreo e indexación).
 * @param {{ title: string, subtitle?: string, items: { href: string, name: string }[], crossLinks?: { href: string, label: string }[] }} opts
 */
export function buildSeoDiscoverSection({ title, subtitle, items, crossLinks = [] }) {
  if (!items?.length) return '';

  const links = items
    .map(
      (item) =>
        `        <li><a href="${escapeHtml(item.href)}">${escapeHtml(item.name)} en vivo</a></li>`
    )
    .join('\n');

  const cross =
    crossLinks.length > 0
      ? `\n    <p class="seo-discover__cross">${crossLinks
          .map(
            (c, i) =>
              `${i > 0 ? ' · ' : ''}<a href="${escapeHtml(c.href)}">${escapeHtml(c.label)}</a>`
          )
          .join('')}</p>`
      : '';

  const sub = subtitle
    ? `\n    <p class="seo-discover__sub">${escapeHtml(subtitle)}</p>`
    : '';

  return `
  <section class="seo-discover container" aria-label="${escapeHtml(title)}">
    <h2 class="seo-discover__title">${escapeHtml(title)}</h2>${sub}
    <nav class="seo-discover__nav" aria-label="Enlaces directos">
      <ul class="seo-discover__list">
${links}
      </ul>
    </nav>${cross}
  </section>`;
}

/** @param {{ slug: string, name: string }[]} items @param {string} basePath e.g. ./canal/ or ./radio/ */
export function toSeoLinkItems(items, basePath = './canal/') {
  return items.map((item) => ({
    href: `${basePath}${item.slug}.html`,
    name: item.name,
  }));
}
