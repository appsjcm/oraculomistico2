/* ============================================================
   ORÁCULO MÍSTICO · ARCANOS · PUENTE
   Fase 13A. El contenido se ha repartido por idiomas dentro de
   js/tarot/. Este archivo se conserva porque data.js y el resto
   del proyecto ya lo importaban: mantiene la misma superficie
   pública y evita tocar lo que funcionaba.
   ============================================================ */

import {
  CODIGOS, TENDENCIAS, ELEMENTO_DE_PALO, elementoDe,
  cargarIdioma, contenido, estadoIdiomas, huecosDetectados,
  nombreDeCarta, PALOS, RANGOS, MAYORES
} from './tarot/catalogo.js';
import { CONTENIDO as ES } from './tarot/es.js';

export { CODIGOS, TENDENCIAS, ELEMENTO_DE_PALO, elementoDe, cargarIdioma, contenido, estadoIdiomas, huecosDetectados, nombreDeCarta, PALOS, RANGOS, MAYORES };

/** Compatibilidad: el catálogo español, como estaba. */
export const ARCANOS = ES;

/** Nombres visibles de los elementos, por idioma. */
export const ELEMENTOS_TRAD = {
  es: { fire: 'Fuego', water: 'Agua', air: 'Aire', earth: 'Tierra' },
  ca: { fire: 'Foc',   water: 'Aigua', air: 'Aire', earth: 'Terra' },
  en: { fire: 'Fire',  water: 'Water', air: 'Air',  earth: 'Earth' },
  fr: { fire: 'Feu',   water: 'Eau',   air: 'Air',  earth: 'Terre' },
  de: { fire: 'Feuer', water: 'Wasser', air: 'Luft', earth: 'Erde' },
  zh: { fire: '火',     water: '水',     air: '风',    earth: '土' }
};

/** Etiquetas de la escala de tendencia, por idioma. */
export const TENDENCIA_TRAD = {
  es: { yes:'Sí', likely_yes:'Probablemente sí', neutral:'Neutral', depends:'Depende', likely_no:'Probablemente no', no:'No' },
  ca: { yes:'Sí', likely_yes:'Probablement sí', neutral:'Neutral', depends:'Depèn', likely_no:'Probablement no', no:'No' },
  en: { yes:'Yes', likely_yes:'Probably yes', neutral:'Neutral', depends:'It depends', likely_no:'Probably not', no:'No' },
  fr: { yes:'Oui', likely_yes:'Probablement oui', neutral:'Neutre', depends:'Cela dépend', likely_no:'Probablement pas', no:'Non' },
  de: { yes:'Ja', likely_yes:'Wahrscheinlich ja', neutral:'Neutral', depends:'Es kommt darauf an', likely_no:'Wahrscheinlich nicht', no:'Nein' },
  zh: { yes:'是', likely_yes:'多半是', neutral:'中性', depends:'视情况而定', likely_no:'多半不是', no:'否' }
};

export const ELEMENTOS = { B: 'Fuego', C: 'Agua', E: 'Aire', O: 'Tierra' };

const BASE_PALO = { M: 0, B: 22, C: 36, E: 50, O: 64 };

/** Código de carta a partir de su posición en el mazo. */
export function codigoPorIndice(i) {
  if (i < 22) return 'M' + String(i).padStart(2, '0');
  for (const [letra, base] of Object.entries(BASE_PALO)) {
    if (letra === 'M') continue;
    if (i >= base && i < base + 14) return letra + String(i - base + 1).padStart(2, '0');
  }
  return null;
}

/** Contenido de una carta por su posición, en el idioma pedido. */
export function contenidoPorIndice(i, idioma = 'es') {
  const codigo = codigoPorIndice(i);
  return codigo ? contenido(codigo, idioma) : null;
}

/* ============================================================
   VALIDACIÓN
   Silenciosa para quien usa la app; se consulta desde la
   consola con OraculoArcanos.validar(). Comprueba el español
   siempre, y cada idioma cargado por separado.
   ============================================================ */
const CAMPOS = ['energy', 'advice', 'upright', 'reversed', 'love', 'work', 'growth', 'yesNo', 'astrology'];

