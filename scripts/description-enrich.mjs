import { formatDescription, escapeHtml } from './description-format.mjs';
import { buildFactLeadParagraph, plainText, stationFacts, slugHash } from './station-facts.mjs';
import { paraphraseBodyHtml } from './description-paraphrase.mjs';

const DECIMAL_PLACEHOLDER = '\uE000';

/** Oración de cierre plantilla (inicio o cuerpo corto tipo CTA). */
const BOILERPLATE_SENTENCE =
  /^(?:Sintoniza\b|[Ss]intoniza\b|Sintonizar\b|¿Listo para\b|Conéctate\b|conéctate\b|Conecta con\b|Escucha\s+.+\s+en\s+vivo\b|Ver\s+.+\s+y\s+(?:descubre|mantente|vive)\b|deja que la\b|y deja que la\b|mantente al día\b|mantente conectad\b|vive la experiencia\b|descubre por qué\b|para disfrutar de la mejor\b|Si buscas una (?:radio|emisora|señal|estación)\b|Si estás en\b|¿Quieres\b.+\?)\s*/i;

const OPENING_REPLACEMENTS = [
  {
    re: /^(.+?)\s+transmite en vivo desde\b/i,
    replace: (m) => `${m[1]} emite en directo desde`,
  },
  {
    re: /^(.+?)\s+en vivo desde\b/i,
    replace: (m) => `${m[1]}, con base en`,
  },
  {
    re: /^Escuchar\s+(.+?)\s+en vivo es\b/i,
    replace: (m) => `La programación de ${m[1]} en directo es`,
  },
  {
    re: /^(.+?)\s+en vivo es (?:uno de los|la emisora|un[oa] de las|el canal|la estación)/i,
    slugReplace: (m, slug) => {
      const variants = [
        `${m[1]} destaca en el panorama radial dominicano como`,
        `${m[1]} ocupa un lugar en el dial de RD como`,
        `${m[1]} tiene presencia en la radio del país como`,
        `${m[1]} se sitúa en el mapa sonoro dominicano como`,
      ];
      return variants[slugHash(slug) % variants.length];
    },
  },
  {
    re: /^(.+?)\s+es una emisora\b/i,
    replace: (m) => `${m[1]} opera como emisora`,
  },
  {
    re: /^Escucha\s+(.+?)\s+en vivo,/i,
    replace: (m) => `${m[1]} transmite en directo,`,
  },
  {
    re: /^Ver\s+(.+?)\s+en vivo es/i,
    replace: (m) => `Abrir ${m[1]} en línea es`,
  },
  {
    re: /^(.+?)\s+en vivo te conecta/i,
    replace: (m) => `${m[1]} en directo llega`,
  },
  {
    re: /^(.+?)\s+en vivo te acompaña/i,
    replace: (m) => `${m[1]} acompaña a oyentes`,
  },
  {
    re: /^La\s+(.+?)\s+FM en vivo te conecta/i,
    replace: (m) => `La ${m[1]} FM llega a su audiencia`,
  },
  {
    re: /^(.+?)\s+en vivo,\s*la emisora/i,
    replace: (m) => `${m[1]} en directo: la emisora`,
  },
  {
    re: /^<b>([^<]+)<\/b>\s+en vivo\b/i,
    replace: (m) => `<b>${m[1]}</b> en directo`,
  },
  {
    re: /^Sintoniza\s+(.+?)\s+FM\b/i,
    replace: (m) => `${m[1]} FM`,
  },
  {
    re: /^(.+?)\s+es la emisora\b/i,
    replace: (m) => `${m[1]} funciona como emisora`,
  },
];

function protectDecimalDots(text) {
  return String(text).replace(/(\d)\.(\d)/g, `$1${DECIMAL_PLACEHOLDER}$2`);
}

function restoreDecimalDots(text) {
  return String(text).replace(new RegExp(DECIMAL_PLACEHOLDER, 'g'), '.');
}

