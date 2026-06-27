/** Intros editoriales de hubs (>=180 palabras cada una, redacción distinta por entrada). */

function p(paragraphs) {
  return paragraphs.map((text) => `<p>${text}</p>`).join('\n');
}

export const CITY_HUB_INTROS = {
  'santo-domingo': p([
    'El dial de <strong>Santo Domingo</strong> concentra la mayor parte de la radio comercial dominicana. Desde Gazcue y el Ensanche hasta los polígonos industriales del Gran Santo Domingo, la capital reúne emisoras nacionales con alcance país, cadenas regionales y señales especializadas en noticias, deportes, música tropical y formatos urbanos. Para quien escucha desde el extranjero, entender este mapa ayuda a elegir entre la parrilla generalista de la mañana y las voces nocturnas de conversación.',
    'En la calle, la radio capitalina sigue siendo compañía en guaguas, colmados y talleres. Muchas frecuencias FM que nacieron aquí marcan la agenda informativa de todo el país: boletines al amanecer, mesas de opinión al mediodía y bloques deportivos en la tarde. Otras apuestan por un público joven con reggaetón, dembow y estrenos digitales, mientras las clásicas del merengue y la bachata mantienen espacios fijos en la tarde-noche.',
    'VivoRD lista en esta página las emisoras saludables asociadas a Santo Domingo según el campo de ciudad en nuestro catálogo. No inventamos ubicaciones: si una emisora declara otra sede, aparece en su hub correspondiente. Cada ficha incluye reproductor web, frecuencia cuando consta en el nombre o la descripción, y texto editorial propio.',
    'Explora el listado, abre las fichas que te interesen y guarda tus favoritas. Si buscas contexto sobre cómo escuchar radio dominicana online o guías por género, revisa los enlaces al final de esta página. El dial capitalino cambia con el tiempo, pero sigue siendo la puerta de entrada al sonido cotidiano de República Dominicana.',
  ]),
  'santiago-de-los-caballeros': p([
    '<strong>Santiago de los Caballeros</strong> es el corazón radial del Cibao. La ciudad industrial y universitaria del norte tiene identidad propia en FM: voces más directas, repertorios donde conviven merengue, bachata, balada y pop, y emisoras que hablan a una audiencia que consume tanto la actualidad nacional como la vida local del valle del Cibao.',
    'A diferencia de la capital, muchas señales santiagueras combinan entretenimiento con información regional. Locutores conocidos en la calle Real, estaciones que acompañan el béisbol invernal y radios románticas que marcan las tardes en los barrios son parte del paisaje. El streaming ha amplificado ese alcance: familias en Nueva York o Madrid suelen sintonizar Santiago para sentir el acento y la selección musical del Cibao.',
    'Esta hub agrupa emisoras cuyo registro en VivoRD indica Santiago de los Caballeros como ciudad. Solo aparecen fichas con stream verificado y sin incidencias graves de salud. Ordenamos por nombre para facilitar la búsqueda; la frecuencia FM se muestra en la ficha cuando está documentada.',
    'Si te interesa comparar Santiago con Santo Domingo, alterna esta página con el hub de la capital y con las guías de merengue, bachata o noticias enlazadas abajo. El Cibao tiene uno de los diales más variados del país y merece explorarse emisora por emisora.',
  ]),
  'san-pedro-de-macoris': p([
    'En <strong>San Pedro de Macorís</strong>, la radio acompaña la vida portuaria, la caña y el béisbol como en pocas ciudades del Caribe. El dial local mezcla estaciones con raíces comunitarias, formatos tropicales y voces que conocen de cerca la historia industrial de la provincia. Escuchar San Pedro en línea es acercarse a un ritmo distinto al de la capital, más cercano al litoral sur-oriental.',
    'Las emisoras de la ciudad suelen programar música bailable, espacios de participación y boletines que conectan barrios con la noticia provincial. En temporada de pelota, muchas frecuencias amplifican la pasión por los Toros del Este y el debate deportivo que cruza fronteras con La Romana y Santo Domingo. La oferta no es tan numerosa como en el Gran Santo Domingo, pero sí densa en identidad.',
    'VivoRD reúne aquí las emisoras de San Pedro de Macorís que están activas en nuestro directorio y pasan el filtro de salud de stream. Cada enlace abre una ficha con reproductor integrado y metadatos verificables. Si una emisora no aparece, puede estar catalogada bajo otra ciudad o temporalmente sin señal online.',
    'Usa este hub como punto de partida para descubrir el sonido del sur profundo. Las guías relacionadas explican cómo escuchar radio dominicana desde el extranjero y recomiendan emisoras por género cuando buscas algo concreto más allá de la geografía.',
  ]),
  'santa-cruz-de-barahona': p([
    '<strong>Barahona</strong>, en el suroeste, tiene un dial acorde a su geografía: mar, montaña y frontera agrícola. Las radios locales sirven a comunidades que siguen la actualidad nacional pero valoran referencias al litoral, al turismo emergente de la región Sur y a la música que suena en playas y campos. La FM barahonesa suele ser cercana, con locutores que nombran calles y festividades conocidas.',
    'El formato dominante combina tropical, balada y espacios informativos breves. Algunas emisoras orientan su programación a oyentes jóvenes con estilos urbanos; otras mantienen la línea romántica que acompaña tardes en el malecón. El streaming permite a la diáspora del suroeste retomar esas voces sin depender de la captación FM en el extranjero.',
    'En esta página listamos emisoras saludables registradas con Santa Cruz de Barahona como ciudad en VivoRD. Priorizamos datos reales del catálogo: nombre, imagen, stream y descripción editorial. No ampliamos la lista con emisoras sin señal comprobada.',
    'Barahona es una pieza clave del mapa radial dominicano fuera del eje Santo Domingo–Santiago. Explora las fichas, compara estilos y consulta las guías enlazadas si necesitas orientación sobre géneros o sobre el uso del reproductor web.',
  ]),
  'san-felipe-de-puerto-plata': p([
    'La costa norte vive al ritmo del turismo, el comercio y el Cibao marítimo. <strong>Puerto Plata</strong> concentra emisoras que hablan a hoteleros, taxistas, estudiantes y familias de Sosúa, Cabarete y la ciudad histórica. El dial mezcla merengue, bachata, reggaetón y programación bilingüe cuando el público lo exige la temporada alta.',
    'Varias frecuencias de la zona enlazan la actualidad nacional con la vida del litoral atlántico: clima, tránsito hacia aeropuertos, eventos culturales y deportes locales. La radio sigue siendo el medio más inmediato en temporadas de huracán o cuando el turismo necesita información práctica. Online, esas mismas señales llegan a dominicanos en el exterior que extrañan la brisa norteña.',
    'Este hub muestra emisoras de San Felipe de Puerto Plata disponibles en VivoRD con stream activo. Cada tarjeta lleva a una ficha con datos verificados y reproductor. Si buscas una emisora concreta, usa también el buscador general de radios.',
    'Puerto Plata complementa hubs de Santiago y Santo Domingo: tres regiones, tres acentos en antena. Revisa las guías de tropical y urbana si quieres profundizar en estilos musicales frecuentes en la costa norte.',
  ]),
  'concepcion-de-la-vega': p([
    '<strong>La Vega</strong>, en el valle agrícola del Cibao Central, tiene un dial ligado al campo, al carnaval y a la universidad regional. Las emisoras locales combinan noticias breves, música tropical y espacios de fe que reflejan la vida comunitaria. Escuchar La Vega online conecta con un centro urbano que no es capital pero sí referencia cultural del interior norte.',
    'Durante febrero, la radio vegana multiplica cobertura de carnaval y concursos; el resto del año, acompaña jornadas laborales en factorías y fincas. Formatos románticos y tropicales compiten con estaciones cristianas y con señales deportivas que siguen la pelota invernal. La diversidad es menor en número de emisoras que en Santo Domingo, pero la identidad es clara.',
    'Listamos aquí fichas saludables con ciudad Concepción de La Vega en nuestros datos. VivoRD no publica streams caídos de forma permanente: si una emisora falla revisiones recientes, queda fuera del hub hasta recuperarse.',
    'La Vega es puerta al hub del Cibao junto con Santiago y Moca. Usa esta página para comparar emisoras del interior y enlaza con guías editoriales cuando quieras contexto sobre géneros o instrucciones de escucha web.',
  ]),
  'santo-domingo-oeste': p([
    'El municipio de <strong>Santo Domingo Oeste</strong> amplía el dial capitalino hacia Los Alcarrizos, Pedro Brand y barrios densamente poblados del oeste del Gran Santo Domingo. Muchas emisoras listadas aquí comparten programación con la capital pero declaran sede o cobertura en la zona oeste, donde el tránsito, el comercio informal y la cultura urbana marcan audiencias jóvenes.',
    'Predominan formatos urbanos, tropical y noticias en franjas breves. Locutores conocidos en colmados y terminales de guagua construyen lealtad que el streaming ahora exporta. Para oyentes en el extranjero, estas señales suenan a capital extendida: mismo idioma, mismos estrenos, pero con menciones de barrios que no aparecen en boletines del centro.',
    'Esta hub agrupa emisoras saludables con Santo Domingo Oeste en el catálogo VivoRD. Cada ficha conserva su descripción enriquecida y metadatos de frecuencia cuando existen. El listado se actualiza al regenerar el build de radios.',
    'Compara este hub con Santo Domingo centro y con hubs de género si buscas noticias o urbana específicamente. El oeste metropolitano es una pieza esencial del mapa FM nacional.',
    'Si vives en Los Alcarrizos o Pedro Brand, estas señales suelen ser las primeras que aparecen al sintonizar FM localmente; online puedes recuperarlas con la misma identidad de barrio.',
  ]),
  'la-romana': p([
    '<strong>La Romana</strong> une industria azucarera, turismo de golf y puerto pesquero en un dial compacto pero reconocible. Las emisoras locales hablan a una ciudad que vive de servicios, comercio y relación constante con San Pedro de Macorís y la capital. En FM suenan tropical, balada, noticias cortas y programación deportiva cuando el béisbol ocupa la conversación pública.',
    'La Romana también recibe señales de emisoras nacionales con repetidoras o promoción local, pero las voces originadas aquí tienen cadencia propia: referencias al malecón, a Central Romana y a festividades del este. Escuchar en línea permite seguir esos matices fuera del país.',
    'VivoRD lista emisoras de La Romana con stream verificado. Solo entran fichas saludables según nuestra auditoría de URLs. Haz clic en cada tarjeta para abrir el reproductor y la descripción completa.',
    'Explora La Romana junto al hub de San Pedro y Higüey para entender el dial del este dominicano. Las guías enlazadas orientan sobre escucha web y sobre géneros musicales frecuentes en la región.',
    'El puerto y los campos de golf generan audiencia bilingüe en temporada alta; varias emisoras reflejan esa mezcla en publicidad y selección musical sin dejar de sonar claramente dominicanas.',
  ]),
  'salvaleon-de-higuey': p([
    'En el este turístico, <strong>Higüey</strong> concentra radios que sirven a residentes y a quienes trabajan en la industria de Punta Cana y Bávaro. El dial mezcla música bailable, espacios de fe, boletines locales y publicidad de comercios que mueven la economía regional. La voz higüeyana suena en guaguas que cruzan La Altagracia y en colmados de la ciudad catedralicia.',
    'La influencia del turismo internacional se nota en repertorios variados: tropical dominicano, pop latino y estilos urbanos comparten horarios. Aun así, muchas emisoras mantienen raíces comunitarias claras, con locutores que anuncian actividades parroquiales, ligas barriales y campañas de servicio público.',
    'Este hub reúne emisoras saludables registradas con Salvaleón de Higüey como ciudad. Los metadatos provienen de nuestro JSON de catálogo; no añadimos emisoras sin evidencia de stream.',
    'Higüey cierra el arco este junto a La Romana y San Pedro. Si planeas escuchar desde el extranjero, combina esta página con guías sobre radio en línea y con hubs de género tropical o cristiano según tu preferencia.',
    'La basílica y el comercio turístico marcan picos de audiencia en fechas religiosas y vacacionales; el listado aquí refleja emisoras que mantienen stream estable fuera de esos picos.',
  ]),
  'san-francisco-de-macoris': p([
    '<strong>San Francisco de Macorís</strong> es un nodo del nordeste dominicano con tradición agrícola y comercial. Su dial FM incluye estaciones tropicales, románticas y cristianas que acompañan rutinas en el mercado, fábricas de tabaco y centros educativos. La ciudad no tiene el volumen de Santiago, pero sí voces estables con décadas de presencia.',
    'La programación suele alternar música nacional con baladas internacionales y bloques informativos breves. En temporada electoral o de huracán, la radio macorís se vuelve canal de utilidad pública. El streaming abre esa utilidad a familias dispersas en Estados Unidos y España.',
    'Aquí aparecen emisoras de San Francisco de Macorís activas en VivoRD. Filtramos streams caídos para no frustrar al oyente. Cada ficha incluye reproductor y texto editorial único generado en el build.',
    'Usa este hub para explorar el nordeste más allá de Santiago. Enlaces a guías y a hubs de género ayudan a profundizar cuando buscas un estilo concreto.',
    'El tabaco y el comercio de la región Nordeste aparecen a menudo en menciones de locutores y patrocinadores; escuchar en línea conserva esas referencias locales.',
    'Cuando llueve en la cordillera, varias emisoras amplían boletines de carretera; ese utilitario forma parte del valor de la radio provincial que este hub recoge.',
  ]),
  sabaneta: p([
    '<strong>Sabaneta</strong>, cuna del merengue según la tradición popular, tiene un dial pequeño pero simbólico en el Cibao Central. Las emisoras locales enfatizan música nacional, espacios culturales y la conexión con festividades que recuerdan a Luis Alberti y la identidad merenguera. Escuchar Sabaneta en línea es un gesto cultural tanto como musical.',
    'La oferta FM incluye formatos tropicales, conversación y programación comunitaria. La ciudad comparte audiencia con Santiago y La Vega, pero mantiene menciones locales que los oyentes del lugar reconocen al instante. Para quien estudia la historia del merengue, estas señales son contexto sonoro.',
    'VivoRD agrupa emisoras saludables con Sabaneta en el campo ciudad. Solo listamos streams que responden en nuestras comprobaciones. Abre cada ficha para ver frecuencia y descripción cuando consten.',
    'Combina Sabaneta con el hub de merengue y con la guía de emisoras tropicales si quieres ampliar el panorama. El Cibao musical se entiende mejor ciudad por ciudad.',
    'En fechas patrias y concursos de merengue, estas emisoras suelen reforzar repertorio clásico; fuera de temporada mantienen la misma identidad con menos eventos en vivo.',
    'Visitantes al monumento de Alberti suelen buscar estas frecuencias como souvenir sonoro; online puedes recrear esa experiencia sin sintonizar FM en el lugar.',
  ]),
  'san-fernando-de-monte-cristi': p([
    'En el noroeste fronterizo, <strong>Monte Cristi</strong> tiene un dial acorde a puerto, pesca y comercio binacional. Las radios locales informan sobre clima, tránsito hacia Dajabón y actividades del litoral. Musicalmente predominan tropical, balada y estaciones cristianas que acompañan comunidades costeras.',
    'La lejanía relativa de la capital hace que la FM local sea referencia cotidiana. Locutores conocen por nombre a oyentes que llaman al estudio; el streaming mantiene ese lazo cuando la migración dispersa familias. La identidad noroestana se escucha en playlist y en expresiones coloquiales.',
    'Este hub lista emisoras de San Fernando de Monte Cristi verificadas en VivoRD. Excluimos señales con problemas persistentes de URL. Cada enlace abre reproductor web sin apps adicionales.',
    'Monte Cristi complementa hubs de Puerto Plata y Santiago en el mapa norte. Consulta guías relacionadas para instrucciones de escucha y recomendaciones por género.',
    'La brisa del noroeste y la pesca artesanal aparecen en crónicas y menciones de clima que estas emisoras suelen incluir en la mañana.',
    'La frontera con Haití y el comercio marítimo marcan parte de la conversación local; escuchar estas señales online conserva ese contexto geográfico.',
  ]),
  moca: p([
    '<strong>Moca</strong>, en la línea entre el Cibao agrícola y el nordeste, tiene emisoras que hablan a productores, comerciantes y estudiantes de Espaillat. El dial es modesto en número pero constante: tropical, balada, noticias breves y programación cristiana en horarios matutinos. La voz mocana llega a fincas de cacao y a talleres urbanos por igual.',
    'Muchos oyentes alternan Moca con Santiago o San Francisco de Macorís según horario y programa. El streaming facilita esa zapping regional sin perder calidad de audio cuando el stream del titular responde bien.',
    'VivoRD muestra aquí emisoras saludables con Moca como ciudad declarada. Los datos de frecuencia provienen del nombre o descripción de cada emisora; no fabricamos cifras.',
    'Explora Moca dentro del eje Cibao y revisa hubs de género si buscas merengue, tropical o cristiana concretamente. La radio provincial sigue siendo puerta de entrada a la vida local.',
    'Espaillat comparte audiencia con Santiago en horas pico; este listado te permite quedarte en voces que nombran Moca y sus barrios sin perderte en el dial metropolitano del Cibao.',
    'Productores de cacao y comerciantes del mercado siguen siendo oyentes habituales de la FM mocana en horas tempranas.',
  ]),
  bani: p([
    '<strong>Baní</strong>, en el valle de Peravia, tiene un dial ligado al sur central: comercio, caña remanente y proximidad a la capital. Las emisoras locales suenan en mercados, playas de Nizao y carreteras hacia Azua. Formatos tropicales y románticos dominan, con espacios de opinión en horarios de mayor audiencia.',
    'La influencia de Santo Domingo se nota en playlist y publicidad, pero locutores banilejos mantienen referencias a festividades patronales y a la geografía costera. Escuchar Baní online es útil para quien creció en el sur central y quiere retomar voces familiares.',
    'Este hub agrupa emisoras activas con Baní en el catálogo VivoRD. Solo entran fichas que pasan el filtro de salud de stream. Haz clic en cada tarjeta para reproducir.',
    'Baní conecta con hubs de Barahona, San Pedro y Santo Domingo en un arco sur. Usa las guías enlazadas para orientación sobre escucha web y géneros musicales.',
    'Las playas de Nizao y el comercio azucarero histórico siguen presentes en la conversación radial local, aunque la provincia comparta noticias nacionales con la capital.',
    'Peravia es puente entre el sur profundo y Santo Domingo; estas emisoras reflejan ese equilibrio en playlist y menciones de carretera hacia la capital.',
  ]),
};

