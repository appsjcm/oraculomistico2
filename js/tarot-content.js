/* ============================================================
   ORÁCULO MÍSTICO · LOS 78 ARCANOS
   Fase 12. Contenido interpretativo propio, escrito para esta
   app. Se mantiene separado de data.js, que guarda la
   estructura del mazo y las imágenes: aquí solo vive el texto.

   Clave de cada carta: el mismo código posicional que ya usaba
   el motor. M00-M21 mayores, y B/C/E/O 01-14 para Bastos,
   Copas, Espadas y Oros. En cada palo: 11 Sota, 12 Caballero,
   13 Reina, 14 Rey.

   Criterio de redacción: ningún enunciado afirma hechos
   futuros. Se habla de lo que una carta puede señalar, sugerir
   o invitar. La sombra describe un riesgo, nunca un destino.
   ============================================================ */

export const ARCANOS = {

  M00: {
    keywords: ['Inicio', 'Libertad', 'Confianza'],
    energy: 'El impulso de empezar algo sin tenerlo todo resuelto.',
    advice: 'Da el primer paso aunque el mapa esté incompleto; ya lo irás dibujando.',
    light: ['Apertura a lo nuevo', 'Espontaneidad', 'Ausencia de prejuicio'],
    shadow: ['Improvisar sin medir', 'Huir de los compromisos', 'Dispersión'],
    upright: 'El Loco marca el punto en que una historia todavía no ha empezado a escribirse. Habla de disponibilidad: la capacidad de mirar algo sin la carga de lo que ya sabes. En una lectura suele señalar un comienzo que pide más confianza que planificación.',
    reversed: 'Invertido, el impulso se atasca. Puede indicar miedo a soltar lo conocido, o bien lo contrario: lanzarse sin escuchar ninguna señal de aviso. Conviene distinguir cuál de las dos cosas está ocurriendo antes de moverse.',
    love: 'Puede señalar un vínculo en su fase más ligera, donde nada está definido todavía. Invita a hablar de expectativas antes de darlas por supuestas.',
    work: 'Buen momento para explorar, aprender algo distinto o probar una idea a pequeña escala. Si hay un proyecto en marcha, revisa qué darías por sentado sin haberlo comprobado.',
    growth: 'Pregúntate qué harías si no te preocupara equivocarte. La respuesta suele apuntar a lo que llevas tiempo aplazando.',
    yesNo: 'Probablemente sí',
    astrology: 'Se asocia simbólicamente a Urano y al aire libre de forma.'
  },

  M01: {
    keywords: ['Iniciativa', 'Habilidad', 'Manifestación'],
    energy: 'Impulso para convertir una intención en acción.',
    advice: 'Usa primero los recursos que ya tienes antes de buscar otros nuevos.',
    light: ['Claridad de propósito', 'Talento aplicado', 'Comunicación eficaz'],
    shadow: ['Prometer más de lo que se sostiene', 'Usar la habilidad para manipular', 'Empezar sin terminar'],
    upright: 'El Mago reúne sobre la mesa todo lo necesario y lo pone a trabajar. Habla de capacidad práctica: saber qué tienes y para qué sirve. En una tirada suele apuntar a un momento en que la voluntad y los medios coinciden.',
    reversed: 'Invertido puede indicar potencial que no llega a concretarse, o destreza empleada para convencer más que para construir. También aparece cuando falta foco: demasiadas herramientas y ninguna elegida.',
    love: 'Puede hablar de atracción que nace de la conversación y del interés genuino. Invita a decir lo que se quiere en lugar de insinuarlo.',
    work: 'Favorece presentar una idea, empezar un proyecto o retomar algo con método. En estudios, señala que el material que necesitas probablemente ya está a tu alcance.',
    growth: 'Revisa qué habilidad tuya llevas tiempo sin usar. Recuperarla suele valer más que aprender una nueva.',
    yesNo: 'Sí',
    astrology: 'Se relaciona simbólicamente con Mercurio.'
  },

  M02: {
    keywords: ['Intuición', 'Silencio', 'Misterio'],
    energy: 'Saber algo antes de poder explicarlo.',
    advice: 'Antes de decidir, dale a la pregunta una noche de silencio.',
    light: ['Escucha interior', 'Discreción', 'Paciencia con lo que no se ve'],
    shadow: ['Guardar lo que habría que decir', 'Confundir miedo con intuición', 'Aislamiento'],
    upright: 'La Sacerdotisa custodia lo que aún no está listo para mostrarse. Habla de un conocimiento que llega por vías distintas al razonamiento, y de la sensatez de no forzar respuestas. En una lectura suele indicar que falta información, y que llegará sola.',
    reversed: 'Invertida puede señalar desconexión de la propia voz interior, o secretos que empiezan a pesar más de lo que protegen. A veces indica simplemente que es momento de hablar.',
    love: 'Puede apuntar a un vínculo con más profundidad que palabras. Invita a preguntar en vez de interpretar lo que el otro calla.',
    work: 'Momento de observar antes de intervenir. En estudios favorece la lectura pausada frente al repaso acelerado.',
    growth: 'Distingue entre la intuición, que llega tranquila, y el miedo, que llega con prisa.',
    yesNo: 'Depende',
    astrology: 'Se asocia simbólicamente a la Luna.'
  },

  M03: {
    keywords: ['Abundancia', 'Cuidado', 'Creación'],
    energy: 'Lo que has sembrado empieza a tener forma propia.',
    advice: 'Cuida lo que ya está creciendo antes de plantar otra cosa.',
    light: ['Generosidad', 'Fertilidad creativa', 'Entorno acogedor'],
    shadow: ['Cuidar de todos menos de uno mismo', 'Sobreprotección', 'Comodidad que estanca'],
    upright: 'La Emperatriz habla del momento en que algo ya no necesita esfuerzo sino atención. Representa lo que nutre: proyectos, vínculos, cuerpos. En una tirada suele señalar una etapa fértil, más de sostener que de iniciar.',
    reversed: 'Invertida puede indicar creatividad bloqueada, entrega que no se devuelve, o un cuidado que se ha vuelto control. También aparece cuando alguien se olvida de sí mismo atendiendo a los demás.',
    love: 'Puede hablar de un vínculo cálido y sostenido. Invita a revisar si el cuidado circula en ambas direcciones.',
    work: 'Favorece los proyectos creativos y el trabajo en equipo. En estudios, es buen momento para producir, no solo para acumular apuntes.',
    growth: 'Pregúntate qué parte de tu energía dedicas a ti. Si la respuesta te incomoda, ahí está el trabajo.',
    yesNo: 'Sí',
    astrology: 'Se relaciona simbólicamente con Venus.'
  },
  M04: {
    keywords: ['Estructura', 'Autoridad', 'Límite'],
    energy: 'Poner orden donde había dispersión.',
    advice: 'Define reglas claras: dan más libertad que la ausencia de ellas.',
    light: ['Criterio firme', 'Protección', 'Constancia'],
    shadow: ['Rigidez', 'Controlar lo que no corresponde', 'Confundir firmeza con dureza'],
    upright: 'El Emperador construye el marco dentro del cual algo puede sostenerse. Habla de estructura, responsabilidad y decisiones que se mantienen en el tiempo. En una lectura suele señalar que hace falta orden antes que impulso.',
    reversed: 'Invertido puede indicar autoridad ejercida sin escucha, o justo lo contrario: falta de estructura, planes que no llegan a asentarse. También señala dificultad para poner límites.',
    love: 'Puede hablar de un vínculo estable donde cada parte sabe a qué atenerse. Invita a revisar si la seguridad se ha vuelto rutina.',
    work: 'Favorece planificar, ordenar prioridades y asumir responsabilidad. En estudios, sugiere que un calendario realista rinde más que la fuerza de voluntad.',
    growth: 'Un límite bien puesto protege la relación; uno impuesto la desgasta.',
    yesNo: 'Sí',
    astrology: 'Se asocia simbólicamente a Aries.'
  },
  M05: {
    keywords: ['Tradición', 'Aprendizaje', 'Pertenencia'],
    energy: 'El valor de lo que otros ya recorrieron antes.',
    advice: 'Busca a alguien que haya pasado por esto y pregúntale.',
    light: ['Transmisión de conocimiento', 'Ética compartida', 'Sentido de comunidad'],
    shadow: ['Repetir sin cuestionar', 'Dogmatismo', 'Buscar aprobación externa'],
    upright: 'El Hierofante representa el saber que se transmite: maestros, instituciones, costumbres. Habla de aprender dentro de un marco y de encontrar sentido en lo compartido. En una tirada puede señalar formación, consejo o un compromiso formal.',
    reversed: 'Invertido puede indicar que una norma heredada ya no encaja, o la necesidad de encontrar el propio criterio. También aparece cuando se busca autoridad fuera en lugar de asumir la propia.',
    love: 'Puede hablar de valores compartidos y de vínculos con voluntad de continuidad. Invita a comprobar si lo que se comparte es de los dos o solo lo esperado.',
    work: 'Favorece formarse, buscar mentoría o trabajar con método probado. En estudios, señala que estudiar acompañado suele rendir más.',
    growth: 'Distingue lo que crees porque lo has pensado de lo que crees porque siempre estuvo ahí.',
    yesNo: 'Probablemente sí',
    astrology: 'Se relaciona simbólicamente con Tauro.'
  },
  M06: {
    keywords: ['Elección', 'Vínculo', 'Coherencia'],
    energy: 'Una decisión que define quién quieres ser.',
    advice: 'Elige según tus valores, no según lo que resulte más cómodo.',
    light: ['Encuentro genuino', 'Decisión consciente', 'Armonía entre partes'],
    shadow: ['Indecisión prolongada', 'Elegir por evitar el conflicto', 'Idealizar al otro'],
    upright: 'Los Enamorados hablan menos de romance y más de elección. Representan el momento en que dos caminos se separan y hay que tomar uno. En una lectura suele señalar un vínculo importante o una decisión que compromete valores.',
    reversed: 'Invertida puede indicar desajuste entre lo que se siente y lo que se hace, decisiones aplazadas, o un vínculo donde uno de los dos no está eligiendo del todo.',
    love: 'Puede señalar un punto de definición en la relación. Invita a hablar con claridad de lo que cada parte espera.',
    work: 'Momento de elegir entre opciones o de aclarar una colaboración. En estudios, puede indicar que toca decidir una dirección.',
    growth: 'Cuando una decisión cuesta mucho, suele ser porque se intenta no perder nada.',
    yesNo: 'Depende',
    astrology: 'Se asocia simbólicamente a Géminis.'
  },
  M07: {
    keywords: ['Determinación', 'Rumbo', 'Autodominio'],
    energy: 'Avanzar sosteniendo fuerzas que tiran en direcciones opuestas.',
    advice: 'Elige una dirección y mantenla el tiempo suficiente para saber si funciona.',
    light: ['Voluntad enfocada', 'Superar un obstáculo', 'Disciplina con propósito'],
    shadow: ['Empujar por encima del límite', 'Avanzar sin saber hacia dónde', 'Rigidez ante el cambio'],
    upright: 'El Carro habla de movimiento controlado: no la fuerza bruta, sino la capacidad de conducirla. Representa el avance que exige mantener el rumbo pese a las tensiones. En una tirada suele indicar progreso conseguido con esfuerzo consciente.',
    reversed: 'Invertido puede señalar dispersión, un avance detenido, o la sensación de correr sin destino. También aparece cuando el control se ha vuelto tensión.',
    love: 'Puede hablar de un vínculo que necesita dirección común. Invita a acordar hacia dónde se va antes de acelerar.',
    work: 'Favorece sacar adelante un proyecto exigente. En estudios, sugiere que la constancia rinde más que los sprints.',
    growth: 'Sostener dos fuerzas opuestas no es debilidad: es lo que hace posible avanzar.',
    yesNo: 'Sí',
    astrology: 'Se relaciona simbólicamente con Cáncer.'
  },
  M08: {
    keywords: ['Coraje', 'Calma', 'Dominio interior'],
    energy: 'La fuerza que no necesita alzar la voz.',
    advice: 'Trata con paciencia aquello de ti que te incomoda; se doma antes que se vence.',
    light: ['Serenidad ante la presión', 'Compasión firme', 'Confianza tranquila'],
    shadow: ['Reprimir en lugar de integrar', 'Dureza consigo mismo', 'Impaciencia disfrazada de fuerza'],
    upright: 'La Fuerza no somete: acompaña. Habla de la capacidad de sostener lo intenso sin dejar que decida por ti. En una lectura suele señalar que la salida pasa por la paciencia y no por el pulso.',
    reversed: 'Invertida puede indicar agotamiento, dudas sobre la propia capacidad, o el intento de controlar por la fuerza algo que solo cede con tiempo.',
    love: 'Puede hablar de un vínculo que pide comprensión más que razón. Invita a responder desde la calma, no desde la reacción.',
    work: 'Favorece situaciones que requieren aguante y buen trato. En estudios, señala que la constancia amable supera al castigo.',
    growth: 'Lo que se reprime vuelve con más fuerza. Lo que se escucha, se calma.',
    yesNo: 'Sí',
    astrology: 'Se asocia simbólicamente a Leo.'
  },
  M09: {
    keywords: ['Introspección', 'Búsqueda', 'Pausa'],
    energy: 'Apartarse para poder ver con claridad.',
    advice: 'Concédete el retiro que llevas tiempo posponiendo.',
    light: ['Honestidad con uno mismo', 'Sabiduría serena', 'Discernimiento'],
    shadow: ['Aislamiento que se alarga', 'Analizar para no actuar', 'Soledad no elegida'],
    upright: 'El Ermitaño se retira con una luz pequeña y suficiente. Habla del valor de parar, de buscar respuestas dentro antes de pedirlas fuera. En una tirada suele señalar una etapa de recogimiento necesaria, no de castigo.',
    reversed: 'Invertido puede indicar que el retiro se ha vuelto refugio, o justo lo contrario: falta de espacio propio en medio del ruido. También señala consejo que se ignora.',
    love: 'Puede hablar de necesidad de espacio, propio o del otro. Invita a nombrarlo en lugar de desaparecer.',
    work: 'Buen momento para revisar, estudiar a fondo o replantear un enfoque. En estudios favorece la comprensión profunda.',
    growth: 'La claridad rara vez llega en medio del ruido. Búscala donde puedas escucharte.',
    yesNo: 'Depende',
    astrology: 'Se relaciona simbólicamente con Virgo.'
  },
  M10: {
    keywords: ['Ciclo', 'Cambio', 'Oportunidad'],
    energy: 'Algo se mueve por sí solo y conviene leerlo a tiempo.',
    advice: 'Distingue lo que puedes cambiar de lo que solo puedes acompañar.',
    light: ['Buen momento para actuar', 'Perspectiva amplia', 'Fin de un estancamiento'],
    shadow: ['Esperar que lo resuelva la suerte', 'Resistirse al giro', 'Repetir el mismo ciclo'],
    upright: 'La Rueda recuerda que las situaciones tienen ritmo propio. Habla de fases que se cierran y otras que empiezan, muchas veces sin que las hayamos provocado. En una lectura suele señalar un punto de inflexión.',
    reversed: 'Invertida puede indicar la sensación de estar atrapado en un bucle, o resistencia a un cambio que ya está ocurriendo. Invita a mirar qué parte del ciclo se repite por decisión propia.',
    love: 'Puede señalar un cambio de fase en el vínculo. Invita a preguntarse qué patrón se está repitiendo.',
    work: 'Momento en que las circunstancias se mueven. En estudios, buen instante para reorientar si algo no encaja.',
    growth: 'No todos los ciclos se eligen, pero casi todos enseñan algo si se miran de frente.',
    yesNo: 'Probablemente sí',
    astrology: 'Se asocia simbólicamente a Júpiter.'
  },
  M11: {
    keywords: ['Equilibrio', 'Verdad', 'Consecuencia'],
    energy: 'Cada decisión tiene un peso, y ahora se está pesando.',
    advice: 'Mira los hechos antes que las versiones, incluida la tuya.',
    light: ['Imparcialidad', 'Responsabilidad asumida', 'Acuerdos justos'],
    shadow: ['Juzgar sin escuchar', 'Rigor sin compasión', 'Evitar la propia parte'],
    upright: 'La Justicia sostiene la balanza sin inclinarla. Habla de causa y efecto, de acuerdos y de la necesidad de mirar una situación sin adornarla. En una lectura suele señalar un momento de rendir cuentas o de tomar una decisión con criterio.',
    reversed: 'Invertida puede indicar desequilibrio, decisiones tomadas desde el sesgo, o la sensación de que algo no se ha resuelto con equidad. También señala responsabilidad que se esquiva.',
    love: 'Puede hablar de acuerdos que necesitan revisarse. Invita a que ambas partes expongan lo que consideran justo.',
    work: 'Favorece contratos, acuerdos y decisiones basadas en datos. En estudios, sugiere evaluar con honestidad dónde estás realmente.',
    growth: 'Asumir tu parte no es culparte: es recuperar la capacidad de cambiarla.',
    yesNo: 'Depende',
    astrology: 'Se asocia simbólicamente a Libra.'
  },
  M12: {
    keywords: ['Pausa', 'Perspectiva', 'Entrega'],
    energy: 'Detenerse a propósito para ver de otro modo.',
    advice: 'Si nada avanza, prueba a cambiar el ángulo antes que el esfuerzo.',
    light: ['Aceptar el compás de espera', 'Ver desde otro lugar', 'Soltar el control'],
    shadow: ['Quedarse quieto por miedo', 'Sacrificarse sin motivo', 'Espera que se vuelve excusa'],
    upright: 'El Colgado no está atrapado: está suspendido. Habla del valor de una pausa elegida y de lo que se entiende cuando se deja de empujar. En una tirada suele señalar un tiempo de espera que tiene sentido.',
    reversed: 'Invertido puede indicar resistencia a parar, o una pausa que se ha alargado hasta convertirse en refugio. También señala sacrificio que no lleva a ninguna parte.',
    love: 'Puede hablar de un vínculo en compás de espera. Invita a preguntarse si esa espera es acuerdo o postergación.',
    work: 'Momento poco favorable para forzar. En estudios, sugiere cambiar el método antes que aumentar las horas.',
    growth: 'A veces la respuesta no llega porque estás mirando desde donde la pregunta nació.',
    yesNo: 'Neutral',
    astrology: 'Se relaciona simbólicamente con Neptuno.'
  },
  M13: {
    keywords: ['Cierre', 'Transformación', 'Renovación'],
    energy: 'Algo termina para que lo siguiente tenga sitio.',
    advice: 'Suelta lo que ya no sostiene; no todo lo que acaba se pierde.',
    light: ['Cierre necesario', 'Cambio profundo', 'Liberación de peso'],
    shadow: ['Aferrarse a lo que ya terminó', 'Miedo paralizante al cambio', 'Confundir final con fracaso'],
    upright: 'La Muerte rara vez habla de muerte literal. Señala el final de una etapa y el comienzo de otra que aún no tiene forma. En una lectura suele indicar que algo se está cerrando, con o sin nuestro permiso, y que resistirse alarga el tránsito.',
    reversed: 'Invertida puede indicar un cierre pendiente, una transición que se detiene a mitad, o resistencia a soltar. También aparece cuando el cambio ya ocurrió pero no se ha reconocido.',
    love: 'Puede señalar el fin de una forma de relacionarse, no necesariamente de la relación. Invita a nombrar qué ha cambiado.',
    work: 'Momento de cerrar proyectos o etapas. En estudios, puede indicar el fin de un enfoque que ya no rinde.',
    growth: 'Lo que se resiste a terminar suele consumir más energía que lo que se deja marchar.',
    yesNo: 'Depende',
    astrology: 'Se asocia simbólicamente a Escorpio.'
  },
  M14: {
    keywords: ['Medida', 'Integración', 'Paciencia'],
    energy: 'Encontrar la proporción justa entre dos extremos.',
    advice: 'Busca el punto medio real, no el que evita el conflicto.',
    light: ['Equilibrio sostenible', 'Sanación gradual', 'Capacidad de combinar'],
    shadow: ['Tibieza que no compromete', 'Impaciencia con el proceso', 'Mezclar sin criterio'],
    upright: 'La Templanza vierte de un recipiente a otro sin derramar. Habla de dosificar, de combinar elementos distintos hasta dar con la medida. En una tirada suele señalar un proceso de recuperación o de ajuste que necesita tiempo.',
    reversed: 'Invertida puede indicar excesos, desequilibrio entre partes de la vida, o prisa por llegar a un punto que solo se alcanza despacio.',
    love: 'Puede hablar de un vínculo que se está equilibrando. Invita a ajustar el ritmo de cada parte sin forzarlo.',
    work: 'Favorece la mejora gradual y la colaboración entre perfiles distintos. En estudios, sugiere repartir el esfuerzo en el tiempo.',
    growth: 'La moderación no es renunciar: es sostener algo el tiempo suficiente para que dé fruto.',
    yesNo: 'Probablemente sí',
    astrology: 'Se relaciona simbólicamente con Sagitario.'
  },
  M15: {
    keywords: ['Apego', 'Deseo', 'Liberación'],
    energy: 'Aquello que atrae y a la vez sujeta.',
    advice: 'Mira de frente lo que te ata: las cadenas de esta carta suelen estar flojas.',
    light: ['Reconocer el propio deseo', 'Vitalidad', 'Honestidad con la sombra'],
    shadow: ['Dependencia', 'Repetir lo que daña', 'Justificar lo que se sabe dañino'],
    upright: 'El Diablo señala lo que nos sujeta sin que del todo lo queramos: hábitos, vínculos, ideas fijas. No juzga el deseo, señala la atadura. En una lectura suele invitar a mirar qué papel tiene uno mismo en lo que dice sufrir.',
    reversed: 'Invertido puede indicar el momento en que la atadura empieza a aflojarse, o la conciencia de un patrón que hasta ahora era invisible. También señala un intento de negar el problema.',
    love: 'Puede hablar de un vínculo intenso donde la atracción convive con la dependencia. Invita a revisar qué se acepta por miedo a perder.',
    work: 'Puede señalar una situación que no satisface pero de la que cuesta salir. En estudios, apunta a la procrastinación como refugio.',
    growth: 'Nombrar un patrón le quita la mitad de su fuerza. La otra mitad se le quita dejando de alimentarlo.',
    yesNo: 'Probablemente no',
    astrology: 'Se asocia simbólicamente a Capricornio.'
  },
  M16: {
    keywords: ['Sacudida', 'Revelación', 'Derrumbe'],
    energy: 'Algo cede de golpe y deja ver lo que había detrás.',
    advice: 'No reconstruyas igual lo que se ha caído; mira primero por qué se cayó.',
    light: ['Verdad que sale a la luz', 'Fin de una falsa seguridad', 'Cambio que libera'],
    shadow: ['Crisis vivida como castigo', 'Reaccionar destruyendo más', 'Negar lo evidente'],
    upright: 'La Torre representa lo que se derrumba porque estaba mal cimentado. Suele llegar sin aviso y resulta incómoda, pero lo que cae raramente podía sostenerse. En una lectura señala una ruptura que abre espacio.',
    reversed: 'Invertida puede indicar una crisis que se pospone, un derrumbe evitado por poco, o un cambio que ya ocurrió y todavía se procesa. También señala resistencia a ver lo que es obvio.',
    love: 'Puede señalar una revelación que cambia el marco. Invita a hablar antes de que la presión decida por vosotros.',
    work: 'Momento de cambios bruscos o replanteamientos. En estudios, puede indicar que un método ha dejado de funcionar.',
    growth: 'Lo que se cae de golpe llevaba tiempo avisando en voz baja.',
    yesNo: 'No',
    astrology: 'Se relaciona simbólicamente con Marte.'
  },
  M17: {
    keywords: ['Esperanza', 'Serenidad', 'Inspiración'],
    energy: 'Después de la sacudida, la calma que orienta.',
    advice: 'Confía en la dirección que te devuelve la calma, aunque avance despacio.',
    light: ['Renovación', 'Fe tranquila', 'Claridad sobre lo esencial'],
    shadow: ['Idealizar sin actuar', 'Desánimo', 'Esperar señales en lugar de decidir'],
    upright: 'La Estrella aparece cuando lo peor ya ha pasado. Habla de recuperación, de un horizonte que vuelve a verse y de la confianza que se reconstruye sin ruido. En una tirada suele señalar una etapa serena y fértil.',
    reversed: 'Invertida puede indicar desconexión de la propia esperanza, cansancio, o expectativas puestas en algo que no depende de ti.',
    love: 'Puede hablar de un vínculo que se sana o de apertura sincera. Invita a dejarse ver sin armadura.',
    work: 'Favorece proyectos creativos y planes a medio plazo. En estudios, buen momento para recuperar la motivación perdida.',
    growth: 'La esperanza útil no niega la dificultad: la atraviesa con una dirección.',
    yesNo: 'Sí',
    astrology: 'Se asocia simbólicamente a Acuario.'
  },
  M18: {
    keywords: ['Intuición', 'Confusión', 'Sueños'],
    energy: 'Lo que se ve a medias y pide no ir deprisa.',
    advice: 'No decidas nada importante mientras no distingas el miedo de la intuición.',
    light: ['Sensibilidad fina', 'Contacto con lo simbólico', 'Imaginación fértil'],
    shadow: ['Autoengaño', 'Miedo que distorsiona', 'Interpretar lo que no se ha preguntado'],
    upright: 'La Luna ilumina lo justo para caminar, no para ver el paisaje. Habla de emociones que llegan sin nombre, de intuiciones ciertas y de temores que fabrican historias. En una lectura suele señalar que aún falta claridad.',
    reversed: 'Invertida puede indicar que la niebla empieza a levantarse, o que una confusión se sostiene porque conviene. También señala verdades que salen a la superficie.',
    love: 'Puede hablar de malentendidos o de cosas no dichas. Invita a preguntar en lugar de suponer.',
    work: 'Momento poco favorable para compromisos con información incompleta. En estudios, sugiere verificar antes de dar algo por sabido.',
    growth: 'La intuición llega en calma; el miedo llega con prisa y con guion.',
    yesNo: 'Probablemente no',
    astrology: 'Se relaciona simbólicamente con Piscis.'
  },
  M19: {
    keywords: ['Claridad', 'Vitalidad', 'Reconocimiento'],
    energy: 'Todo se ve con luz suficiente y sin adornos.',
    advice: 'Muéstrate como eres: aquí no hace falta protegerse tanto.',
    light: ['Alegría sencilla', 'Éxito visible', 'Confianza bien puesta'],
    shadow: ['Optimismo que ignora avisos', 'Necesidad de ser visto', 'Deslumbrarse con lo evidente'],
    upright: 'El Sol no deja sombras donde esconder nada. Habla de claridad, de energía disponible y de momentos en que las cosas simplemente funcionan. En una lectura suele señalar una etapa favorable y honesta.',
    reversed: 'Invertido puede indicar una alegría contenida, retrasos en algo que ya está encaminado, o dificultad para reconocer lo bueno que ya hay. Rara vez señala fracaso: más bien luz atenuada.',
    love: 'Puede hablar de un vínculo transparente y cálido. Invita a disfrutarlo sin buscarle un problema.',
    work: 'Favorece la visibilidad, los resultados y el reconocimiento. En estudios, buen momento para exponer o presentar.',
    growth: 'Reconocer lo que va bien no es ingenuidad: es la base para sostenerlo.',
    yesNo: 'Sí',
    astrology: 'Se asocia simbólicamente al Sol.'
  },
  M20: {
    keywords: ['Despertar', 'Revisión', 'Llamada'],
    energy: 'Algo del pasado vuelve a mirarse con otros ojos.',
    advice: 'Revisa lo que dejaste atrás antes de decidir hacia dónde vas.',
    light: ['Perdón', 'Balance honesto', 'Segunda oportunidad'],
    shadow: ['Autocrítica excesiva', 'Quedarse en el reproche', 'Ignorar la llamada'],
    upright: 'El Juicio propone mirar el recorrido completo. Habla de comprender por qué ocurrió lo que ocurrió y de decidir con eso en la mano. En una lectura suele señalar un momento de balance o una vocación que reaparece.',
    reversed: 'Invertido puede indicar dureza consigo mismo, una decisión que se pospone, o la resistencia a cerrar un capítulo que pide revisión.',
    love: 'Puede hablar de una conversación pendiente o de una reconciliación posible. Invita a hablar desde el presente, no desde el agravio.',
    work: 'Favorece revisar la trayectoria y reorientar. En estudios, buen momento para evaluar qué camino tiene sentido.',
    growth: 'Revisar el pasado sirve si termina en una decisión, no si termina en una condena.',
    yesNo: 'Probablemente sí',
    astrology: 'Se relaciona simbólicamente con Plutón.'
  },
  M21: {
    keywords: ['Culminación', 'Integración', 'Plenitud'],
    energy: 'Un ciclo se completa y encaja con el resto.',
    advice: 'Antes de empezar lo siguiente, reconoce lo que has terminado.',
    light: ['Cierre satisfactorio', 'Sentido de conjunto', 'Logro reconocido'],
    shadow: ['No permitirse cerrar', 'Buscar más sin disfrutar lo logrado', 'Final que se alarga'],
    upright: 'El Mundo señala el punto en que las piezas encajan. Habla de ciclos que se completan, de aprendizajes que se integran y de una plenitud que no depende de tenerlo todo. En una tirada suele indicar culminación.',
    reversed: 'Invertido puede indicar un cierre incompleto, la sensación de que falta algo para dar por terminado, o la dificultad de reconocer el propio logro.',
    love: 'Puede hablar de un vínculo maduro o de una etapa que se cierra con paz. Invita a nombrar lo conseguido juntos.',
    work: 'Favorece finalizar proyectos y recoger resultados. En estudios, señala el cierre de una etapa formativa.',
    growth: 'Cerrar bien es parte del trabajo, no un trámite posterior.',
    yesNo: 'Sí',
    astrology: 'Se asocia simbólicamente a Saturno.'
  },
  B01: {
    keywords: ['Chispa', 'Impulso', 'Comienzo'],
    energy: 'Una idea que enciende ganas de moverse.',
    advice: 'Actúa mientras el entusiasmo esté vivo; después cuesta el doble.',
    light: ['Inspiración clara', 'Energía disponible', 'Iniciativa'],
    shadow: ['Entusiasmo que se apaga rápido', 'Empezar sin plan', 'Impulsividad'],
    upright: 'El As de Bastos es el momento en que algo se enciende. Habla de una idea, un deseo o una oportunidad que pide movimiento. En una lectura suele señalar el arranque de algo con potencial real.',
    reversed: 'Invertido puede indicar un impulso que no llega a concretarse, dudas que apagan la chispa, o falta de dirección para tanta energía.',
    love: 'Puede hablar del inicio de una atracción o de recuperar el entusiasmo en un vínculo. Invita a dar el primer paso.',
    work: 'Buen momento para lanzar una idea o iniciar un proyecto. En estudios, favorece empezar algo que llevas tiempo rondando.',
    growth: 'El entusiasmo es un buen motor de arranque, pero no sostiene el viaje entero. Prepara lo segundo.',
    yesNo: 'Sí',
    astrology: 'Fuego en su forma más inicial.'
  },
  B02: {
    keywords: ['Planificación', 'Decisión', 'Horizonte'],
    energy: 'Mirar lejos antes de dar el paso.',
    advice: 'Decide entre lo seguro y lo que te atrae; no puedes tener ambas cosas a la vez.',
    light: ['Visión de futuro', 'Elección meditada', 'Ambición sana'],
    shadow: ['Planificar sin ejecutar', 'Miedo a salir de lo conocido', 'Indecisión'],
    upright: 'El Dos de Bastos muestra a alguien que ya tiene algo y mira hacia lo que aún no. Habla del momento en que se planifica una expansión. En una tirada suele señalar una decisión entre quedarse o avanzar.',
    reversed: 'Invertido puede indicar planes que no arrancan, miedo a lo desconocido, o una elección aplazada tanto tiempo que se decide sola.',
    love: 'Puede hablar de valorar el futuro del vínculo. Invita a compartir los planes en lugar de suponerlos.',
    work: 'Favorece la planificación estratégica. En estudios, buen momento para decidir especialidad o enfoque.',
    growth: 'Elegir implica renunciar. Si no duele algo, probablemente no has elegido todavía.',
    yesNo: 'Probablemente sí',
    astrology: 'Fuego que se ordena y proyecta.'
  },
  B03: {
    keywords: ['Expansión', 'Espera activa', 'Alcance'],
    energy: 'Lo puesto en marcha empieza a moverse solo.',
    advice: 'Ya has lanzado; ahora sostén y observa lo que vuelve.',
    light: ['Progreso visible', 'Colaboraciones', 'Ampliar horizontes'],
    shadow: ['Impaciencia', 'Esperar resultados sin ajustar nada', 'Alcance mayor que los medios'],
    upright: 'El Tres de Bastos mira el mar después de haber enviado los barcos. Habla del tiempo entre la acción y el resultado, cuando ya no se puede hacer más que sostener. En una lectura suele señalar expansión en curso.',
    reversed: 'Invertido puede indicar retrasos, planes que se quedan cortos, o la tentación de abandonar justo antes de que llegue el retorno.',
    love: 'Puede hablar de un vínculo que se abre a algo más amplio. Invita a dar tiempo sin desentenderse.',
    work: 'Favorece proyectos que ya están en marcha y alianzas. En estudios, señala que el esfuerzo previo empieza a notarse.',
    growth: 'Esperar bien también es una forma de actuar.',
    yesNo: 'Sí',
    astrology: 'Fuego que se extiende.'
  },
  B04: {
    keywords: ['Celebración', 'Hogar', 'Estabilidad'],
    energy: 'Un logro que merece detenerse a reconocerlo.',
    advice: 'Celebra lo conseguido antes de fijar la siguiente meta.',
    light: ['Alegría compartida', 'Base sólida', 'Sentido de pertenencia'],
    shadow: ['Conformarse demasiado pronto', 'Celebrar de cara a la galería', 'Miedo a moverse de lo estable'],
    upright: 'El Cuatro de Bastos levanta cuatro columnas y una guirnalda. Habla de estabilidad conseguida y del momento de compartirla. En una tirada suele señalar armonía, celebración o un hito alcanzado.',
    reversed: 'Invertido puede indicar celebración postergada, tensión en el ambiente cercano, o una estabilidad más aparente que real.',
    love: 'Puede hablar de compromiso, convivencia o un momento de armonía. Invita a cuidar el terreno común.',
    work: 'Buen momento para cerrar una fase y reconocerla en equipo. En estudios, señala un logro que merece pausa.',
    growth: 'Reconocer lo logrado no frena el avance: lo sostiene.',
    yesNo: 'Sí',
    astrology: 'Fuego asentado.'
  },
  B05: {
    keywords: ['Fricción', 'Competencia', 'Contraste'],
    energy: 'Varias fuerzas empujando a la vez sin coordinarse.',
    advice: 'Antes de imponer tu idea, comprueba si todos habláis del mismo problema.',
    light: ['Debate que aclara', 'Energía viva', 'Sana competencia'],
    shadow: ['Discusión estéril', 'Ego por encima del objetivo', 'Desgaste sin avance'],
    upright: 'El Cinco de Bastos muestra un choque desordenado más que una batalla. Habla de fricción, de opiniones que compiten y de la energía que se pierde cuando nadie cede. En una lectura suele señalar tensión resoluble.',
    reversed: 'Invertido puede indicar que el conflicto se evita en lugar de resolverse, o que la tensión se ha vuelto interna. También señala el final de una disputa.',
    love: 'Puede hablar de desacuerdos frecuentes por cosas pequeñas. Invita a mirar qué necesidad hay debajo de la discusión.',
    work: 'Puede señalar un entorno competitivo o un equipo sin criterio común. En estudios, apunta a la dispersión de esfuerzos.',
    growth: 'No toda discusión merece tu energía. Elige cuáles antes de entrar.',
    yesNo: 'Probablemente no',
    astrology: 'Fuego en desorden.'
  },
  B06: {
    keywords: ['Reconocimiento', 'Logro', 'Confianza'],
    energy: 'El esfuerzo se hace visible y otros lo notan.',
    advice: 'Acepta el reconocimiento sin restarle importancia ni creerte definitivo.',
    light: ['Éxito merecido', 'Liderazgo natural', 'Buena reputación'],
    shadow: ['Depender del aplauso', 'Orgullo que aísla', 'Confiarse tras el triunfo'],
    upright: 'El Seis de Bastos celebra un regreso victorioso. Habla del momento en que el trabajo da fruto y además se ve. En una tirada suele señalar reconocimiento, avance o una etapa favorable.',
    reversed: 'Invertido puede indicar un logro que pasa desapercibido, dudas sobre el propio mérito, o reconocimiento que no llega a tiempo.',
    love: 'Puede hablar de un vínculo que se vive con orgullo compartido. Invita a expresar lo que se valora del otro.',
    work: 'Favorece presentaciones, ascensos y visibilidad. En estudios, señala buenos resultados en algo que costó.',
    growth: 'El reconocimiento externo confirma, pero no sustituye al propio criterio.',
    yesNo: 'Sí',
    astrology: 'Fuego que culmina.'
  },
  B07: {
    keywords: ['Defensa', 'Convicción', 'Resistencia'],
    energy: 'Sostener una posición aunque cueste.',
    advice: 'Defiende lo que de verdad es tuyo; suelta lo que solo defiendes por costumbre.',
    light: ['Firmeza en lo propio', 'Valentía', 'Ventaja de posición'],
    shadow: ['Ponerse a la defensiva sin motivo', 'Agotamiento por resistir', 'Ver amenazas donde no las hay'],
    upright: 'El Siete de Bastos defiende una posición desde arriba. Habla de sostener lo conseguido frente a la presión, con la ventaja de conocer bien el terreno. En una lectura suele señalar que toca mantenerse firme.',
    reversed: 'Invertido puede indicar cansancio, ganas de rendirse, o la sensación de estar defendiendo algo que ya no importa tanto.',
    love: 'Puede hablar de necesidad de marcar límites. Invita a distinguir entre proteger el vínculo y protegerse del otro.',
    work: 'Puede señalar competencia o críticas. En estudios, indica que hay que sostener el propio criterio.',
    growth: 'Antes de defender una posición, comprueba que sigues creyendo en ella.',
    yesNo: 'Depende',
    astrology: 'Fuego que se sostiene.'
  },
  B08: {
    keywords: ['Rapidez', 'Movimiento', 'Noticias'],
    energy: 'Todo se acelera de golpe.',
    advice: 'Aprovecha el impulso, pero comprueba la dirección antes de soltarlo todo.',
    light: ['Avance veloz', 'Comunicación fluida', 'Obstáculos que se despejan'],
    shadow: ['Precipitación', 'Demasiadas cosas a la vez', 'Decidir sin digerir'],
    upright: 'El Ocho de Bastos son ocho varas en pleno vuelo. Habla de velocidad, mensajes que llegan y situaciones que se desbloquean. En una tirada suele señalar movimiento rápido tras una espera.',
    reversed: 'Invertido puede indicar retrasos, comunicación que se atasca, o prisa que provoca errores.',
    love: 'Puede hablar de un vínculo que avanza deprisa o de noticias que lo mueven. Invita a no confundir intensidad con solidez.',
    work: 'Favorece la ejecución rápida y las comunicaciones. En estudios, buen momento para avanzar temario.',
    growth: 'La velocidad amplifica lo que ya hay: si el rumbo es bueno, ayuda; si no, complica.',
    yesNo: 'Sí',
    astrology: 'Fuego en movimiento.'
  },
  B09: {
    keywords: ['Resistencia', 'Cautela', 'Último tramo'],
    energy: 'Cansancio de quien lleva mucho sosteniendo.',
    advice: 'Descansa antes de decidir si sigues; la fatiga aconseja mal.',
    light: ['Perseverancia', 'Experiencia acumulada', 'Aguante en el tramo final'],
    shadow: ['Desconfianza generalizada', 'Agotamiento', 'Defenderse de quien no ataca'],
    upright: 'El Nueve de Bastos muestra a alguien herido pero en pie. Habla de resistencia, de heridas anteriores que enseñan a estar alerta y del esfuerzo final antes de llegar. En una lectura suele señalar cansancio con la meta cerca.',
    reversed: 'Invertido puede indicar agotamiento que ya no compensa, terquedad, o la conveniencia de soltar una batalla que no era la propia.',
    love: 'Puede hablar de defensas levantadas por experiencias pasadas. Invita a revisar si protegen o aíslan.',
    work: 'Puede señalar la recta final de un proyecto exigente. En estudios, indica la fase previa a los resultados.',
    growth: 'La experiencia enseña a protegerse; conviene revisar de qué, para no protegerse de todo.',
    yesNo: 'Depende',
    astrology: 'Fuego que resiste.'
  },
  B10: {
    keywords: ['Carga', 'Exceso', 'Responsabilidad'],
    energy: 'Llevar más peso del que corresponde.',
    advice: 'Reparte, delega o suelta: no todo lo que cargas es tuyo.',
    light: ['Compromiso serio', 'Capacidad de asumir', 'Cerca de completar'],
    shadow: ['No pedir ayuda', 'Asumir lo ajeno', 'Agotamiento por acumulación'],
    upright: 'El Diez de Bastos avanza doblado bajo una carga que apenas deja ver el camino. Habla de responsabilidades acumuladas, muchas veces por no haber dicho que no. En una tirada suele señalar sobrecarga.',
    reversed: 'Invertido puede indicar que la carga empieza a soltarse, o el momento de reconocer que no se puede con todo. También señala negarse a delegar.',
    love: 'Puede hablar de un vínculo donde uno sostiene más que el otro. Invita a repartir el peso con honestidad.',
    work: 'Señala exceso de tareas. En estudios, indica que el volumen ha superado a la organización.',
    growth: 'Pedir ayuda no resta mérito al esfuerzo: lo hace sostenible.',
    yesNo: 'Probablemente no',
    astrology: 'Fuego sobrecargado.'
  },
  B11: {
    keywords: ['Curiosidad', 'Entusiasmo', 'Descubrimiento'],
    energy: 'Ganas de probar algo sin saber aún si saldrá bien.',
    advice: 'Explora sin exigirte dominarlo desde el primer día.',
    light: ['Mente abierta', 'Aprendizaje ilusionado', 'Iniciativa juvenil'],
    shadow: ['Empezar mucho y terminar poco', 'Impaciencia con el proceso', 'Entusiasmo sin base'],
    upright: 'La Sota de Bastos trae noticias que encienden. Habla del principio de un aprendizaje, de la curiosidad que empuja a probar. En una lectura suele señalar una oportunidad temprana o alguien con ganas y poca experiencia.',
    reversed: 'Invertida puede indicar entusiasmo que se enfría, proyectos abandonados a medias, o inseguridad al empezar algo nuevo.',
    love: 'Puede hablar de un interés incipiente o de recuperar el juego en el vínculo. Invita a la ligereza sin descuido.',
    work: 'Favorece formarse y probar. En estudios, señala una materia que despierta interés genuino.',
    growth: 'La curiosidad es un buen comienzo; la constancia es lo que la convierte en algo.',
    yesNo: 'Probablemente sí',
    astrology: 'Fuego que aprende.'
  },
  B12: {
    keywords: ['Acción', 'Audacia', 'Cambio'],
    energy: 'Lanzarse con todo hacia algo que atrae.',
    advice: 'Muévete, pero decide antes hasta dónde estás dispuesto a llegar.',
    light: ['Coraje', 'Iniciativa decidida', 'Pasión que impulsa'],
    shadow: ['Imprudencia', 'Empezar sin terminar', 'Cambiar de rumbo constantemente'],
    upright: 'El Caballero de Bastos cabalga sin frenar. Habla de acción decidida, de aventura y de la energía que se lanza antes de calcular. En una tirada suele señalar un movimiento importante o un viaje.',
    reversed: 'Invertido puede indicar impulsos que se frustran, arranques sin continuidad, o precipitación que sale cara.',
    love: 'Puede hablar de pasión intensa y de ritmo rápido. Invita a comprobar si hay algo más que impulso.',
    work: 'Favorece cambios y proyectos ambiciosos. En estudios, señala energía alta que conviene canalizar.',
    growth: 'La audacia sin dirección se llama simplemente prisa.',
    yesNo: 'Sí',
    astrology: 'Fuego que se lanza.'
  },
  B13: {
    keywords: ['Determinación', 'Calidez', 'Independencia'],
    energy: 'Saber lo que se quiere y no necesitar permiso.',
    advice: 'Ocupa tu espacio con naturalidad: no hace falta pedir disculpas por brillar.',
    light: ['Seguridad en uno mismo', 'Generosidad', 'Magnetismo natural'],
    shadow: ['Impaciencia con los demás', 'Necesidad de control', 'Reaccionar en caliente'],
    upright: 'La Reina de Bastos gobierna con calor y criterio propio. Habla de una energía segura, cálida y directa, que sabe lo que quiere sin imponerlo. En una lectura puede señalar a alguien así o esa cualidad en ti.',
    reversed: 'Invertida puede indicar inseguridad disimulada con dureza, celos, o dificultad para sostener la propia posición sin enfadarse.',
    love: 'Puede hablar de un vínculo apasionado con espacio para cada uno. Invita a expresar el deseo con claridad.',
    work: 'Favorece liderar con carisma y sacar adelante lo que otros dejaron. En estudios, señala capacidad de arrastrar al grupo.',
    growth: 'La seguridad real no necesita apagar a nadie para sostenerse.',
    yesNo: 'Sí',
    astrology: 'Fuego que sostiene su forma.'
  },
  B14: {
    keywords: ['Visión', 'Liderazgo', 'Empuje'],
    energy: 'Poner en marcha a otros detrás de una idea.',
    advice: 'Marca la dirección con claridad y deja que cada cual encuentre su modo.',
    light: ['Iniciativa que inspira', 'Visión de conjunto', 'Decisión firme'],
    shadow: ['Autoritarismo', 'Impaciencia con el ritmo ajeno', 'Prometer más de lo alcanzable'],
    upright: 'El Rey de Bastos convierte una visión en un proyecto que otros siguen. Habla de liderazgo con empuje, de decisiones claras y de la capacidad de encender a un grupo. En una tirada puede señalar a alguien así o ese papel para ti.',
    reversed: 'Invertido puede indicar mando ejercido a base de presión, expectativas desmedidas, o un liderazgo que se ha quedado sin rumbo.',
    love: 'Puede hablar de un vínculo con alguien de carácter fuerte. Invita a que la iniciativa no sea siempre del mismo lado.',
    work: 'Favorece dirigir, emprender y motivar. En estudios, señala capacidad de coordinar trabajos en grupo.',
    growth: 'Liderar es sobre todo hacer posible el trabajo de otros, no solo señalar el destino.',
    yesNo: 'Sí',
    astrology: 'Fuego que dirige.'
  },
  C01: {
    keywords: ['Apertura', 'Emoción', 'Comienzo afectivo'],
    energy: 'Algo se abre por dentro y pide ser sentido.',
    advice: 'Permítete sentir antes de decidir qué hacer con ello.',
    light: ['Sensibilidad viva', 'Amor que nace', 'Compasión'],
    shadow: ['Bloqueo emocional', 'Entregarse sin medir', 'Confundir intensidad con vínculo'],
    upright: 'El As de Copas es una copa que rebosa. Habla del comienzo de algo emocional: un afecto, una intuición, una conexión. En una lectura suele señalar apertura del corazón y disponibilidad para sentir.',
    reversed: 'Invertido puede indicar emociones contenidas, dificultad para expresar lo que se siente, o un afecto que no encuentra dónde ir.',
    love: 'Puede hablar del nacimiento de un afecto o de una etapa de mayor apertura. Invita a decir lo que se siente sin adornarlo.',
    work: 'Favorece proyectos con componente creativo o humano. En estudios, señala interés genuino más que obligación.',
    growth: 'Sentir no compromete a actuar. Puedes reconocer una emoción sin obedecerla.',
    yesNo: 'Sí',
    astrology: 'Agua en su forma más pura.'
  },
  C02: {
    keywords: ['Encuentro', 'Reciprocidad', 'Acuerdo'],
    energy: 'Dos que se reconocen y deciden mirarse.',
    advice: 'Comprueba que lo que das y lo que recibes se parecen.',
    light: ['Vínculo equilibrado', 'Atracción mutua', 'Reconciliación'],
    shadow: ['Dependencia mutua', 'Idealizar al otro', 'Desequilibrio silencioso'],
    upright: 'El Dos de Copas es un brindis entre iguales. Habla de encuentro, de acuerdo y de la química que aparece cuando dos partes se reconocen. En una tirada suele señalar una relación o alianza que funciona en ambos sentidos.',
    reversed: 'Invertido puede indicar desequilibrio, un vínculo que se ha desalineado, o dificultad para llegar a un punto común.',
    love: 'Puede hablar de una conexión mutua y sincera. Invita a cuidar la reciprocidad, no solo el sentimiento.',
    work: 'Favorece asociaciones y trabajo de dos. En estudios, señala una buena pareja de estudio o colaboración.',
    growth: 'Una relación sana se nota en que ninguna parte tiene que encogerse.',
    yesNo: 'Sí',
    astrology: 'Agua que se corresponde.'
  },
  C03: {
    keywords: ['Celebración', 'Amistad', 'Comunidad'],
    energy: 'La alegría que solo existe compartida.',
    advice: 'Rodéate de quienes celebran lo tuyo sin reservas.',
    light: ['Apoyo cercano', 'Alegría compartida', 'Sentirse parte'],
    shadow: ['Superficialidad', 'Evadirse en lo social', 'Compañía que no sostiene'],
    upright: 'El Tres de Copas brinda en grupo. Habla de amistad, comunidad y de los momentos que se disfrutan por estar acompañados. En una lectura suele señalar apoyo del entorno o una celebración.',
    reversed: 'Invertido puede indicar distancia con el grupo, celebraciones vacías, o la sensación de estar rodeado y no acompañado.',
    love: 'Puede hablar de un vínculo que se integra bien en la vida de ambos. Invita a cuidar también las amistades.',
    work: 'Favorece el trabajo en equipo y el buen ambiente. En estudios, señala que estudiar en grupo puede rendir.',
    growth: 'Elige con cuidado con quién celebras: dice mucho de dónde estás.',
    yesNo: 'Sí',
    astrology: 'Agua que se comparte.'
  },
  C04: {
    keywords: ['Desapego', 'Insatisfacción', 'Reconsiderar'],
    energy: 'Tenerlo y aun así no sentirlo.',
    advice: 'Antes de buscar algo nuevo, mira si has agotado lo que tienes delante.',
    light: ['Pausa para reevaluar', 'Honestidad con el propio hastío', 'Saber decir no'],
    shadow: ['Apatía', 'Rechazar sin mirar', 'Quedarse en la queja'],
    upright: 'El Cuatro de Copas mira tres copas con desgana mientras una cuarta se le ofrece sin que la vea. Habla de saturación, de aburrimiento y de oportunidades que pasan desapercibidas. En una tirada suele invitar a levantar la vista.',
    reversed: 'Invertido puede indicar que el interés vuelve, o el momento en que se acepta lo que antes se rechazaba. También señala salir de un bache.',
    love: 'Puede hablar de rutina o de desconexión emocional. Invita a nombrar el aburrimiento antes de que se instale.',
    work: 'Puede señalar desmotivación. En estudios, indica que el método actual ya no engancha.',
    growth: 'La insatisfacción es información, no un veredicto. Pregúntate de qué te avisa.',
    yesNo: 'Probablemente no',
    astrology: 'Agua estancada.'
  },
  C05: {
    keywords: ['Pérdida', 'Duelo', 'Lo que queda'],
    energy: 'Mirar lo derramado sin ver aún lo que sigue en pie.',
    advice: 'Date permiso para lamentarlo, y luego gírate: no todo se ha caído.',
    light: ['Duelo honesto', 'Aprendizaje del error', 'Aceptación'],
    shadow: ['Quedarse en la pérdida', 'Culpa que no cierra', 'Ignorar lo que queda'],
    upright: 'El Cinco de Copas mira tres copas volcadas sin volverse hacia las dos que siguen enteras. Habla de decepción y de duelo, y del momento en que el dolor ocupa todo el campo de visión. En una lectura invita a mirar también atrás.',
    reversed: 'Invertido puede indicar el comienzo de la recuperación, el perdón, o la capacidad de ver por fin lo que se conservó.',
    love: 'Puede hablar de una decepción o de un duelo por lo que no fue. Invita a distinguir entre la persona y la expectativa.',
    work: 'Puede señalar un revés o un proyecto que no salió. En estudios, un resultado por debajo de lo esperado.',
    growth: 'El duelo tiene su tiempo; el problema empieza cuando se convierte en identidad.',
    yesNo: 'No',
    astrology: 'Agua que se derrama.'
  },
  C06: {
    keywords: ['Memoria', 'Inocencia', 'Reencuentro'],
    energy: 'Algo del pasado vuelve con dulzura.',
    advice: 'Recoge del pasado lo que te nutre y deja allí lo que te ata.',
    light: ['Nostalgia sana', 'Generosidad sencilla', 'Reencuentro'],
    shadow: ['Vivir en el recuerdo', 'Idealizar lo que fue', 'Negarse a crecer'],
    upright: 'El Seis de Copas comparte flores entre quienes se conocen de siempre. Habla de memoria, de ternura y de vínculos con raíz. En una tirada puede señalar un reencuentro o el peso amable del pasado.',
    reversed: 'Invertido puede indicar quedarse anclado en lo que fue, o la necesidad de cerrar un capítulo antiguo para poder avanzar.',
    love: 'Puede hablar de alguien del pasado o de un vínculo con historia compartida. Invita a mirar el presente, no solo el recuerdo.',
    work: 'Puede señalar retomar algo dejado atrás. En estudios, recuperar una materia o un interés antiguo.',
    growth: 'El pasado se visita; no se habita.',
    yesNo: 'Probablemente sí',
    astrology: 'Agua que recuerda.'
  },
  C07: {
    keywords: ['Opciones', 'Fantasía', 'Discernimiento'],
    energy: 'Muchas posibilidades y ninguna todavía real.',
    advice: 'Elige una y hazla concreta; el resto seguirá siendo humo.',
    light: ['Imaginación fértil', 'Abanico de posibilidades', 'Momento de soñar'],
    shadow: ['Ilusión que sustituye a la acción', 'Dispersión', 'Confundir deseo con plan'],
    upright: 'El Siete de Copas ofrece siete visiones entre nubes, unas valiosas y otras no. Habla del momento en que hay demasiadas opciones y ninguna se ha probado. En una lectura invita a distinguir lo posible de lo imaginado.',
    reversed: 'Invertido puede indicar que la niebla se despeja y una opción se impone con claridad, o que se han descartado las fantasías.',
    love: 'Puede hablar de idealización o de dudas entre opciones. Invita a mirar a la persona real, no a la imaginada.',
    work: 'Puede señalar exceso de proyectos posibles. En estudios, dificultad para elegir camino.',
    growth: 'Soñar cuesta poco; elegir es lo que convierte un sueño en una vida.',
    yesNo: 'Depende',
    astrology: 'Agua que se dispersa.'
  },
  C08: {
    keywords: ['Retirada', 'Búsqueda', 'Dejar atrás'],
    energy: 'Marcharse de algo que ya no llena, aunque esté bien.',
    advice: 'Si algo ya no te alimenta, irte no es fracasar: es reconocerlo.',
    light: ['Honestidad para partir', 'Buscar sentido', 'Valor de soltar'],
    shadow: ['Huir en vez de resolver', 'Abandonar antes de tiempo', 'Irse sin despedirse'],
    upright: 'El Ocho de Copas da la espalda a lo construido y camina hacia la noche. Habla de una partida elegida, no forzada: dejar algo que funciona pero ya no significa. En una tirada suele señalar una decisión de retirada.',
    reversed: 'Invertido puede indicar dudas sobre si irse o quedarse, un regreso, o la permanencia en algo que ya se sabe agotado.',
    love: 'Puede hablar de distanciarse de un vínculo que no colma. Invita a hablarlo antes de desaparecer.',
    work: 'Puede señalar el fin de una etapa laboral o formativa. En estudios, dejar un camino que no era el propio.',
    growth: 'Irse a tiempo evita convertir una etapa buena en un recuerdo amargo.',
    yesNo: 'Depende',
    astrology: 'Agua que se retira.'
  },
  C09: {
    keywords: ['Satisfacción', 'Bienestar', 'Deseo cumplido'],
    energy: 'Sentirse a gusto con lo que se tiene.',
    advice: 'Disfruta de lo conseguido sin necesitar que nadie lo valide.',
    light: ['Contento genuino', 'Autoestima sana', 'Placer sencillo'],
    shadow: ['Autocomplacencia', 'Confundir tener con estar bien', 'Placer que tapa un vacío'],
    upright: 'El Nueve de Copas se sienta satisfecho ante lo suyo. Habla de bienestar, de deseos que se cumplen y de disfrutar sin culpa. En una lectura suele señalar un momento favorable en lo emocional o material.',
    reversed: 'Invertido puede indicar satisfacción aparente, deseos cumplidos que no llenaban, o exceso que empalaga.',
    love: 'Puede hablar de un vínculo que da bienestar. Invita a disfrutarlo sin buscar la próxima cosa.',
    work: 'Favorece los resultados y el reconocimiento personal. En estudios, señala satisfacción con lo logrado.',
    growth: 'Pregúntate qué deseabas realmente. A veces se cumple lo pedido y no lo necesitado.',
    yesNo: 'Sí',
    astrology: 'Agua satisfecha.'
  },
  C10: {
    keywords: ['Armonía', 'Pertenencia', 'Plenitud compartida'],
    energy: 'El bienestar que se sostiene entre varios.',
    advice: 'Cuida los vínculos que te sostienen: son el logro, no el decorado.',
    light: ['Familia elegida', 'Paz emocional', 'Vínculos duraderos'],
    shadow: ['Idealizar la armonía', 'Evitar conflictos necesarios', 'Aparentar felicidad'],
    upright: 'El Diez de Copas dibuja un arco de copas sobre quienes están juntos. Habla de plenitud compartida, de hogar y de vínculos que han encontrado su forma. En una tirada suele señalar armonía en lo afectivo.',
    reversed: 'Invertido puede indicar una armonía forzada, tensiones que no se nombran, o distancia entre lo que se muestra y lo que se vive.',
    love: 'Puede hablar de un vínculo consolidado o de proyecto común. Invita a que la paz sea real, no mantenida a base de silencios.',
    work: 'Favorece equipos con buen clima. En estudios, señala un entorno que apoya.',
    growth: 'La armonía sana admite desacuerdos; la fingida los prohíbe.',
    yesNo: 'Sí',
    astrology: 'Agua en plenitud.'
  },
  C11: {
    keywords: ['Sensibilidad', 'Mensaje', 'Ternura'],
    energy: 'Una emoción nueva que aún no sabe su nombre.',
    advice: 'Deja que lo que sientes se exprese aunque salga torpe.',
    light: ['Apertura afectiva', 'Imaginación', 'Sinceridad sin filtro'],
    shadow: ['Sensibilidad a flor de piel', 'Fantasear en exceso', 'Tomarlo todo como personal'],
    upright: 'La Sota de Copas sostiene una copa de la que asoma algo inesperado. Habla de mensajes emocionales, de intuiciones tempranas y de una sensibilidad que se estrena. En una lectura puede señalar una noticia afectiva o una etapa receptiva.',
    reversed: 'Invertida puede indicar inmadurez emocional, susceptibilidad, o dificultad para expresar lo que se siente.',
    love: 'Puede hablar de un interés que empieza o de una confesión. Invita a la honestidad sencilla.',
    work: 'Favorece lo creativo y lo intuitivo. En estudios, señala interés que nace de la curiosidad, no de la nota.',
    growth: 'La sensibilidad no es fragilidad: es información fina si aprendes a leerla.',
    yesNo: 'Probablemente sí',
    astrology: 'Agua que despierta.'
  },
  C12: {
    keywords: ['Propuesta', 'Romanticismo', 'Ideal'],
    energy: 'Acercarse a alguien o algo con el corazón por delante.',
    advice: 'Comprueba que lo que ofreces puedes sostenerlo después.',
    light: ['Gestos sinceros', 'Seguir el corazón', 'Encanto genuino'],
    shadow: ['Prometer desde la emoción', 'Idealizar', 'Enamorarse de la idea'],
    upright: 'El Caballero de Copas avanza despacio, con la copa en alto. Habla de propuestas, invitaciones y gestos que vienen del sentimiento. En una tirada suele señalar un acercamiento afectivo o una oferta que emociona.',
    reversed: 'Invertido puede indicar promesas que no se cumplen, seducción sin fondo, o un ideal que choca con la realidad.',
    love: 'Puede hablar de una declaración o de un gesto importante. Invita a valorar la constancia además del gesto.',
    work: 'Favorece propuestas creativas. En estudios, señala un proyecto elegido por vocación.',
    growth: 'Lo que se promete en caliente hay que sostenerlo en frío.',
    yesNo: 'Probablemente sí',
    astrology: 'Agua que se ofrece.'
  },
  C13: {
    keywords: ['Empatía', 'Intuición', 'Contención'],
    energy: 'Sostener lo que otros sienten sin ahogarse en ello.',
    advice: 'Cuida de los demás sin dejar de cuidarte: se puede hacer a la vez.',
    light: ['Escucha profunda', 'Serenidad emocional', 'Intuición fiable'],
    shadow: ['Absorber emociones ajenas', 'Olvidarse de una misma', 'Dar para ser necesitada'],
    upright: 'La Reina de Copas sostiene su copa con calma, sin derramarla. Habla de madurez emocional: sentir mucho y no perderse. En una lectura puede señalar a alguien con esa capacidad o esa cualidad disponible en ti.',
    reversed: 'Invertida puede indicar desbordamiento emocional, entrega que agota, o dificultad para poner límites afectivos.',
    love: 'Puede hablar de un vínculo con profundidad y cuidado mutuo. Invita a que la contención sea de dos.',
    work: 'Favorece papeles de acompañamiento, mediación o cuidado. En estudios, señala buena sintonía con el grupo.',
    growth: 'Sentir con alguien no es cargar con lo suyo. La empatía se sostiene sobre un límite.',
    yesNo: 'Sí',
    astrology: 'Agua que contiene.'
  },
  C14: {
    keywords: ['Serenidad', 'Madurez', 'Equilibrio emocional'],
    energy: 'Calma que se mantiene aunque el mar se agite.',
    advice: 'Responde desde la calma, no desde la primera reacción.',
    light: ['Templanza', 'Consejo sabio', 'Estabilidad afectiva'],
    shadow: ['Reprimir para aparentar calma', 'Distancia emocional', 'Manipular desde la aparente serenidad'],
    upright: 'El Rey de Copas mantiene el trono firme sobre aguas movidas. Habla de dominio emocional que no niega el sentimiento, sino que lo administra. En una tirada puede señalar a alguien maduro afectivamente o esa actitud en ti.',
    reversed: 'Invertido puede indicar emociones contenidas hasta reventar, frialdad, o consejo dado sin implicarse.',
    love: 'Puede hablar de un vínculo estable con alguien de trato sereno. Invita a que la calma no sea distancia.',
    work: 'Favorece la gestión de personas y las situaciones tensas. En estudios, señala capacidad de mantener la cabeza fría.',
    growth: 'La calma verdadera no es ausencia de emoción: es no dejar que sea ella quien conduzca.',
    yesNo: 'Sí',
    astrology: 'Agua que gobierna.'
  },
  E01: {
    keywords: ['Claridad', 'Verdad', 'Decisión'],
    energy: 'Un pensamiento que corta la confusión de un tajo.',
    advice: 'Di lo que piensas con precisión: la claridad ahorra mucho después.',
    light: ['Lucidez', 'Honestidad', 'Ruptura con la confusión'],
    shadow: ['Verdad dicha sin cuidado', 'Racionalizar para no sentir', 'Cortar por lo sano demasiado pronto'],
    upright: 'El As de Espadas es una hoja limpia que atraviesa la niebla. Habla del instante en que algo se entiende con nitidez y ya no se puede desver. En una lectura suele señalar claridad mental o una verdad que se impone.',
    reversed: 'Invertido puede indicar confusión, ideas que no acaban de ordenarse, o claridad usada como arma.',
    love: 'Puede hablar de una conversación necesaria. Invita a decir la verdad cuidando la forma.',
    work: 'Favorece analizar, decidir y comunicar con precisión. En estudios, señala que un concepto por fin encaja.',
    growth: 'Entender algo con claridad no obliga a actuar de inmediato, pero ya no permite fingir que no se sabe.',
    yesNo: 'Sí',
    astrology: 'Aire en estado puro.'
  },
  E02: {
    keywords: ['Bloqueo', 'Indecisión', 'Tregua'],
    energy: 'No mirar para no tener que elegir.',
    advice: 'Quítate la venda: la decisión no mejora por aplazarse.',
    light: ['Pausa antes de decidir', 'Equilibrio provisional', 'Evitar un conflicto inútil'],
    shadow: ['Negarse a ver', 'Parálisis', 'Tregua que se eterniza'],
    upright: 'El Dos de Espadas cruza dos hojas con los ojos vendados. Habla de una decisión que se evita, muchas veces porque ambas opciones cuestan. En una tirada suele señalar bloqueo o un equilibrio que no puede durar.',
    reversed: 'Invertido puede indicar que la venda cae y hay que decidir, o que la información necesaria por fin aparece.',
    love: 'Puede hablar de algo que no se quiere mirar. Invita a nombrarlo antes de que decida solo.',
    work: 'Puede señalar una decisión aplazada. En estudios, indica evitar una asignatura o un tema difícil.',
    growth: 'No decidir también es decidir, solo que sin elegir tú.',
    yesNo: 'Neutral',
    astrology: 'Aire detenido.'
  },
  E03: {
    keywords: ['Dolor', 'Verdad dura', 'Claridad amarga'],
    energy: 'Algo duele porque es cierto.',
    advice: 'Permite que duela lo que duele; taparlo lo alarga.',
    light: ['Ver la realidad', 'Duelo que limpia', 'Fin del engaño'],
    shadow: ['Recrearse en la herida', 'Herir con la verdad', 'Confundir dolor con castigo'],
    upright: 'El Tres de Espadas atraviesa un corazón bajo la lluvia. Habla de una verdad que hace daño y del dolor que acompaña a ciertas claridades. En una lectura suele señalar una decepción o una ruptura.',
    reversed: 'Invertido puede indicar el proceso de recuperación, o el momento en que el dolor se sostiene más de lo que corresponde.',
    love: 'Puede hablar de una decepción o de una conversación dolorosa. Invita a hablar sin buscar hacer daño.',
    work: 'Puede señalar una crítica dura o una noticia difícil. En estudios, un resultado que obliga a replantear.',
    growth: 'El dolor no es el enemigo: la parte que se enquista es lo que se evita mirar.',
    yesNo: 'No',
    astrology: 'Aire que hiere.'
  },
  E04: {
    keywords: ['Reposo', 'Recuperación', 'Silencio'],
    energy: 'Parar del todo para poder volver.',
    advice: 'Descansa de verdad, no a medias mientras piensas en lo pendiente.',
    light: ['Descanso reparador', 'Retiro consciente', 'Recuperar fuerzas'],
    shadow: ['Aplazar el regreso', 'Descanso que se vuelve evasión', 'Agotamiento no atendido'],
    upright: 'El Cuatro de Espadas descansa en silencio con tres hojas colgadas y una guardada. Habla de una pausa necesaria tras el desgaste. En una tirada suele señalar convalecencia o retiro voluntario.',
    reversed: 'Invertido puede indicar que toca volver a la actividad, o que el descanso se ha estado postergando demasiado.',
    love: 'Puede hablar de necesidad de pausa en el vínculo. Invita a explicarla para que no se lea como distancia.',
    work: 'Señala la conveniencia de parar antes de seguir. En estudios, indica que el rendimiento pide descanso, no más horas.',
    growth: 'Descansar no es perder tiempo: es lo que hace posible el siguiente tramo.',
    yesNo: 'Neutral',
    astrology: 'Aire en reposo.'
  },
  E05: {
    keywords: ['Conflicto', 'Coste', 'Victoria amarga'],
    energy: 'Ganar la discusión y perder algo por el camino.',
    advice: 'Pregúntate qué cuesta tener razón aquí, y si compensa.',
    light: ['Defender lo justo', 'Reconocer los límites', 'Retirarse a tiempo'],
    shadow: ['Ganar a cualquier precio', 'Humillar', 'Resentimiento que se queda'],
    upright: 'El Cinco de Espadas recoge las armas mientras los demás se alejan. Habla de conflictos donde el triunfo deja mal sabor. En una lectura suele señalar tensión, desacuerdo o un coste relacional.',
    reversed: 'Invertido puede indicar el deseo de reparar, el final de una disputa, o la decisión de no entrar en un conflicto.',
    love: 'Puede hablar de discusiones que dejan huella. Invita a buscar entendimiento antes que razón.',
    work: 'Puede señalar rivalidad o un ambiente tenso. En estudios, competencia que resta más de lo que suma.',
    growth: 'Hay conversaciones que se ganan y relaciones que se pierden en el mismo movimiento.',
    yesNo: 'No',
    astrology: 'Aire en conflicto.'
  },
  E06: {
    keywords: ['Transición', 'Alejarse', 'Aguas más calmas'],
    energy: 'Dejar atrás lo difícil sin haberlo olvidado.',
    advice: 'Acepta la ayuda para cruzar; no hace falta remar solo.',
    light: ['Salir de una etapa dura', 'Apoyo en el tránsito', 'Perspectiva que mejora'],
    shadow: ['Marcharse sin cerrar', 'Llevarse el problema', 'Transición que se alarga'],
    upright: 'El Seis de Espadas navega hacia una orilla más tranquila con las espadas a bordo. Habla de un tránsito: la dificultad no ha desaparecido, pero ya se está saliendo de ella. En una tirada suele señalar mejoría gradual.',
    reversed: 'Invertido puede indicar resistencia a moverse, un cambio que se pospone, o la sensación de arrastrar lo mismo a otro lugar.',
    love: 'Puede hablar de superar una crisis juntos o por separado. Invita a reconocer lo que se deja atrás.',
    work: 'Puede señalar un cambio de entorno o proyecto. En estudios, pasar página tras una etapa difícil.',
    growth: 'Cambiar de sitio ayuda si además cambias algo de lo que llevas contigo.',
    yesNo: 'Probablemente sí',
    astrology: 'Aire en tránsito.'
  },
  E07: {
    keywords: ['Estrategia', 'Sigilo', 'Astucia'],
    energy: 'Actuar por caminos que no se anuncian.',
    advice: 'Si necesitas ocultar tu plan, revisa primero si te convence del todo.',
    light: ['Inteligencia táctica', 'Elegir bien la batalla', 'Independencia'],
    shadow: ['Actuar a espaldas de otros', 'Medias verdades', 'Escapar de la responsabilidad'],
    upright: 'El Siete de Espadas se lleva parte de las armas sin ser visto. Habla de estrategia, de discreción y a veces de engaño. En una lectura suele señalar que alguien no está mostrando todas sus cartas.',
    reversed: 'Invertido puede indicar que algo oculto sale a la luz, un arrepentimiento, o la decisión de actuar con transparencia.',
    love: 'Puede hablar de cosas no dichas. Invita a preguntar directamente en lugar de investigar.',
    work: 'Puede señalar competencia poco limpia o la necesidad de moverse con discreción. En estudios, atajos que salen caros.',
    growth: 'La astucia sirve; la ocultación desgasta. Distingue cuál estás usando.',
    yesNo: 'Probablemente no',
    astrology: 'Aire que maniobra.'
  },
  E08: {
    keywords: ['Limitación', 'Bloqueo mental', 'Salida no vista'],
    energy: 'Sentirse atrapado por lo que se cree imposible.',
    advice: 'Comprueba cuáles de tus límites son reales y cuáles solo pensados.',
    light: ['Reconocer el propio bloqueo', 'Pedir otra mirada', 'Primer paso hacia la salida'],
    shadow: ['Creerse sin opciones', 'Esperar el rescate', 'Autolimitarse'],
    upright: 'El Ocho de Espadas está vendado y rodeado, pero las ataduras son flojas y el suelo está libre. Habla de bloqueos que se sostienen sobre todo en la cabeza. En una tirada suele invitar a revisar qué impide realmente moverse.',
    reversed: 'Invertido puede indicar que se empieza a ver la salida, o la recuperación de la propia capacidad de decidir.',
    love: 'Puede hablar de sentirse atrapado en una dinámica. Invita a nombrarla en voz alta.',
    work: 'Puede señalar una situación que parece sin salida. En estudios, bloqueo ante un tema que se cree imposible.',
    growth: 'Muchos muros resultan ser puertas mal iluminadas.',
    yesNo: 'Probablemente no',
    astrology: 'Aire atrapado.'
  },
  E09: {
    keywords: ['Angustia', 'Insomnio', 'Anticipación'],
    energy: 'La noche en la que todo parece peor de lo que es.',
    advice: 'Escribe lo que temes: casi siempre encoge al salir de la cabeza.',
    light: ['Reconocer la ansiedad', 'Pedir ayuda', 'Separar miedo de hecho'],
    shadow: ['Rumiar sin parar', 'Anticipar catástrofes', 'Sufrir a solas'],
    upright: 'El Nueve de Espadas se incorpora en la cama con el rostro entre las manos. Habla de angustia nocturna, de pensamientos que giran y del sufrimiento que produce lo imaginado. En una lectura suele señalar preocupación intensa.',
    reversed: 'Invertido puede indicar que la angustia empieza a ceder, que se busca ayuda, o que un miedo se enfrenta por fin.',
    love: 'Puede hablar de inseguridades que crecen en silencio. Invita a compartirlas antes de que se hagan grandes.',
    work: 'Puede señalar estrés o presión sostenida. En estudios, ansiedad ante los exámenes.',
    growth: 'La mente de madrugada exagera. Conviene no tomar decisiones a esa hora.',
    yesNo: 'No',
    astrology: 'Aire que atormenta.'
  },
  E10: {
    keywords: ['Final', 'Fondo', 'Amanecer'],
    energy: 'Lo peor ya ha pasado porque no puede ir a más.',
    advice: 'Da el ciclo por cerrado; empezar de nuevo pesa menos que reparar esto.',
    light: ['Cierre definitivo', 'Aceptación', 'Amanecer al fondo'],
    shadow: ['Dramatizar', 'Regodearse en el papel de víctima', 'Rematar lo que ya cayó'],
    upright: 'El Diez de Espadas marca un final sin ambigüedad, con un amanecer despuntando al fondo. Habla de tocar fondo y de la extraña calma que llega después. En una tirada suele señalar el cierre de algo doloroso.',
    reversed: 'Invertido puede indicar el inicio de la recuperación, o la resistencia a aceptar que algo ya terminó.',
    love: 'Puede hablar del final de un vínculo o de una dinámica. Invita a cerrar sin alargar la agonía.',
    work: 'Puede señalar el fin de una etapa laboral difícil. En estudios, abandonar un camino que no era.',
    growth: 'Tocar fondo tiene una ventaja: a partir de ahí todo movimiento es hacia arriba.',
    yesNo: 'No',
    astrology: 'Aire que concluye.'
  },
  E11: {
    keywords: ['Curiosidad mental', 'Vigilancia', 'Aprender'],
    energy: 'Querer entenderlo todo, y deprisa.',
    advice: 'Pregunta más y concluye menos, al menos por ahora.',
    light: ['Mente despierta', 'Capacidad de observar', 'Ganas de saber'],
    shadow: ['Hablar antes de entender', 'Desconfianza', 'Criticar por deporte'],
    upright: 'La Sota de Espadas observa alerta, con la hoja en alto. Habla de curiosidad intelectual, de estar atento y de un aprendizaje que empieza. En una tirada puede señalar noticias, estudio o alguien que hace preguntas incómodas.',
    reversed: 'Invertida puede indicar chismes, información poco fiable, o una crítica que llega sin fundamento.',
    love: 'Puede hablar de conversaciones que aclaran o de dudas que piden preguntarse. Invita a comprobar antes de asumir.',
    work: 'Favorece investigar y aprender. En estudios, buen momento para profundizar en un tema.',
    growth: 'Preguntar bien vale más que responder rápido.',
    yesNo: 'Depende',
    astrology: 'Aire que observa.'
  },
  E12: {
    keywords: ['Urgencia', 'Ímpetu', 'Determinación'],
    energy: 'Lanzarse de frente con la idea por delante.',
    advice: 'Antes de disparar la frase, comprueba si buscas resolver o ganar.',
    light: ['Decisión rápida', 'Ir al grano', 'Valentía intelectual'],
    shadow: ['Atropellar', 'Hablar sin filtro', 'Prisa que arrasa matices'],
    upright: 'El Caballero de Espadas cabalga a toda velocidad con la hoja en alto. Habla de determinación mental, de ir directo y de decisiones que no admiten espera. En una lectura suele señalar acción rápida y frontal.',
    reversed: 'Invertido puede indicar precipitación con consecuencias, agresividad verbal, o un impulso que se frena en seco.',
    love: 'Puede hablar de conversaciones intensas o directas. Invita a bajar el tono sin renunciar al contenido.',
    work: 'Favorece resolver con rapidez. En estudios, avanzar sin dar vueltas, cuidando no saltarse pasos.',
    growth: 'La rapidez es útil cuando la dirección es correcta; si no, solo llegas antes al sitio equivocado.',
    yesNo: 'Probablemente sí',
    astrology: 'Aire que embiste.'
  },
  E13: {
    keywords: ['Lucidez', 'Independencia', 'Franqueza'],
    energy: 'Ver las cosas como son, sin adornarlas.',
    advice: 'Di la verdad con precisión y con cuidado: ambas cosas caben.',
    light: ['Criterio propio', 'Honestidad', 'Experiencia que enseña'],
    shadow: ['Frialdad', 'Dureza al juzgar', 'Levantar muros por prudencia'],
    upright: 'La Reina de Espadas sostiene la hoja recta y mira de frente. Habla de claridad ganada con experiencia, de decir lo que hay que decir sin rodeos. En una lectura puede señalar a alguien así o esa capacidad en ti.',
    reversed: 'Invertida puede indicar amargura, crítica que hiere, o aislamiento tras haber sido herida.',
    love: 'Puede hablar de un vínculo donde la honestidad importa más que la comodidad. Invita a que la franqueza no sea frontera.',
    work: 'Favorece el análisis y las decisiones difíciles. En estudios, señala pensamiento crítico afinado.',
    growth: 'La lucidez sin ternura se vuelve dureza; con ternura, se vuelve criterio.',
    yesNo: 'Depende',
    astrology: 'Aire que discierne.'
  },
  E14: {
    keywords: ['Criterio', 'Ética', 'Autoridad mental'],
    energy: 'Decidir con la cabeza fría y las razones claras.',
    advice: 'Explica tus razones: una decisión entendida se acepta mejor que una impuesta.',
    light: ['Juicio imparcial', 'Claridad al comunicar', 'Integridad'],
    shadow: ['Rigidez intelectual', 'Frialdad al decidir', 'Usar la razón como poder'],
    upright: 'El Rey de Espadas gobierna con la ley y la palabra. Habla de autoridad basada en el criterio, de decisiones fundamentadas y de ética aplicada. En una tirada puede señalar a alguien así o el momento de decidir con la cabeza.',
    reversed: 'Invertido puede indicar autoritarismo, argumentos usados para imponer, o decisiones tomadas sin considerar a las personas.',
    love: 'Puede hablar de un vínculo donde se razona mucho y se siente poco en voz alta. Invita a dejar sitio a lo emocional.',
    work: 'Favorece dirigir, arbitrar y estructurar. En estudios, señala capacidad para argumentar y defender ideas.',
    growth: 'Tener razón y tener criterio no siempre coinciden. El criterio incluye a quien escucha.',
    yesNo: 'Sí',
    astrology: 'Aire que gobierna.'
  },
  O01: {
    keywords: ['Oportunidad', 'Semilla', 'Recurso'],
    energy: 'Algo concreto se pone al alcance de la mano.',
    advice: 'Acepta la oportunidad y dale forma: sola no crece.',
    light: ['Comienzo próspero', 'Base sólida', 'Salud y cuerpo presentes'],
    shadow: ['Dejar pasar la ocasión', 'Confundir potencial con logro', 'Apego a lo material'],
    upright: 'El As de Oros es una moneda ofrecida entre nubes sobre un jardín. Habla de una oportunidad tangible: un trabajo, un recurso, una posibilidad práctica. En una lectura suele señalar un comienzo con base real.',
    reversed: 'Invertido puede indicar una ocasión que se deja escapar, planes sin cimiento, o preocupación por lo material.',
    love: 'Puede hablar de un vínculo que empieza con posibilidades reales. Invita a construir con hechos, no solo con intención.',
    work: 'Favorece nuevas ofertas, proyectos y recursos. En estudios, señala una oportunidad de formación concreta.',
    growth: 'Una oportunidad solo lo es si haces algo con ella.',
    yesNo: 'Sí',
    astrology: 'Tierra que empieza.'
  },
  O02: {
    keywords: ['Equilibrio', 'Adaptación', 'Malabares'],
    energy: 'Sostener varias cosas a la vez sin que caiga ninguna.',
    advice: 'Si no puedes con todo, prioriza antes de que decida el cansancio.',
    light: ['Flexibilidad', 'Buena gestión del tiempo', 'Adaptarse al cambio'],
    shadow: ['Demasiados frentes', 'Aplazar decisiones', 'Equilibrio que agota'],
    upright: 'El Dos de Oros baila con dos monedas unidas por un lazo infinito. Habla de la gestión de varias prioridades y de la agilidad que exige. En una tirada suele señalar equilibrio dinámico, no estático.',
    reversed: 'Invertido puede indicar sobrecarga, desorganización, o algo que se cae por intentar sostener demasiado.',
    love: 'Puede hablar de dificultad para hacer sitio al vínculo entre otras cosas. Invita a decidir qué lugar ocupa.',
    work: 'Señala multitarea. En estudios, la necesidad de compaginar asignaturas o trabajo y estudio.',
    growth: 'Hacer malabares funciona un tiempo. Después toca elegir qué se deja en el suelo.',
    yesNo: 'Depende',
    astrology: 'Tierra en movimiento.'
  },
  O03: {
    keywords: ['Oficio', 'Colaboración', 'Reconocimiento'],
    energy: 'El trabajo bien hecho empieza a notarse.',
    advice: 'Acepta ayuda especializada: no todo tiene que salir de ti.',
    light: ['Competencia demostrada', 'Trabajo en equipo', 'Aprendizaje aplicado'],
    shadow: ['Perfeccionismo', 'No delegar', 'Trabajar sin reconocimiento'],
    upright: 'El Tres de Oros muestra a un artesano explicando su obra a quienes la encargaron. Habla de oficio, colaboración y del momento en que la calidad se reconoce. En una lectura suele señalar progreso por competencia.',
    reversed: 'Invertido puede indicar falta de coordinación, trabajo poco valorado, o exigencia desmedida consigo mismo.',
    love: 'Puede hablar de un vínculo que se construye con hechos compartidos. Invita a repartir tareas y méritos.',
    work: 'Favorece proyectos colaborativos y desarrollo profesional. En estudios, buen momento para trabajos en grupo.',
    growth: 'Pedir a otro lo que hace mejor que tú no resta: multiplica.',
    yesNo: 'Sí',
    astrology: 'Tierra que construye.'
  },
  O04: {
    keywords: ['Conservación', 'Seguridad', 'Control'],
    energy: 'Agarrar fuerte lo que se tiene por miedo a perderlo.',
    advice: 'Distingue entre ahorrar y aferrarse: solo una de las dos cosas te sostiene.',
    light: ['Prudencia', 'Ahorro con criterio', 'Proteger lo conseguido'],
    shadow: ['Rigidez', 'Miedo a compartir', 'Definirse por lo que se posee'],
    upright: 'El Cuatro de Oros sujeta sus monedas con todo el cuerpo. Habla de seguridad buscada en lo material y del control que a veces la acompaña. En una tirada suele señalar prudencia, o bien una retención que empieza a pesar.',
    reversed: 'Invertido puede indicar que se suelta el control, gastos que se descontrolan, o la decisión de abrirse a compartir.',
    love: 'Puede hablar de reservas emocionales o de control en el vínculo. Invita a preguntarse qué se teme perder.',
    work: 'Puede señalar cautela económica. En estudios, aferrarse a un método por seguridad.',
    growth: 'Lo que se sujeta demasiado fuerte deja de poder crecer.',
    yesNo: 'Depende',
    astrology: 'Tierra que retiene.'
  },
  O05: {
    keywords: ['Carencia', 'Exclusión', 'Ayuda cercana'],
    energy: 'Pasar frío junto a una puerta que está abierta.',
    advice: 'Pide ayuda: probablemente esté más cerca de lo que crees.',
    light: ['Solidaridad', 'Reconocer la necesidad', 'Resistencia compartida'],
    shadow: ['Orgullo que impide pedir', 'Sentirse fuera', 'Mentalidad de escasez'],
    upright: 'El Cinco de Oros camina por la nieve frente a una vidriera iluminada que no mira. Habla de carencia -material o afectiva- y de la dificultad de pedir ayuda estando cerca de ella. En una lectura suele señalar una etapa dura y transitoria.',
    reversed: 'Invertido puede indicar que la situación empieza a mejorar, que se acepta el apoyo, o que se sale del aislamiento.',
    love: 'Puede hablar de sentirse solo dentro de un vínculo. Invita a decirlo en lugar de esperar que se note.',
    work: 'Puede señalar dificultades económicas o laborales. En estudios, sensación de ir por detrás.',
    growth: 'Pedir ayuda no es debilidad; no pedirla cuando la hay sí es un coste evitable.',
    yesNo: 'No',
    astrology: 'Tierra en escasez.'
  },
  O06: {
    keywords: ['Generosidad', 'Intercambio', 'Equilibrio'],
    energy: 'Lo que se da y lo que se recibe buscan su medida.',
    advice: 'Revisa si en tus intercambios siempre estás en el mismo lado.',
    light: ['Dar sin condiciones', 'Recibir con gratitud', 'Justicia en el reparto'],
    shadow: ['Dar para tener poder', 'Depender de la ayuda', 'Reparto desigual'],
    upright: 'El Seis de Oros pesa mientras reparte. Habla de generosidad, de ayuda que llega y del equilibrio -a veces desigual- entre quien da y quien recibe. En una tirada suele señalar apoyo o un intercambio que se ajusta.',
    reversed: 'Invertido puede indicar generosidad interesada, deudas que pesan, o una relación de ayuda que se ha desequilibrado.',
    love: 'Puede hablar de reciprocidad en el vínculo. Invita a mirar si el cuidado circula o solo va en un sentido.',
    work: 'Favorece acuerdos justos, becas o apoyos. En estudios, ayuda de alguien con más recorrido.',
    growth: 'Recibir bien también se aprende, y cuesta más de lo que parece.',
    yesNo: 'Sí',
    astrology: 'Tierra que reparte.'
  },
  O07: {
    keywords: ['Paciencia', 'Evaluación', 'Cosecha lenta'],
    energy: 'Mirar lo sembrado y preguntarse si valdrá la pena.',
    advice: 'Dale tiempo a lo que has plantado antes de arrancarlo para verlo.',
    light: ['Constancia', 'Valorar el proceso', 'Decisión informada'],
    shadow: ['Impaciencia', 'Abandonar antes del fruto', 'Invertir donde no crece'],
    upright: 'El Siete de Oros se apoya en la azada y contempla lo cultivado. Habla del momento de evaluar: seguir invirtiendo o cambiar de terreno. En una lectura suele señalar una pausa reflexiva a mitad de camino.',
    reversed: 'Invertido puede indicar frustración por resultados lentos, esfuerzo mal dirigido, o la decisión de abandonar algo que no rinde.',
    love: 'Puede hablar de evaluar hacia dónde va el vínculo. Invita a valorar lo construido, no solo lo que falta.',
    work: 'Momento de revisar si un proyecto merece continuidad. En estudios, evaluar si el esfuerzo va bien orientado.',
    growth: 'Hay procesos que solo se juzgan bien cuando han tenido tiempo de ocurrir.',
    yesNo: 'Depende',
    astrology: 'Tierra que madura.'
  },
  O08: {
    keywords: ['Oficio', 'Constancia', 'Perfeccionar'],
    energy: 'Repetir hasta que salga bien, y luego una vez más.',
    advice: 'Practica lo básico: ahí es donde se gana la diferencia.',
    light: ['Dedicación', 'Mejora continua', 'Atención al detalle'],
    shadow: ['Perfeccionismo estéril', 'Trabajo mecánico', 'Perderse en el detalle'],
    upright: 'El Ocho de Oros trabaja moneda tras moneda con la misma atención. Habla de aprendizaje por repetición, de oficio que se afina y de la satisfacción del trabajo bien hecho. En una tirada suele señalar formación o dedicación sostenida.',
    reversed: 'Invertido puede indicar desmotivación, trabajo hecho sin alma, o exigencia que ya no mejora nada.',
    love: 'Puede hablar de cuidar el vínculo con gestos pequeños y constantes. Invita a no descuidar lo cotidiano.',
    work: 'Favorece especializarse y mejorar. En estudios, señala que la práctica repetida está dando fruto.',
    growth: 'La maestría es aburrida por dentro: son horas de lo mismo hasta que deja de costar.',
    yesNo: 'Sí',
    astrology: 'Tierra que se pule.'
  },
  O09: {
    keywords: ['Autonomía', 'Logro propio', 'Disfrute'],
    energy: 'Estar bien contigo y con lo que has construido.',
    advice: 'Disfruta de lo tuyo sin sentir que debes justificarlo.',
    light: ['Independencia', 'Refinamiento', 'Fruto del esfuerzo propio'],
    shadow: ['Aislarse en la autosuficiencia', 'Confundir logro con valía', 'Soledad no reconocida'],
    upright: 'El Nueve de Oros pasea por su jardín con un halcón en la mano. Habla de autonomía conquistada, de disfrutar lo logrado por uno mismo y de una elegancia sin ostentación. En una lectura suele señalar independencia y bienestar.',
    reversed: 'Invertido puede indicar dependencia no deseada, logros que no se disfrutan, o autosuficiencia que se ha vuelto muro.',
    love: 'Puede hablar de valorar el propio espacio dentro del vínculo. Invita a que la independencia no excluya la compañía.',
    work: 'Favorece proyectos propios y trabajo autónomo. En estudios, señala capacidad de avanzar sin supervisión.',
    growth: 'La autonomía es libertad; la autosuficiencia absoluta suele ser una forma elegante de miedo.',
    yesNo: 'Sí',
    astrology: 'Tierra que florece.'
  },
  O10: {
    keywords: ['Legado', 'Estabilidad', 'Continuidad'],
    energy: 'Lo construido dura más que quien lo construyó.',
    advice: 'Piensa a largo plazo: lo que decidas hoy va a durar.',
    light: ['Seguridad duradera', 'Familia y raíces', 'Patrimonio compartido'],
    shadow: ['Peso de lo heredado', 'Estabilidad que ata', 'Medir el valor en bienes'],
    upright: 'El Diez de Oros reúne varias generaciones bajo un mismo arco. Habla de estabilidad consolidada, de legado y de lo que se sostiene en el tiempo. En una tirada suele señalar seguridad material y raíces.',
    reversed: 'Invertido puede indicar conflictos por herencias o recursos, inestabilidad familiar, o una estructura que ya no encaja.',
    love: 'Puede hablar de proyectos de largo recorrido o de integrar familias. Invita a hablar del futuro con concreción.',
    work: 'Favorece consolidación y planes a largo plazo. En estudios, elegir una vía con recorrido.',
    growth: 'Lo que construyes ahora será el suelo que pises dentro de unos años.',
    yesNo: 'Sí',
    astrology: 'Tierra consolidada.'
  },
  O11: {
    keywords: ['Aprendizaje', 'Método', 'Primer paso'],
    energy: 'Ganas de aprender algo con las manos y con calma.',
    advice: 'Empieza pequeño y constante: los cimientos no se ven pero sostienen.',
    light: ['Aplicación', 'Ganas de formarse', 'Practicidad'],
    shadow: ['Ir demasiado despacio', 'Miedo a empezar', 'Estudiar sin aplicar'],
    upright: 'La Sota de Oros contempla una moneda como quien estudia algo nuevo. Habla de aprendizaje aplicado, de propuestas concretas y de la etapa en que se sientan las bases. En una lectura suele señalar formación u oportunidad inicial.',
    reversed: 'Invertida puede indicar falta de foco, planes que no se ponen en marcha, o desinterés por lo práctico.',
    love: 'Puede hablar de un vínculo que empieza con paso firme. Invita a construir sin prisa.',
    work: 'Favorece prácticas, formación y primeros encargos. En estudios, buen momento para asentar fundamentos.',
    growth: 'Lo que se aprende despacio se olvida despacio.',
    yesNo: 'Probablemente sí',
    astrology: 'Tierra que aprende.'
  },
  O12: {
    keywords: ['Constancia', 'Método', 'Fiabilidad'],
    energy: 'Avanzar despacio pero sin detenerse nunca.',
    advice: 'Mantén el ritmo aunque parezca lento: es el que llega.',
    light: ['Responsabilidad', 'Trabajo metódico', 'Persona de fiar'],
    shadow: ['Rutina sin revisión', 'Resistencia al cambio', 'Lentitud excesiva'],
    upright: 'El Caballero de Oros avanza sobre campo arado, sin prisa y sin pausa. Habla de constancia, método y compromiso sostenido. En una tirada suele señalar progreso lento pero seguro.',
    reversed: 'Invertido puede indicar estancamiento, aburrimiento en la rutina, o cabezonería ante lo que pide cambiar.',
    love: 'Puede hablar de un vínculo estable y previsible. Invita a introducir algo nuevo antes de que se apague.',
    work: 'Favorece tareas largas y responsabilidad. En estudios, señala que el trabajo diario está funcionando.',
    growth: 'La constancia gana casi siempre, salvo cuando repite un error con disciplina.',
    yesNo: 'Sí',
    astrology: 'Tierra que persevera.'
  },
  O13: {
    keywords: ['Cuidado práctico', 'Abundancia', 'Sensatez'],
    energy: 'Hacer que el día a día funcione y además sea agradable.',
    advice: 'Cuida lo cotidiano: es donde de verdad se sostiene todo lo demás.',
    light: ['Sentido práctico', 'Generosidad concreta', 'Conexión con lo natural'],
    shadow: ['Cargar con todo el trabajo invisible', 'Sobreproteger', 'Medir el afecto en tareas'],
    upright: 'La Reina de Oros cuida a la vez su jardín y a quienes lo habitan. Habla de sensatez práctica, de abundancia bien administrada y de cuidado que se nota en los hechos. En una lectura puede señalar a alguien así o esa cualidad en ti.',
    reversed: 'Invertida puede indicar agotamiento por sostener a todos, descuido personal, o dependencia de la seguridad material.',
    love: 'Puede hablar de un vínculo que se cuida con hechos cotidianos. Invita a repartir ese cuidado.',
    work: 'Favorece la gestión, la organización y los entornos que necesitan sostén. En estudios, buena administración del tiempo.',
    growth: 'Cuidar a los demás y cuidarte no compiten; solo lo parecen cuando falta tiempo.',
    yesNo: 'Sí',
    astrology: 'Tierra que nutre.'
  },
  O14: {
    keywords: ['Solidez', 'Prosperidad', 'Responsabilidad'],
    energy: 'Lo construido con los años sostiene sin esfuerzo aparente.',
    advice: 'Administra lo que tienes con vista larga y mano abierta.',
    light: ['Seguridad conseguida', 'Buen administrador', 'Fiabilidad probada'],
    shadow: ['Obsesión por el control', 'Rigidez ante lo nuevo', 'Valorar solo lo tangible'],
    upright: 'El Rey de Oros preside un terreno que ha ido construyendo. Habla de prosperidad sostenida, de criterio práctico y de responsabilidad sobre lo propio. En una tirada puede señalar a alguien así o el momento de administrar con cabeza.',
    reversed: 'Invertido puede indicar apego excesivo a lo material, terquedad, o una gestión que se ha vuelto control.',
    love: 'Puede hablar de un vínculo estable con alguien que aporta seguridad. Invita a que la solidez no excluya la ternura.',
    work: 'Favorece dirigir, invertir y consolidar. En estudios, señala capacidad para llevar proyectos largos a término.',
    growth: 'Tener no es lo mismo que estar seguro. Comprueba cuál de las dos cosas buscas.',
    yesNo: 'Sí',
    astrology: 'Tierra que gobierna.'
  }
};