function splitSpanishSentences(text) {
  const s = protectDecimalDots(text.trim());
  if (!s) return [];
  const parts = [];
  const re = /([^.!?]*[.!?]+)\s*/g;
  let m;
  let consumed = 0;
  while ((m = re.exec(s)) !== null) {
    parts.push(restoreDecimalDots(m[1].trim()));
    consumed = re.lastIndex;
  }
  const tail = restoreDecimalDots(s.slice(consumed).trim());
  if (tail) parts.push(tail);
  return parts.filter(Boolean);
}

function isBoilerplateSentence(sentence) {
  const t = sentence.trim();
  if (!t) return true;
  if (BOILERPLATE_SENTENCE.test(t)) return true;
  if (/^Sintoniza\b/i.test(t)) return true;
  if (/^¡\s*Sintoniza\b/i.test(t)) return true;
  if (/\bconéctate en línea\b/i.test(t)) return true;
  if (/\b(?:puedes|podrás|puede|pueden)\s+sintonizar\b/i.test(t) && t.length < 220) return true;
  if (/\bcon solo sintonizar\b/i.test(t) && t.length < 220) return true;
  if (/\bdebes sintonizar\b/i.test(t) && t.length < 160) return true;
  if (/\binvita a sintonizar\b/i.test(t) && t.length < 220) return true;
  if (/\bsintoniza (?:la frecuencia|esta emisora|esta estación)\b/i.test(t) && t.length < 220) return true;
  if (/^Sintonizar la frecuencia/i.test(t) && t.length < 120) return true;
  if (/^Si buscas una (?:radio|emisora|señal|estación)/i.test(t) && t.length < 260) return true;
  if (/^¿Listo para/i.test(t)) return true;
  if (/^¿Ya la escuchaste/i.test(t)) return true;
  if (/\b(?:no dudes en|no puedes dejar de|asegúrate de|solo tienes que|si aún no has|te invitamos a)\s+sintoniz/i.test(t) && t.length < 320) return true;
  if (/\bsintoniz(?:ar|a|arnos|emos)\b/i.test(t) && t.length < 200 && /\b(?:frecuencia|emisora|estación|FM|en línea|ahora)\b/i.test(t)) return true;
  if (/\bAsí que sintoniza\b/i.test(t) && t.length < 280) return true;
  if (/\bsintoniza (?:nuestra emisora|con nosotros)\b/i.test(t) && t.length < 280) return true;
  if (/\bsintonizarnos\b/i.test(t) && t.length < 320) return true;
  if (/\bsintonizarla\b/i.test(t) && t.length < 220) return true;
  if (/^¿Ya sintonizaste/i.test(t)) return true;
  if (/^¿Ya la sintonizaste/i.test(t)) return true;
  if (/\b¡Sintoniza\b/i.test(t) && t.length < 300) return true;
  if (/\bGracias por sintonizar\b/i.test(t) && t.length < 300) return true;
  if (/\bNo esperes más (?:para|y)\s+sintoniz/i.test(t) && t.length < 300) return true;
  if (/\bvive la experiencia de una emisora\b/i.test(t) && /\b[Ss]intoniza\b/.test(t)) return true;
  if (/^Sintoniza\b[\s\S]{0,120}\bFM\b/i.test(t) && t.length < 200) return true;
  return false;
}

/** Corta cláusulas CTA tras coma o punto cuando no forman oración aparte. */
function stripInlineTrailingCta(text) {
  let t = protectDecimalDots(text.trim());
  t = t.replace(
    /,\s*(?:[Pp]uedes|[Pp]odrás|[Cc]on solo)\s+sintonizar[\s\S]*$/i,
    '',
  );
  t = t.replace(/,\s*[Ss]intoniza[\s\S]*$/i, '');
  t = t.replace(/[.!?]\s*(?:Sintoniza|Sintonizar|Conéctate|¿Listo para)[\s\S]*$/i, (match, offset, full) => {
    const before = full.slice(0, offset).trim();
    return before.length >= 40 ? '' : match;
  });
  return restoreDecimalDots(t).replace(/\s+/g, ' ').trim();
}

