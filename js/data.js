import { tEn as traducirEn } from './i18n.js';
// data.js - Arcanos Mayores, Menores, Runas, Fases Lunares
import { imgObj } from './config.js';

export const MAJOR_ARCANA = [
    { num:'0', name:'El Loco', emoji:'🃏', key:'Inicio, aventura, fe', img:imgObj('am00.png'), up:'El Loco representa el inicio de un viaje lleno de posibilidades. En amor: nuevas relaciones sin ataduras. Trabajo: proyectos innovadores. Salud: vitalidad renovada. Espiritualmente: confía en el universo.', rv:'Invertido: imprudencia, temor a lo nuevo. Evita riesgos necesarios. En amor: miedo al compromiso. Trabajo: acciones sin planificar. Salud: descuidos.', el:'Aire' },
    { num:'I', name:'El Mago', emoji:'🎩', key:'Voluntad, poder, manifestación', img:imgObj('am01.png'), up:'Tienes todas las herramientas para crear tu realidad. Amor: atracción magnética. Trabajo: éxito emprendedor. Salud: recuperación rápida.', rv:'Invertido: manipulación, falta de dirección. En amor: relaciones tóxicas. Trabajo: mal uso del poder.', el:'Mercurio' },
    { num:'II', name:'La Sacerdotisa', emoji:'🌙', key:'Intuición, misterio', img:imgObj('am02.png'), up:'Confía en tu voz interior. Amor: conexión espiritual. Trabajo: escucha antes de actuar. Salud: sanación emocional.', rv:'Invertida: secretos, bloqueo intuitivo.', el:'Luna' },
    { num:'III', name:'La Emperatriz', emoji:'👑', key:'Fertilidad, abundancia', img:imgObj('am03.png'), up:'Creatividad y nutrición. Amor: embarazo o relación floreciente. Trabajo: proyectos fructíferos. Salud: bienestar físico.', rv:'Invertida: dependencia, falta de creatividad.', el:'Venus' },
    { num:'IV', name:'El Emperador', emoji:'⚔️', key:'Autoridad, estructura', img:imgObj('am04.png'), up:'Estabilidad y liderazgo. Amor: compromiso serio. Trabajo: ascenso. Salud: fortaleza.', rv:'Invertido: tiranía, rigidez.', el:'Aries' },
    { num:'V', name:'El Hierofante', emoji:'✝️', key:'Tradición, guía', img:imgObj('am05.png'), up:'Matrimonio, educación, valores. Amor: boda tradicional. Trabajo: mentoría. Salud: seguimiento médico.', rv:'Invertido: rebeldía, cuestionamiento de normas.', el:'Tauro' },
    { num:'VI', name:'Los Amantes', emoji:'💕', key:'Amor, unión, elección', img:imgObj('am06.png'), up:'Decisiones del corazón. Amor: relación armoniosa. Trabajo: elegir entre opciones. Salud: equilibrio.', rv:'Invertidos: desacuerdos, mala comunicación.', el:'Géminis' },
    { num:'VII', name:'El Carro', emoji:'🏆', key:'Victoria, determinación', img:imgObj('am07.png'), up:'Control y éxito. Amor: superar obstáculos. Trabajo: logros. Salud: fuerza de voluntad.', rv:'Invertido: falta de control, agresividad.', el:'Cáncer' },
    { num:'VIII', name:'La Fuerza', emoji:'🦁', key:'Fortaleza, paciencia', img:imgObj('am08.png'), up:'Coraje interior. Amor: domar pasiones. Trabajo: liderazgo suave. Salud: recuperación.', rv:'Invertida: inseguridad, debilidad.', el:'Leo' },
    { num:'IX', name:'El Ermitaño', emoji:'🏮', key:'Introspección, sabiduría', img:imgObj('am09.png'), up:'Retiro necesario. Amor: tiempo a solas. Trabajo: análisis. Salud: descanso.', rv:'Invertido: aislamiento excesivo.', el:'Virgo' },
    { num:'X', name:'Rueda de la Fortuna', emoji:'☸️', key:'Destino, cambio', img:imgObj('am10.png'), up:'Buena suerte. Amor: giro inesperado. Trabajo: oportunidades. Salud: mejoría.', rv:'Invertida: mala racha, resistirse al cambio.', el:'Júpiter' },
    { num:'XI', name:'La Justicia', emoji:'⚖️', key:'Equilibrio, verdad', img:imgObj('am11.png'), up:'Karma, decisiones justas. Amor: honestidad. Trabajo: resoluciones legales. Salud: balance.', rv:'Invertida: injusticia, mentiras.', el:'Libra' },
    { num:'XII', name:'El Colgado', emoji:'🙃', key:'Sacrificio, perspectiva', img:imgObj('am12.png'), up:'Pausa voluntaria. Amor: dar espacio. Trabajo: esperar. Salud: cambio de hábitos.', rv:'Invertido: estancamiento, resistencia.', el:'Agua' },
    { num:'XIII', name:'La Muerte', emoji:'💀', key:'Transformación, renacimiento', img:imgObj('am13.png'), up:'Fin de un ciclo. Amor: dejar ir. Trabajo: cierre. Salud: renovación.', rv:'Invertida: miedo al cambio.', el:'Escorpio' },
    { num:'XIV', name:'La Templanza', emoji:'🏺', key:'Equilibrio, armonía', img:imgObj('am14.png'), up:'Moderación y paciencia. Amor: relación equilibrada. Trabajo: adaptación. Salud: recuperación.', rv:'Invertida: desequilibrio, extremos.', el:'Sagitario' },
    { num:'XV', name:'El Diablo', emoji:'😈', key:'Ataduras, tentación', img:imgObj('am15.png'), up:'Adicciones, apegos. Amor: dependencia. Trabajo: obsesión por dinero. Salud: excesos.', rv:'Invertido: liberación, romper cadenas.', el:'Capricornio' },
    { num:'XVI', name:'La Torre', emoji:'⚡', key:'Caos, revelación', img:imgObj('am16.png'), up:'Cambio repentino. Amor: ruptura. Trabajo: crisis. Salud: accidente necesario.', rv:'Invertida: evitación del cambio.', el:'Marte' },
    { num:'XVII', name:'La Estrella', emoji:'⭐', key:'Esperanza, sanación', img:imgObj('am17.png'), up:'Optimismo. Amor: nuevas ilusiones. Trabajo: inspiración. Salud: recuperación.', rv:'Invertida: desesperanza.', el:'Acuario' },
    { num:'XVIII', name:'La Luna', emoji:'🌙', key:'Ilusión, subconsciente', img:imgObj('am18.png'), up:'Intuición, sueños. Amor: confusiones. Trabajo: engaños. Salud: ansiedad.', rv:'Invertida: claridad, secretos revelados.', el:'Piscis' },
    { num:'XIX', name:'El Sol', emoji:'☀️', key:'Éxito, alegría', img:imgObj('am19.png'), up:'Felicidad plena. Amor: matrimonio. Trabajo: éxito rotundo. Salud: energía.', rv:'Invertido: éxito retrasado.', el:'Sol' },
    { num:'XX', name:'El Juicio', emoji:'📯', key:'Renacimiento, llamado', img:imgObj('am20.png'), up:'Despertar y revisión. Amor: posibilidad de reconciliación. Trabajo: nueva oportunidad. Bienestar: escucha las señales y busca orientación profesional cuando sea necesario.', rv:'Invertido: autocrítica excesiva.', el:'Fuego' },
    { num:'XXI', name:'El Mundo', emoji:'🌍', key:'Completud, éxito', img:imgObj('am21.png'), up:'Culminación. Amor: unión completa. Trabajo: meta alcanzada. Salud: plenitud.', rv:'Invertido: falta de cierre.', el:'Saturno' }
];