function revisarCatalogo(datos, etiqueta, exigirTodo = true) {
  const fallos = [];
  const codigos = Object.keys(datos);
  if (exigirTodo && codigos.length !== 78) fallos.push(`${etiqueta}: ${codigos.length} cartas en vez de 78.`);
  if (new Set(codigos).size !== codigos.length) fallos.push(`${etiqueta}: hay códigos repetidos.`);

  codigos.forEach(c => {
    const a = datos[c];
    if (!Array.isArray(a.keywords) || a.keywords.length !== 3) fallos.push(`${etiqueta}/${c}: deben ser exactamente 3 conceptos clave.`);
    if (!Array.isArray(a.light) || a.light.length !== 3) fallos.push(`${etiqueta}/${c}: deben ser exactamente 3 aspectos de luz.`);
    if (!Array.isArray(a.shadow) || a.shadow.length !== 3) fallos.push(`${etiqueta}/${c}: deben ser exactamente 3 aspectos de sombra.`);
    CAMPOS.forEach(f => { if (!a[f] || !String(a[f]).trim()) fallos.push(`${etiqueta}/${c}: falta ${f}.`); });
    if (a.yesNo && !TENDENCIAS.includes(a.yesNo)) fallos.push(`${etiqueta}/${c}: tendencia no admitida («${a.yesNo}»).`);
  });

  if (exigirTodo) {
    ['B', 'C', 'E', 'O'].forEach(p => {
      const delPalo = codigos.filter(c => c.startsWith(p));
      if (delPalo.length !== 14) fallos.push(`${etiqueta}: el palo ${p} tiene ${delPalo.length} cartas en vez de 14.`);
      ['11', '12', '13', '14'].forEach(n => {
        if (!datos[p + n]) fallos.push(`${etiqueta}: falta la figura ${p}${n}.`);
      });
    });
  }
  return fallos;
}

export function validar(mazo = [], idiomas = ['es']) {
  const fallos = revisarCatalogo(ES, 'es');
  const porIdioma = { es: { cartas: Object.keys(ES).length, completo: true, faltan: [] } };

  /* Reina y Rey en su sitio. La comprobación existe porque en una
     versión anterior estuvieron intercambiados. */
  if (Array.isArray(mazo) && mazo.length === 78) {
    ['B', 'C', 'E', 'O'].forEach(p => {
      const base = BASE_PALO[p];
      const reina = mazo[base + 12], rey = mazo[base + 13];
      if (reina && !/reina|queen|königin|reine|王后/i.test(reina.name)) fallos.push(`Palo ${p}: la posición 13 debería ser la Reina y es «${reina.name}».`);
      if (rey && !/rey|king|könig|roi|国王/i.test(rey.name)) fallos.push(`Palo ${p}: la posición 14 debería ser el Rey y es «${rey.name}».`);
    });
    mazo.forEach((carta, i) => {
      if (!contenidoPorIndice(i)) fallos.push(`Sin contenido para la carta ${i} («${carta?.name}»).`);
    });
  }

  /* Cada idioma cargado, por separado. Un idioma incompleto no es
     un fallo del sistema: es contenido pendiente, y se dice. */
  const estado = estadoIdiomas();
  idiomas.filter(l => l !== 'es').forEach(l => {
    const cargado = estado[l];
    if (!cargado?.cargado || !cargado.cartas) {
      porIdioma[l] = { cartas: 0, completo: false, faltan: ['todo el contenido'] };
      return;
    }
    porIdioma[l] = { cartas: cargado.cartas, completo: cargado.cartas === 78, faltan: cargado.cartas === 78 ? [] : [`${78 - cargado.cartas} cartas`] };
  });

  /* Nombres: los seis idiomas deben nombrar las 78. */
  ['es','ca','en','fr','de','zh'].forEach(l => {
    CODIGOS.forEach(c => {
      const n = nombreDeCarta(c, l);
      if (!n || n === c) fallos.push(`Nombre ausente: ${c} en «${l}».`);
    });
  });

  return { ok: fallos.length === 0, total: Object.keys(ES).length, fallos, porIdioma, huecos: huecosDetectados().length };
}
