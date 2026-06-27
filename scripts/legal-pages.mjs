import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteHeader } from './site-header.mjs';
import { siteFooter } from './site-footer.mjs';
import { seoHead, ensureSeoAssets } from './seo-head.mjs';
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from './site-config.mjs';
import { streamHealthSummary, getFailedEntryCount, loadHealthIndex } from './stream-health-index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const updated = new Date().toISOString().slice(0, 10);

function buildSobreVivoRdBody() {
  loadHealthIndex();
  const summary = streamHealthSummary();
  const failedUnion = getFailedEntryCount();
  const checked = summary.checked ?? summary.withStream ?? '—';
  const failedStream = summary.failed ?? '—';

  return `
  <h1>Acerca de ${SITE_NAME}</h1>
  <p class="legal-lead">Última actualización: ${updated}</p>
  <section>
    <h2>Qué es ${SITE_NAME}</h2>
    <p>${SITE_NAME} (${SITE_URL}) es un directorio web y aplicación móvil que organiza el acceso a canales de televisión y emisoras de radio de República Dominicana. No operamos las señales ni somos titulares de las marcas que aparecen en el catálogo: facilitamos una interfaz unificada para buscar, escuchar y ver contenido en directo cuando el titular o la fuente técnica lo permiten.</p>
    <p>El proyecto nació para sustituir experiencias fragmentadas — enlaces rotos, reproductores incompatibles y páginas sin contexto — por fichas con reproductor integrado, metadatos verificables cuando existen en nuestros datos y guías editoriales sobre el ecosistema dominicano de medios.</p>
  </section>
  <section>
    <h2>Quién lo mantiene</h2>
    <p>El sitio es mantenido por el equipo editorial de ${SITE_NAME}. Las decisiones de catálogo, redacción de guías y política de enlaces se toman de forma independiente respecto a las emisoras listadas. No vendemos posiciones en el directorio ni cobramos a las radios por aparecer en la portada.</p>
    <p>Para contacto operativo, retiros de contenido o reportes técnicos: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> y la página de <a href="./contacto.html">Contacto</a>.</p>
  </section>
  <section>
    <h2>Metodología del catálogo</h2>
    <p>Cada ficha combina información pública del emisor (nombre, ciudad cuando consta en nuestros datos, frecuencia FM si está documentada) con comprobaciones periódicas de la URL de reproducción. No inventamos datos: si un campo no existe en <code>data/*.json</code>, no se muestra.</p>
    <p>Disponemos de auditorías automáticas de salud de streams registradas en <code>data/stream-health.json</code>, <code>data/embed-health.json</code> y <code>data/tv-not-playing.json</code>. En la última revisión consolidada constaban ${checked} URLs comprobadas en stream-health, con ${failedStream} marcadas como no reproducibles en esa pasada, y ${failedUnion} entradas únicas en la unión de los tres informes de salud.</p>
    <p>Las fichas cuya señal no supera una verificación <em>dura</em> (por ejemplo HTTP 404 en el stream, o constancia en <code>tv-not-playing.json</code>) se mantienen accesibles para el usuario, pero pueden etiquetarse con <code>noindex</code> para buscadores y excluirse del sitemap. No desindexamos por falsos negativos del checker server-side (bloqueos CORS, URLs de página oficial reproducidas por iframe, etc.).</p>
  </section>
  <section>
    <h2>Política editorial</h2>
    <p>Las descripciones de canal y radio parten de textos de referencia pública cuando existen, enriquecidos con un párrafo inicial único basado en datos verificables (ciudad, dial, tipo de señal) y enlaces contextuales a nuestras <a href="./guias/">guías</a> cuando el tema encaja (merengue, noticias, TV desde el exterior, etc.).</p>
    <p>Eliminamos cierres repetitivos tipo llamada a la acción que no aportan información diferenciada. Priorizamos claridad, accesibilidad del reproductor y honestidad cuando una señal no está disponible.</p>
    <p>Las guías largas (700+ palabras) son contenido original de ${SITE_NAME}, revisado en cada build con validación de enlaces internos.</p>
  </section>
  <section>
    <h2>Publicidad y privacidad</h2>
    <p>Podemos mostrar anuncios de Google AdSense en páginas de listado y artículos, siguiendo la configuración descrita en <a href="./privacidad.html">Privacidad</a>. En fichas de reproductor priorizamos la experiencia de escucha o visionado; la monetización no debe interferir con la reproducción.</p>
  </section>
  <section>
    <h2>DMCA y titulares de derechos</h2>
    <p>Si representas a una emisora o cadena y deseas corregir datos, actualizar el stream oficial o solicitar la baja de una ficha, consulta el procedimiento detallado en <a href="./aviso-legal.html">Aviso legal</a> (sección de propiedad intelectual y retirada). Respondemos cuando podemos verificar la solicitud.</p>
  </section>
  <section>
    <h2>Transparencia técnica</h2>
    <p>El sitio estático se genera con scripts de build en el repositorio del proyecto; el sitemap y <code>robots.txt</code> se regeneran en cada publicación. La app Android (Capacitor) empaqueta el mismo contenido web verificado.</p>
    <p>Si detectas un enlace roto o un reproductor que falla de forma persistente, indícanos la URL de la ficha. Las correcciones de stream se aplican en datos y se vuelven a comprobar en la siguiente auditoría de salud.</p>
  </section>`;
}