export const GENRE_HUB_INTROS = {
  noticias: p([
    'La radio informativa dominicana sigue siendo el canal más rápido para boletines, entrevistas y análisis mientras conduces o trabajas. A diferencia de la televisión, permite multitarea y actualización continua: desde el amanecer con resúmenes de prensa hasta mesas nocturnas de opinión. En VivoRD clasificamos como <strong>noticias y talk</strong> las emisoras cuyo nombre o descripción mencionan explícitamente actualidad, informativos, talk o espacios de opinión.',
    'Este criterio es automático y conservador: si no hay evidencia textual en nuestros datos, la emisora no aparece aquí aunque ocasionalmente transmita boletines. Preferimos evitar inventar géneros. Dentro del grupo encontrarás señales de Santo Domingo, Santiago y ciudades provinciales con enfoque periodístico o conversacional.',
    'Cada ficha enlazada tiene reproductor web y metadatos verificables de ciudad y frecuencia FM cuando constan. Si un stream falla revisiones recientes, la emisora se excluye del listado hasta recuperarse, coherente con nuestra política de salud de URLs.',
    'Para profundizar, abre la guía de radios de noticias enlazada abajo y compara con hubs de ciudad si te interesa el contexto geográfico. La información en antena complementa —no sustituye— a medios escritos y digitales.',
    'Puedes alternar entre emisoras de este listado desde el móvil o el escritorio: cada ficha de VivoRD conserva su propio reproductor, metadatos de ciudad y descripción editorial sin duplicar la señal del titular.',
  ]),
  'urbano-reggaeton': p([
    'El <strong>urbano</strong> y el <strong>reggaetón</strong> dominicano tienen emisoras dedicadas, no solo bloques nocturnos en parrillas tropicales. Dembow, trap latino y estrenos de chart conviven en frecuencias orientadas a público joven de Santo Domingo, Santiago y ciudades turísticas. Detectamos este género cuando el nombre o la descripción de la emisora mencionan reggaetón, urbano, dembow, trap u otros términos equivalentes.',
    'La clasificación se basa en texto real del catálogo VivoRD, no en suposiciones de formato. Una emisora generalista que no declare esos estilos no entrará aquí aunque ocasionalmente los toque. El listado mezcla señales nacionales e regionales siempre que el stream esté saludable.',
    'Desde el extranjero, estas emisoras son ventana a estrenos y a la conversación cultural urbana del país. Cada tarjeta abre una ficha con reproductor integrado y descripción editorial enriquecida en el build.',
    'Consulta la guía de radio urbana enlazada para contexto adicional y combina este hub con hubs de ciudad si quieres filtrar por zona. El dembow y el reggaetón evolucionan rápido; el catálogo se regenera cuando actualizamos datos.',
    'Si una emisora deja de responder en nuestras comprobaciones, desaparece temporalmente del hub hasta que el titular restablezca el stream; así evitamos enlaces muertos en medio de una sesión de escucha.',
  ]),
  merengue: p([
    'El <strong>merengue</strong> sigue siendo la raíz identitaria del dial dominicano. Emisoras tropicales y generalistas lo declaran en nombre o descripción, ya sea con parrillas clásicas o con mezcla de merengue moderno y otros ritmos. Este hub agrupa fichas donde la palabra merengue aparece en metadatos verificables de VivoRD.',
    'No confundimos tropical genérico con merengue explícito: hace falta mención textual. Así evitamos clasificaciones inventadas. El resultado incluye estaciones de capital, Cibao y regiones con tradición en festivales y carnavales donde el merengue es protagonista.',
    'Cada enlace lleva a reproductor web, frecuencia FM si está documentada y texto editorial único. Streams caídos se excluyen hasta nueva verificación.',
    'Para contexto histórico y recomendaciones ampliadas, lee la guía de merengue y bachata enlazada. El merengue convive hoy con bachata y urbano; explora también esos hubs para comparar estilos.',
    'Las fichas enlazadas muestran frecuencia FM cuando aparece en el nombre o la descripción original; si falta ese dato, la emisora sigue siendo reproducible online aunque no publiquemos cifras inventadas.',
    'En carnaval y Navidad, muchas de estas emisoras refuerzan clásicos de merengue en directo; fuera de temporada el repertorio sigue siendo mayoritariamente nacional con espacio para estrenos.',
  ]),
  bachata: p([
    'La <strong>bachata</strong> dominicana ocupa espacios enteros en FM comercial y romántica. Clasificamos aquí emisoras que mencionan bachata en nombre o descripción: desde clásicos de guitarra hasta fusiones urbanas. El criterio es textual y automático sobre datos VivoRD.',
    'Muchas estaciones mezclan bachata con balada o pop latino; si la bachata está declarada, la emisora entra en este hub aunque también toque otros géneros. Preferimos transparencia sobre pureza de formato. Todas las fichas listadas tienen stream saludable al momento del build.',
    'Oyentes en el extranjero usan este listado para retomar sonidos de barrio y estrellas románticas contemporáneas. Abre cada ficha para escuchar y leer metadatos de ciudad y dial.',
    'Combina este hub con el de baladas románticas y con guías editoriales si buscas orientación. La bachata sigue expandiéndose globalmente; el dial local refleja esa demanda.',
    'Desde el extranjero, muchos oyentes usan este listado para alternar emisoras románticas durante el trabajo; VivoRD no sustituye apps oficiales de cada cadena, pero centraliza el acceso web verificado.',
    'Los fines de semana suelen concentrar baladas y bachata en estas parrillas; entre semana algunas emisoras alternan con pop latino sin perder el enfoque romántico declarado en su ficha.',
  ]),
  'salsa-tropical': p([
    'La etiqueta <strong>salsa y tropical</strong> agrupa emisoras que declaran salsa, tropical u otros ritmos afines en nombre o descripción. Incluye parrillas donde el merengue no es la palabra clave pero sí la estética bailable caribeña. La detección es por regex sobre texto real; no asignamos salsa a emisoras que no lo mencionen.',
    'Santo Domingo y Santiago concentran parte del listado, pero hay señales provinciales con fuerte componente tropical para colmados, taxis y festivales. Cada ficha mantiene reproductor web y datos verificables.',
    'Streams no saludables quedan fuera hasta recuperarse. VivoRD prioriza experiencia de oyente sobre volumen de catálogo.',
    'Explora también hubs de merengue y bachata porque muchas emisoras tropicales cruzan géneros. La guía de merengue y bachata enlazada ofrece contexto editorial adicional.',
    'Los carnavales y fiestas patronales del país suelen reflejarse en estas parrillas; escuchar en línea permite seguir esos picos de energía tropical aunque no estés en el barrio.',
    'Colmados, colores y vendedores ambulantes siguen siendo el público natural de estas frecuencias; el streaming replica parte de esa atmósfera para quienes extrañan el Caribe desde el exterior.',
    'Si buscas una emisora concreta, usa el buscador general de VivoRD además de este listado temático.',
  ]),
  'baladas-romantica': p([
    'Las emisoras <strong>románticas y de balada</strong> dominicanas acompañan tardes, oficinas y tránsito con repertorio sentimental en español. Detectamos este grupo cuando el catálogo menciona balada, romántica, canciones de amor o términos afines en nombre o descripción.',
    'El formato suele mezclar balada latina, pop suave y clásicos internacionales. Algunas señales nocturnas amplían espacios de dedicatorias y llamadas de oyentes. Clasificamos solo con evidencia textual para no inventar formatos.',
    'Listamos emisoras saludables con enlace a ficha completa y reproductor. Ciudad y frecuencia aparecen cuando constan en datos.',
    'Si buscas bachata romántica específicamente, revisa también el hub de bachata. Las guías enlazadas explican cómo escuchar desde el extranjero sin apps adicionales.',
    'Muchas emisoras de este grupo mantienen espacios de dedicatorias y peticiones en vivo; la ficha individual resume la programación cuando el titular la publica en su web o en nuestros metadatos.',
    'Las tardes dominicanas siguen siendo horario fuerte para este formato: luz tenue, tránsito lento y canciones sentimentales que estas emisoras programan de forma explícita.',
    'Muchas parejas y taxistas de provincia dejan estas frecuencias fijas en bajo volumen durante horas; el hub facilita retomar esa costumbre desde el navegador.',
  ]),
  cristiana: p([
    'La radio <strong>cristiana y gospel</strong> en República Dominicana incluye emisoras comerciales, comunitarias y señales de ministerios con programación de fe, música worship y espacios de enseñanza. Entran en este hub las fichas cuyo nombre o descripción mencionan términos cristianos, evangelísticos, bíblicos o equivalentes verificables.',
    'Respetamos la diversidad denominacional sin clasificar más allá del texto disponible. No etiquetamos una emisora cristiana si el catálogo no lo indica. El listado abarca Santo Domingo, Santiago y ciudades con fuerte presencia de congregaciones y estaciones locales de fe.',
    'Cada emisora enlazada tiene stream comprobado y descripción editorial. Usa el reproductor web integrado en cada ficha.',
    'Para contexto general sobre radio dominicana online, consulta las guías relacionadas. La programación cristiana convive en el dial con formatos seculares; explora otros hubs de género si buscas comparar.',
    'Algunas emisoras incluyen en su descripción horarios de culto o bloques de enseñanza; esa información aparece en la ficha cuando forma parte del texto fuente que importamos.',
    'Domingo por la mañana concentra buena parte de la audiencia cristiana en FM; este hub te permite saltar entre señales sin buscar manualmente en todo el catálogo nacional.',
  ]),
  deportes: p([
    'El deporte en radio dominicana — especialmente <strong>béisbol invernal</strong>, pelota MLB y fútbol — tiene emisoras y franjas dedicadas. Este hub reúne señales que mencionan deportes, béisbol, NBA, MLB u otros términos deportivos en nombre o descripción del catálogo VivoRD.',
    'Durante temporada invernal, muchas emisoras amplían cobertura aunque su formato principal sea otro; solo aparecen aquí si esa orientación deportiva está documentada en texto. Preferimos precisión sobre completitud inflada.',
    'Abre cada ficha para escuchar narraciones, mesas de opinión y bloques en vivo cuando el stream responde. Excluimos URLs caídas de forma persistente.',
    'La guía de deportes en TV y radio enlazada complementa este listado con contexto sobre canales y emisoras clave. Combina con hubs de ciudad si sigues un equipo regional.',
    'Durante series y finales, conviene abrir varias fichas en pestañas separadas: VivoRD no mezcla señales, pero facilita saltar entre narradores cuando el titular mantiene activo cada stream.',
    'Liga invernal, Grandes Ligas y fútbol europeo compiten por atención en estas emisoras; el listado refleja solo quienes declaran ese enfoque en los textos que tenemos registrados.',
    'Antes de un partido clave, conviene abrir la ficha unos minutos antes por posibles retrasos en el arranque del stream del titular.',
  ]),
};

export function getCityIntro(slug) {
  return CITY_HUB_INTROS[slug] || '';
}

export function getGenreIntro(slug) {
  return GENRE_HUB_INTROS[slug] || '';
}
