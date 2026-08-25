/* Mazo propio en alta resolución (1086px de origen), alojado en este repositorio.
   Cada carta se sirve en dos tamaños WebP: `img/deck/` (700px) para modales,
   tiradas y exportación a PDF, y `img/deck/thumb/` (420px) para rejillas.
   Las claves conservan los nombres históricos para no tocar data.js. */
export const DECK_DIR = 'img/deck/';
export const DECK_THUMB_DIR = 'img/deck/thumb/';
export const RUNE_DIR = 'img/runes/';
export const RUNE_THUMB_DIR = 'img/runes/thumb/';

export const CARD_IMAGES = {
    'am00.png': 'img/deck/am00.webp',
    'am01.png': 'img/deck/am01.webp',
    'am02.png': 'img/deck/am02.webp',
    'am03.png': 'img/deck/am03.webp',
    'am04.png': 'img/deck/am04.webp',
    'am05.png': 'img/deck/am05.webp',
    'am06.png': 'img/deck/am06.webp',
    'am07.png': 'img/deck/am07.webp',
    'am08.png': 'img/deck/am08.webp',
    'am09.png': 'img/deck/am09.webp',
    'am10.png': 'img/deck/am10.webp',
    'am11.png': 'img/deck/am11.webp',
    'am12.png': 'img/deck/am12.webp',
    'am13.png': 'img/deck/am13.webp',
    'am14.png': 'img/deck/am14.webp',
    'am15.png': 'img/deck/am15.webp',
    'am16.png': 'img/deck/am16.webp',
    'am17.png': 'img/deck/am17.webp',
    'am18.png': 'img/deck/am18.webp',
    'am19.png': 'img/deck/am19.webp',
    'am20.png': 'img/deck/am20.webp',
    'am21.png': 'img/deck/am21.webp',
    'ameb01.png': 'img/deck/ameb01.webp',
    'ameb02.png': 'img/deck/ameb02.webp',
    'ameb03.png': 'img/deck/ameb03.webp',
    'ameb04.png': 'img/deck/ameb04.webp',
    'ameb05.png': 'img/deck/ameb05.webp',
    'ameb06.png': 'img/deck/ameb06.webp',
    'ameb07.png': 'img/deck/ameb07.webp',
    'ameb08.png': 'img/deck/ameb08.webp',
    'ameb09.png': 'img/deck/ameb09.webp',
    'ameb10.png': 'img/deck/ameb10.webp',
    'ameb11.png': 'img/deck/ameb11.webp',
    'ameb12.png': 'img/deck/ameb12.webp',
    'ameb13.png': 'img/deck/ameb13.webp',
    'ameb14.png': 'img/deck/ameb14.webp',
    'amec01.png': 'img/deck/amec01.webp',
    'amec02.png': 'img/deck/amec02.webp',
    'amec03.png': 'img/deck/amec03.webp',
    'amec04.png': 'img/deck/amec04.webp',
    'amec05.png': 'img/deck/amec05.webp',
    'amec06.png': 'img/deck/amec06.webp',
    'amec07.png': 'img/deck/amec07.webp',
    'amec08.png': 'img/deck/amec08.webp',
    'amec09.png': 'img/deck/amec09.webp',
    'amec10.png': 'img/deck/amec10.webp',
    'amec11.png': 'img/deck/amec11.webp',
    'amec12.png': 'img/deck/amec12.webp',
    'amec13.png': 'img/deck/amec13.webp',
    'amec14.png': 'img/deck/amec14.webp',
    'amee01.png': 'img/deck/amee01.webp',
    'amee02.png': 'img/deck/amee02.webp',
    'amee03.png': 'img/deck/amee03.webp',
    'amee04.png': 'img/deck/amee04.webp',
    'amee05.png': 'img/deck/amee05.webp',
    'amee06.png': 'img/deck/amee06.webp',
    'amee07.png': 'img/deck/amee07.webp',
    'amee08.png': 'img/deck/amee08.webp',
    'amee09.png': 'img/deck/amee09.webp',
    'amee10.png': 'img/deck/amee10.webp',
    'amee11.png': 'img/deck/amee11.webp',
    'amee12.png': 'img/deck/amee12.webp',
    'amee13.png': 'img/deck/amee13.webp',
    'amee14.png': 'img/deck/amee14.webp',
    'ameo01.png': 'img/deck/ameo01.webp',
    'ameo02.png': 'img/deck/ameo02.webp',
    'ameo03.png': 'img/deck/ameo03.webp',
    'ameo04.png': 'img/deck/ameo04.webp',
    'ameo05.png': 'img/deck/ameo05.webp',
    'ameo06.png': 'img/deck/ameo06.webp',
    'ameo07.png': 'img/deck/ameo07.webp',
    'ameo08.png': 'img/deck/ameo08.webp',
    'ameo09.png': 'img/deck/ameo09.webp',
    'ameo10.png': 'img/deck/ameo10.webp',
    'ameo11.png': 'img/deck/ameo11.webp',
    'ameo12.png': 'img/deck/ameo12.webp',
    'ameo13.png': 'img/deck/ameo13.webp',
    'ameo14.png': 'img/deck/ameo14.webp',
};

export function getCardImageUrl(fileName) { return CARD_IMAGES[fileName] || ''; }
export function imgObj(fileName) { return getCardImageUrl(fileName); }
export function getImgSrc(card) { return typeof card.img === 'string' ? card.img : ''; }

/** Versión ligera de una carta o runa para rejillas; deja intacto lo demás. */
export function thumbFor(url = '') {
    if (!url || url.includes('/thumb/')) return url;
    if (url.startsWith(DECK_DIR)) return url.replace(DECK_DIR, DECK_THUMB_DIR);
    if (url.startsWith(RUNE_DIR)) return url.replace(RUNE_DIR, RUNE_THUMB_DIR);
    return url;
}