/* ============================================================
   MOTOR
   Une el contenido con el mazo que ya existía en data.js. El
   mapeo es posicional y verificado: los 22 mayores en orden, y
   luego Bastos, Copas, Espadas y Oros de 14 en 14. Dentro de
   cada palo: 11 Sota, 12 Caballero, 13 Reina, 14 Rey.
   ============================================================ */

const BASE_PALO = { M: 0, B: 22, C: 36, E: 50, O: 64 };
export const ELEMENTOS = { B: 'Fuego', C: 'Agua', E: 'Aire', O: 'Tierra' };

/** Código de carta a partir de su posición en el mazo. */
export function codigoPorIndice(i) {
  if (i < 22) return 'M' + String(i).padStart(2, '0');
  for (const [letra, base] of Object.entries(BASE_PALO)) {
    if (letra === 'M') continue;
    if (i >= base && i < base + 14) return letra + String(i - base + 1).padStart(2, '0');
  }
  return null;
}

/** Contenido de una carta por su posición en el mazo. */
export function contenidoPorIndice(i) {
  const codigo = codigoPorIndice(i);
  return codigo ? ARCANOS[codigo] || null : null;
}

/* Escala de tendencia. Se presenta como orientación simbólica,
   nunca como pronóstico. */
export const TENDENCIAS = ['Sí', 'Probablemente sí', 'Neutral', 'Depende', 'Probablemente no', 'No'];

