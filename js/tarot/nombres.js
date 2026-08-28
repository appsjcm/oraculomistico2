/* ============================================================
   ORÁCULO MÍSTICO · NOMBRES DE LOS ARCANOS
   Fase 13A. Los nombres estaban fijos en español dentro de
   data.js. Aquí viven los seis idiomas, con la terminología
   habitual del Tarot en cada uno.

   Los 22 mayores se nombran uno a uno. Los 56 menores se
   componen: rango + conector + palo, porque cada lengua ordena
   esas piezas a su manera.
   ============================================================ */

export const PALOS = {
  es: { B: 'Bastos',  C: 'Copas',  E: 'Espadas', O: 'Oros' },
  ca: { B: 'Bastons', C: 'Copes',  E: 'Espases', O: 'Ors' },
  en: { B: 'Wands',   C: 'Cups',   E: 'Swords',  O: 'Pentacles' },
  fr: { B: 'Bâtons',  C: 'Coupes', E: 'Épées',   O: 'Deniers' },
  de: { B: 'Stäbe',   C: 'Kelche', E: 'Schwerter', O: 'Münzen' },
  zh: { B: '权杖',     C: '圣杯',    E: '宝剑',      O: '星币' }
};

/* Rangos 1-14. La posición 11 es la Sota, 12 el Caballero,
   13 la Reina y 14 el Rey: el mismo orden en los seis idiomas. */
export const RANGOS = {
  es: ['As','Dos','Tres','Cuatro','Cinco','Seis','Siete','Ocho','Nueve','Diez','Sota','Caballero','Reina','Rey'],
  ca: ['As','Dos','Tres','Quatre','Cinc','Sis','Set','Vuit','Nou','Deu','Sota','Cavaller','Reina','Rei'],
  en: ['Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Page','Knight','Queen','King'],
  fr: ['As','Deux','Trois','Quatre','Cinq','Six','Sept','Huit','Neuf','Dix','Valet','Cavalier','Reine','Roi'],
  de: ['Ass','Zwei','Drei','Vier','Fünf','Sechs','Sieben','Acht','Neun','Zehn','Bube','Ritter','Königin','König'],
  zh: ['王牌','二','三','四','五','六','七','八','九','十','侍者','骑士','王后','国王']
};

/* Cómo se une el rango con el palo en cada lengua. */
/* Catala i frances eliden la preposicio davant de vocal: "Rei d'Ors",
   no "Rei de Ors". Sense aixo els noms sortien mal escrits. */
const VOCAL = /^[aeiouàáâãäèéêëìíîïòóôõöùúûüAEIOUÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜ]/;
const elidir = (r, p) => VOCAL.test(p) ? `${r} d’${p}` : `${r} de ${p}`;

const UNION = {
  es: (r, p) => `${r} de ${p}`,
  ca: elidir,
  en: (r, p) => `${r} of ${p}`,
  fr: elidir,
  de: (r, p) => `${r} der ${p}`,
  zh: (r, p) => `${p}${r}`
};

export const MAYORES = {
  es: ['El Loco','El Mago','La Sacerdotisa','La Emperatriz','El Emperador','El Hierofante','Los Enamorados','El Carro','La Fuerza','El Ermitaño','La Rueda de la Fortuna','La Justicia','El Colgado','La Muerte','La Templanza','El Diablo','La Torre','La Estrella','La Luna','El Sol','El Juicio','El Mundo'],
  ca: ['El Boig','El Mag','La Sacerdotessa','L\u2019Emperadriu','L\u2019Emperador','El Hierofant','Els Enamorats','El Carro','La Força','L\u2019Ermità','La Roda de la Fortuna','La Justícia','El Penjat','La Mort','La Temprança','El Diable','La Torre','L\u2019Estrella','La Lluna','El Sol','El Judici','El Món'],
  en: ['The Fool','The Magician','The High Priestess','The Empress','The Emperor','The Hierophant','The Lovers','The Chariot','Strength','The Hermit','Wheel of Fortune','Justice','The Hanged Man','Death','Temperance','The Devil','The Tower','The Star','The Moon','The Sun','Judgement','The World'],
  fr: ['Le Mat','Le Bateleur','La Papesse','L\u2019Impératrice','L\u2019Empereur','Le Pape','Les Amoureux','Le Chariot','La Force','L\u2019Ermite','La Roue de Fortune','La Justice','Le Pendu','La Mort','Tempérance','Le Diable','La Tour','L\u2019Étoile','La Lune','Le Soleil','Le Jugement','Le Monde'],
  de: ['Der Narr','Der Magier','Die Hohepriesterin','Die Herrscherin','Der Herrscher','Der Hierophant','Die Liebenden','Der Wagen','Die Kraft','Der Eremit','Das Rad des Schicksals','Die Gerechtigkeit','Der Gehängte','Der Tod','Die Mäßigkeit','Der Teufel','Der Turm','Der Stern','Der Mond','Die Sonne','Das Gericht','Die Welt'],
  zh: ['愚者','魔术师','女祭司','皇后','皇帝','教皇','恋人','战车','力量','隐士','命运之轮','正义','倒吊人','死神','节制','恶魔','高塔','星星','月亮','太阳','审判','世界']
};

/** Nombre de una carta por su código, en el idioma pedido. */
export function nombreDeCarta(codigo, idioma = 'es') {
  const L = MAYORES[idioma] ? idioma : 'es';
  const letra = codigo[0];
  const n = Number(codigo.slice(1));
  if (letra === 'M') return MAYORES[L][n] || MAYORES.es[n] || codigo;
  const rango = (RANGOS[L] || RANGOS.es)[n - 1];
  const palo = (PALOS[L] || PALOS.es)[letra];
  if (!rango || !palo) return codigo;
  return (UNION[L] || UNION.es)(rango, palo);
}

/* Indice inverso: de nombre a codigo, en los seis idiomas a la vez.
   Hace falta porque una entrada guardada conserva el nombre en el
   idioma en que se creo, y el Grimorio puede leerse en otro. */
let INDICE = null;
function construirIndice() {
  const m = new Map();
  const codigos = [];
  for (let i = 0; i <= 21; i++) codigos.push('M' + String(i).padStart(2, '0'));
  for (const p of ['B', 'C', 'E', 'O']) for (let i = 1; i <= 14; i++) codigos.push(p + String(i).padStart(2, '0'));
  for (const idioma of Object.keys(MAYORES)) {
    for (const c of codigos) {
      const n = nombreDeCarta(c, idioma);
      if (n && n !== c) m.set(normalizar(n), c);
    }
  }
  return m;
}
function normalizar(s) {
  /* Els apostrofs recte i corb son el mateix caracter per a qui
     escriu: una entrada antiga pot portar qualsevol dels dos. */
  return String(s).normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019\u02bc\u0060\u00b4\u0027]/g, "'")
    .toLowerCase().replace(/\s+/g, ' ').trim();
}
/** Codigo de una carta a partir de su nombre en cualquier idioma. */
export function codigoPorNombre(nombre) {
  if (!nombre) return null;
  if (!INDICE) INDICE = construirIndice();
  return INDICE.get(normalizar(nombre)) || null;
}
/** ¿Es un arcano mayor? Antes se miraba si el nombre llevaba " de ",
    lo que fallaba en cuanto la app dejaba de estar en espanol. */
export function esArcanoMayor(nombre) {
  const c = codigoPorNombre(nombre);
  return c ? c[0] === 'M' : false;
}