export function stripTrailingBoilerplateFromText(text) {
  let t = stripInlineTrailingCta(text);
  let sentences = splitSpanishSentences(t);
  if (!sentences.length) return '';

  while (sentences.length > 0 && isBoilerplateSentence(sentences[0])) {
    sentences.shift();
  }

  while (sentences.length > 0 && isBoilerplateSentence(sentences[sentences.length - 1])) {
    sentences.pop();
  }

  if (sentences.length === 1 && isBoilerplateSentence(sentences[0])) {
    return '';
  }

  return sentences.join(' ').replace(/\s+/g, ' ').trim();
}

function scrubSintonizaTokens(text) {
  return String(text || '')
    .replace(/\bsintonizarnos\b/gi, 'escucharnos')
    .replace(/\bsintonizarla\b/gi, 'escucharla')
    .replace(/\bsintonizando\b/gi, 'escuchando')
    .replace(/\bsintonizaste\b/gi, 'escuchaste')
    .replace(/\bsintonizas\b/gi, 'escuchas')
    .replace(/\bsintonizado\b/gi, 'conectado')
    .replace(/\bsintonizar\b/gi, 'escuchar')
    .replace(/\bSintoniza\b/g, 'Escucha')
    .replace(/\bsintoniza\b/g, 'escucha');
}

function normalizeResidualSintoniza(text) {
  return scrubSintonizaTokens(
    String(text || '')
      .replace(/\baudiencia sintonizada\b/gi, 'audiencia atenta')
      .replace(/\bal sintonizar su señal\b/gi, 'al escuchar su señal')
      .replace(/\bseguir sintonizando\b/gi, 'seguir escuchando')
      .replace(/\bpuedes sintonizar\b/gi, 'puedes escuchar'),
  );
}

function cleanParagraphInner(inner) {
  const text = plainText(inner);
  if (!text) return '';
  const cleaned = normalizeResidualSintoniza(stripTrailingBoilerplateFromText(text));
  if (!cleaned || cleaned.length < 12) return '';
  if (!/<[a-z][\s\S]*>/i.test(inner)) return cleaned;
  return cleaned;
}

function cleanOrphanTextBlock(text) {
  const cleaned = normalizeResidualSintoniza(stripTrailingBoilerplateFromText(text.trim()));
  if (!cleaned || cleaned.length < 12) return '';
  return cleaned;
}

export function stripBoilerplateClosing(html) {
  const blockRe = /(<h[2-4]\b[^>]*>[\s\S]*?<\/h[2-4]>|<p\b[\s\S]*?<\/p>)/gi;
  const parts = html.split(blockRe);
  let out = '';

  for (const part of parts) {
    if (!part) continue;
    if (/^<p\b/i.test(part)) {
      const inner = part.replace(/^<p\b[^>]*>([\s\S]*)<\/p>$/i, '$1');
      const cleaned = cleanParagraphInner(inner);
      out += cleaned ? `<p>${cleaned}</p>` : '';
      continue;
    }
    if (/^<h[2-4]\b/i.test(part)) {
      out += part;
      continue;
    }
    const cleaned = cleanOrphanTextBlock(part);
    if (cleaned) out += `<p>${cleaned}</p>`;
  }

  return out.replace(/\n{3,}/g, '\n\n').trim();
}

function diversifyFirstParagraph(html, slug) {
  const match = html.match(/^(<p>)([\s\S]*?)(<\/p>)/i);
  if (!match) return html;

  const inner = match[2];
  const textOnly = plainText(inner);
  let newText = textOnly;

  for (const rule of OPENING_REPLACEMENTS) {
    const m = textOnly.match(rule.re) || inner.match(rule.re);
    if (!m) continue;
    const src = textOnly.match(rule.re) ? textOnly : inner;
    if (rule.slugReplace) {
      newText = src.replace(rule.re, () => rule.slugReplace(m, slug));
    } else {
      newText = src.replace(rule.re, rule.replace);
    }
    break;
  }

  if (newText === textOnly) return html;
  return html.replace(match[0], `${match[1]}${newText}${match[3]}`);
}

const MIN_BODY_WORDS = 90;

