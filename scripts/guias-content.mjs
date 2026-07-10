/**
 * Cuerpos editoriales de las guías. readMin se calcula en guias-build.mjs.
 * Enlaces internos validados contra radio/*.html y canal/*.html existentes.
 */
export const RAW_GUIDES = [
  {
    slug: 'como-escuchar-radio-dominicana-en-vivo',
    title: 'Cómo escuchar radio dominicana en vivo por internet',
    description:
      'Guía práctica para sintonizar emisoras de República Dominicana desde el móvil o el ordenador: requisitos, calidad de audio y consejos de uso.',
    body: `
<p>Escuchar <strong>radio dominicana en vivo</strong> por internet ya no depende de estar en el país ni de tener un receptor FM. Desde Nueva York, Madrid o Santo Domingo puedes abrir el navegador, elegir una emisora y escuchar noticias, deportes, merengue, bachata o programas de opinión en segundos.</p>
<p>En esta guía explicamos cómo funciona el acceso online en República Dominicana, qué diferencia hay respecto a la FM tradicional, qué emisoras conviene probar primero y cómo usar VivoRD para no perder tiempo buscando enlaces rotos.</p>

<h2>1. Qué necesitas para escuchar online</h2>
<ul>
  <li><strong>Conexión estable:</strong> 3G/4G/5G o Wi‑Fi. Para audio en directo bastan 1–2 Mbps; no hace falta fibra.</li>
  <li><strong>Navegador actualizado:</strong> Chrome, Firefox, Safari o Edge en versión reciente soportan los formatos de streaming más usados (HLS, MP3, AAC).</li>
  <li><strong>Altavoz o auriculares:</strong> en el móvil, la app Android de VivoRD permite seguir escuchando con la pantalla apagada; en web depende del navegador y del sistema.</li>
</ul>
<p>No necesitas registrarte ni instalar programas especiales en el ordenador. En el teléfono, la app opcional mejora la experiencia en segundo plano.</p>

<h2>2. FM tradicional vs streaming: qué cambia</h2>
<p>La radio FM en República Dominicana ocupa la banda de <strong>88 MHz a 108 MHz</strong>. Cada emisora tiene una frecuencia local: por ejemplo <strong>Z 101 en 101.3 FM</strong> (Santo Domingo) o <strong>CDN en 92.5 FM</strong>. La señal llega por antena y su alcance es geográfico.</p>
<p>El <strong>streaming online</strong> reenvía esa misma programación —o una versión digital paralela— por internet. Ventajas claras:</p>
<ul>
  <li>Escuchas desde el extranjero sin antena ni sintonizador.</li>
  <li>Comparas emisoras en segundos sin buscar dial por dial.</li>
  <li>Muchas estaciones transmiten 24 h online aunque la FM tenga horarios limitados.</li>
</ul>
<p>La desventaja: si la emisora cambia la URL del stream o el proveedor cae, el enlace deja de funcionar hasta que alguien lo actualice. Por eso conviene un directorio mantenido como VivoRD en lugar de guardar marcadores sueltos.</p>

<h2>3. Tipos de emisoras en el dial dominicano</h2>
<p>El ecosistema radiofónico del país es diverso. Estos bloques te ayudan a orientarte:</p>

<h3>Informativas y talk</h3>
<p>Boletines, entrevistas políticas, análisis económico y deportes en vivo. Referentes nacionales: <a href="../radio/z101.html">Z 101 (101.3 FM, Santo Domingo)</a> y <a href="../radio/cdn.html">CDN 92.5</a>, con programación hablada en horario matutino y vespertino. <a href="../radio/independencia.html">Independencia</a> es otra opción informativa con presencia en el dial.</p>

<h3>Música tropical</h3>
<p>Merengue, bachata y salsa en parrilla. <a href="../radio/caliente.html">Caliente 104 (104.1 FM, Santo Domingo)</a> es referente de salsa; en Santiago destacan <a href="../radio/primera.html">Primera 88.1 FM</a> (romántica/tropical) y <a href="../radio/labakana.html">La Bakana FM (105.9 FM)</a>.</p>

<h3>Urbano y reggaetón</h3>
<p>Dirigidas a audiencia joven: <a href="../radio/kq94.html">KQ 94.5 FM</a>, <a href="../radio/ritmo96.html">Ritmo 96</a> y <a href="../radio/lakalle963.html">La Kalle 96.3 (Santiago)</a> mezclan reggaetón, dembow y pop latino.</p>

<h3>Gospel y cristianas</h3>
<p>Programación de fe e inspiración, como <a href="../radio/amanecer.html">Radio Amanecer</a>, con música cristiana y mensajes motivacionales.</p>

<h2>4. Cómo usar VivoRD paso a paso</h2>
<ol>
  <li>Entra en <a href="../radios.html">Radios</a> desde el menú superior.</li>
  <li>Usa el buscador por nombre («Z 101», «Caliente») o recorre el listado por relevancia.</li>
  <li>Abre la ficha: verás ciudad, frecuencia FM y descripción completa de la emisora.</li>
  <li>Pulsa reproducir. Si el stream falla, prueba otra emisora del mismo género: a veces hay mantenimiento puntual del proveedor.</li>
  <li>En Android, instala la app VivoRD para radio en segundo plano con controles en la pantalla de bloqueo.</li>
</ol>

<h2>5. Consumo de datos y calidad de audio</h2>
<p>El audio en directo consume mucho menos que un video HD. Una hora de radio online suele estar entre <strong>30 y 60 MB</strong> según el bitrate (64–128 kbps es habitual). Con Wi‑Fi no hay problema; con datos móviles, una hora diaria puede sumar ~1,5 GB al mes.</p>
<p>Si el audio se corta: acércate al router, cierra otras apps que descarguen en paralelo o baja la calidad si el reproductor lo permite. En el coche con datos, desactiva el ahorro de batería agresivo: algunos móviles pausan pestañas en segundo plano.</p>

<h2>6. Huso horario y programación</h2>
<p>República Dominicana usa <strong>AST (UTC−4)</strong> todo el año, sin cambio de horario de verano. Los programas matutinos (6:00–10:00) y los espacios de la tarde-noche (17:00–21:00) concentran la mayor audiencia. Si escuchas desde España, suma 5 horas en invierno o 6 en verano; desde la costa este de EE. UU. la diferencia es 0–1 hora según tu estado.</p>

<h2>7. Uso legal y respeto a titulares</h2>
<p>VivoRD enlaza señales públicas o streams de terceros. Las marcas, locutores y programas pertenecen a cada emisora. El uso previsto es <strong>personal</strong>: escuchar en casa o en el trayecto, no reemitir ni redistribuir el audio con fines comerciales. Si eres titular y quieres corregir un enlace o solicitar baja, escríbenos desde <a href="../contacto.html">Contacto</a>.</p>

<h2>Preguntas frecuentes</h2>
<p><strong>¿Es gratis escuchar radio dominicana online?</strong> Sí, en VivoRD no cobramos por el acceso. La emisora puede incluir publicidad en su programación, como en la FM.</p>
<p><strong>¿Puedo escuchar desde fuera del país?</strong> Sí, el streaming no depende de estar dentro del alcance de la antena FM.</p>
<p><strong>¿Por qué a veces no suena una emisora?</strong> El proveedor del stream puede estar en mantenimiento o la emisora cambió la URL. Prueba más tarde o reporta el fallo.</p>
<p><strong>¿Necesito VPN?</strong> En la mayoría de emisoras dominicanas, no. Algunas señales puntuales pueden restringir región; es poco frecuente en radio.</p>
<p><strong>¿VivoRD es una emisora?</strong> No. Somos un directorio y reproductor que agrupa enlaces e información pública de terceros.</p>

<p><strong>Siguiente lectura:</strong> <a href="mejores-emisoras-merengue-y-bachata.html">Mejores emisoras de merengue y bachata</a> · <a href="mejores-radios-noticias-republica-dominicana.html">Radios de noticias</a> · <a href="que-es-vivord-y-como-usarlo.html">Qué es VivoRD</a></p>`,
  },
  {
    slug: 'mejores-emisoras-merengue-y-bachata',
    title: 'Mejores emisoras de merengue y bachata en República Dominicana',
    description:
      'Selección orientativa de radios dominicanas para escuchar merengue, bachata y música tropical en vivo, con frecuencias, ciudades y enlaces en VivoRD.',
    body: `
<p>La <strong>música tropical</strong> define el paisaje sonoro dominicano. Merengue, bachata y salsa suenan en colmados, guaguas y radios FM de Santo Domingo, Santiago y ciudades del interior. Si buscas emisoras donde ese repertorio es protagonista —no solo un bloque de una hora—, esta guía recorre opciones concretas con frecuencia, ciudad y enlace para escuchar ya.</p>

<h2>Cómo elegimos (sin ranking oficial)</h2>
<p>No existe un «top» único validado por audiencias públicas en tiempo real. La «mejor» emisora depende de si quieres clásicos de los 90, bachata romántica, salsa en vivo o mezcla con reggaetón. Usamos tres criterios verificables:</p>
<ul>
  <li><strong>Especialización musical:</strong> tropical, merengue o bachata en la parrilla habitual, no solo en fines de semana.</li>
  <li><strong>Presencia nacional:</strong> emisoras conocidas en Santo Domingo, Santiago o ambas.</li>
  <li><strong>Disponibilidad online</strong> en VivoRD al publicar esta guía.</li>
</ul>

<h2>Emisoras destacadas: ficha por ficha</h2>

<h3>Caliente 104 — Santo Domingo, 104.1 FM</h3>
<p>Referente de <strong>salsa</strong> en la capital. Su dial 104.1 FM es sinónimo de percusión caribeña, sesiones enérgicas y clásicos que llenan la pista. Si tu prioridad es ritmo y trompetas antes que balada romántica, empieza aquí. <a href="../radio/caliente.html">Escuchar Caliente 104 en vivo</a>.</p>

<h3>La Kalle 96.3 — Santiago</h3>
<p>Emisora del Cibao con fuerte apuesta <strong>urbana y latina</strong>: reggaetón, bachata moderna y pop latino conviven en la programación. Ideal si quieres tropical mezclado con sonido joven. <a href="../radio/lakalle963.html">Escuchar La Kalle 96.3</a>.</p>

<h3>Primera 88.1 FM — Santiago</h3>
<p>Propuesta <strong>romántica y tropical</strong>: baladas, bachata sentida e identidad norteña. Menos agresiva que una emisora urbana; más adecuada para tarde-noche o ambientes relajados. <a href="../radio/primera.html">Escuchar Primera 88.1</a>.</p>

<h3>La Bakana FM — Santiago, 105.9 FM</h3>
<p>Combina pop, noticias ligeras y tropical en <strong>105.9 FM</strong>. Funciona como emisora de día completo: música variada con momentos informativos breves. <a href="../radio/labakana.html">Escuchar La Bakana FM</a>.</p>

<h3>Fuego 90 — Santo Domingo</h3>
<p>Conocida como «La Salsera». Mezcla salsa, bachata y espacios de actualidad. Buen puente si te gusta la salsa de Caliente pero quieres otra línea de programación en la capital. <a href="../radio/fuego90.html">Escuchar Fuego 90</a>.</p>

<h2>Merengue vs bachata: qué esperar en cada emisora</h2>
<p>El <strong>merengue</strong> domina fiestas, carnavales y eventos públicos; la percusión y el güira marcan el pulso. La <strong>bachata</strong> tiene mayor peso romántico y en playlists urbanas actuales. En la práctica, muchas emisoras rotan ambos géneros con reggaetón en franjas juveniles.</p>
<ul>
  <li><strong>Solo bachata clásica o romántica:</strong> prioriza Primera 88.1 o emisoras con formato romántico.</li>
  <li><strong>Energía y percusión:</strong> Caliente 104, Fuego 90.</li>
  <li><strong>Mezcla tropical + urbano:</strong> La Kalle 96.3, KQ 94.5 (<a href="../radio/kq94.html">KQ 94.5 FM</a>).</li>
</ul>

<h2>Santo Domingo vs Santiago en el dial tropical</h2>
<p>La capital concentra emisoras con alcance nacional y más variedad de formatos (salsa pura, urbano, tropical generalista). <strong>Santiago</strong>, como hub del Cibao, tiene identidad fuerte en romántica y tropical norteño: Primera y La Bakana son ejemplos claros. Si vives en el extranjero, el streaming elimina esa distinción geográfica: puedes alternar ambas ciudades en la misma sesión.</p>

<h2>Consejos para oyentes fuera de República Dominicana</h2>
<p>La hora pico local (mañana 7:00–10:00 y tarde-noche 18:00–22:00 AST) coincide con programas hablados y mayor rotación musical. Desde Europa suma 5–6 horas; desde Nueva York, 0–1 hora según horario de verano. Si buscas solo música sin locutores, prueba madrugada dominicana o fines de semana.</p>

<h2>Emisoras regionales que completan el mapa tropical</h2>
<p>Fuera de Santo Domingo y Santiago hay voces locales con identidad propia: emisoras de <strong>La Vega</strong>, <strong>San Pedro de Macorís</strong> o <strong>Puerto Plata</strong> mezclan merengue regional con noticias de barrio. En VivoRD puedes filtrar por nombre en <a href="../radios.html">Radios</a> y descubrir frecuencias que no aparecen en las listas «nacionales». Si viajas a una provincia, anota la FM local y compárala con el stream online: a veces la parrilla difiere ligeramente por publicidad regional.</p>

<h2>Historia breve: por qué el tropical sigue dominando</h2>
<p>El merengue dominicano y la bachata moderna exportaron la cultura de la isla al mundo. Las emisoras tropicales no son nostalgia: siguen siendo el canal donde se estrenan temas de temporada, se anuncian conciertos en el Olímpico o se discuten polémicas de artistas. Escuchar Caliente, Primera o Fuego 90 en vivo conecta con esa conversación cultural en tiempo real, no solo con una lista de Spotify estática.</p>

<h2>Preguntas frecuentes</h2>
<p><strong>¿Cuál es la mejor emisora de bachata?</strong> No hay una sola respuesta: Primera 88.1 y varias urbanas incluyen bachata moderna; para salsa pura, Caliente y Fuego 90.</p>
<p><strong>¿Puedo escuchar estas emisoras gratis?</strong> Sí, desde VivoRD con conexión a internet.</p>
<p><strong>¿La frecuencia FM importa online?</strong> No para el streaming, pero ayuda si viajas a RD y quieres sintonizar la FM local.</p>
<p><strong>¿Hay merengue 24 horas?</strong> Pocas emisoras son 100 % merengue; la mayoría mezcla tropical. Busca parrilla de fin de semana o festivales en vivo.</p>

<p><strong>Ver también:</strong> <a href="como-escuchar-radio-dominicana-en-vivo.html">Cómo escuchar radio online</a> · <a href="radio-urbana-y-reggaeton-dominicano.html">Radio urbana y reggaetón</a> · <a href="../radios.html">Catálogo completo</a></p>`,
  },
  {
    slug: 'ver-tv-dominicana-desde-el-extranjero',
    title: 'Cómo ver TV dominicana desde el extranjero',
    description:
      'Opciones legales y prácticas para ver canales de televisión de República Dominicana en vivo desde fuera del país: requisitos, canales y solución de problemas.',
    body: `
<p>Millones de dominicanos y dominicanas viven fuera de la isla —en Estados Unidos, España, Italia u otros países— y quieren seguir <strong>noticias, novelas, deportes y programas</strong> de casa. Ver TV dominicana desde el extranjero es posible por internet, pero no funciona igual que encender el televisor en Santo Domingo. Esta guía explica por qué, qué canales probar primero y qué hacer cuando el reproductor falla.</p>

<h2>1. Por qué no siempre funciona igual que en RD</h2>
<ul>
  <li><strong>Derechos de retransmisión:</strong> el titular del canal puede limitar el embed a su dominio oficial (.com.do).</li>
  <li><strong>Geobloqueo:</strong> YouTube, Dailymotion u otros hosts pueden restringir por país.</li>
  <li><strong>URLs cambiantes:</strong> las emisoras rotan streams tras eventos o migraciones de CDN.</li>
  <li><strong>Restricción de iframe:</strong> algunos canales solo permiten ver en su web, no en agregadores.</li>
</ul>
<p>VivoRD centraliza señales públicas o enlaces oficiales cuando existen, pero <strong>no controla</strong> la disponibilidad del titular. Si un canal cae, suele ser temporal o requiere actualizar el enlace.</p>

<h2>2. Canales que más consultan desde el exterior</h2>

<h3>Generalistas e informativos</h3>
<ul>
  <li><a href="../canal/color-vision-canal-9.html">Color Visión (Canal 9)</a> — mezcla noticias y entretenimiento.</li>
  <li><a href="../canal/antena-latina-canal-7.html">Antena 7 (Canal 7)</a> — novelas, variedades y boletines.</li>
  <li><a href="../canal/telemicro-canal-5.html">Telemicro (Canal 5)</a> — humor, deportes y noticias.</li>
  <li><a href="../canal/telecentro-canal-13.html">Telecentro (Canal 13)</a> — información y cultura.</li>
</ul>

<h3>Entretenimiento y restricciones</h3>
<p><a href="../canal/telesistema-canal-11.html">Telesistema (Canal 11)</a> tiene trayectoria larga en TV dominicana. En algunos momentos la señal solo reproduce en su sitio oficial por política del proveedor; la ficha de VivoRD indica si hay botón «Ver en sitio oficial».</p>

<h2>3. Requisitos técnicos</h2>
<ul>
  <li><strong>Conexión:</strong> mínimo 5 Mbps recomendados para video estable; 10+ Mbps si es HD.</li>
  <li><strong>Navegador:</strong> Chrome, Firefox o Safari actualizados; HLS o iframe según el canal.</li>
  <li><strong>TV grande:</strong> Chromecast, AirPlay o navegador en Smart TV (puede ser menos fluido que en móvil).</li>
  <li><strong>Audio:</strong> si solo te importa la voz (noticias), algunos canales toleran conexiones más lentas.</li>
</ul>

<h2>4. VPN: ¿cuándo tiene sentido?</h2>
<p>No siempre hace falta. Muchas señales en VivoRD están orientadas a audiencia internacional. Si ves un mensaje de «no disponible en tu región», una VPN con salida en República Dominicana <em>puede</em> desbloquear —pero debes respetar los términos del proveedor del stream y del canal. La VPN no arregla enlaces rotos ni streams caídos del lado del emisor.</p>

<h2>5. Qué hacer cuando el embed falla</h2>
<ol>
  <li>Pulsa <strong>Ver en sitio oficial</strong> si la ficha lo muestra.</li>
  <li>Busca el canal en YouTube o redes sociales: muchos suben clips o transmisiones paralelas.</li>
  <li>Prueba otro navegador o modo incógnito (extensiones de bloqueo a veces interfieren).</li>
  <li>Reporta en <a href="../contacto.html">Contacto</a> con el nombre del canal para revisar el enlace.</li>
</ol>

<h2>6. Combinar TV con radio desde fuera</h2>
<p>Muchos usuarios en el extranjero dejan la <strong>TV en una pestaña</strong> (noticiero o novela) y escuchan <a href="../radio/z101.html">Z 101</a> o <a href="../radio/cdn.html">CDN 92.5</a> en otra para boletines de radio. La app VivoRD facilita radio en segundo plano mientras ves video en el ordenador.</p>

<h2>7. Uso responsable</h2>
<p>Ver TV en línea para consumo personal es el uso previsto. No grabes ni redistribuyas señales con derechos de autor sin permiso del titular. Las marcas y programas pertenecen a cada canal.</p>

<h2>Dispositivos: móvil, tablet y televisor</h2>
<p>En <strong>móvil</strong>, el navegador funciona bien para canales con reproductor ligero; gira a horizontal para ver en pantalla completa. En <strong>tablet</strong>, la experiencia se acerca a una TV pequeña. En <strong>Smart TV</strong>, el navegador integrado a veces bloquea autoplay o cookies: si falla, envía desde el teléfono con Chromecast o usa un stick (Fire TV, Chromecast con Google TV) abriendo vivo-rd.com en su navegador.</p>

<h2>Calidad de imagen y buffering</h2>
<p>Si el video se pausa cada pocos segundos, baja la calidad si el reproductor lo permite, acerca el router o usa cable Ethernet en el portátil. Los canales en HD requieren más ancho de banda estable que la radio. En horas pico (noche en RD), las redes domésticas compartidas pueden sufrir más cortes.</p>

<h2>Preguntas frecuentes</h2>
<p><strong>¿Es legal ver TV dominicana desde EE. UU.?</strong> El acceso por stream público o sitio oficial para uso personal es el escenario habitual; no reemites ni vendes el contenido.</p>
<p><strong>¿Por qué Telesistema a veces no carga en VivoRD?</strong> Restricción del titular o del host del video; usa el enlace oficial desde la ficha.</p>
<p><strong>¿Necesito cuenta o suscripción?</strong> VivoRD no cobra; algunos canales pueden pedir registro en su web propia.</p>
<p><strong>¿Qué huso horario usan los programas?</strong> AST (UTC−4), sin horario de verano en RD.</p>

<p><strong>Relacionado:</strong> <a href="canales-tv-noticias-republica-dominicana.html">Canales de noticias</a> · <a href="deportes-en-tv-y-radio-dominicana.html">Deportes en TV y radio</a> · <a href="../index.html">TV en vivo</a></p>`,
  },
  {
    slug: 'que-es-vivord-y-como-usarlo',
    title: 'Qué es VivoRD y cómo usarlo',
    description:
      'Presentación del servicio VivoRD: catálogo de TV y radio dominicana, reproductor web, app Android, guías y preguntas frecuentes.',
    body: `
<p><strong>VivoRD</strong> (vivo-rd.com) es un directorio y reproductor para consultar <strong>televisión y radio de República Dominicana en vivo</strong> desde el navegador o la app Android. No somos una emisora ni operamos las señales: reunimos información pública, fichas descriptivas, datos de ciudad y frecuencia, y enlaces de reproducción cuando el titular los ofrece.</p>

<h2>Qué ofrecemos</h2>
<ul>
  <li><strong>TV en vivo:</strong> decenas de canales nacionales con ficha informativa y reproductor cuando la señal lo permite (HLS, iframe u oficial).</li>
  <li><strong>Radios:</strong> cientos de emisoras con ciudad, frecuencia FM y descripción editorial completa.</li>
  <li><strong>Búsqueda y recientes:</strong> encuentra rápido lo que ves o escuchas con frecuencia (hasta 3 recientes por TV y radio).</li>
  <li><strong>Guías:</strong> artículos como este sobre cómo escuchar, qué emisoras elegir y ver TV desde el extranjero.</li>
  <li><strong>App Android:</strong> misma experiencia con radio en segundo plano, mini reproductor y controles de medios.</li>
</ul>

<h2>Qué no somos</h2>
<ul>
  <li>No vendemos paquetes de cable, IPTV pirata ni suscripciones premium.</li>
  <li>No almacenamos grabaciones completas de programas: solo enlace en directo.</li>
  <li>No garantizamos disponibilidad 24/7 de todas las señales: dependen de terceros.</li>
  <li>No somos titulares de marcas como Color Visión, Z 101 o CDN: enlazamos contenido de sus respectivos operadores.</li>
</ul>

<h2>Cómo navegar el sitio</h2>
<ol>
  <li><strong>Inicio</strong> — pestaña TV: carrusel de destacados, canales principales y catálogo completo con filtro por nombre.</li>
  <li><strong>Radios</strong> — listado por relevancia con búsqueda; abre la ficha para reproducir.</li>
  <li><strong>Ficha de canal o emisora</strong> — reproductor, bloque de datos (ciudad, FM, señal) y descripción.</li>
  <li><strong>Guías</strong> — sección <a href="./">/guias/</a> con artículos editoriales.</li>
  <li><strong>Legal</strong> — <a href="../aviso-legal.html">Aviso legal</a>, <a href="../privacidad.html">Privacidad</a> y <a href="../contacto.html">Contacto</a> en el pie de página.</li>
</ol>

<h2>TV vs radio en VivoRD</h2>
<p>La <strong>televisión</strong> suele consumir más ancho de banda (video) y puede estar sujeta a restricciones de embed del canal. La <strong>radio</strong> es más ligera (audio) y funciona mejor en móvil y en segundo plano con la app. Muchos usuarios combinan ambos: noticias en video y opinión en radio durante el día.</p>

<h2>App Android</h2>
<p>La aplicación VivoRD replica el catálogo web con ventajas en móvil: reproducción de radio con pantalla apagada, integración con controles del sistema y acceso rápido a recientes. La versión y novedades se documentan en el changelog dentro de la app. No necesitas la app para usar el sitio en el navegador.</p>

<h2>Privacidad y publicidad</h2>
<p>El sitio web puede mostrar publicidad de terceros para mantener el servicio. La app puede usar AdMob. Puedes gestionar cookies desde el aviso en pantalla. Detalles en <a href="../privacidad.html">Privacidad</a>. No vendemos datos personales de oyentes a emisoras.</p>

<h2>Contacto y correcciones</h2>
<p>¿Enlace roto, logo incorrecto o solicitud de retiro por parte del titular? <a href="../contacto.html">Escríbenos</a>. Los propietarios de marcas pueden pedir actualización o baja según <a href="../aviso-legal.html">Aviso legal</a>. Respondemos cuando es técnicamente posible verificar la solicitud.</p>

<h2>Recientes y búsqueda unificada</h2>
<p>El sitio recuerda hasta <strong>tres canales de TV</strong> y <strong>tres radios</strong> que hayas abierto recientemente, para volver sin buscar de nuevo. La búsqueda en la cabecera y en el overlay móvil cruza TV y radio: escribe «CDN», «Color» o «Z» y salta a la ficha correcta. En la app Android el comportamiento es equivalente.</p>

<h2>Errores frecuentes y soluciones</h2>
<ul>
  <li><strong>Pantalla negra en TV:</strong> prueba otro navegador o el enlace oficial del canal.</li>
  <li><strong>Radio se corta al bloquear el móvil:</strong> usa la app Android o desactiva ahorro de batería para el navegador.</li>
  <li><strong>No aparece una emisora:</strong> puede estar excluida por falta de stream verificable; consulta Contacto.</li>
</ul>

<h2>Actualizaciones y changelog de la app</h2>
<p>El sitio y la app evolucionan: nuevas emisoras, corrección de streams y mejoras de reproducción en segundo plano. Las notas de versión en la app Android documentan cambios recientes (por ejemplo, recuperación de audio tras llamadas o controles en pantalla de bloqueo). Si algo falló en una versión anterior, revisa que tengas la última build instalada antes de reportar.</p>

<h2>Guías y contenido editorial</h2>
<p>La sección <a href="./">Guías</a> reúne artículos como este: cómo escuchar radio, comparativas entre emisoras, TV desde el extranjero y deportes. No sustituyen las fichas de cada canal, pero ayudan a elegir con criterio. El contenido se actualiza cuando cambia el catálogo o las frecuencias verificables.</p>

<h2>Preguntas frecuentes</h2>
<p><strong>¿VivoRD es gratis?</strong> Sí, el acceso al directorio y reproductor es gratuito.</p>
<p><strong>¿Por qué un canal no reproduce?</strong> Stream caído, URL cambiada o restricción del titular. Prueba el enlace oficial si aparece en la ficha.</p>
<p><strong>¿Puedo solicitar que agreguen una emisora?</strong> Sí, vía Contacto, si existe stream público verificable.</p>
<p><strong>¿Funciona fuera de República Dominicana?</strong> Sí, para la mayoría de radios y muchos canales de TV.</p>

<p><strong>Explora:</strong> <a href="../index.html">TV en vivo</a> · <a href="../radios.html">Radios</a> · <a href="como-escuchar-radio-dominicana-en-vivo.html">Cómo escuchar radio</a></p>`,
  },
  {
    slug: 'canales-tv-noticias-republica-dominicana',
    title: 'Canales de TV de noticias en República Dominicana',
    description:
      'Panorama de los principales canales dominicanos de información y actualidad: programación, horarios y acceso en vivo en VivoRD.',
    body: `
<p>Seguir la <strong>actualidad dominicana</strong> en video implica saber qué canales dedican franjas —o jornadas enteras— a noticias, debates y reportajes. La TV generalista dominicana mezcla información con entretenimiento; esta guía separa los referentes informativos y explica cómo verlos online.</p>

<h2>Color Visión (Canal 9)</h2>
<p>Histórico generalista con fuerte peso informativo. Boletines de última hora, entrevistas a figuras políticas y económicas, y coberturas nacionales conviven con entretenimiento. Es una de las primeras paradas si buscas contexto sobre lo que ocurre en Santo Domingo y las provincias. <a href="../canal/color-vision-canal-9.html">Ver Color Visión en vivo</a>.</p>

<h2>Antena 7 (Canal 7)</h2>
<p>Mezcla noticias, novelas y variedades; referente de audiencia en horario estelar. Sus espacios informativos suelen concentrarse en franjas de mañana, mediodía y noche. Útil si quieres noticias dentro de una parrilla más amplia de entretenimiento. <a href="../canal/antena-latina-canal-7.html">Ver Antena 7 en vivo</a>.</p>

<h2>Telemicro (Canal 5)</h2>
<p>Canal generalista con humor, deportes y noticias. Programas de opinión y boletines comparten cartelera con entretenimiento. Buena opción si te interesan titulares con tono más variado. <a href="../canal/telemicro-canal-5.html">Ver Telemicro en vivo</a>.</p>

<h2>Telesistema (Canal 11)</h2>
<p>Trayectoria larga en TV dominicana. Algunas señales solo permiten ver en la web oficial por restricción del proveedor de video; la ficha en VivoRD indica si debes abrir el sitio del canal. <a href="../canal/telesistema-canal-11.html">Ficha de Telesistema</a>.</p>

<h2>Telecentro (Canal 13)</h2>
<p>Enfoque en información y cultura con cobertura nacional. Espacios de análisis y reportajes complementan boletines tradicionales. <a href="../canal/telecentro-canal-13.html">Ver Telecentro en vivo</a>.</p>

<h2>Otros canales en el catálogo</h2>
<p>Existen canales adicionales con componente informativo o especializado en el listado de VivoRD, como <a href="../canal/canal-dtv.html">Canal DTV</a>. El catálogo completo está en la <a href="../index.html">página de inicio</a>.</p>

<h2>Combinar TV con radio informativa</h2>
<p>Muchos usuarios alternan <strong>video en TV</strong> con <strong>radio hablada</strong> en el trayecto: <a href="../radio/z101.html">Z 101 (101.3 FM)</a> y <a href="../radio/cdn.html">CDN 92.5</a> ofrecen boletines y análisis cuando no puedes mirar pantalla. VivoRD permite tener ambos abiertos en pestañas o usar la app para audio en segundo plano.</p>

<h2>Horarios y zona horaria</h2>
<p>República Dominicana usa <strong>AST (UTC−4)</strong> sin horario de verano. Los noticieros de mediodía (12:00–14:00) y noche (21:00–23:00) suelen concentrar audiencia. Desde Europa, suma 5–6 horas; desde la costa este de EE. UU., la diferencia es mínima.</p>

<h2>Noticias de provincias y capital</h2>
<p>La cobertura no se limita a Santo Domingo: los equipos de campo de Color Visión, Antena 7 y Telemicro suelen incluir corresponsales en Santiago, San Francisco de Macorís o La Vega en titulares regionales. Si te interesa un suceso local, presta atención a los boletines de mediodía cuando amplían el mapa del país.</p>

<h2>Novelas y noticias en el mismo canal</h2>
<p>La TV dominicana mezcla géneros en generalistas: un noticiero puede preceder a una novela estelar. Si solo quieres información, programa recordatorios en horarios de boletín; si buscas entretenimiento con contexto informativo, Antena 7 y Color Visión son el patrón clásico.</p>

<h2>Elecciones y cobertura especial</h2>
<p>En años electorales, los canales generalistas amplían horas de transmisión con debates, escrutinios y entrevistas a candidatos. La parrilla habitual cede a especiales nacionales. Si sigues la política dominicana desde el exterior, esos días conviene tener abierta la ficha del canal que anuncie cobertura completa y una radio talk (<a href="../radio/z101.html">Z 101</a> o <a href="../radio/cdn.html">CDN</a>) para análisis en audio cuando no puedas ver video.</p>

<h2>Acceso en VivoRD y datos del canal</h2>
<p>Cada ficha incluye reproductor (cuando la señal lo permite), bloque con señal de canal (por ejemplo «Canal 9») y enlace oficial si existe. Antes de pedir revisión de un fallo, comprueba si el canal ofrece botón a su web: algunas restricciones son deliberadas del titular. El catálogo completo de TV está en la <a href="../index.html">página de inicio</a> con filtro por nombre.</p>

<h2>Lista de comprobación antes de ver noticias en vivo</h2>
<ol>
  <li>Comprueba tu conexión (mínimo 5 Mbps para video estable).</li>
  <li>Abre la ficha del canal en VivoRD y lee la descripción del programa actual.</li>
  <li>Si el embed falla, usa el enlace oficial del titular.</li>
  <li>Para contexto adicional, abre Z 101 o CDN en otra pestaña.</li>
</ol>

<h2>Preguntas frecuentes</h2>
<p><strong>¿Hay un canal 24 h solo de noticias?</strong> La mayoría son generalistas con franjas informativas, no CNN estilo continuo.</p>
<p><strong>¿Puedo ver noticias dominicanas desde el extranjero?</strong> Sí, vía streaming; ver <a href="ver-tv-dominicana-desde-el-extranjero.html">guía para el extranjero</a>.</p>
<p><strong>¿Qué canal elegir para entrevistas políticas?</strong> Color Visión, Antena 7 y espacios de Z 101/CDN en radio complementan bien.</p>

<p><strong>Más guías:</strong> <a href="ver-tv-dominicana-desde-el-extranjero.html">Ver TV desde el extranjero</a> · <a href="mejores-radios-noticias-republica-dominicana.html">Radios de noticias</a></p>`,
  },
  {
    slug: 'mejores-radios-noticias-republica-dominicana',
    title: 'Mejores radios de noticias en República Dominicana',
    description:
      'Guía de emisoras dominicanas de información y opinión: Z 101, CDN 92.5, Independencia y más, con frecuencias y acceso en vivo.',
    body: `
<p>Si te interesa la <strong>actualidad dominicana</strong> sin depender solo de la televisión, la radio sigue siendo el medio más ágil para boletines, entrevistas en vivo y análisis mientras conduces o trabajas. Esta guía recorre las emisoras informativas más consultadas, con frecuencia FM, ciudad y enlace para escuchar en VivoRD.</p>

<h2>Qué hace a una radio «informativa»</h2>
<p>No todas las emisoras son 24 h de noticias estilo internacional. En RD predominan formatos <strong>talk + música</strong> o <strong>noticias + deportes</strong>. Una radio informativa útil para ti incluye:</p>
<ul>
  <li>Boletines en horas punta (mañana, mediodía, tarde).</li>
  <li>Entrevistas a actores políticos, económicos y sociales.</li>
  <li>Cobertura de legislación, elecciones y sucesos nacionales.</li>
  <li>En muchos casos, bloque deportivo (LMB, NBA, fútbol).</li>
</ul>

<h2>Z 101 — 101.3 FM, Santo Domingo</h2>
<p>Referencia nacional de <strong>opinión y actualidad</strong>. Su frecuencia 101.3 FM en Santo Domingo es casi un estándar en taxis y oficinas. Programas de mesa redonda, entrevistas matutinas y comentario político. <a href="../radio/z101.html">Escuchar Z 101 en vivo</a>. Para comparar estilos con otra gran emisora informativa, lee <a href="diferencias-entre-z101-y-cdn.html">Z 101 vs CDN</a>.</p>

<h2>CDN 92.5 — Santo Domingo</h2>
<p><strong>Cadena de Noticias</strong> en 92.5 FM: enfoque periodístico con redacción propia y presencia digital fuerte. Boletines, reportajes y conexión con el grupo CDN en televisión (<a href="../canal/cdn-sports-max-canal-67.html">CDN Deportes</a> en TV para deportes). <a href="../radio/cdn.html">Escuchar CDN 92.5</a>.</p>

<h2>Independencia</h2>
<p>Emisora con perfil informativo en el dial dominicano. Opción a considerar si quieres alternar voces y enfoques respecto a Z 101 y CDN. <a href="../radio/independencia.html">Escuchar Independencia</a>.</p>

<h2>BE 99.7 y el ecosistema Listín</h2>
<p><a href="../radio/be997.html">BE 99.7</a> (Santo Domingo Oeste) forma parte del ecosistema del Grupo Listín Diario, con formato contemporáneo (pop/top 40) pero vinculación mediática al grupo periodístico. No es talk puro, pero conecta con la misma familia editorial que el diario.</p>

<h2>Cuándo escuchar cada franja</h2>
<ul>
  <li><strong>6:00–9:00 AST:</strong> programas matutinos, entrevistas del día, tráfico y titulares.</li>
  <li><strong>12:00–14:00:</strong> boletines de mediodía.</li>
  <li><strong>17:00–20:00:</strong> análisis de cierre y deportes.</li>
</ul>
<p>Desde el extranjero, convierte esas horas a tu huso local para pillar los espacios en vivo.</p>

<h2>Perfiles de oyente: ¿cuál te encaja?</h2>
<ul>
  <li><strong>Profesional que quiere titulares rápidos:</strong> CDN en boletines de mediodía.</li>
  <li><strong>Opinión política profunda:</strong> Z 101 en programa matutino o vespertino.</li>
  <li><strong>Deportes US + LMB:</strong> ambas, según el comentarista del día.</li>
  <li><strong>Fondo informativo sin debate:</strong> Independencia como tercera opción.</li>
</ul>

<h2>Relación con prensa escrita y digital</h2>
<p>CDN comparte ecosistema con medios del grupo CDN; Z 101 mantiene línea propia con invitados del día. Ninguna sustituye leer el detalle en un diario digital, pero te mantienen en contexto mientras conduces o cocinas. Combinar <a href="canales-tv-noticias-republica-dominicana.html">TV de noticias</a> + radio talk es el flujo dominicano clásico.</p>

<h2>Podcast y redes vs radio en vivo</h2>
<p>Muchos programas de Z 101 y CDN publican fragmentos en YouTube o redes sociales al día siguiente. Si necesitas <strong>el directo</strong> —reacción inmediata a un suceso—, el streaming en VivoRD sigue siendo la vía. Si puedes esperar, los clips resumen entrevistas largas. La radio en vivo brilla en crisis, elecciones o partidos de béisbol cuando el minuto a minuto importa.</p>

<h2>Frecuencias verificables</h2>
<p>Guarda estas referencias del dial capitalino: <strong>Z 101 = 101.3 FM</strong>, <strong>CDN = 92.5 FM</strong>. En provincias la señal FM puede repetirse vía repetidoras; online, una sola URL en VivoRD evita confusiones. <a href="../radio/be997.html">BE 99.7</a> (Grupo Listín) complementa el ecosistema informativo con formato musical, útil si quieres alternar talk con música contemporánea.</p>

<h2>Independencia y terceras voces</h2>
<p><a href="../radio/independencia.html">Independencia</a> aporta otra línea informativa cuando buscas diversidad de enfoques. No compite por el mismo oyente exclusivo: muchos alternan tres emisoras en la misma jornada. La clave es saber qué programa suena a cada hora; las parrillas cambian entre semana y fin de semana.</p>

<p>Para profundizar en el contraste entre las dos grandes emisoras talk, lee la <a href="diferencias-entre-z101-y-cdn.html">comparativa Z 101 vs CDN</a>. Si prefieres solo audio sin video, esta guía basta; si quieres imágenes del suceso del día, combina con <a href="canales-tv-noticias-republica-dominicana.html">TV de noticias</a>.</p>

<h2>TV + radio: flujo recomendado</h2>
<ol>
  <li>Mañana: Z 101 o CDN en audio mientras preparas el día.</li>
  <li>Mediodía: boletín de TV (<a href="../canal/color-vision-canal-9.html">Color Visión</a> o <a href="../canal/antena-latina-canal-7.html">Antena 7</a>) si puedes ver pantalla.</li>
  <li>Tarde: vuelta a radio para entrevistas largas sin mirar video.</li>
</ol>

<h2>Preguntas frecuentes</h2>
<p><strong>¿Z 101 o CDN?</strong> Depende del tono que busques; tenemos una <a href="diferencias-entre-z101-y-cdn.html">comparativa dedicada</a>.</p>
<p><strong>¿Son gratis online?</strong> Sí, desde VivoRD.</p>
<p><strong>¿Incluyen deportes?</strong> Sí, ambas cubren béisbol y deportes US con frecuencia.</p>
<p><strong>¿Puedo escuchar desde EE. UU.?</strong> Sí, por streaming.</p>

<p><strong>Ver también:</strong> <a href="canales-tv-noticias-republica-dominicana.html">TV de noticias</a> · <a href="como-escuchar-radio-dominicana-en-vivo.html">Cómo escuchar radio online</a></p>`,
  },
  {
    slug: 'radio-urbana-y-reggaeton-dominicano',
    title: 'Radio urbana y reggaetón en República Dominicana',
    description:
      'Emisoras dominicanas de música urbana, reggaetón y dembow: KQ 94.5, Ritmo 96, La Kalle 96.3 y consejos para escuchar en vivo.',
    body: `
<p>El <strong>reggaetón</strong>, el <strong>dembow</strong> y el pop urbano dominicano tienen emisoras propias en el dial FM. No es música residual en una parrilla tropical: hay estaciones enteras orientadas a audiencia joven en Santo Domingo, Santiago y otras ciudades. Esta guía describe las principales, sus frecuencias y cómo escucharlas online.</p>

<h2>Qué entendemos por «radio urbana» en RD</h2>
<p>Formato con predominio de:</p>
<ul>
  <li>Reggaetón y trap latino.</li>
  <li>Dembow y ritmos de barrio dominicano.</li>
  <li>Bachata «urbana» y fusiones con pop internacional.</li>
  <li>Locutores jóvenes, promociones nocturnas y eventos en vivo.</li>
</ul>
<p>Se diferencia de emisoras tropicales clásicas (salsa/merengue puro) como <a href="../radio/caliente.html">Caliente 104</a> o <a href="../radio/fuego90.html">Fuego 90</a>.</p>

<h2>KQ 94.5 FM</h2>
<p>Emisora de referencia en <strong>94.5 FM</strong> con enfoque urbano y latino. Parrilla orientada a éxitos actuales del reggaetón y artistas dominicanos en la escena internacional. <a href="../radio/kq94.html">Escuchar KQ 94.5 en vivo</a>.</p>

<h2>Ritmo 96</h2>
<p>Otra opción clara del segmento urbano en el dial. Útil para alternar con KQ si quieres comparar estilos de programación y rotación musical. <a href="../radio/ritmo96.html">Escuchar Ritmo 96</a>.</p>

<h2>La Kalle 96.3 — Santiago</h2>
<p>Presencia fuerte en el <strong>Cibao</strong> (96.3 FM). Mezcla urbano con pop latino y bachata moderna; no es 100 % reggaetón pero es destino habitual de oyentes jóvenes del norte. <a href="../radio/lakalle963.html">Escuchar La Kalle 96.3</a>.</p>

<h2>Urbano vs tropical: tabla rápida</h2>
<ul>
  <li><strong>Tropical clásico:</strong> Caliente 104, Fuego 90, Primera 88.1 — salsa, merengue, bachata romántica.</li>
  <li><strong>Urbano:</strong> KQ 94.5, Ritmo 96 — reggaetón, dembow, hits latinos.</li>
  <li><strong>Mixto:</strong> La Kalle 96.3, La Bakana 105.9 — puente entre ambos mundos.</li>
</ul>

<h2>Horarios y eventos</h2>
<p>Las emisoras urbanas suelen concentrar <strong>viernes y sábados nocturnos</strong> (22:00–02:00 AST) para sesiones especiales y menciones de discotecas o festivales. Si escuchas desde el extranjero, convierte a tu hora local. En semana laboral, la parrilla se parece más a rotación continua de hits.</p>

<h2>Calidad y datos móviles</h2>
<p>El audio urbano en streaming consume similar a cualquier radio (30–60 MB/hora). En auriculares Bluetooth desde el móvil, la app VivoRD mantiene la reproducción en segundo plano mejor que muchas pestañas de navegador.</p>

<h2>Artistas dominicanos en la parrilla urbana</h2>
<p>La radio urbana dominicana es escaparate para artistas locales que cruzan a mercados internacionales: colaboraciones con reggaetón global, dembow de producción dominicana y bachata fusionada. Escuchar KQ o Ritmo 96 te expone a estrenos antes de que lleguen a playlists curadas. Las emisoras anuncian conciertos en discotecas de Piantini, Santiago o playas en temporada alta.</p>

<h2>Convivencia con la FM tradicional</h2>
<p>Muchos oyentes jóvenes usan datos en la calle y FM en el carro. Si compras un radio FM en RD, anota las frecuencias: KQ 94.5, Ritmo 96, La Kalle 96.3. Online, las mismas emisoras están a un clic en VivoRD sin sintonizar manualmente.</p>

<h2>Seguridad y volumen en espacios públicos</h2>
<p>En bus o metro conviene auriculares: el contenido urbano puede incluir letras explícitas. Ajusta volumen para no molestar. En familia, las emisoras mixtas (La Bakana, La Kalle) pueden ser más neutrales en horario diurno que un urbano puro en madrugada.</p>

<h2>De dónde sale el urbano dominicano</h2>
<p>El dembow y el reggaetón en RD tienen productores y sellos locales que exportan beats a Latinoamérica. La radio urbana es el primer filtro comercial: lo que no rota en KQ o Ritmo 96 tarda más en llegar a audiencia masiva. Escuchar en vivo te acerca a estrenos de barrio antes de charts globales. Cruza esta guía con <a href="mejores-emisoras-merengue-y-bachata.html">tropical clásico</a> si quieres contrastar generaciones musicales.</p>

<h2>Playlist vs radio en vivo</h2>
<p>Spotify y YouTube Music personalizan con algoritmos; la radio urbana introduce sorpresas, promociones locales y charla de locutores que contextualizan tendencias. Si buscas descubrimiento editorial humano —no solo repetición de hits—, dedica una hora semanal a KQ o Ritmo 96 en directo.</p>

<p>La bachata urbana y el dembow dominicano comparten espacio en estas parrillas con reggaetón internacional. Si un tema suena en Santo Domingo un lunes, a menudo aparece en Santiago la misma semana: el streaming nacional sincroniza tendencias entre ciudades. Las noches de viernes suelen concentrar estrenos y mezclas en vivo.</p>

<h2>Preguntas frecuentes</h2>
<p><strong>¿Dónde está el dembow puro?</strong> En parrillas urbanas de KQ, Ritmo y programación nocturna de varias emisoras mixtas.</p>
<p><strong>¿Hay letras explícitas?</strong> Depende de la canción y la hora; las emisoras comerciales suelen emitir versiones «clean» en día.</p>
<p><strong>¿Puedo comparar con merengue?</strong> Sí, lee <a href="mejores-emisoras-merengue-y-bachata.html">guía de tropical</a>.</p>

<p><strong>Ver también:</strong> <a href="como-escuchar-radio-dominicana-en-vivo.html">Escuchar radio online</a> · <a href="../radios.html">Catálogo de radios</a></p>`,
  },
  {
    slug: 'deportes-en-tv-y-radio-dominicana',
    title: 'Deportes en TV y radio dominicana',
    description:
      'Dónde seguir béisbol, NBA y deportes nacionales en canales y radios de República Dominicana en vivo.',
    body: `
<p>El deporte —especialmente <strong>béisbol</strong>, baloncesto NBA y fútbol— ocupa franjas grandes en la radio y la televisión dominicanas. Si quieres seguir LMB, Selección o ligas US desde RD o desde el extranjero, esta guía indica dónde suelen sonar los partidos y los programas de análisis.</p>

<h2>Radio deportiva e informativa</h2>
<p>Las emisoras talk cubren deporte en horario vespertino:</p>
<ul>
  <li><a href="../radio/z101.html">Z 101 (101.3 FM)</a> — análisis, entrevistas y cobertura de béisbol y NBA.</li>
  <li><a href="../radio/cdn.html">CDN 92.5</a> — boletines con sección deportiva y conexión con el grupo CDN.</li>
</ul>
<p>En trayecto o trabajo, la radio sigue siendo el medio más práctico para seguir un juego con narración en español.</p>

<h2>TV deportiva</h2>
<p><a href="../canal/cdn-sports-max-canal-67.html">CDN Deportes</a> (Canal 67) es el referente especializado del grupo CDN para contenido deportivo en televisión. Complementa la radio y la web del grupo.</p>
<p>Los <strong>canales generalistas</strong> también emiten partidos y resúmenes:</p>
<ul>
  <li><a href="../canal/telemicro-canal-5.html">Telemicro (Canal 5)</a></li>
  <li><a href="../canal/color-vision-canal-9.html">Color Visión (Canal 9)</a></li>
  <li><a href="../canal/antena-latina-canal-7.html">Antena 7 (Canal 7)</a></li>
</ul>
<p>La disponibilidad de un partido concreto depende de derechos de retransmisión; no todos los juegos MLB o NBA están en abierto en RD.</p>

<h2>Béisbol dominicano (LMB)</h2>
<p>La Liga Mayor de Béisbol invernal concentra audiencia entre octubre y enero aproximadamente. Las emisoras aumentan cobertura en esas fechas: entrevistas a peloteros, transmisiones parciales o narración alternada según derechos. Sigue <a href="../radio/cdn.html">CDN</a> y <a href="../radio/z101.html">Z 101</a> en temporada.</p>

<h2>NBA y deportes US</h2>
<p>Programas nocturnos en radio talk suelen abrir espacio a NBA y béisbol MLB cuando hay audiencia. No hay una emisora 100 % NBA 24 h como en algunos mercados US; el consumo es por franjas.</p>

<h2>Cómo combinar TV + radio en un partido</h2>
<ol>
  <li>Abre CDN Deportes o generalista si tienes video del juego.</li>
  <li>Si el video falla, pasa a Z 101 o CDN en audio desde VivoRD.</li>
  <li>Usa la app Android para no cortar el audio al bloquear el teléfono.</li>
</ol>

<h2>Desde el extranjero</h2>
<p>El streaming deportivo puede tener las mismas restricciones que otros canales (geobloqueo, derechos). La radio suele ser más fácil de escuchar internacionalmente. Ver también <a href="ver-tv-dominicana-desde-el-extranjero.html">TV desde el extranjero</a>.</p>

<h2>Temporada de béisbol invernal (LMB)</h2>
<p>Entre aproximadamente octubre y enero, la Liga Mayor de Béisbol domina conversaciones. Aguilas, Licey, Gigantes y Estrellas generan audiencia masiva. Las emisoras alargan espacios con análisis de rotaciones, imports y juegos de la Serie. Si solo sigues MLB desde EE. UU., la LMB invernal te devuelve al béisbol dominicano con narradores locales.</p>

<h2>Fútbol y otros deportes</h2>
<p>El fútbol internacional (Liga española, Champions) aparece en bloques de resultados en radio talk, aunque el béisbol sigue siendo rey. Baloncesto NBA tiene seguimiento en horario nocturno. Para eventos puntuales (boxeo, atletismo), los canales generalistas suelen interrumpir parrilla habitual.</p>

<h2>Resúmenes y análisis post-juego</h2>
<p>Tras un juego de Aguilas o Licey, los programas nocturnos de Z 101 y CDN suelen abrir línea con oyentes. Si perdiste la transmisión en video, el audio post-partido recupera goles, decisiones polémicas y entrevistas en vestuario (cuando la emisora las tiene). <a href="../canal/cdn-sports-max-canal-67.html">CDN Deportes</a> complementa con imágenes cuando hay derechos.</p>

<h2>Calendario aproximado del fan dominicano</h2>
<ul>
  <li><strong>Oct–Ene:</strong> Liga de Béisbol Profesional (LMB) — máxima prioridad en radio y TV.</li>
  <li><strong>Mar–Sep:</strong> MLB y NBA en bloques nocturnos.</li>
  <li><strong>Año completo:</strong> fútbol internacional en resúmenes.</li>
</ul>
<p>Ajusta expectativas: no todo partido de MLB está en abierto en RD; la radio suele tener narración aunque no haya imagen.</p>

<h2>Narración en español desde el exterior</h2>
<p>Si vives en EE. UU. y el partido de MLB está en inglés en TV local, la radio dominicana en español mantiene el vínculo cultural. LMB invernal es aún más relevante para la diáspora: horarios nocturnos en RD pueden coincidir con tarde en Nueva York, facilitando ver o escuchar en familia.</p>

<p>Los programas deportivos de fin de semana suelen extenderse si hay partido de Selección o torneo internacional con participación dominicana. Mantén <a href="../radio/cdn.html">CDN</a> y <a href="../canal/telemicro-canal-5.html">Telemicro</a> en favoritos en octubre–marzo, cuando convergen LMB, NBA y pretemporada de MLB. En verano, el béisbol de Grandes Ligas llena espacios nocturnos en talk y en redes sociales de los programas.</p>

<h2>Preguntas frecuentes</h2>
<p><strong>¿Transmiten todos los juegos de Aguilas/Licey en vivo?</strong> Depende del año y los derechos; consulta parrilla del canal que tiene el contrato.</p>
<p><strong>¿CDN Deportes está en VivoRD?</strong> Sí, en <a href="../canal/cdn-sports-max-canal-67.html">su ficha</a> cuando la señal está activa.</p>
<p><strong>¿Es gratis?</strong> Acceso VivoRD gratuito; la señal puede incluir anuncios del emisor.</p>

<p><strong>Ver también:</strong> <a href="mejores-radios-noticias-republica-dominicana.html">Radios de noticias</a> · <a href="../index.html">Todos los canales</a></p>`,
  },
  {
    slug: 'diferencias-entre-z101-y-cdn',
    title: 'Z 101 vs CDN 92.5: diferencias y cuál escuchar',
    description:
      'Comparativa entre Z 101 (101.3 FM) y CDN 92.5: formato, tono, deportes y cuándo elegir cada emisora informativa dominicana.',
    body: `
<p><strong>Z 101</strong> y <strong>CDN 92.5</strong> son las dos emisoras que más se mencionan cuando alguien busca «radio de noticias» en Santo Domingo. No son intercambiables: tienen historias distintas, tonos editoriales diferentes y públicos que a veces se solapan. Esta guía te ayuda a elegir —o alternar— según lo que quieras escuchar.</p>

<h2>Datos rápidos</h2>
<ul>
  <li><strong>Z 101:</strong> 101.3 FM, Santo Domingo. <a href="../radio/z101.html">Escuchar Z 101</a>.</li>
  <li><strong>CDN 92.5:</strong> 92.5 FM, Cadena de Noticias. <a href="../radio/cdn.html">Escuchar CDN 92.5</a>.</li>
</ul>

<h2>Origen y enfoque</h2>
<p><strong>Z 101</strong> se asocia a décadas de programación de opinión, mesas de debate y locutores con audiencia fiel. El formato es talk dominante: entrevistas largas, comentario político y espacios deportivos. Es la radio de «la conversación del día» en muchos sectores.</p>
<p><strong>CDN 92.5</strong> es la voz radiofónica del <strong>grupo CDN</strong>, con redacción periodística y presencia en TV (<a href="../canal/cdn-sports-max-canal-67.html">CDN Deportes</a>). El enfoque tiende a ser más noticia redactada + análisis que mesa de opinión pura, aunque también tiene programas de entrevista.</p>

<h2>Tono y estilo</h2>
<ul>
  <li><strong>Z 101:</strong> más polarizada en percepción pública; ideal si buscas debate directo y opiniones enfrentadas.</li>
  <li><strong>CDN 92.5:</strong> tono periodístico; ideal si prefieres boletines y cobertura multiplataforma del grupo.</li>
</ul>
<p>La «mejor» depende de si quieres análisis o confrontación de ideas.</p>

<h2>Deportes</h2>
<p>Ambas cubren béisbol y deportes US. CDN tiene sinergia con canal deportivo en TV; Z 101 tiene programas deportivos con audiencia consolidada en radio. En temporada invernal (LMB), ambas suben cobertura.</p>

<h2>¿Cuándo escuchar cada una?</h2>
<ul>
  <li><strong>Mañana con entrevistas políticas:</strong> prueba ambas; compara invitados del día.</li>
  <li><strong>Mediodía con boletín rápido:</strong> CDN suele ser eficiente en titulares.</li>
  <li><strong>Trayecto largo:</strong> Z 101 para programa de opinión extenso.</li>
  <li><strong>Partido en video + radio:</strong> CDN TV deportes + CDN radio, o Z 101 en audio.</li>
</ul>

<h2>¿Y otras opciones?</h2>
<p><a href="../radio/independencia.html">Independencia</a> y otras emisoras talk amplían el espectro. Para música sin noticias, cambia a <a href="../radio/caliente.html">Caliente 104</a> o emisoras urbanas (<a href="radio-urbana-y-reggaeton-dominicano.html">guía urbana</a>).</p>

<h2>Streaming y extranjero</h2>
<p>Ambas están disponibles en VivoRD por internet. No necesitas sintonizar 101.3 o 92.5 en FM si estás fuera del país. Consumo de datos similar a cualquier radio (~30–60 MB/hora).</p>

<h2>Invitados y agenda del día</h2>
<p>La utilidad de Z 101 o CDN depende de quién esté al aire ese día: ministro, analista, pelotero o empresario. Si un tema te importa (elecciones, reforma fiscal, rumba de temporada LMB), revisa ambas emisoras en la misma mañana: a menudo entrevistan a actores distintos del mismo asunto.</p>

<h2>Publicidad y patrocinios</h2>
<p>Como en toda radio comercial, habrá bloques de anuncios locales (bancos, clínicas, retail). Es el modelo que financia el contenido gratuito. La publicidad de VivoRD (web/app) es independiente de la parrilla de cada emisora.</p>

<h2>Historia y legitimidad en el dial</h2>
<p>Ambas emisoras llevan décadas en el dial capitalino: no son proyectos nuevos ni streams anónimos. Eso importa si te preocupa la fuente de la información. Z 101 construyó audiencia en talk; CDN en noticia multiplataforma. Elegir una no implica rechazar la otra: muchos profesionales escuchan las dos para contrastar enfoques.</p>

<h2>Tabla comparativa rápida</h2>
<ul>
  <li><strong>Frecuencia:</strong> Z 101 = 101.3 FM · CDN = 92.5 FM.</li>
  <li><strong>Ciudad base:</strong> ambas con foco en Santo Domingo y alcance nacional online.</li>
  <li><strong>TV vinculada:</strong> CDN → CDN Deportes; Z 101 → formato radio primero.</li>
  <li><strong>Mejor para:</strong> Z 101 = debate · CDN = boletín + redacción.</li>
</ul>

<h2>Cómo probar ambas en una semana</h2>
<p>Lunes a viernes: escucha 20 minutos de cada emisora en el mismo horario (por ejemplo 8:00 AST). Anota diferencias de tono, invitados y profundidad. El fin de semana, prueba espacios deportivos si te interesa LMB o NBA. Así decides con evidencia, no con reputación heredada.</p>

<p>Ambas emisoras están en el catálogo de VivoRD con stream en vivo: no necesitas hardware FM. Desde el extranjero, la calidad de audio suele ser suficiente con 4G; el video de entrevistas en estudios a veces se publica aparte en redes del programa. Prueba ambas en la misma semana antes de elegir favorita.</p>

<h2>Preguntas frecuentes</h2>
<p><strong>¿Puedo escuchar las dos el mismo día?</strong> Sí; muchos oyentes alternan según el programa.</p>
<p><strong>¿Cuál tiene más música?</strong> En horario informativo, ambas priorizan voz; la música aparece en franjas específicas o fines de semana.</p>
<p><strong>¿Son gratuitas online?</strong> Sí, en VivoRD.</p>
<p><strong>¿Sustituyen a la TV de noticias?</strong> No; complementan. Ver <a href="canales-tv-noticias-republica-dominicana.html">canales de TV</a>.</p>

<p><strong>Ver también:</strong> <a href="mejores-radios-noticias-republica-dominicana.html">Radios de noticias</a> · <a href="como-escuchar-radio-dominicana-en-vivo.html">Cómo escuchar radio</a></p>`,
  },
];
