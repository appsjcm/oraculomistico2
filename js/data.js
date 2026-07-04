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
    wands: { 'As':'ameb01.png','2':'ameb02.png','3':'ameb03.png','4':'ameb04.png','5':'ameb05.png','6':'ameb06.png','7':'ameb07.png','8':'ameb08.png','9':'ameb09.png','10':'ameb10.png','Sota':'ameb11.png','Caballero':'ameb12.png','Reina':'ameb14.png','Rey':'ameb13.png' },
    cups: { 'As':'amec01.png','2':'amec02.png','3':'amec03.png','4':'amec04.png','5':'amec05.png','6':'amec06.png','7':'amec07.png','8':'amec08.png','9':'amec09.png','10':'amec10.png','Sota':'amec11.png','Caballero':'amec12.png','Reina':'amec14.png','Rey':'amec13.png' },
    swords: { 'As':'amee01.png','2':'amee02.png','3':'amee03.png','4':'amee04.png','5':'amee05.png','6':'amee06.png','7':'amee07.png','8':'amee08.png','9':'amee09.png','10':'amee10.png','Sota':'amee11.png','Caballero':'amee12.png','Reina':'amee14.png','Rey':'amee13.png' },
    pents: { 'As':'ameo01.png','2':'ameo02.png','3':'ameo03.png','4':'ameo04.png','5':'ameo05.png','6':'ameo06.png','7':'ameo07.png','8':'ameo08.png','9':'ameo09.png','10':'ameo10.png','Sota':'ameo11.png','Caballero':'ameo12.png','Reina':'ameo14.png','Rey':'ameo13.png' }
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
    { sym:'ᚠ', name:'Fehu', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Runic_letter_fehu_feoh_fe_f.svg/200px-Runic_letter_fehu_feoh_fe_f.svg.png', up:'Fehu: riqueza, prosperidad, abundancia material. Te invita a disfrutar de lo que has cosechado. En el amor: relaciones generosas. En el trabajo: éxito económico.', rv:'Invertida: pérdidas, mala gestión, egoísmo.' },
    { sym:'ᚢ', name:'Uruz', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Runic_letter_uruz_ur_u.svg/200px-Runic_letter_uruz_ur_u.svg.png', up:'Uruz: fuerza vital, salud, poder. Energía bruta para superar obstáculos. En amor: pasión intensa. Trabajo: determinación.', rv:'Invertida: debilidad, agotamiento.' },
    { sym:'ᚦ', name:'Thurisaz', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Runic_letter_thurisaz_thurs_thorn.svg/200px-Runic_letter_thurisaz_thurs_thorn.svg.png', up:'Thurisaz: protección, conflicto necesario, defensa. Es la runa del martillo de Thor.', rv:'Invertida: vulnerabilidad, traición.' },
    { sym:'ᚨ', name:'Ansuz', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Runic_letter_ansuz_aesc_a.svg/200px-Runic_letter_ansuz_aesc_a.svg.png', up:'Ansuz: comunicación, sabiduría, consejo. Mensajes importantes, aprendizaje.', rv:'Invertida: malentendidos, engaño.' },
    { sym:'ᚱ', name:'Raidho', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Runic_letter_raido_rad_reid_r.svg/200px-Runic_letter_raido_rad_reid_r.svg.png', up:'Raidho: viaje, movimiento, evolución. Cambios físicos o de perspectiva.', rv:'Invertida: retrasos, estancamiento.' },
    { sym:'ᚲ', name:'Kenaz', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Runic_letter_kaun_k.svg/200px-Runic_letter_kaun_k.svg.png', up:'Kenaz: conocimiento, creatividad, pasión. Luz que ilumina lo oscuro.', rv:'Invertida: oscuridad, bloqueo creativo.' },
    { sym:'ᚷ', name:'Gebo', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Runic_letter_gebo_gyfu_g.svg/200px-Runic_letter_gebo_gyfu_g.svg.png', up:'Gebo: regalo, asociación, generosidad. Equilibrio en el intercambio.', rv:'' },
    { sym:'ᚹ', name:'Wunjo', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Runic_letter_wunjo_wynn_w.svg/200px-Runic_letter_wunjo_wynn_w.svg.png', up:'Wunjo: alegría, armonía, bienestar. Felicidad compartida.', rv:'Invertida: tristeza, desarmonía.' },
    { sym:'ᚺ', name:'Hagalaz', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Runic_letter_hagalaz_haegl_h.svg/200px-Runic_letter_hagalaz_haegl_h.svg.png', up:'Hagalaz: cambio disruptivo, caos necesario. Fuerza de la naturaleza.', rv:'' },
    { sym:'ᚾ', name:'Nauthiz', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Runic_letter_naudiz_nyd_naud_n.svg/200px-Runic_letter_naudiz_nyd_naud_n.svg.png', up:'Nauthiz: necesidad, resistencia, aprendizaje a través del dolor.', rv:'Invertida: restricciones, victimismo.' },
    { sym:'ᛁ', name:'Isa', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Runic_letter_isaz_is_iss_i.svg/200px-Runic_letter_isaz_is_iss_i.svg.png', up:'Isa: inmovilidad, congelamiento, introspección. Todo se detiene.', rv:'' },
    { sym:'ᛃ', name:'Jera', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Runic_letter_jera_j.svg/200px-Runic_letter_jera_j.svg.png', up:'Jera: cosecha, resultados, ciclos. Recompensa tras el esfuerzo.', rv:'' },
    { sym:'ᛇ', name:'Eihwaz', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Runic_letter_iwaz_eoh.svg/200px-Runic_letter_iwaz_eoh.svg.png', up:'Eihwaz: resistencia, conexión espiritual, iniciación. Puente entre mundos.', rv:'Invertida: confusión, debilidad.' },
    { sym:'ᛈ', name:'Perthro', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Runic_letter_pertho_peorth_p.svg/200px-Runic_letter_pertho_peorth_p.svg.png', up:'Perthro: misterio, destino, revelación. Lo desconocido.', rv:'Invertida: secretos, mala suerte.' },
    { sym:'ᛉ', name:'Algiz', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Runic_letter_algiz.svg/200px-Runic_letter_algiz.svg.png', up:'Algiz: protección, defensa, oportunidad. Escudo contra el mal.', rv:'Invertida: vulnerabilidad, peligro.' },
    { sym:'ᛊ', name:'Sowilo', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Runic_letter_sowilo_s.svg/200px-Runic_letter_sowilo_s.svg.png', up:'Sowilo: sol, éxito, energía, claridad. Ilumina tu camino.', rv:'' },
    { sym:'ᛏ', name:'Tiwaz', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Runic_letter_tiwaz_tir_tyr_t.svg/200px-Runic_letter_tiwaz_tir_tyr_t.svg.png', up:'Tiwaz: victoria, justicia, sacrificio. Honor y liderazgo.', rv:'Invertida: derrota, injusticia.' },
    { sym:'ᛒ', name:'Berkano', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Runic_letter_berkanan_beorc_bjarkan_b.svg/200px-Runic_letter_berkanan_beorc_bjarkan_b.svg.png', up:'Berkano: crecimiento, fertilidad, nuevos comienzos. Runa de la madre tierra.', rv:'Invertida: estancamiento.' },
    { sym:'ᛖ', name:'Ehwaz', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Runic_letter_ehwaz_eh_e.svg/200px-Runic_letter_ehwaz_eh_e.svg.png', up:'Ehwaz: progreso, confianza, trabajo en equipo. Movimiento suave.', rv:'Invertida: obstáculos.' },
    { sym:'ᛗ', name:'Mannaz', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Runic_letter_mannaz_man_m.svg/200px-Runic_letter_mannaz_man_m.svg.png', up:'Mannaz: humanidad, comunidad, ayuda mutua. Tu papel en el grupo.', rv:'Invertida: aislamiento, egoísmo.' },
    { sym:'ᛚ', name:'Laguz', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Runic_letter_laukaz_lagu_logr_l.svg/200px-Runic_letter_laukaz_lagu_logr_l.svg.png', up:'Laguz: intuición, flujo, sanación emocional. Déjate llevar.', rv:'Invertida: confusión, miedo al cambio.' },
    { sym:'ᛜ', name:'Ingwaz', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Runic_letter_ingwaz.svg/200px-Runic_letter_ingwaz.svg.png', up:'Ingwaz: potencial, gestación, logro. Algo está gestándose.', rv:'' },
    { sym:'ᛞ', name:'Dagaz', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Runic_letter_dagaz_daeg_d.svg/200px-Runic_letter_dagaz_daeg_d.svg.png', up:'Dagaz: día, despertar, transformación, esperanza. Cambio hacia la luz.', rv:'' },
    { sym:'ᛟ', name:'Othala', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Runic_letter_othalan_ethel_o.svg/200px-Runic_letter_othalan_ethel_o.svg.png', up:'Othala: herencia, hogar, tradición. Lo que recibes de tus antepasados.', rv:'Invertida: pérdida, desarraigo.' }
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