const MINOR_FILENAMES = {
    wands: { 'As':'ameb01.png','2':'ameb02.png','3':'ameb03.png','4':'ameb04.png','5':'ameb05.png','6':'ameb06.png','7':'ameb07.png','8':'ameb08.png','9':'ameb09.png','10':'ameb10.png','Sota':'ameb11.png','Caballero':'ameb12.png','Reina':'ameb13.png','Rey':'ameb14.png' },
    cups: { 'As':'amec01.png','2':'amec02.png','3':'amec03.png','4':'amec04.png','5':'amec05.png','6':'amec06.png','7':'amec07.png','8':'amec08.png','9':'amec09.png','10':'amec10.png','Sota':'amec11.png','Caballero':'amec12.png','Reina':'amec13.png','Rey':'amec14.png' },
    swords: { 'As':'amee01.png','2':'amee02.png','3':'amee03.png','4':'amee04.png','5':'amee05.png','6':'amee06.png','7':'amee07.png','8':'amee08.png','9':'amee09.png','10':'amee10.png','Sota':'amee11.png','Caballero':'amee12.png','Reina':'amee13.png','Rey':'amee14.png' },
    pents: { 'As':'ameo01.png','2':'ameo02.png','3':'ameo03.png','4':'ameo04.png','5':'ameo05.png','6':'ameo06.png','7':'ameo07.png','8':'ameo08.png','9':'ameo09.png','10':'ameo10.png','Sota':'ameo11.png','Caballero':'ameo12.png','Reina':'ameo13.png','Rey':'ameo14.png' }
};