const staticPages = [
  {
    file: 'aviso-legal.html',
    pathname: '/aviso-legal.html',
    title: `Aviso legal · ${SITE_NAME}`,
    description: `Información legal y responsabilidad de uso de ${SITE_NAME}.`,
    body: `
  <h1>Aviso legal</h1>
  <p class="legal-lead">Última actualización: ${updated}</p>
  <section>
    <h2>1. Titular del sitio</h2>
    <p>${SITE_NAME} (${SITE_URL}) es un agregador de enlaces y reproductores para consultar canales de televisión y emisoras de radio de República Dominicana en el navegador.</p>
  </section>
  <section>
    <h2>2. Naturaleza del servicio</h2>
    <p>No somos emisora ni operador de las señales. Las transmisiones, marcas y contenidos pertenecen a sus titulares. Mostramos información pública y enlaces o flujos obtenidos de fuentes de terceros, que pueden cambiar o dejar de estar disponibles sin previo aviso.</p>
  </section>
  <section>
    <h2>3. Uso permitido</h2>
    <p>El sitio es para uso personal y no comercial. Queda prohibido reutilizar el sitio para reemitir masivamente señales, eludir restricciones técnicas del proxy, realizar scraping automatizado agresivo o cualquier actividad que perjudique la infraestructura o a terceros.</p>
  </section>
  <section>
    <h2>4. Propiedad intelectual y retirada de contenido (DMCA)</h2>
    <p>Los logotipos, nombres de canales, programación y señales en directo son propiedad de sus respectivos titulares. ${SITE_NAME} no reclama derechos sobre marcas ni sobre el contenido audiovisual retransmitido.</p>
    <p>Si eres titular de derechos de autor, marca registrada o representante legal y consideras que una ficha enlaza o reproduce material sin autorización, puedes solicitar la retirada o corrección siguiendo este procedimiento:</p>
    <ol class="legal-list">
      <li>Envía un correo a <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> con el asunto «Solicitud DMCA / retirada».</li>
      <li>Indica la URL exacta de la ficha en ${SITE_URL} (por ejemplo <code>/radio/nombre.html</code> o <code>/canal/nombre.html</code>).</li>
      <li>Describe el material protegido y acredita tu relación con el titular (enlace a sitio oficial, documento de representación o datos de contacto verificables).</li>
      <li>Declara de buena fe que el uso no está autorizado por el titular, su agente o la ley.</li>
      <li>Incluye tu nombre, dirección postal si aplica y firma electrónica.</li>
    </ol>
    <p>Revisamos las solicitudes en un plazo orientativo de 3 a 10 días hábiles. Podemos desindexar la ficha, retirar el enlace al stream, actualizar metadatos o responder pidiendo información adicional. El envío de reclamaciones falsas puede tener consecuencias legales según la legislación aplicable.</p>
    <p>Para consultas generales (enlace roto, logo incorrecto) también puedes usar <a href="./contacto.html">Contacto</a>.</p>
  </section>
  <section>
    <h2>5. Limitación de responsabilidad</h2>
    <p>${SITE_NAME} se ofrece «tal cual». No garantizamos disponibilidad continua, calidad de audio/video ni ausencia de errores. No respondemos por cortes, publicidad de terceros ni contenido mostrado en reproductores externos.</p>
  </section>`,
  },
  {
    file: 'privacidad.html',
    pathname: '/privacidad.html',
    title: `Política de privacidad · ${SITE_NAME}`,
    description: `Cómo ${SITE_NAME} trata datos y cookies.`,
    body: `
  <h1>Política de privacidad</h1>
  <p class="legal-lead">Última actualización: ${updated}</p>
  <section>
    <h2>1. Datos que recogemos</h2>
    <p>Al visitar el sitio, el servidor o la red de entrega (por ejemplo Cloudflare) puede registrar dirección IP, navegador, páginas visitadas y hora de acceso con fines de seguridad y estadísticas agregadas.</p>
  </section>
  <section>
    <h2>2. Cookies y almacenamiento local</h2>
    <p>Usamos almacenamiento local para recordar tu elección sobre cookies (aceptar o rechazar publicidad). Si aceptas, podemos mostrar anuncios de Google AdSense, que pueden instalar cookies propias.</p>
    <p>Los reproductores embebidos (Dailymotion, iframes de emisoras, etc.) pueden instalar cookies adicionales; consulta las políticas de cada proveedor.</p>
  </section>
  <section>
    <h2>3. Publicidad (Google AdSense)</h2>
    <p>Mostramos anuncios servidos por Google Ireland Limited / Google LLC (AdSense). Google puede usar cookies o identificadores para personalizar o medir anuncios según su política.</p>
    <p>Más información: <a href="https://policies.google.com/technologies/ads" rel="noopener noreferrer">Cómo usa Google los datos en publicidad</a> y <a href="https://adssettings.google.com" rel="noopener noreferrer">Configuración de anuncios de Google</a>.</p>
  </section>
  <section>
    <h2>4. Otros terceros</h2>
    <p>Cargamos recursos de Google Fonts, jsDelivr, Cloudflare y dominios de streaming vinculados al catálogo. Esos servicios tienen políticas independientes.</p>
  </section>
  <section>
    <h2>5. Tus derechos</h2>
    <p>Puedes solicitar información o eliminación de datos que hayas enviado voluntariamente escribiendo a <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
  </section>`,
  },
  {
    file: 'terminos.html',
    pathname: '/terminos.html',
    title: `Términos de uso · ${SITE_NAME}`,
    description: `Condiciones de uso de ${SITE_NAME}.`,
    body: `
  <h1>Términos de uso</h1>
  <p class="legal-lead">Al usar ${SITE_NAME} aceptas estos términos.</p>
  <section>
    <h2>1. Servicio</h2>
    <p>Facilitamos acceso organizado a canales y radios. No vendemos suscripciones ni almacenamos copias permanentes de las transmisiones.</p>
  </section>
  <section>
    <h2>2. Edad y territorio</h2>
    <p>Eres responsable de cumplir las leyes de tu país. Algunos contenidos pueden estar geo-restringidos por el emisor original.</p>
  </section>
  <section>
    <h2>3. Conducta</h2>
    <p>No uses el sitio para ataques, spam al API de proxy, minería de criptomonedas ni automatización que degrade el servicio para otros usuarios.</p>
  </section>
  <section>
    <h2>4. Contacto</h2>
    <p>Consultas: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> · <a href="./contacto.html">página de contacto</a>.</p>
  </section>`,
  },
  {
    file: 'contacto.html',
    pathname: '/contacto.html',
    title: `Contacto · ${SITE_NAME}`,
    description: `Contacta con el equipo de ${SITE_NAME}.`,
    body: `
  <h1>Contacto</h1>
  <p class="legal-lead">Reportes de enlaces rotos, retiros (DMCA) y sugerencias.</p>
  <section>
    <h2>Correo</h2>
    <p><a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
    <p>Incluye URL de la página (canal o radio), descripción del problema y, si aplica, acreditación como titular de derechos.</p>
  </section>
  <section>
    <h2>Qué revisamos</h2>
    <ul class="legal-list">
      <li>Señal que no reproduce o muestra error</li>
      <li>Imagen o nombre incorrecto</li>
      <li>Solicitud de retiro por titular de marca o derechos</li>
      <li>Fallos de accesibilidad o usabilidad</li>
    </ul>
  </section>
  <section>
    <h2>Tiempo de respuesta</h2>
    <p>Intentamos responder en un plazo de 3 a 10 días hábiles según volumen de solicitudes.</p>
  </section>`,
  },
];

