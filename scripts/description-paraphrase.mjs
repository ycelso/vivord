import { plainText, slugHash } from './station-facts.mjs';

/** Muletillas del cuerpo (orden: frases largas primero). >=4 variantes por regla, rotación por slug. */
const CLICHE_RULES = [
  {
    re: /ofreciendo una programación que mantiene a los oyentes conectados/gi,
    variants: [
      'con una parrilla pensada para acompañar al oyente',
      'con espacios que enlazan información y entretenimiento',
      'con bloques que siguen el día a día del país',
      'con una grilla que alterna datos y música',
    ],
  },
  {
    re: /combina información actualizada con entretenimiento/gi,
    variants: [
      'mezcla noticias de actualidad con propuesta musical',
      'alterna boletines informativos y entretenimiento en antena',
      'equilibra cobertura informativa y contenido lúdico',
      'une información del momento con programación variada',
    ],
  },
  {
    re: /los éxitos del momento y clásicos que no pasan de moda/gi,
    variants: [
      'temas actuales y clásicos de siempre en rotación',
      'novedades del top junto a canciones de catálogo',
      'lo nuevo del momento y referencias que perduran',
      'chart del día y joyas que no envejecen',
    ],
  },
  {
    re: /clásicos que no pasan de moda/gi,
    variants: [
      'temas de catálogo que siguen sonando',
      'referencias musicales que no caducan',
      'joyas clásicas del repertorio',
      'canciones que el público pide una y otra vez',
    ],
  },
  {
    re: /clásicos que nunca pasan de moda/gi,
    variants: [
      'temas de siempre en la rotación',
      'referencias que el público no deja de pedir',
      'canciones de catálogo con años de presencia',
      'joyas clásicas del dial',
    ],
  },
  {
    re: /se ha convertido en un punto de encuentro para quienes/gi,
    variants: [
      'se ha ganado habitualidad entre quienes',
      'reúne en antena a quienes',
      'funciona como parada habitual para quienes',
      'concentra cada día a quienes',
    ],
  },
  {
    re: /ha convertido en un punto de encuentro para quienes/gi,
    variants: [
      'ha ganado habitualidad entre quienes',
      'reúne en antena a quienes',
      'funciona como parada habitual para quienes',
      'concentra cada día a quienes',
    ],
  },
  {
    re: /convertido en un punto de encuentro para quienes/gi,
    variants: [
      'convertido en referente habitual para quienes',
      'consolidado como espacio en el dial para quienes',
      'establecido como opción frecuente para quienes',
      'reconocido como parada sonora para quienes',
    ],
  },
  {
    re: /se ha convertido en un punto de encuentro/gi,
    variants: [
      'reúne en su dial',
      'concentra en antena',
      'agrupa en su programación',
      'sirve de escaparate musical',
    ],
  },
  {
    re: /se ha convertido en el punto de encuentro/gi,
    variants: [
      'es el espacio habitual de',
      'funciona como referencia para',
      'concentra la atención de',
      'reúne cada día a',
    ],
  },
  {
    re: /ha convertido en un punto de encuentro/gi,
    variants: [
      'reúne en su dial',
      'concentra en antena',
      'agrupa en su programación',
      'sirve de escaparate musical',
    ],
  },
  {
    re: /convertido en un punto de encuentro/gi,
    variants: [
      'referente en antena para',
      'espacio habitual de',
      'opción de referencia para',
      'frecuencia de encuentro para',
    ],
  },
  {
    re: /un punto de encuentro para quienes/gi,
    variants: [
      'un espacio habitual para quienes',
      'una opción en el dial para quienes',
      'una referencia sonora para quienes',
      'una parada frecuente para quienes',
    ],
  },
  {
    re: /es un punto de encuentro para/gi,
    variants: [
      'funciona como referencia para',
      'concentra en antena a',
      'reúne habitualmente a',
      'sirve de escaparate para',
    ],
  },
  {
    re: /se ha convertido en un referente/gi,
    variants: [
      'ha ganado peso en el dial como',
      'es referencia habitual en',
      'ocupa un lugar reconocido en',
      'se distingue en el panorama como',
    ],
  },
  {
    re: /se ha convertido en punto de referencia/gi,
    variants: [
      'es referencia en el dial para',
      'funciona como parada habitual para',
      'ocupa un lugar reconocido para',
      'se distingue en antena para',
    ],
  },
  {
    re: /punto de referencia para quienes/gi,
    variants: [
      'referencia en el dial para quienes',
      'opción habitual para quienes',
      'parada frecuente para quienes',
      'espacio reconocido para quienes',
    ],
  },
  {
    re: /conecta a su audiencia con la esencia de la radio dominicana/gi,
    variants: [
      'lleva al oyente el sonido característico del dial dominicano',
      'refleja en antena la identidad sonora del país',
      'transmite el estilo que distingue a la radio del país',
      'acerca al público la voz musical de RD',
    ],
  },
  {
    re: /conecta a su audiencia con la esencia/gi,
    variants: [
      'acerca a su público al estilo',
      'lleva al oyente la identidad',
      'refleja en antena el carácter',
      'transmite al auditorio el sello',
    ],
  },
  {
    re: /conecta con su audiencia con la/gi,
    variants: [
      'llega a su público con la',
      'acerca al oyente con la',
      'dialoga con quienes escuchan con la',
      'comparte con su audiencia la',
    ],
  },
  {
    re: /la esencia de la radio dominicana/gi,
    variants: [
      'el estilo del dial dominicano',
      'la identidad sonora del país',
      'el carácter de la radio en RD',
      'la voz musical de República Dominicana',
    ],
  },
  {
    re: /mantienen viva la esencia de la radio dominicana/gi,
    variants: [
      'conservan el estilo del dial dominicano',
      'sostienen la identidad sonora local',
      'reflejan la radio hecha en RD',
      'mantienen el sello del país en antena',
    ],
  },
  {
    re: /la programación incluye espacios dedicados a/gi,
    variants: [
      'en antena hay bloques orientados a',
      'la parrilla reserva segmentos para',
      'entre sus espacios figuran bloques de',
      'la grilla contempla programas de',
    ],
  },
  {
    re: /quienes disfrutan de la buena música/gi,
    variants: [
      'oyentes que buscan repertorio cuidado',
      'quienes valoran una selección musical sólida',
      'público que aprecia propuesta sonora variada',
      'audiencia amante del buen repertorio',
    ],
  },
  {
    re: /en vivo es la radio dominicana que/gi,
    variants: [
      'en directo es, en el dial de RD, la emisora que',
      'online representa en RD la estación que',
      'por streaming es la emisora dominicana que',
      'en antena digital es la radio que',
    ],
  },
  {
    re: /en vivo es la emisora que/gi,
    variants: [
      'en directo es la estación que',
      'online es la radio que',
      'por streaming es la emisora que',
      'en antena es la estación que',
    ],
  },
  {
    re: /es, en el dial dominicano,/gi,
    variants: [
      'destaca en el panorama radial dominicano,',
      'ocupa un lugar en el dial de RD,',
      'tiene presencia en la radio del país,',
      'se sitúa en el mapa sonoro dominicano,',
    ],
  },
  {
    re: /en el dial dominicano/gi,
    variants: [
      'en la radio de República Dominicana',
      'en el mapa FM del país',
      'entre las emisoras dominicanas',
      'en el panorama radial de RD',
    ],
  },
  {
    re: /te conecta con el ritmo/gi,
    variants: [
      'te acerca al pulso',
      'te lleva el compás',
      'te pone en sintonía con el ritmo',
      'te acerca al sonido',
    ],
  },
  {
    re: / en vivo te conecta/gi,
    variants: [
      ' en directo te acerca',
      ' online te enlaza',
      ' por streaming te conecta',
      ' en antena te acerca',
    ],
  },
];

