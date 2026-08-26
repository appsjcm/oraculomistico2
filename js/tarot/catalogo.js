/* ============================================================
   ORÁCULO MÍSTICO · CATÁLOGO DE LOS ARCANOS
   Fase 13A. Une la estructura del mazo con el contenido del
   idioma activo.

   El español se importa siempre porque es el respaldo: si a
   otro idioma le falta una cadena, se sirve la española en su
   lugar y se anota el hueco, en vez de mostrar «undefined».
   Los demás idiomas se cargan solo cuando se piden.
   ============================================================ */

import { CONTENIDO as ES } from './es.js';
import { nombreDeCarta, PALOS, RANGOS, MAYORES } from './nombres.js';

export { nombreDeCarta, PALOS, RANGOS, MAYORES };

const CARGADORES = {
  ca: () => import('./ca.js'),
  en: () => import('./en.js'),
  fr: () => import('./fr.js'),
  de: () => import('./de.js'),
  zh: () => import('./zh.js')
};

const CACHE = { es: ES };
const HUECOS = new Set();

/** Códigos de las 78 cartas, en orden de mazo. */
export const CODIGOS = Object.keys(ES);

export const CAMPOS_TEXTO = ['energy', 'advice', 'upright', 'reversed', 'love', 'work', 'growth', 'astrology'];
export const CAMPOS_LISTA = ['keywords', 'light', 'shadow'];

/** Escala de tendencia, en códigos. La etiqueta la pone la interfaz. */
export const TENDENCIAS = ['yes', 'likely_yes', 'neutral', 'depends', 'likely_no', 'no'];

/** Elementos en código; el nombre visible lo pone la interfaz. */
export const ELEMENTO_DE_PALO = { B: 'fire', C: 'water', E: 'air', O: 'earth' };

/* Los arcanos mayores no pertenecen a ningun palo, pero si tienen
   correspondencia elemental por via astrologica. Sin este mapa el
   elemento de un mayor se quedaba sin traducir al cambiar de idioma. */
export const ELEMENTO_DE_MAYOR = {
  M00: 'air',   M01: 'air',   M02: 'water', M03: 'earth',
  M04: 'fire',  M05: 'earth', M06: 'air',   M07: 'water',
  M08: 'fire',  M09: 'earth', M10: 'fire',  M11: 'air',
  M12: 'water', M13: 'water', M14: 'fire',  M15: 'earth',
  M16: 'fire',  M17: 'air',   M18: 'water', M19: 'fire',
  M20: 'water', M21: 'earth'
};

/* Elemento de cualquier carta, mayor o menor. */
export function elementoDe(codigo) {
  if (!codigo) return null;
  return codigo[0] === 'M' ? (ELEMENTO_DE_MAYOR[codigo] || null) : (ELEMENTO_DE_PALO[codigo[0]] || null);
}

/* Carga el contenido de un idioma. Si no existe o falla, se
   queda con el español y lo dice una sola vez. */
export async function cargarIdioma(idioma = 'es') {
  if (CACHE[idioma]) return CACHE[idioma];
  const cargar = CARGADORES[idioma];
  if (!cargar) return ES;
  try {
    const mod = await cargar();
    CACHE[idioma] = mod.CONTENIDO || {};
    return CACHE[idioma];
  } catch {
    if (!HUECOS.has(idioma)) {
      HUECOS.add(idioma);
      console.info(`[Oráculo] Sin contenido de Tarot en «${idioma}»; se usa el español.`);
    }
    CACHE[idioma] = {};
    return CACHE[idioma];
  }
}

/** Contenido de una carta, campo a campo, con respaldo al español. */
export function contenido(codigo, idioma = 'es') {
  const base = ES[codigo];
  if (!base) return null;
  const propio = (CACHE[idioma] || {})[codigo];
  if (!propio) return { ...base, _idioma: 'es', _completo: idioma === 'es' };

  const salida = {};
  let completo = true;
  [...CAMPOS_TEXTO, ...CAMPOS_LISTA, 'yesNo'].forEach(campo => {
    const v = propio[campo];
    const vacio = v == null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === '');
    if (vacio) {
      salida[campo] = base[campo];
      completo = false;
      const aviso = `${idioma}:${codigo}.${campo}`;
      if (!HUECOS.has(aviso)) { HUECOS.add(aviso); console.info(`[Oráculo] Falta ${aviso}; se usa el español.`); }
    } else {
      salida[campo] = v;
    }
  });
  salida._idioma = idioma;
  salida._completo = completo;
  return salida;
}

/** Qué idiomas tienen contenido cargado y cuánto les falta. */
export function estadoIdiomas() {
  const salida = {};
  ['es', ...Object.keys(CARGADORES)].forEach(l => {
    const d = CACHE[l];
    salida[l] = d ? { cargado: true, cartas: Object.keys(d).length } : { cargado: false, cartas: 0 };
  });
  return salida;
}

export const huecosDetectados = () => [...HUECOS];