function pageHtml(page) {
  return `${seoHead({
    title: page.title,
    description: page.description,
    pathname: page.pathname,
    ogType: 'article',
  })}
${siteHeader('tv', 0, 'Buscar canal…')}
<main class="site-main container legal-page" id="main-content">
  <a href="./index.html" class="back-link">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
    Inicio
  </a>
  ${page.body}
</main>
${siteFooter(0)}
<script>window.BASE_URL = './';</script>
<script src="./assets/js/api-config.js"></script>
<script src="./assets/js/mobile.js" defer></script>
<script src="./assets/js/capacitor-native.js" defer></script>
</body>
</html>`;
}

export async function generateLegalPages() {
  await ensureSeoAssets();
  const pages = [
    {
      file: 'sobre-vivord.html',
      pathname: '/sobre-vivord.html',
      title: `Acerca de ${SITE_NAME}`,
      description: `Qué es ${SITE_NAME}, metodología del catálogo, política editorial y contacto para titulares.`,
      body: buildSobreVivoRdBody(),
    },
    ...staticPages,
  ];

  console.log('Páginas legales:');
  for (const page of pages) {
    await fs.writeFile(path.join(ROOT, page.file), pageHtml(page));
    console.log(`  ${page.file}`);
  }
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  generateLegalPages().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