/* ============================================================
   VALIDACIÓN
   Diagnóstico silencioso: no molesta a quien usa la app. Se
   consulta desde la consola con OraculoArcanos.validar().
   ============================================================ */
export function validar(mazo = []) {
  const fallos = [];
  const codigos = Object.keys(ARCANOS);

  if (codigos.length !== 78) fallos.push(`Se esperaban 78 cartas y hay ${codigos.length}.`);
  if (new Set(codigos).size !== codigos.length) fallos.push('Hay códigos repetidos.');

  const CAMPOS = ['energy', 'advice', 'upright', 'reversed', 'love', 'work', 'growth', 'yesNo', 'astrology'];
  codigos.forEach(c => {
    const a = ARCANOS[c];
    if (!Array.isArray(a.keywords) || a.keywords.length !== 3) fallos.push(`${c}: debe tener exactamente 3 conceptos clave.`);
    if (!Array.isArray(a.light) || a.light.length !== 3) fallos.push(`${c}: debe tener exactamente 3 aspectos de luz.`);
    if (!Array.isArray(a.shadow) || a.shadow.length !== 3) fallos.push(`${c}: debe tener exactamente 3 aspectos de sombra.`);
    CAMPOS.forEach(f => { if (!a[f] || !String(a[f]).trim()) fallos.push(`${c}: falta ${f}.`); });
    if (a.yesNo && !TENDENCIAS.includes(a.yesNo)) fallos.push(`${c}: tendencia no admitida (${a.yesNo}).`);
  });

  /* Los cuatro palos, con sus catorce cartas y sus figuras. */
  ['B', 'C', 'E', 'O'].forEach(p => {
    const delPalo = codigos.filter(c => c.startsWith(p));
    if (delPalo.length !== 14) fallos.push(`Palo ${p}: ${delPalo.length} cartas en vez de 14.`);
    ['11', '12', '13', '14'].forEach(n => {
      if (!ARCANOS[p + n]) fallos.push(`Palo ${p}: falta la figura ${p}${n}.`);
    });
  });

  /* Reina y Rey en su sitio. En una versión anterior estuvieron
     intercambiados: esta comprobación existe para que no vuelva
     a pasar sin que nadie se entere. */
  if (Array.isArray(mazo) && mazo.length === 78) {
    ['B', 'C', 'E', 'O'].forEach(p => {
      const base = BASE_PALO[p];
      const reina = mazo[base + 12];
      const rey = mazo[base + 13];
      if (reina && !/reina/i.test(reina.name)) fallos.push(`Palo ${p}: la posición 13 debería ser la Reina y es «${reina.name}».`);
      if (rey && !/rey/i.test(rey.name)) fallos.push(`Palo ${p}: la posición 14 debería ser el Rey y es «${rey.name}».`);
    });
    mazo.forEach((carta, i) => {
      if (!contenidoPorIndice(i)) fallos.push(`Sin contenido para la carta ${i} («${carta?.name}»).`);
    });
  }

  return { ok: fallos.length === 0, total: codigos.length, fallos };
}