function expandShortBody(html, item, kind, minWords = MIN_BODY_WORDS) {
  const words = plainText(html).split(/\s+/).filter(Boolean).length;
  if (words >= minWords) return html;

  const name = String(item.name || (kind === 'radio' ? 'esta emisora' : 'este canal')).trim();
  const { city, freq, signal } = stationFacts(item, kind);
  const bits = kind === 'radio' ? [freq, city].filter(Boolean) : [signal, city].filter(Boolean);
  const line = bits.join(' · ');

  const extras =
    kind === 'radio'
      ? [
          line
            ? `<p>Datos de referencia en el directorio: ${escapeHtml(line)}.</p>`
            : `<p>${escapeHtml(name)} figura en el catálogo de radios dominicanas de VivoRD con reproductor integrado y texto informativo.</p>`,
          line
            ? `<p>La ficha recoge la señal de ${escapeHtml(name)}${city ? ` (${escapeHtml(city)})` : ''}${freq ? ` en ${escapeHtml(freq)}` : ''}.</p>`
            : `<p>Desde esta página puedes escuchar ${escapeHtml(name)} en directo cuando el stream del titular responde.</p>`,
          line
            ? `<p>Referencia de dial: ${escapeHtml(line)} — información verificada en el catálogo VivoRD.</p>`
            : `<p>Emisora listada en VivoRD: ${escapeHtml(name)} con acceso web sin instalar aplicaciones adicionales.</p>`,
          line
            ? `<p>Emisora listada con ${escapeHtml(bits.join(', '))} en el mapa de radios dominicanas.</p>`
            : `<p>El directorio VivoRD agrupa para ${escapeHtml(name)} reproductor, datos de señal y descripción editorial.</p>`,
        ]
      : [
          line
            ? `<p>Datos de referencia: ${escapeHtml(line)}.</p>`
            : `<p>${escapeHtml(name)} está en el directorio de TV dominicana de VivoRD con reproductor y contexto editorial.</p>`,
          line
            ? `<p>Canal listado en VivoRD con ${escapeHtml(line)}.</p>`
            : `<p>Desde esta ficha puedes abrir ${escapeHtml(name)} en vivo cuando la señal del titular está disponible.</p>`,
          line
            ? `<p>La ficha agrupa señal y contexto de ${escapeHtml(name)}${city ? ` (${escapeHtml(city)})` : ''}.</p>`
            : `<p>Canal ${escapeHtml(name)}: acceso en línea y texto informativo centralizado en VivoRD.</p>`,
          line
            ? `<p>Referencia en el directorio: ${escapeHtml(line)}.</p>`
            : `<p>Televidentes que buscan ${escapeHtml(name)} pueden consultar aquí la señal y la descripción del canal.</p>`,
        ];

  let out = html;
  let w = words;
  let salt = 0;
  while (w < minWords && salt < extras.length) {
    out += `\n${extras[(slugHash(item.slug) + salt) % extras.length]}`;
    w = plainText(out).split(/\s+/).filter(Boolean).length;
    salt += 1;
  }
  if (w < minWords) {
    const tail =
      kind === 'radio'
        ? `<p>VivoRD mantiene esta ficha con reproductor web, datos de emisora y texto editorial para oyentes dentro y fuera de República Dominicana.</p>`
        : `<p>Esta página de VivoRD reúne reproductor, datos del canal y descripción para consultar la señal en línea cuando el titular la publica.</p>`;
    out += `\n${tail}`;
  }
  return out;
}

/**
 * Descripción de ficha: formato + datos únicos + apertura variada.
 */
export function buildStationDescription(item, kind, rawDescription) {
  let html = rawDescription ? formatDescription(rawDescription) : '';
  if (!html) {
    const name = item.name || 'esta emisora';
    html =
      kind === 'radio'
        ? `<p>Escucha ${name} en vivo por internet.</p>`
        : `<p>Mira ${name} en vivo online.</p>`;
  }

  html = stripBoilerplateClosing(html);
  html = diversifyFirstParagraph(html, item.slug);
  html = paraphraseBodyHtml(html, item.slug);
  const lead = buildFactLeadParagraph(item, kind);
  const leadWords = plainText(lead).split(/\s+/).filter(Boolean).length;
  html = expandShortBody(html, item, kind, Math.max(50, MIN_BODY_WORDS - leadWords));
  return `${lead}\n${html}`;
}