export const MINOR_ARCANA = (() => {
    const suits = { wands: 'Bastos', cups: 'Copas', swords: 'Espadas', pents: 'Pentáculos' };
    const numbers = ['As', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Sota', 'Caballero', 'Reina', 'Rey'];
    const res = [];
    const meanings = {
        wands: {
            As: { up: 'El As de Bastos es la chispa de la creatividad. En amor: nueva pasión, atracción intensa. Trabajo: inicio de un proyecto exitoso. Salud: energía renovada.', rv: 'Invertido: falta de dirección, creatividad bloqueada.' },
            '2': { up: 'Planificación y decisión. Amor: elegir entre dos opciones. Trabajo: sopesar pros y contras.', rv: 'Invertido: miedo a decidir.' },
            '3': { up: 'Expansión y colaboración. Amor: relación que avanza. Trabajo: trabajo en equipo exitoso.', rv: 'Invertido: conflictos de ego.' },
            '4': { up: 'Estabilidad y celebración. Amor: relación segura. Trabajo: logros consolidados.', rv: 'Invertido: estancamiento.' },
            '5': { up: 'Competencia y desafíos. Amor: rivalidad. Trabajo: lucha por el poder.', rv: 'Invertido: conflictos resueltos.' },
            '6': { up: 'Victoria y reconocimiento. Amor: triunfo amoroso. Trabajo: éxito público.', rv: 'Invertido: orgullo herido.' },
            '7': { up: 'Valentía y perseverancia. Amor: superar obstáculos. Trabajo: defensa de tus ideas.', rv: 'Invertido: agotamiento.' },
            '8': { up: 'Movimiento rápido. Amor: cambios repentinos. Trabajo: noticias urgentes.', rv: 'Invertido: retrasos.' },
            '9': { up: 'Resistencia y protección. Amor: defender la relación. Trabajo: enfrentar críticas.', rv: 'Invertido: vulnerabilidad.' },
            '10': { up: 'Carga y responsabilidad. Amor: compromiso pesado. Trabajo: mucho trabajo.', rv: 'Invertido: liberación de cargas.' },
            Sota: { up: 'Mensajero entusiasta. Amor: nuevas ilusiones. Trabajo: aprendiz creativo.', rv: 'Invertido: inmadurez.' },
            Caballero: { up: 'Acción impulsiva. Amor: declaración apasionada. Trabajo: iniciativa.', rv: 'Invertido: impaciencia.' },
            Reina: { up: 'Carisma, confianza y calidez. Amor: vínculo apasionado con apoyo e independencia. Trabajo: creatividad, iniciativa y capacidad para inspirar a otras personas.', rv: 'Invertida: inseguridad, celos, temperamento dominante o necesidad excesiva de aprobación.' },
            Rey: { up: 'Liderazgo visionario, iniciativa y dominio de la energía creativa. Amor: presencia leal, apasionada y protectora. Trabajo: dirección, emprendimiento y decisiones con perspectiva.', rv: 'Invertido: autoritarismo, impulsividad, arrogancia o promesas difíciles de sostener.' }
        },
        cups: {
            As: { up: 'Amor puro y emociones. En amor: nuevo romance. Trabajo: proyecto creativo. Salud: sanación emocional.', rv: 'Invertido: bloqueo emocional.' },
            '2': { up: 'Unión y atracción. Amor: conexión profunda. Trabajo: alianza exitosa.', rv: 'Invertido: desamor.' },
            '3': { up: 'Celebración y amistad. Amor: relaciones armoniosas. Trabajo: éxito en equipo.', rv: 'Invertido: excesos.' },
            '4': { up: 'Apatía emocional. Amor: necesidad de cambio. Trabajo: aburrimiento.', rv: 'Invertido: despertar emocional.' },
            '5': { up: 'Pérdida y duelo. Amor: ruptura. Trabajo: fracaso.', rv: 'Invertido: aceptación.' },
            '6': { up: 'Nostalgia y recuerdos. Amor: reencuentro. Trabajo: clientes antiguos.', rv: 'Invertido: vivir en el pasado.' },
            '7': { up: 'Elección ilusoria. Amor: fantasías. Trabajo: muchas opciones confusas.', rv: 'Invertido: claridad.' },
            '8': { up: 'Abandono y cambio. Amor: dejar ir. Trabajo: renunciar a algo.', rv: 'Invertido: apego.' },
            '9': { up: 'Deseo cumplido. Amor: sueño hecho realidad. Trabajo: ascenso deseado.', rv: 'Invertido: insatisfacción.' },
            '10': { up: 'Felicidad plena. Amor: armonía total. Trabajo: éxito rotundo.', rv: 'Invertido: desarmonía.' },
            Sota: { up: 'Mensajero emocional. Amor: declaración de amor. Trabajo: buena noticia.', rv: 'Invertido: noticias tristes.' },
            Caballero: { up: 'Propuesta romántica. Amor: invitación a salir. Trabajo: oferta tentadora.', rv: 'Invertido: rechazo.' },
            Reina: { up: 'Intuición, sensibilidad y profunda comprensión emocional. Amor: escucha, ternura y conexión afectiva. Trabajo: creatividad, empatía y capacidad de acompañar.', rv: 'Invertida: dependencia emocional, susceptibilidad, idealización o dificultad para poner límites.' },
            Rey: { up: 'Madurez y equilibrio emocional. Amor: afecto estable, comprensión y compromiso sereno. Trabajo: diplomacia, mediación y liderazgo empático.', rv: 'Invertido: frialdad aparente, manipulación emocional, ánimo inestable o sentimientos reprimidos.' }
        },
        swords: {
            As: { up: 'Claridad mental. Amor: comunicación honesta. Trabajo: idea brillante. Bienestar: ordenar dudas y consultar a un profesional cuando corresponda.', rv: 'Invertido: confusión.' },
            '2': { up: 'Indecisión y bloqueo. Amor: no saber qué hacer. Trabajo: estancamiento.', rv: 'Invertido: liberación.' },
            '3': { up: 'Dolor y traición. Amor: desamor. Trabajo: fracaso.', rv: 'Invertido: superación.' },
            '4': { up: 'Descanso y recuperación. Amor: tiempo a solas. Trabajo: pausa necesaria.', rv: 'Invertido: insomnio.' },
            '5': { up: 'Conflicto y derrota. Amor: discusión. Trabajo: competencia desleal.', rv: 'Invertido: reconciliación.' },
            '6': { up: 'Superación y ayuda. Amor: dejar atrás. Trabajo: cambio de ambiente.', rv: 'Invertido: estancamiento.' },
            '7': { up: 'Engaño y astucia. Amor: mentiras. Trabajo: estrategia.', rv: 'Invertido: verdad revelada.' },
            '8': { up: 'Sensación de estar atrapado. Amor: relación asfixiante. Trabajo: bloqueo.', rv: 'Invertido: liberación.' },
            '9': { up: 'Angustia y pesadillas. Amor: preocupación. Trabajo: miedo al fracaso.', rv: 'Invertido: superar miedos.' },
            '10': { up: 'Final doloroso. Amor: ruptura definitiva. Trabajo: fin de ciclo.', rv: 'Invertido: renacer.' },
            Sota: { up: 'Vigilancia y espionaje. Amor: curiosidad. Trabajo: investigación.', rv: 'Invertido: chismes.' },
            Caballero: { up: 'Impulso mental. Amor: declaración racional. Trabajo: ataque verbal.', rv: 'Invertido: ira.' },
            Reina: { up: 'Claridad, independencia y percepción aguda. Amor: sinceridad, límites sanos y comunicación directa. Trabajo: análisis preciso, criterio y decisiones objetivas.', rv: 'Invertida: dureza, resentimiento, crítica destructiva o aislamiento emocional.' },
            Rey: { up: 'Autoridad intelectual, verdad y juicio equilibrado. Amor: comunicación madura y decisiones razonadas. Trabajo: estrategia, liderazgo justo y dominio profesional.', rv: 'Invertido: abuso de autoridad, manipulación, rigidez mental o crueldad verbal.' }
        },
        pents: {
            As: { up: 'Abundancia material. Amor: relación sólida. Trabajo: nueva fuente de ingresos. Salud: bienestar físico.', rv: 'Invertido: pérdida económica.' },
            '2': { up: 'Equilibrio financiero. Amor: dar y recibir. Trabajo: multitarea.', rv: 'Invertido: desorden financiero.' },
            '3': { up: 'Trabajo en equipo. Amor: construir juntos. Trabajo: colaboración.', rv: 'Invertido: falta de cooperación.' },
            '4': { up: 'Apego material. Amor: posesividad. Trabajo: acumular.', rv: 'Invertido: desprendimiento.' },
            '5': { up: 'Pérdida económica. Amor: sentirse desprotegido. Trabajo: crisis.', rv: 'Invertido: recuperación.' },
            '6': { up: 'Generosidad y ayuda. Amor: dar sin esperar. Trabajo: caridad.', rv: 'Invertido: egoísmo.' },
            '7': { up: 'Evaluación de inversión. Amor: pensar en el futuro. Trabajo: planificar.', rv: 'Invertido: impaciencia.' },
            '8': { up: 'Maestría y trabajo. Amor: construir relación. Trabajo: aprendizaje.', rv: 'Invertido: trabajo mal hecho.' },
            '9': { up: 'Autosuficiencia. Amor: independencia económica. Trabajo: éxito solitario.', rv: 'Invertido: soledad.' },
            '10': { up: 'Riqueza y legado. Amor: familia estable. Trabajo: éxito total.', rv: 'Invertido: pérdida de herencia.' },
            Sota: { up: 'Estudiante aplicado. Amor: nuevo interés. Trabajo: prácticas.', rv: 'Invertido: pereza.' },
            Caballero: { up: 'Trabajo duro. Amor: constancia. Trabajo: movimiento laboral.', rv: 'Invertido: vagancia.' },
            Reina: { up: 'Cuidado práctico, abundancia y conexión con la naturaleza. Amor: afecto estable, generosidad y creación de un hogar seguro. Trabajo: buena administración, constancia y prosperidad sostenible.', rv: 'Invertida: descuido personal, dependencia material, sobreprotección o mala organización.' },
            Rey: { up: 'Éxito material, seguridad y dominio de los recursos. Amor: compromiso estable y capacidad de proveer sin perder la cercanía. Trabajo: empresa, inversión y administración responsable.', rv: 'Invertido: codicia, materialismo, terquedad o uso controlador del dinero y la posición.' }
        }
    };
    for (let s in suits) {
        for (let n of numbers) {
            let fileName = MINOR_FILENAMES[s][n];
            if (!fileName) continue;
            let meaning = meanings[s][n] || { up: 'Energía positiva', rv: 'Bloqueos' };
            res.push({
                num: n, name: `${n === 'As' ? 'As' : n} de ${suits[s]}`, suitId: s,
                el: s === 'wands' ? 'Fuego' : s === 'cups' ? 'Agua' : s === 'swords' ? 'Aire' : 'Tierra',
                key: suits[s], emoji: '🃏', img: imgObj(fileName),
                up: meaning.up, rv: meaning.rv
            });
        }
    }
    return res;
})();

export const ALL_TAROT = [...MAJOR_ARCANA, ...MINOR_ARCANA];

export const RUNAS = [
    { sym:'ᚠ', name:'Fehu', img:'img/runes/r01.webp', up:'Fehu: riqueza, prosperidad, abundancia material. Te invita a disfrutar de lo que has cosechado. En el amor: relaciones generosas. En el trabajo: éxito económico.', rv:'Invertida: pérdidas, mala gestión, egoísmo.' },
    { sym:'ᚢ', name:'Uruz', img:'img/runes/r02.webp', up:'Uruz: fuerza vital, salud, poder. Energía bruta para superar obstáculos. En amor: pasión intensa. Trabajo: determinación.', rv:'Invertida: debilidad, agotamiento.' },
    { sym:'ᚦ', name:'Thurisaz', img:'img/runes/r03.webp', up:'Thurisaz: protección, conflicto necesario, defensa. Es la runa del martillo de Thor.', rv:'Invertida: vulnerabilidad, traición.' },
    { sym:'ᚨ', name:'Ansuz', img:'img/runes/r04.webp', up:'Ansuz: comunicación, sabiduría, consejo. Mensajes importantes, aprendizaje.', rv:'Invertida: malentendidos, engaño.' },
    { sym:'ᚱ', name:'Raidho', img:'img/runes/r05.webp', up:'Raidho: viaje, movimiento, evolución. Cambios físicos o de perspectiva.', rv:'Invertida: retrasos, estancamiento.' },
    { sym:'ᚲ', name:'Kenaz', img:'img/runes/r06.webp', up:'Kenaz: conocimiento, creatividad, pasión. Luz que ilumina lo oscuro.', rv:'Invertida: oscuridad, bloqueo creativo.' },
    { sym:'ᚷ', name:'Gebo', img:'img/runes/r07.webp', up:'Gebo: regalo, asociación, generosidad. Equilibrio en el intercambio.', rv:'' },
    { sym:'ᚹ', name:'Wunjo', img:'img/runes/r08.webp', up:'Wunjo: alegría, armonía, bienestar. Felicidad compartida.', rv:'Invertida: tristeza, desarmonía.' },
    { sym:'ᚺ', name:'Hagalaz', img:'img/runes/r09.webp', up:'Hagalaz: cambio disruptivo, caos necesario. Fuerza de la naturaleza.', rv:'' },
    { sym:'ᚾ', name:'Nauthiz', img:'img/runes/r10.webp', up:'Nauthiz: necesidad, resistencia, aprendizaje a través del dolor.', rv:'Invertida: restricciones, victimismo.' },
    { sym:'ᛁ', name:'Isa', img:'img/runes/r11.webp', up:'Isa: inmovilidad, congelamiento, introspección. Todo se detiene.', rv:'' },
    { sym:'ᛃ', name:'Jera', img:'img/runes/r12.webp', up:'Jera: cosecha, resultados, ciclos. Recompensa tras el esfuerzo.', rv:'' },
    { sym:'ᛇ', name:'Eihwaz', img:'img/runes/r13.webp', up:'Eihwaz: resistencia, conexión espiritual, iniciación. Puente entre mundos.', rv:'Invertida: confusión, debilidad.' },
    { sym:'ᛈ', name:'Perthro', img:'img/runes/r14.webp', up:'Perthro: misterio, destino, revelación. Lo desconocido.', rv:'Invertida: secretos, mala suerte.' },
    { sym:'ᛉ', name:'Algiz', img:'img/runes/r15.webp', up:'Algiz: protección, defensa, oportunidad. Escudo contra el mal.', rv:'Invertida: vulnerabilidad, peligro.' },
    { sym:'ᛊ', name:'Sowilo', img:'img/runes/r16.webp', up:'Sowilo: sol, éxito, energía, claridad. Ilumina tu camino.', rv:'' },
    { sym:'ᛏ', name:'Tiwaz', img:'img/runes/r17.webp', up:'Tiwaz: victoria, justicia, sacrificio. Honor y liderazgo.', rv:'Invertida: derrota, injusticia.' },
    { sym:'ᛒ', name:'Berkano', img:'img/runes/r18.webp', up:'Berkano: crecimiento, fertilidad, nuevos comienzos. Runa de la madre tierra.', rv:'Invertida: estancamiento.' },
    { sym:'ᛖ', name:'Ehwaz', img:'img/runes/r19.webp', up:'Ehwaz: progreso, confianza, trabajo en equipo. Movimiento suave.', rv:'Invertida: obstáculos.' },
    { sym:'ᛗ', name:'Mannaz', img:'img/runes/r20.webp', up:'Mannaz: humanidad, comunidad, ayuda mutua. Tu papel en el grupo.', rv:'Invertida: aislamiento, egoísmo.' },
    { sym:'ᛚ', name:'Laguz', img:'img/runes/r21.webp', up:'Laguz: intuición, flujo, sanación emocional. Déjate llevar.', rv:'Invertida: confusión, miedo al cambio.' },
    { sym:'ᛜ', name:'Ingwaz', img:'img/runes/r22.webp', up:'Ingwaz: potencial, gestación, logro. Algo está gestándose.', rv:'' },
    { sym:'ᛞ', name:'Dagaz', img:'img/runes/r23.webp', up:'Dagaz: día, despertar, transformación, esperanza. Cambio hacia la luz.', rv:'' },
    { sym:'ᛟ', name:'Othala', img:'img/runes/r24.webp', up:'Othala: herencia, hogar, tradición. Lo que recibes de tus antepasados.', rv:'Invertida: pérdida, desarraigo.' }
];

export const MOON_PHASES = [
    { sym:'🌑', name:'Luna Nueva', meaning:'Nuevos comienzos. Siembra intenciones.', ritual:'Escribe 10 deseos.', affirmation:'Soy un nuevo comienzo.' },
    { sym:'🌒', name:'Luna Creciente', meaning:'Acción y crecimiento.', ritual:'Visualiza tus metas.', affirmation:'Mis sueños se hacen realidad.' },
    { sym:'🌓', name:'Cuarto Creciente', meaning:'Decisiones y desafíos.', ritual:'Medita frente a un espejo.', affirmation:'Supero cualquier desafío.' },
    { sym:'🌔', name:'Gibosa Creciente', meaning:'Refinamiento.', ritual:'Revisa tu agenda.', affirmation:'Perfecciono mi camino.' },
    { sym:'🌕', name:'Luna Llena', meaning:'Culminación y poder.', ritual:'Carga tus cristales.', affirmation:'Soy poderoso y completo.' },
    { sym:'🌖', name:'Gibosa Menguante', meaning:'Gratitud y entrega.', ritual:'Agradece.', affirmation:'Doy gracias y comparto mi luz.' },
    { sym:'🌗', name:'Cuarto Menguante', meaning:'Liberación y perdón.', ritual:'Quema lo que deseas soltar.', affirmation:'Libero con amor todo lo que me pesa.' },
    { sym:'🌘', name:'Luna Menguante', meaning:'Descanso e integración.', ritual:'Baño de sal marina.', affirmation:'Descanso y me restauro.' }
];


/* ============================================================
   Fase 13A · Contenido de los Arcanos por idioma
   El mazo no se duplica: se enriquece. El nombre y el texto de
   cada carta vienen del catálogo en el idioma activo, con el
   español como respaldo. Aplicar el idioma es reescribir esos
   campos sobre el mismo mazo, no crear otro.
   ============================================================ */
import {
    ARCANOS, contenidoPorIndice, codigoPorIndice, ELEMENTOS,
    ELEMENTOS_TRAD, TENDENCIA_TRAD, cargarIdioma, nombreDeCarta,
    validar as validarArcanos, estadoIdiomas, elementoDe} from './tarot-content.js';

/** El elemento en código, deducido del palo. Los mayores conservan el suyo. */
const ELEMENTO_CODIGO = { B: 'fire', C: 'water', E: 'air', O: 'earth' };

/** Vuelca sobre el mazo el contenido del idioma indicado. */
export function aplicarIdiomaTarot(idioma = 'es') {
    ALL_TAROT.forEach((carta, i) => {
        const codigo = codigoPorIndice(i);
        const c = contenidoPorIndice(i, idioma);
        if (!codigo || !c) return;

        carta.codigo = codigo;
        carta.name = nombreDeCarta(codigo, idioma);
        carta.keywords = c.keywords;
        carta.key = Array.isArray(c.keywords) ? c.keywords.join(', ') : carta.key;
        carta.energy = c.energy;
        carta.advice = c.advice;
        carta.light = c.light;
        carta.shadow = c.shadow;
        carta.uprightMeaning = c.upright;
        carta.reversedMeaning = c.reversed;
        carta.up = c.upright;
        carta.rv = c.reversed;
        carta.love = c.love;
        carta.work = c.work;
        carta.personalGrowth = c.growth;
        carta.yesNo = c.yesNo;
        carta.yesNoLabel = (TENDENCIA_TRAD[idioma] || TENDENCIA_TRAD.es)[c.yesNo] || c.yesNo;
        carta.astrology = c.astrology;

        const cod = elementoDe(codigo);
        if (cod) {
            carta.elemento = cod;
            carta.el = (ELEMENTOS_TRAD[idioma] || ELEMENTOS_TRAD.es)[cod];
        }
    });
}

/* Las 24 runas se traducen en la capa de datos, igual que las cartas:
   asi los doce sitios que las pintan no necesitan enterarse. El nombre
   (Fehu, Uruz...) es un nombre propio y no cambia en ningun idioma.
   Se guarda el texto castellano original para poder volver a el. */
const RUNAS_ES = RUNAS.map(r => ({ up: r.up, rv: r.rv }));

export function aplicarIdiomaRunas(idioma = 'es') {
    const tr = (k) => {
        /* Con el idioma explicito: t() mira el de la interfaz, que aun
           puede no haber cambiado cuando se prepara el contenido. */
        const v = traducirEn(idioma, k);
        return v && v !== k ? v : null;
    };
    RUNAS.forEach((runa, i) => {
        if (idioma === 'es') {
            runa.up = RUNAS_ES[i].up;
            runa.rv = RUNAS_ES[i].rv;
            return;
        }
        runa.up = tr('rn' + i + 'U') || RUNAS_ES[i].up;
        const rv = tr('rn' + i + 'R');
        runa.rv = rv !== null ? rv : RUNAS_ES[i].rv;
    });
}

/** Carga el idioma y lo aplica al mazo y a las runas. */
export async function usarIdiomaTarot(idioma = 'es') {
    await cargarIdioma(idioma);
    aplicarIdiomaTarot(idioma);
    aplicarIdiomaRunas(idioma);
    /* La carga del idioma es asincrona: quien ya haya pintado nombres de
       cartas (la biblioteca de la portada) necesita saber que ya estan
       traducidos para repintar. Sin este aviso se quedaba en castellano. */
    try {
        document.dispatchEvent(new CustomEvent('oraculo:idioma-tarot', { detail: { idioma } }));
    } catch { /* sin DOM no hay nada que avisar */ }
    return idioma;
}

aplicarIdiomaTarot('es');

export { ARCANOS, ELEMENTOS, ELEMENTOS_TRAD, TENDENCIA_TRAD, validarArcanos, estadoIdiomas, nombreDeCarta };