function pickVariant(variants, slug, salt = 0) {
  return variants[(slugHash(slug) + salt) % variants.length];
}

function paraphrasePlainText(text, slug) {
  let out = String(text || '');
  CLICHE_RULES.forEach((rule, i) => {
    rule.re.lastIndex = 0;
    if (rule.re.test(out)) {
      rule.re.lastIndex = 0;
      out = out.replace(rule.re, pickVariant(rule.variants, slug, i));
    }
    rule.re.lastIndex = 0;
  });
  return out.replace(/\s+/g, ' ').trim();
}

function paraphraseParagraphInner(inner, slug) {
  if (!/<[a-z][\s\S]*>/i.test(inner)) {
    return paraphrasePlainText(inner, slug);
  }
  return paraphrasePlainText(plainText(inner), slug);
}

/** Parafrasea muletillas en el cuerpo (sin tocar description-lead). */
export function paraphraseBodyHtml(html, slug) {
  const blockRe = /(<h[2-4]\b[^>]*>[\s\S]*?<\/h[2-4]>|<p\b[\s\S]*?<\/p>|<ul\b[\s\S]*?<\/ul>)/gi;
  const parts = html.split(blockRe);
  let out = '';

  for (const part of parts) {
    if (!part) continue;
    if (/^<p\b/i.test(part)) {
      const inner = part.replace(/^<p\b[^>]*>([\s\S]*)<\/p>$/i, '$1');
      const next = paraphraseParagraphInner(inner, slug);
      out += next ? `<p>${next}</p>` : part;
      continue;
    }
    if (/^<ul\b/i.test(part)) {
      const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
      out += part.replace(liRe, (_, liInner) => {
        const t = paraphraseParagraphInner(liInner, slug);
        return `<li>${t}</li>`;
      });
      continue;
    }
    out += part;
  }

  if (!out.trim() && html.trim()) {
    return paraphrasePlainText(plainText(html), slug);
  }

  return out.replace(/\n{3,}/g, '\n\n').trim();
}

export { CLICHE_RULES, paraphrasePlainText, pickVariant };
