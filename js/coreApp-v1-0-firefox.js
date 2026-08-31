import { ALL_TAROT, MAJOR_ARCANA, MINOR_ARCANA, RUNAS, MOON_PHASES, ARCANOS, ELEMENTOS, validarArcanos, usarIdiomaTarot, estadoIdiomas, TENDENCIA_TRAD } from './data.js';
import { codigoPorNombre, esArcanoMayor } from './tarot-content.js';
import { thumbFor } from './config.js';
import { applyAppTranslations, getAppLanguage, getAppLanguagePreference, getAppLocale, languageOptionsHTML, setAppLanguage, t } from './i18n.js';

document.documentElement.dataset.oraculoModule = 'loaded';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const LS = {
  name: 'oraculo.userName',
  guide: 'oraculo.guideSeen.v2',
  diary: 'oraculo.diary.v2',
  puter: 'puterConnected',
  intention: 'oraculo.intention',
  prefs: 'oraculo.prefs',
  voice: 'oraculo.voicePrefs',
  aiStyle: 'oraculo.aiStyle',
  chat: 'oraculo.chatRitual.v1',
  profile: 'oraculo.profile.v1',
  theme: 'oraculo.theme.v1',
  appearanceMode: 'oraculo.appearanceMode.v1',
  privateMode: 'oraculo.privateMode.v1',
  achievements: 'oraculo.achievements.v1',
  dailyJournal: 'oraculo.dailyJournal.v1',
  pdfStyle: 'oraculo.pdfStyle.v1',
  focusMode: 'oraculo.focusMode.v1',
  errorLog: 'oraculo.errorLog.v1',
  migration: 'oraculo.migrationVersion.v1',
  performanceMode: 'oraculo.performanceMode.v1',
  birthDate: 'oraculo.birthDate.v1',
  birthTime: 'oraculo.birthTime.v1',
  birthPlace: 'oraculo.birthPlace.v1',
  astroHouseSystem: 'oraculo.astroHouseSystem.v1',
  effects3d: 'oraculo.3d.preference.v14'
};

let lastReading = null;
let grabovoiEntries = [];
let grabovoiGuide = { digitMeanings: {}, methods: [] };
let oracleLipTimer = null;
let oracleLipWordStart = -1;
let oracleAvatarHideTimer = null;
let oracleProsodyTimer = null;
let voiceWakeLock = null;
let activeSpeech = { text: '', charIndex: 0, active: false, interrupted: false };
let voiceSpeechSession = 0;
let remoteSpeechAudio = null;
let lastGeneratedSpeech = null;
let cachedWebVoices = [];
let astroCitiesCache = null;
let astroCityMatches = [];

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
}
function cleanInterpretation(value = '') {
  return String(value || '')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/`{1,3}/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
function cleanClosedReading(value = '') {
  return cleanInterpretation(value)
    .replace(/¿[^?\n]*\?/g, '')
    .replace(/(^|[\n.!])\s*(?:qué|que|cómo|como|cuál|cual|cuándo|cuando|dónde|donde|por qué|por que|quieres|puedes|podrías|podrias|te gustaría|te gustaria)[^?\n]*\?/gim, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n[ \t]+\n/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
function sample(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
const REVERSED_RATE_OPTIONS = [0.2, 0.3, 0.5];
function chooseReversedRate() { return sample(REVERSED_RATE_OPTIONS); }
function isReversed(rate) { return Math.random() < Math.min(0.5, Math.max(0, Number(rate) || 0)); }
function reversalRateNotice(rate) { return `<p class="notice reversal-rate-note">${escapeHTML(t('reversalRate', { rate:Math.round(rate * 100) }))}</p>`; }
function clampText(text, max = 280) { text = String(text || ''); return text.length > max ? text.slice(0, max - 1) + '…' : text; }
function todayKey() { return new Date().toISOString().slice(0, 10); }
function storeGet(key, fallback = null) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
function storeSet(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function toast(text) {
  const root = $('#toastRoot');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  root.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* aria-modal="true" solo habla a los lectores de pantalla: el Tab seguia
   saliendo del dialogo hacia la pagina de detras, invisible bajo el velo
   y sin forma evidente de volver. inert la retira a la vez del recorrido
   de teclado y del arbol de accesibilidad. */
const SIN_AISLAR = new Set(['modalRoot', 'toastRoot']);
const HAY_INERT = 'inert' in HTMLElement.prototype;

function aislarFondo(activo) {
  Array.from(document.body.children).forEach(el => {
    if (SIN_AISLAR.has(el.id)) return;
    if (activo) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
  });
}

/* Reserva para navegadores sin inert: se cicla el Tab a mano dentro del
   panel. Hace lo mismo, solo que sin ocultarlo del lector de pantalla,
   que en esos navegadores ya cubre aria-modal. */
const FOCALIZABLES = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function cicloDeTabulacion(e) {
  if (e.key !== 'Tab') return;
  const panel = $('#modalRoot .modal-panel');
  if (!panel) return;
  const focos = Array.from(panel.querySelectorAll(FOCALIZABLES)).filter(x => x.offsetParent !== null);
  if (!focos.length) return;
  const primero = focos[0], ultimo = focos[focos.length - 1];
  if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
  else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
}

/* Quien abrio el modal recupera el foco al cerrarse: si no, el teclado
   vuelve al principio del documento y se pierde el sitio. */
let focoPrevio = null;

function openModal({ icon = '🔮', title = 'Oráculo', subtitle = '', body = '', actions = '' }) {
  const root = $('#modalRoot');
  root.className = 'modal-root open';
  root.innerHTML = `
    <div class="modal-backdrop" data-close-modal></div>
    <section class="modal-panel" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}">
      <header class="modal-head">
        <div class="modal-title"><span class="emoji">${icon}</span><div><h2>${escapeHTML(title)}</h2>${subtitle ? `<p>${escapeHTML(subtitle)}</p>` : ''}</div></div>
        <button class="modal-close" data-close-modal type="button" aria-label="${escapeHTML(t('closed'))}">✕</button>
      </header>
      <div class="modal-body">${body}</div>
      ${actions ? `<footer class="modal-actions">${actions}</footer>` : ''}
    </section>`;
  applyAppTranslations(root);
  /* Solo se recuerda quien abrio el primero: un modal que abre otro no
     debe pisar la referencia al boton original. */
  if (!focoPrevio) focoPrevio = document.activeElement;
  if (HAY_INERT) aislarFondo(true);
  else document.addEventListener('keydown', cicloDeTabulacion, true);
  root.addEventListener('click', modalClickHandler, { once: true });
  document.addEventListener('keydown', escHandler, { once: true });
  setTimeout(() => $('.modal-close')?.focus(), 10);
}
function modalClickHandler(e) {
  if (e.target.closest('[data-close-modal]')) closeModal();
  else $('#modalRoot')?.addEventListener('click', modalClickHandler, { once: true });
}
function escHandler(e) {
  if (e.key === 'Escape') {
    if (closeAstroWheelFullscreen()) {
      document.addEventListener('keydown', escHandler, { once: true });
      return;
    }
    closeModal();
  } else {
    document.addEventListener('keydown', escHandler, { once: true });
  }
}
function closeModal() {
  closeAstroWheelFullscreen();
  document.body.classList.remove('astro-wheel-fullscreen-open');
  $('#modalRoot').className = 'modal-root';
  $('#modalRoot').innerHTML = '';
  if (HAY_INERT) aislarFondo(false);
  else document.removeEventListener('keydown', cicloDeTabulacion, true);
  if (focoPrevio && document.contains(focoPrevio)) {
    try { focoPrevio.focus(); } catch { /* el elemento pudo desaparecer */ }
  }
  focoPrevio = null;
}

/* Las fuentes base de jsPDF no llevan acentos ni CJK: sin esto la
   cabecera salia con simbolos rotos al cambiar de idioma. */
function pdfAscii(txt = '') {
  const limpio = String(txt).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  /* Si aun quedan caracteres fuera del latino no hay glifo posible. */
  return limpio.replace(/[^\u0020-\u024f\n]/g, '').trim();
}

/* Vista traducida de una fase lunar. El indice es la clave y no cambia,
   asi que las lecturas ya guardadas siguen siendo validas. */
function faseTraducida(phase) {
  const i = MOON_PHASES.indexOf(phase);
  if (i < 0) return phase;
  return {
    ...phase,
    name: t('mp' + i + 'N'),
    meaning: t('mp' + i + 'M'),
    ritual: t('mp' + i + 'R'),
    affirmation: t('mp' + i + 'A')
  };
}

function readingActions(text, type = 'Lectura') {
  const b = (act, icono, clave) => `<button class="btn compact" data-act="${act}" type="button">${icono} ${escapeHTML(t(clave))}</button>`;
  return `
    <div class="actions mt reading-actions">
      ${b('ai-reading', '🤖', 'raDeepen')}
      ${b('save-reading', '⭐', 'raSave')}
      ${b('copy-reading', '📋', 'raCopy')}
      ${b('share-reading', '📤', 'raShare')}
      ${b('speak-reading', '🔊', 'raListen')}
      ${b('download-reading-mp3', '🎧', 'raMp3')}
      ${b('pdf-options', '📄', 'raPdf')}
      ${b('share-visual', '🖼️', 'raCard')}
    </div>
    <div id="aiReadingPanel" class="ai-reading-panel hidden" aria-live="polite"></div>`;
}
function setLastReading({ type, title, text, items = [], ai = '', ritual = null, meta = {} }) {
  lastReading = { type, title, text: cleanInterpretation(text), items, ai: cleanInterpretation(ai), ritual, meta, date: new Date().toISOString() };
  unlockAchievement('first_reading');
}
function getReadingText() {
  if (!lastReading) return '';
  const ai = lastReading.ai ? `

Interpretación IA:
${cleanInterpretation(lastReading.ai)}` : '';
  return `${lastReading.title}

${cleanInterpretation(lastReading.text)}${ai}`;
}
function setAIReadingPanel(html, tone = '') {
  const panel = $('#aiReadingPanel');
  if (!panel) return;
  panel.className = `ai-reading-panel ${tone}`.trim();
  panel.innerHTML = html;
}
function saveReading(reading = lastReading) {
  if (!reading) return toast(t('tsNoReading'));
  if (isPrivateMode()) return toast(t('tsPrivateSkip'));
  const diary = storeGet(LS.diary, []);
  diary.unshift({ ...reading, id: crypto.randomUUID?.() || String(Date.now()), date: reading.date || new Date().toISOString(), favorite: !!reading.favorite, note: reading.note || '' });
  storeSet(LS.diary, diary.slice(0, 300));
  unlockAchievement('first_save');
  toast(t('tsSavedLibrary'));
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast(t('tsCopied')); }
  catch { toast(t('tsCopyFail')); }
}
async function shareText(text, title = 'Oráculo Místico') {
  if (navigator.share) {
    try { await navigator.share({ title, text }); return; } catch {}
  }
  copyText(text);
}
function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
function safeFileName(title = 'oraculo-mistico') {
  return String(title).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'oraculo-mistico';
}
function getUserName() { return (localStorage.getItem(LS.name) || '').trim(); }
function getReadingSubjectName(reading = lastReading) {
  const meta = reading?.meta || {};
  if (meta.name) return String(meta.name).trim();
  if (meta.synastry?.a?.name && meta.synastry?.b?.name) return `${meta.synastry.a.name} · ${meta.synastry.b.name}`;
  return getUserName();
}
function isNumerologyReading(reading = lastReading) {
  return /Numerolog[ií]a/i.test(reading?.type || '');
}
function isPersonalNumerologyReading(reading = lastReading) {
  return /^Numerolog[ií]a$/i.test(reading?.type || '') && Boolean(reading?.meta?.numbers);
}
function aiLanguageName(language = getAppLanguage()) {
  const languageNames = {
    es:'español',
    ca:'catalán',
    en:'inglés',
    fr:'francés',
    de:'alemán',
    zh:'chino simplificado'
  };
  return languageNames[language] || languageNames.es;
}
function aiLanguageInstruction() {
  return `Responde siempre en ${aiLanguageName()}. Si el texto base está en otro idioma, traduce la interpretación final al idioma elegido en la aplicación. `;
}
function getAIStyle() { return localStorage.getItem(LS.aiStyle) || 'mistica'; }
function aiStyleInstruction(style = getAIStyle()) {
  const styles = {
    mistica: 'Estilo de IA: místico, intuitivo, ceremonial, con lenguaje bonito pero claro. ',
    razonable: 'Estilo de IA: razonable, práctico, equilibrado y con los pies en la tierra. ',
    corta: 'Estilo de IA: respuesta breve, directa y fácil de entender, sin extenderse. ',
    profunda: 'Estilo de IA: lectura profunda, simbólica y desarrollada, con matices. ',
    directa: 'Estilo de IA: directo, claro, sin rodeos y orientado a la acción. ',
    amorosa: 'Estilo de IA: cálido, amable, protector y esperanzador. '
  };
  return styles[style] || styles.mistica;
}
function personalPrefix() { const name = getUserName(); return `${name ? `La persona se llama ${name}. Puedes dirigirte a ella por su nombre de forma natural, cercana y sin repetirlo en cada frase. ` : ''}${aiStyleInstruction()}`; }
function readingPersonalPrefix(reading = lastReading) {
  const name = getReadingSubjectName(reading);
  return `${name ? `La persona de esta lectura se llama ${name}. Usa este nombre y no el nombre guardado del perfil si son diferentes. ` : ''}${aiStyleInstruction()}`;
}
function readingSubjectField(id = 'readingSubject', value = '') {
  return `<div class="field"><label>${escapeHTML(t('subjFor'))}</label>${inputWithMic(id, `value="${escapeHTML(value)}" placeholder="${escapeHTML(t('subjPh'))}"`)}</div>`;
}
function getReadingSubject(id = 'readingSubject') {
  return ($(id.startsWith('#') ? id : `#${id}`)?.value || '').trim();
}
function subjectPrefix(subject = '') {
  return subject ? `${t('lblFor')}: ${subject}\n` : '';
}
function subjectMeta(subject = '', meta = {}) {
  return subject ? { ...meta, name:subject } : meta;
}
function subjectSubtitle(base = '', subject = '') {
  return subject ? `${base} · ${t('lblFor')} ${subject}` : base;
}
function extractReadingSubjectFromText(text = '') {
  const match = String(text || '').match(/\bpara\s+([^,.!?;]+)/i);
  if (!match) return '';
  let subject = match[1]
    .replace(/\b(una|un|la|el)\s+tirada\b.*$/i, '')
    .replace(/\b(sobre|con|porque|cuando|donde|dónde|que|qué|si|del|de)\b.*$/i, '')
    .trim();
  if (!subject) return '';
  const stop = /^(saber|ver|entender|preguntar|consultar|mirar|hoy|mañana|manana|amor|trabajo|dinero|salud|claridad)$/i;
  if (stop.test(subject)) return '';
  return subject.split(/\s+/).slice(0, 4).join(' ');
}
function resolveReadingAssets(reading = lastReading) {
  if (!reading) return [];
  const names = Array.isArray(reading.items) ? reading.items : [];
  return names.map((item, index) => {
    if (item && typeof item === 'object') return { index, ...item };
    const name = String(item || '');
    const card = ALL_TAROT.find(c => c.name === name);
    if (card) return { index, kind: 'tarot', name: card.name, subtitle: card.key || card.el || '', image: card.img || '', symbol: card.emoji || '🃏' };
    const rune = RUNAS.find(r => r.name === name);
    if (rune) return { index, kind: 'runa', name: rune.name, subtitle: rune.up || '', image: rune.img || '', symbol: rune.sym || 'ᚱ' };
    const moon = MOON_PHASES.find(m => m.name === name);
    if (moon) return { index, kind: 'luna', name: moon.name, subtitle: moon.meaning || '', image: '', symbol: moon.sym || '🌙' };
    return { index, kind: reading.type || 'lectura', name, subtitle: '', image: '', symbol: '✦' };
  }).filter(a => a.name);
}
function splitReadingText(text = '') {
  const parts = String(text || '').split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
  const compact = [];
  const long = [];
  for (const part of parts) {
    if (part.length < 190 && compact.length < 7) compact.push(part);
    else long.push(part);
  }
  if (!compact.length && text) compact.push(String(text).split('\n').slice(0, 5).join(' · '));
  return { compact, long: long.length ? long.join('\n\n') : String(text || '') };
}
function cleanPdfText(value = '') {
  return String(value || '')
    .replace(/[🌟✨🔮🃏🌙ᚱ🤖📄📋📤⭐🎙️⏹️🔊]/g, '')
    .replace(/[☉☽☿♀♂♃♄♈♉♊♋♌♍♎♏♐♑♒♓]/g, '')
    .replace(/[\uFE0E\uFE0F]/g, '')
    .replace(/[•]/g, '-')
    .replace(/[–—]/g, '-')
    .trim();
}
const ASTRO_PDF_SIGNS = ['ARI','TAU','GEM','CAN','LEO','VIR','LIB','ESC','SAG','CAP','ACU','PIS'];
const ASTRO_SIGN_COLORS = ['#bd3b75','#a79a92','#f1c833','#4f6fa8','#bd3b75','#a79a92','#f1c833','#4f6fa8','#bd3b75','#a79a92','#f1c833','#4f6fa8'];
const ASTRO_PDF_SIGN_COLORS = [[189, 59, 117], [167, 154, 146], [241, 200, 51], [79, 111, 168], [189, 59, 117], [167, 154, 146], [241, 200, 51], [79, 111, 168], [189, 59, 117], [167, 154, 146], [241, 200, 51], [79, 111, 168]];
const ASTRO_PDF_PLANETS = { sun:'SOL', moon:'LUN', mercury:'MER', venus:'VEN', mars:'MAR', jupiter:'JUP', saturn:'SAT', uranus:'URA', neptune:'NEP', pluto:'PLU', node:'NOD', chiron:'QUI', lilith:'LIL' };
const ASTRO_PDF_ASPECTS = {
  'Conjunción': { code:'CONJ', color:[74, 113, 184] },
  'Sextil': { code:'SEXT', color:[59, 151, 132] },
  'Cuadratura': { code:'CUAD', color:[190, 57, 103] },
  'Trígono': { code:'TRIG', color:[74, 113, 184] },
  'Oposición': { code:'OPOS', color:[190, 57, 103] }
};
function getAstroPdfChart(reading = lastReading) {
  const meta = reading?.meta || {};
  return meta.solarReturn?.chart || meta.astroToday || meta.astro || null;
}
function drawAstroPdfWheel(doc, chart, x, y, size, palette = {}, heading = 'Rueda astral') {
  if (!chart?.planets?.length || !chart?.houses?.length) return y;
  const includeLegend = palette.includeLegend !== false;
  const includeAspectList = palette.includeAspectList !== false;
  const extraH = includeLegend || includeAspectList ? 68 : 30;
  const gold = palette.gold || [218, 184, 72];
  const violet = palette.violet || [38, 28, 72];
  const ink = palette.ink || [38, 36, 48];
  const line = palette.line || [196, 170, 83];
  const rose = [190, 57, 103];
  const cx = x + size / 2;
  const cy = y + size / 2 + 5;
  const outer = size * .445;
  const signR = size * .375;
  const houseR = size * .414;
  const planetRadii = [size * .30, size * .265, size * .23, size * .195];
  const toPoint = (degree, radius) => {
    const angle = degToRad(astroWheelAngle(chart, degree) - 90);
    return { x:cx + Math.cos(angle) * radius, y:cy + Math.sin(angle) * radius };
  };
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...violet);
  doc.text(pdfAscii(heading), x, y - 1);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(232, 226, 214);
  doc.roundedRect(x - 6, y + 2, size + 12, size + extraH, 3, 3, 'FD');
  doc.circle(cx, cy, outer, 'FD');
  doc.setDrawColor(210, 205, 196);
  doc.setLineWidth(.18);
  doc.circle(cx, cy, size * .35, 'S');
  doc.circle(cx, cy, size * .255, 'S');
  doc.circle(cx, cy, size * .07, 'S');
  for (let i = 0; i < 12; i++) {
    const boundary = i * 30;
    const p1 = toPoint(boundary, size * .35);
    const p2 = toPoint(boundary, outer);
    doc.setDrawColor(224, 217, 205);
    doc.setLineWidth(.16);
    doc.line(p1.x, p1.y, p2.x, p2.y);
  }
  for (let i = 0; i < 180; i++) {
    const deg = i * 2;
    const isMajor = i % 15 === 0;
    const isMedium = i % 5 === 0;
    const p1 = toPoint(deg, outer - (isMajor ? 6.2 : isMedium ? 4.5 : 2.6));
    const p2 = toPoint(deg, outer);
    doc.setDrawColor(isMajor ? 62 : 132, isMajor ? 58 : 128, isMajor ? 68 : 134);
    doc.setLineWidth(isMajor ? .35 : isMedium ? .18 : .10);
    doc.line(p1.x, p1.y, p2.x, p2.y);
  }
  doc.setDrawColor(48, 46, 55);
  doc.setLineWidth(.35);
  chart.houses.forEach(house => {
    const p1 = toPoint(house.cusp, size * .09);
    const p2 = toPoint(house.cusp, outer);
    doc.line(p1.x, p1.y, p2.x, p2.y);
    const hp = toPoint(house.cusp + 15, houseR);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(48, 46, 55);
    doc.text(String(house.number), hp.x, hp.y + 2, { align:'center' });
  });
  ASTRO_PDF_SIGNS.forEach((label, index) => {
    const p = toPoint(index * 30 + 15, signR);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...(ASTRO_PDF_SIGN_COLORS[index] || gold));
    doc.text(label, p.x, p.y + 2, { align:'center' });
  });
  if (chart.aspects?.length) {
    const byName = Object.fromEntries(chart.planets.map(planet => [planet.name, planet]));
    chart.aspects.slice(0, 12).forEach(aspect => {
      const a = byName[aspect.a];
      const b = byName[aspect.b];
      if (!a || !b) return;
      const p1 = toPoint(a.degree, size * .17);
      const p2 = toPoint(b.degree, size * .17);
      const aspectMeta = ASTRO_PDF_ASPECTS[aspect.name] || ASTRO_PDF_ASPECTS['Conjunción'];
      doc.setDrawColor(...aspectMeta.color);
      doc.setLineWidth(aspect.name === 'Cuadratura' || aspect.name === 'Oposición' ? .35 : .28);
      doc.line(p1.x, p1.y, p2.x, p2.y);
      if (aspect.name === 'Conjunción') {
        doc.circle((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 1.2, 'S');
      }
    });
  }
  doc.setDrawColor(...rose);
  doc.setLineWidth(.55);
  doc.line(cx - outer - 6, cy, cx + outer + 6, cy);
  const mcA = chart.mc?.absolute ?? 0;
  const mc1 = toPoint(mcA, size * .12);
  const mc2 = toPoint(mcA, outer + 6);
  doc.setDrawColor(...rose);
  doc.line(mc1.x, mc1.y, mc2.x, mc2.y);
  const axisLabels = [
    ['AC', cx - outer - 6, cy + 2],
    ['DC', cx + outer + 6, cy + 2],
    ['MC', mc2.x, mc2.y],
    ['IC', toPoint(mcA + 180, outer + 6).x, toPoint(mcA + 180, outer + 6).y]
  ];
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...rose);
  axisLabels.forEach(([label, lx, ly]) => doc.text(label, lx, ly, { align:'center' }));
  chart.planets.forEach((planet, index) => {
    const radius = planetRadii[index % planetRadii.length];
    const p = toPoint(planet.degree, radius);
    const code = ASTRO_PDF_PLANETS[planet.id] || pdfAscii(planet.name).slice(0, 3).toUpperCase();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.7);
    doc.setTextColor(78, 78, 82);
    doc.text(code, p.x, p.y + 1.7, { align:'center' });
    if (planet.retrograde) {
      doc.setFontSize(4.4);
      doc.text('R', p.x + 5.5, p.y - 1.8, { align:'center' });
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.6);
    doc.setTextColor(112, 108, 116);
    doc.text(pdfAscii(planet.degreeLabel || `${planet.signDegree}°`).slice(0, 8), p.x, p.y + 6, { align:'center' });
  });
  const signLegend = 'ARI Aries · TAU Tauro · GEM Geminis · CAN Cancer · LEO Leo · VIR Virgo · LIB Libra · ESC Escorpio · SAG Sagitario · CAP Capricornio · ACU Acuario · PIS Piscis';
  const aspectLegend = 'CONJ 0 conjuncion · SEXT 60 sextil · CUAD 90 cuadratura · TRIG 120 trigono · OPOS 180 oposicion';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(142, 139, 143);
  doc.text(pdfAscii(`${chart.name || ''}, ${chart.date || ''}, ${chart.time || ''}`).toUpperCase(), cx, y + size + 14, { align:'center' });
  if (chart.place?.label) doc.text(pdfAscii(chart.place.label).toUpperCase(), cx, y + size + 21, { align:'center' });
  if (includeLegend) {
    doc.setFontSize(6.1);
    doc.setTextColor(...ink);
    doc.text(doc.splitTextToSize(pdfAscii(signLegend), size - 8).slice(0, 2), cx, y + size + 31, { align:'center' });
    doc.text(doc.splitTextToSize(pdfAscii(aspectLegend), size - 8).slice(0, 2), cx, y + size + 39, { align:'center' });
  }
  let aspectY = y + size + (includeLegend ? 50 : 30);
  if (includeAspectList && chart.aspects?.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...violet);
    doc.text('Aspectos principales', x, aspectY);
    aspectY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    chart.aspects.slice(0, 8).forEach((aspect, index) => {
      const meta = ASTRO_PDF_ASPECTS[aspect.name] || { code:pdfAscii(aspect.name).slice(0, 4).toUpperCase(), color:ink };
      const col = index % 2;
      const row = Math.floor(index / 2);
      const tx = x + col * (size / 2 + 4);
      const ty = aspectY + row * 6;
      doc.setTextColor(...meta.color);
      doc.setFont('helvetica', 'bold');
      doc.text(meta.code, tx, ty);
      doc.setTextColor(...ink);
      doc.setFont('helvetica', 'normal');
      doc.text(pdfAscii(`${aspect.a}/${aspect.b} orb ${aspect.orb}°`), tx + 15, ty);
    });
    aspectY += Math.ceil(Math.min(chart.aspects.length, 8) / 2) * 6;
  }
  return aspectY + 4;
}
function canvasDataUrlFromImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve('');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch { resolve(''); }
    };
    img.onerror = () => resolve('');
    img.src = src;
  });
}
function runeSvgDataUrl(sym = 'ᚱ') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="420" viewBox="0 0 320 420"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#efe9f8"/><stop offset="100%" stop-color="#d8d2e8"/></linearGradient></defs><rect x="20" y="20" width="280" height="380" rx="52" fill="url(#bg)" stroke="#c4aa53" stroke-width="8"/><circle cx="160" cy="210" r="88" fill="#f8f5ff" stroke="#c4aa53" stroke-width="5"/><text x="160" y="240" text-anchor="middle" font-size="148" font-family="serif" fill="#2d2156">${sym}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
function getPdfReadingHighlight(reading = lastReading) {
  const meta = reading?.meta || {};
  /* Si quien genera el PDF ya trae su propio destacado, manda ese. */
  if (meta.highlight?.label && meta.highlight?.value) return meta.highlight;
  if (Array.isArray(meta.grabovoiSelections) && meta.grabovoiSelections.length) {
    const codes = meta.grabovoiSelections.map(item => item.codigo).filter(Boolean);
    const n = codes.length;
    /* La etiqueta decia siempre 'Numerologia + Grabovoi', tambien en una
       hoja de secuencias suelta, donde no hay numerologia por medio. */
    const esHoja = reading?.type === 'Grabovoi';
    return {
      label: esHoja ? t('gbSheet') : t('gbNumGrab'),
      value: codes.slice(0, 3).join(' · ') + (n > 3 ? ` +${n - 3}` : ''),
      detail: `${esHoja ? '' : (getReadingSubjectName(reading) || reading.title || '') + ' · '}${n === 1 ? t('gbSelOne') : t('gbSel', { n })}`
    };
  }
  if (reading?.type === 'Sueños' && meta.dreamElement) {
    return {
      label:'Elemento predominante',
      value:meta.dreamElement.name,
      detail:meta.dreamElement.explanation
    };
  }
  if (reading?.type === 'Numerología' && meta.numbers) {
    return {
      label:'Números importantes',
      value:`${meta.numbers.life} · ${meta.numbers.expression} · ${meta.numbers.personalYear}`,
      detail:`Camino de vida ${meta.numbers.life} · Expresión ${meta.numbers.expression} · Año personal ${meta.numbers.personalYear}`
    };
  }
  if (reading?.type === 'Astros' && meta.astro) {
    const astro = meta.astro;
    if (meta.solarReturn?.chart) {
      const solar = meta.solarReturn;
      return {
        label:'Revolucion solar',
        value:`${solar.year} · ${solar.chart.sun?.name || astro.sun?.name || ''} · ASC ${solar.chart.asc?.name || ''}`,
        detail:`${getReadingSubjectName(reading) || reading.title || 'Lectura astral'} · retorno aproximado: ${solar.localLabel || ''}`.trim()
      };
    }
    return {
      label:'Triada astral',
        value:`${astroGlyph(astro.sun?.symbol || '☉')} ${astro.sun?.name || ''} · ${astroGlyph(astro.moon?.signSymbol || '☽')} ${astro.moon?.sign || ''} · ${astroGlyph(astro.asc?.symbol || 'ASC')} ${astro.asc?.name || ''}`,
      detail:`${getReadingSubjectName(reading) || reading.title || 'Lectura astral'} · ${meta.birthDate || astro.date || ''} ${meta.birthTime || astro.time || ''}`.trim()
    };
  }
  if (reading?.type === 'Grabovoi' && meta.grabovoiCode) {
    return {
      label:'Código consultado',
      value:meta.grabovoiCode,
      detail:meta.grabovoiPurpose || reading.title || 'Secuencia de concentración simbólica'
    };
  }
  return null;
}

async function exportNumerologyPDF(reading = lastReading) {
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) throw new Error('jsPDF no cargado');
  const meta = reading?.meta || {};
  const numbers = meta.numbers || {};
  const name = meta.name || numbers.name || getReadingSubjectName(reading) || 'Consulta';
  const birthDate = meta.birthDate || numbers.date || '';
  const birthTime = meta.birthTime || numbers.time || '';
  const fields = Array.isArray(meta.numerologyFields) && meta.numerologyFields.length
    ? meta.numerologyFields
    : numerologyFields(numbers);
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 18;
  const ink = [35, 31, 44];
  const muted = [104, 96, 118];
  const gold = [174, 124, 42];
  const line = [214, 188, 112];
  const soft = [252, 249, 241];
  const violet = [55, 42, 86];
  const today = new Date(reading?.date || Date.now()).toLocaleDateString('es-ES');
  let y = 0;

  const text = (value, x, yy, options = {}) => doc.text(pdfAscii(value), x, yy, options);
  const addFooter = () => {
    doc.setDrawColor(232, 222, 195);
    doc.line(margin, H - 17, W - margin, H - 17);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    text('Lectura numerologica simbolica. Uso orientativo y de entretenimiento.', margin, H - 10);
    text(String(doc.internal.getNumberOfPages()), W - margin, H - 10, { align:'right' });
  };
  const addPageHeader = () => {
    doc.setFillColor(...soft);
    doc.rect(0, 0, W, H, 'F');
    doc.setDrawColor(...line);
    doc.setLineWidth(.45);
    doc.roundedRect(margin, 16, W - margin * 2, 32, 6, 6, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...violet);
    text('INFORME NUMEROLOGICO', margin + 7, 28);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...muted);
    text('Perfil personal · Oraculo Mistico', margin + 7, 36);
    text(today, W - margin - 7, 28, { align:'right' });
    y = 58;
  };
  const ensure = (needed = 28) => {
    if (y + needed <= H - 24) return;
    addFooter();
    doc.addPage();
    addPageHeader();
  };
  const wrapped = (value, width) => doc.splitTextToSize(cleanPdfText(value), width).map(pdfAscii);

  addPageHeader();

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...line);
  doc.roundedRect(margin, y, W - margin * 2, 28, 5, 5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...violet);
  text(name, margin + 7, y + 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  text(`Nacimiento: ${birthDate || 'sin fecha'}${birthTime ? ` · ${birthTime}` : ''}`, margin + 7, y + 17);
  text(`Numeros calculados: ${fields.length}`, W - margin - 7, y + 17, { align:'right' });
  y += 38;

  const keyNumbers = [
    ['Camino', numbers.life],
    ['Expresion', numbers.expression],
    ['Ano personal', numbers.personalYear]
  ].filter(([, value]) => value);
  const cardGap = 5;
  const cardW = (W - margin * 2 - cardGap * (keyNumbers.length - 1 || 1)) / Math.max(1, keyNumbers.length);
  keyNumbers.forEach(([label, number], index) => {
    const x = margin + index * (cardW + cardGap);
    const meaning = numerologyMeaning(number);
    doc.setFillColor(246, 239, 219);
    doc.setDrawColor(...line);
    doc.roundedRect(x, y, cardW, 30, 5, 5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...gold);
    text(String(number), x + 7, y + 15);
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    text(label.toUpperCase(), x + 7, y + 23);
    doc.setFontSize(9);
    doc.setTextColor(...violet);
    text(meaning.title, x + cardW - 7, y + 15, { align:'right' });
  });
  y += 40;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...violet);
  text('Lectura profesional', margin, y);
  y += 6;

  fields.forEach(([label, number, description]) => {
    const meaning = numerologyMeaning(number);
    const bodyLines = [
      ...wrapped(description, W - margin * 2 - 36).slice(0, 2),
      ...wrapped(`${t('nuStrength')}: ${meaning.gift}.`, W - margin * 2 - 36).slice(0, 2),
      ...wrapped(`${t('nuChallenge')}: ${meaning.challenge}.`, W - margin * 2 - 36).slice(0, 2),
      ...wrapped(`${t('nuAdvice')}: ${meaning.advice}.`, W - margin * 2 - 36).slice(0, 2)
    ];
    const boxH = Math.max(25, 12 + bodyLines.length * 4.4);
    ensure(boxH + 6);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(225, 211, 174);
    doc.roundedRect(margin, y, W - margin * 2, boxH, 4, 4, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...gold);
    text(String(number), margin + 8, y + 15);
    doc.setFontSize(10);
    doc.setTextColor(...violet);
    text(`${label} · ${meaning.title}`, margin + 25, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.4);
    doc.setTextColor(...ink);
    doc.text(bodyLines, margin + 25, y + 15);
    y += boxH + 6;
  });

  ensure(34);
  doc.setFillColor(246, 243, 252);
  doc.setDrawColor(183, 167, 216);
  doc.roundedRect(margin, y, W - margin * 2, 30, 5, 5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...violet);
  text(t('nuSynthesis'), margin + 7, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.7);
  doc.setTextColor(...ink);
  doc.text(wrapped(t('nuSynthesisText'), W - margin * 2 - 14).slice(0, 4), margin + 7, y + 16);
  addFooter();
  doc.save(`${safeFileName(`numerologia-${name}`)}.pdf`);
  unlockAchievement('first_pdf');
}

async function exportAstroPDF(reading = lastReading) {
  const chart = getAstroPdfChart(reading);
  if (!chart) return false;
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) throw new Error('jsPDF no cargado');
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 15;
  const gold = [218, 184, 72];
  const goldInk = [146, 104, 37];
  const violet = [38, 28, 72];
  const ink = [38, 36, 48];
  const muted = [116, 111, 122];
  const line = [196, 170, 83];
  const soft = [246, 242, 232];
  const solar = reading?.meta?.solarReturn || null;
  const reportTitle = solar?.chart ? `Revolucion solar ${solar.year}` : reading?.meta?.astroToday ? 'Tirada astral del dia' : 'Carta astral';
  const subject = getReadingSubjectName(reading) || chart.name || 'Consulta';
  const fileName = safeFileName(`${reportTitle}-${subject}`);
  let y = 0;
  const wrapped = (value, width) => doc.splitTextToSize(cleanPdfText(value), width);
  const addHeader = (section = reportTitle) => {
    doc.setFillColor(...violet);
    doc.rect(0, 0, W, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...gold);
    doc.text('ORACULO MISTICO', margin, 10);
    doc.setFontSize(8.5);
    doc.setTextColor(244, 238, 222);
    doc.text('INFORME ASTRAL', margin, 16);
    doc.setFontSize(8);
    doc.text(new Date(reading?.date || Date.now()).toLocaleString('es-ES'), W - margin, 10, { align:'right' });
    doc.text(pdfAscii(section), W - margin, 16, { align:'right' });
    doc.setDrawColor(...line);
    doc.setLineWidth(.35);
    doc.line(margin, 24, W - margin, 24);
    y = 34;
  };
  const addFooter = () => {
    const page = doc.internal.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...muted);
    doc.text('Lectura simbolica. Calculada en el dispositivo con motor abierto y sin marcas externas.', margin, H - 8);
    doc.text(String(page), W - margin, H - 8, { align:'right' });
  };
  const newPage = (section = reportTitle) => {
    addFooter();
    doc.addPage();
    addHeader(section);
  };
  const ensureRoom = (needed = 24, section = reportTitle) => {
    if (y + needed <= H - 18) return;
    newPage(section);
  };
  const sectionTitle = (label) => {
    ensureRoom(12, label);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...violet);
    doc.text(pdfAscii(label).toUpperCase(), margin, y);
    doc.setDrawColor(...line);
    doc.setLineWidth(.25);
    doc.line(margin, y + 2.5, W - margin, y + 2.5);
    y += 8;
  };
  const addInfoBox = (lines, options = {}) => {
    const cleanLines = lines.map(cleanPdfText).filter(Boolean);
    if (!cleanLines.length) return;
    const width = W - margin * 2 - 12;
    const textLines = cleanLines.flatMap(line => wrapped(line, width).slice(0, options.maxLinesPerItem || 2));
    const h = Math.min(options.maxH || 44, 12 + textLines.length * 4.6);
    ensureRoom(h + 5, options.section || reportTitle);
    doc.setFillColor(...(options.accent ? [248, 239, 214] : soft));
    doc.setDrawColor(...(options.accent ? gold : line));
    doc.roundedRect(margin, y, W - margin * 2, h, 4, 4, 'FD');
    doc.setFont('helvetica', options.title ? 'bold' : 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(...ink);
    doc.text(textLines.slice(0, Math.floor((h - 9) / 4.6)), margin + 6, y + 8);
    y += h + 7;
  };
  const addTable = (heading, headers, rows, widths) => {
    const cleanRows = rows.map(row => row.map(cell => cleanPdfText(cell))).filter(row => row.some(Boolean));
    if (!cleanRows.length) return;
    sectionTitle(heading);
    const usable = W - margin * 2;
    const colW = widths || headers.map(() => usable / headers.length);
    const drawHead = () => {
      doc.setFillColor(...violet);
      doc.setDrawColor(...violet);
      doc.roundedRect(margin, y, usable, 8, 2.5, 2.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(255, 250, 239);
      let tx = margin + 3;
      headers.forEach((head, i) => {
        doc.text(pdfAscii(head), tx, y + 5.3);
        tx += colW[i];
      });
      y += 9;
    };
    drawHead();
    cleanRows.forEach((row, index) => {
      const cellLines = row.map((cell, i) => wrapped(cell, colW[i] - 5).slice(0, 2));
      const rowH = Math.max(8.5, 4.2 * Math.max(...cellLines.map(lines => lines.length)) + 4);
      if (y + rowH > H - 18) {
        newPage(heading);
        sectionTitle(heading);
        drawHead();
      }
      doc.setFillColor(...(index % 2 ? [255, 253, 248] : [249, 246, 238]));
      doc.setDrawColor(226, 218, 204);
      doc.roundedRect(margin, y, usable, rowH, 2, 2, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.45);
      doc.setTextColor(...ink);
      let tx = margin + 3;
      cellLines.forEach((lines, i) => {
        doc.text(lines, tx, y + 5.4);
        tx += colW[i];
      });
      y += rowH + 1.2;
    });
    y += 4;
  };
  const addSynthesis = () => {
    const stats = astroAspectStats(chart);
    const tight = stats.tightest;
    const summary = [
      `${subject}: Sol en ${chart.sun?.name || ''}, Luna en ${chart.moon?.sign || ''}, Ascendente en ${chart.asc?.name || ''} y Medio Cielo en ${chart.mc?.name || ''}.`,
      `La carta muestra ${chart.aspects?.length || 0} aspectos mayores: ${stats.counts.flow} fluidos, ${stats.counts.tension} de ajuste y ${stats.counts.focus} de foco.`,
      tight ? `El aspecto mas exacto es ${tight.name} entre ${tight.a} y ${tight.b}, con orbe ${tight.orb} grados.` : '',
      solar?.localLabel ? `Retorno solar aproximado: ${solar.localLabel}.` : '',
      reading?.meta?.intention ? `Intencion: ${reading.meta.intention}.` : ''
    ];
    sectionTitle('Sintesis profesional');
    addInfoBox(summary, { accent:true, maxH:48, section:'Sintesis profesional' });
    const body = cleanPdfText(reading?.ai || cleanInterpretation(reading?.text || '')).replace(/Posiciones:[\s\S]*$/i, '').trim();
    if (body) addInfoBox(wrapped(body, W - margin * 2 - 12).slice(0, 12), { maxH:64, maxLinesPerItem:1, section:'Sintesis profesional' });
  };
  toast(t('tsMakingPdf'));
  addHeader(reportTitle);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...violet);
  doc.text(pdfAscii(reportTitle).toUpperCase(), margin, y);
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  doc.text(wrapped(`${subject} · ${chart.date || ''} · ${chart.time || ''}${chart.place?.label ? ` · ${chart.place.label}` : ''}`, W - margin * 2), margin, y + 7);
  y += 20;
  addInfoBox([
    `Motor: ${chart.engine || 'Astronomy Engine'} · Casas: ${astroHouseSystemLabel(chart.houseSystem)}`,
    chart.utcLabel ? `Hora universal: ${chart.utcLabel}` : '',
    chart.siderealTimeLabel ? `Tiempo sideral: ${chart.siderealTimeLabel}` : '',
    chart.place?.timezone ? `Zona horaria: ${chart.place.timezone}` : ''
  ], { accent:true, maxH:32 });
  const wheelSize = Math.min(166, W - margin * 2 - 12);
  const wheelX = margin + (W - margin * 2 - wheelSize) / 2;
  y = drawAstroPdfWheel(doc, chart, wheelX, y + 1, wheelSize, { gold, goldInk, violet, ink, line, includeLegend:false, includeAspectList:false }, 'Rueda astral');
  newPage('Tablas astrales');
  addTable('Claves', ['Punto', 'Posicion', 'Lectura'], [
    ['Sol', `${chart.sun?.name || ''} ${chart.sun?.degreeLabel || ''}`, chart.sun?.keywords?.join(', ') || 'Identidad'],
    ['Luna', `${chart.moon?.sign || ''} ${chart.moon?.degreeLabel || ''}`, chart.moon?.keywords?.join(', ') || 'Emocion'],
    ['Ascendente', `${chart.asc?.name || ''} ${chart.asc?.degreeLabel || ''}`, chart.asc?.keywords?.join(', ') || 'Entrada'],
    ['Medio Cielo', `${chart.mc?.name || ''} ${chart.mc?.degreeLabel || ''}`, chart.mc?.keywords?.join(', ') || 'Direccion visible']
  ], [34, 58, 88]);
  addTable('Posiciones planetarias', ['Astro', 'Grado', 'Funcion'], chart.planets.map(planet => [
    ASTRO_PDF_PLANETS[planet.id] || planet.name,
    `${planet.sign} ${planet.degreeLabel || `${planet.signDegree} grados`}${planet.retrograde ? ' Rx' : ''}`,
    planet.role || planet.element || ''
  ]), [25, 62, 93]);
  addTable('Casas', ['Casa', 'Cuspide', 'Area'], chart.houses.map(house => [
    `Casa ${house.number}`,
    `${house.sign} ${house.degreeLabel || `${house.degree} grados`}`,
    house.label || house.element || ''
  ]), [25, 65, 90]);
  addTable('Aspectos principales', ['Aspecto', 'Astros', 'Orbe'], (chart.aspects || []).map(aspect => [
    `${aspect.name} ${aspect.angle} grados`,
    `${aspect.a} / ${aspect.b}`,
    `${aspect.orb} grados · ${astroAspectOrbLabel(aspect.orb)}`
  ]), [54, 82, 44]);
  addSynthesis();
  addFooter();
  doc.save(`${fileName}-profesional.pdf`);
  unlockAchievement('first_pdf');
  return true;
}

async function exportPDF(title, text, reading = lastReading) {
  if (getAstroPdfChart(reading)) {
    try {
      await exportAstroPDF(reading);
      return;
    } catch (error) {
      console.warn('PDF astral no disponible:', error);
    }
  }
  if (isPersonalNumerologyReading(reading)) {
    try {
      toast(t('tsMakingPdf'));
      await exportNumerologyPDF(reading);
      return;
    } catch (error) {
      console.warn('PDF de numerologia no disponible:', error);
    }
  }
  const filename = safeFileName(title);
  try {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF) throw new Error('jsPDF no cargado');
    toast(t('tsMakingPdf'));
    const style = getPdfStyle();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const margin = 18;
    const gold = [218, 184, 72];
    /* Version del dorado con contraste suficiente sobre fondo claro. */
    const goldInk = [146, 104, 37];
    const dark = style === 'light' || style === 'summary' ? [252, 248, 239] : [14, 13, 28];
    const violet = [38, 28, 72];
    const soft = style === 'light' || style === 'summary' ? [255, 255, 255] : [239, 234, 255];
    const ink = style === 'light' || style === 'summary' ? [35, 24, 16] : [38, 36, 48];
    const line = [196, 170, 83];
    const astroPdfChart = getAstroPdfChart(reading);
    const assets = astroPdfChart ? [] : resolveReadingAssets(reading);
    let { compact, long } = splitReadingText(text);
    if (style === 'summary') { long = ''; compact = compact.slice(0, 9); }
    const userName = getReadingSubjectName(reading);
    const date = new Date(reading?.date || Date.now()).toLocaleString('es-ES');
    const addHeader = (pageTitle = title) => {
      doc.setFillColor(...dark);
      doc.rect(0, 0, W, 25, 'F');
      doc.setTextColor(...gold);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('ORACULO MISTICO', margin, 11);
      doc.setFontSize(9);
      doc.setTextColor(style === 'light' || style === 'summary' ? 80 : 245, style === 'light' || style === 'summary' ? 58 : 239, style === 'light' || style === 'summary' ? 36 : 218);
      doc.text(pdfAscii(t('pdfSubtitle')), margin, 17);
      doc.setTextColor(style === 'light' || style === 'summary' ? 80 : 245, style === 'light' || style === 'summary' ? 58 : 239, style === 'light' || style === 'summary' ? 36 : 218);
      doc.setFontSize(9);
      doc.text(date, W - margin, 11, { align: 'right' });
      if (userName) doc.text(pdfAscii(`${t('lblFor')}: ${userName}`), W - margin, 17, { align: 'right' });
      doc.setDrawColor(...line);
      doc.setLineWidth(0.35);
      doc.line(margin, 25, W - margin, 25);
      doc.setTextColor(...ink);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      const tLines = doc.splitTextToSize(cleanPdfText(pageTitle), W - margin * 2);
      doc.text(tLines, margin, 37);
      return 43 + Math.max(0, tLines.length - 1) * 5;
    };
    const addFooter = () => {
      const page = doc.internal.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(110, 103, 125);
      doc.text('Uso simbolico y de entretenimiento. No sustituye consejo profesional.', margin, H - 9);
      doc.text(String(page), W - margin, H - 9, { align: 'right' });
    };
    let y = addHeader(title);
    const ensurePdfRoom = (needed = 30) => {
      if (y + needed <= H - 18) return;
      addFooter();
      doc.addPage();
      y = addHeader(title);
    };
    function addPdfRows(heading, rows, options = {}) {
      const cleanRows = rows.map(row => cleanPdfText(row)).filter(Boolean);
      if (!cleanRows.length) return;
      const columns = options.columns || 1;
      const gap = 6;
      const rowH = options.rowH || 6;
      const colW = (W - margin * 2 - gap * (columns - 1)) / columns;
      let index = 0;
      while (index < cleanRows.length) {
        const rowsPerColumn = Math.max(3, Math.floor((H - y - 42) / rowH));
        const take = Math.min(cleanRows.length - index, rowsPerColumn * columns);
        const chunk = cleanRows.slice(index, index + take);
        const usedRows = Math.ceil(chunk.length / columns);
        const boxH = 12 + usedRows * rowH;
        ensurePdfRoom(boxH + 6);
        doc.setFillColor(...(options.accent ? soft : [249, 246, 238]));
        doc.setDrawColor(...(options.accent ? [114, 139, 214] : line));
        doc.roundedRect(margin, y, W - margin * 2, boxH, 5, 5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...violet);
        doc.text(pdfAscii(heading), margin + 6, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(options.fontSize || 7.7);
        doc.setTextColor(...ink);
        chunk.forEach((row, offset) => {
          const col = Math.floor(offset / usedRows);
          const line = offset % usedRows;
          const tx = margin + 6 + col * (colW + gap);
          const ty = y + 14 + line * rowH;
          doc.text(doc.splitTextToSize(row, colW - 5).slice(0, 1), tx, ty);
        });
        y += boxH + 6;
        index += take;
      }
    }
    const highlight = getPdfReadingHighlight(reading);
    if (highlight) {
      const detailLines = doc.splitTextToSize(cleanPdfText(highlight.detail), W - margin * 2 - 16).slice(0, 3);
      const highlightH = 21 + detailLines.length * 4.3;
      doc.setFillColor(246, 239, 213);
      doc.setDrawColor(...gold);
      doc.roundedRect(margin, y, W - margin * 2, highlightH, 5, 5, 'FD');
      doc.setTextColor(...violet);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(cleanPdfText(highlight.label).toUpperCase(), margin + 7, y + 7);
      /* El valor destacado (el codigo Grabovoi, los numeros) se imprimia
         en dorado claro sobre el recuadro crema: 1.67:1, ilegible en
         papel. Se oscurece conservando el tono; queda en 4.3:1. */
      doc.setTextColor(...goldInk);
      doc.setFontSize(reading?.type === 'Grabovoi' ? 20 : 16);
      /* Un codigo largo se salia de la caja: ahora se parte. */
      const anchoValor = W - margin * 2 - 14;
      const lineasValor = doc.splitTextToSize(cleanPdfText(highlight.value), anchoValor);
      doc.text(lineasValor.slice(0, 2), margin + 7, y + 15);
      doc.setTextColor(...ink);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(detailLines, margin + 7, y + 21);
      y += highlightH + 6;
    }
    if (astroPdfChart) {
      if (y > H - 230) { addFooter(); doc.addPage(); y = addHeader(title); }
      const wheelSize = Math.min(148, W - margin * 2 - 12);
      const wheelX = margin + (W - margin * 2 - wheelSize) / 2;
      const wheelTitle = reading?.meta?.solarReturn?.chart ? 'Rueda de revolucion solar' : reading?.meta?.astroToday ? 'Rueda astral del dia' : 'Rueda de carta astral';
      y = drawAstroPdfWheel(doc, astroPdfChart, wheelX, y + 2, wheelSize, { gold, goldInk, violet, ink, line }, wheelTitle);
      const stats = astroAspectStats(astroPdfChart);
      const tight = stats.tightest;
      const solar = reading?.meta?.solarReturn;
      addPdfRows('Claves astrologicas', [
        `Sol: ${astroPdfChart.sun?.name || ''} ${astroPdfChart.sun?.degreeLabel || ''}`,
        `Luna: ${astroPdfChart.moon?.sign || ''} ${astroPdfChart.moon?.degreeLabel || ''}`,
        `Ascendente: ${astroPdfChart.asc?.name || ''} ${astroPdfChart.asc?.degreeLabel || ''}`,
        `Medio Cielo: ${astroPdfChart.mc?.name || ''} ${astroPdfChart.mc?.degreeLabel || ''}`,
        astroPdfChart.utcLabel ? `Hora universal: ${astroPdfChart.utcLabel}` : '',
        astroPdfChart.siderealTimeLabel ? `Tiempo sideral: ${astroPdfChart.siderealTimeLabel}` : '',
        `Casas: ${astroHouseSystemLabel(astroPdfChart.houseSystem)}`,
        solar?.localLabel ? `Retorno: ${solar.localLabel}` : '',
        tight ? `Aspecto mas exacto: ${tight.name} ${tight.a}/${tight.b}, orbe ${tight.orb} grados` : '',
        `Aspectos: ${astroPdfChart.aspects?.length || 0} mayores, ${stats.counts.flow} fluidos, ${stats.counts.tension} de ajuste`
      ], { columns:2, accent:true, rowH:6.2 });
      addPdfRows('Posiciones planetarias', astroPdfChart.planets.map(planet => `${ASTRO_PDF_PLANETS[planet.id] || planet.name}: ${planet.degreeLabel || `${planet.signDegree} grados`} ${planet.sign}${planet.retrograde ? ' Rx' : ''} - ${planet.role}`), { columns:2, rowH:6.2, fontSize:7.2 });
      addPdfRows('Aspectos principales', (astroPdfChart.aspects || []).slice(0, 12).map(aspect => {
        const meta = ASTRO_PDF_ASPECTS[aspect.name] || { code:pdfAscii(aspect.name).slice(0, 4).toUpperCase() };
        return `${meta.code}: ${aspect.a} / ${aspect.b} - ${aspect.angle} grados, orbe ${aspect.orb} (${astroAspectOrbLabel(aspect.orb)})`;
      }), { columns:1, accent:true, rowH:6.1, fontSize:7.4 });
      addPdfRows('Casas', astroPdfChart.houses.map(house => `Casa ${house.number} - ${house.label}: ${house.degreeLabel || `${house.degree} grados`} ${house.sign}`), { columns:2, rowH:6, fontSize:7.4 });
    }
    if (assets.length) {
      const maxAssets = Math.min(10, assets.length);
      const visible = assets.slice(0, maxAssets);
      const allTarot = visible.every(a => a.kind === 'tarot');
      const allRunes = visible.every(a => a.kind === 'runa');
      const cols = allTarot ? Math.min(5, Math.max(1, visible.length)) : Math.min(5, Math.max(1, visible.length));
      const gap = 4;
      const rawCardW = (W - margin * 2 - gap * (cols - 1)) / cols;
      const cardW = allTarot ? Math.min(34, rawCardW) : rawCardW;
      const gridW = cardW * cols + gap * (cols - 1);
      const startX = margin + Math.max(0, (W - margin * 2 - gridW) / 2);
      const rowHeights = [];
      for (let row = 0; row < Math.ceil(visible.length / cols); row++) {
        const slice = visible.slice(row * cols, row * cols + cols);
        rowHeights[row] = Math.max(...slice.map(asset => asset.kind === 'tarot' ? 92 : asset.kind === 'runa' ? 58 : 52));
      }
      const rowOffset = (r) => rowHeights.slice(0, r).reduce((a, b) => a + b + gap, 0);
      for (let i = 0; i < visible.length; i++) {
        const asset = visible[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const boxH = asset.kind === 'tarot' ? 92 : asset.kind === 'runa' ? 58 : 52;
        const x = startX + col * (cardW + gap);
        const boxY = y + rowOffset(row);
        doc.setDrawColor(...line);
        doc.setFillColor(249, 246, 238);
        doc.roundedRect(x, boxY, cardW, boxH, 3, 3, 'FD');
        const label = cleanPdfText(posLabel(asset.position) || asset.name || t('lblElementN', { n: i + 1 }));
        doc.setTextColor(...ink);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.8);
        const labelLines = doc.splitTextToSize(label, cardW - 4).slice(0, 2);
        doc.text(labelLines, x + cardW / 2, boxY + 5, { align: 'center' });
        if (asset.kind === 'tarot') {
          const imgW = Math.max(18, Math.min(cardW - 12, 25));
          const imgH = imgW * 1.72;
          const imgX = x + (cardW - imgW) / 2;
          const imgY = boxY + 12;
          const dataUrl = await canvasDataUrlFromImage(asset.image);
          if (dataUrl) {
            try { doc.addImage(dataUrl, 'PNG', imgX, imgY, imgW, imgH); }
            catch { doc.setFillColor(238, 232, 255); doc.roundedRect(imgX, imgY, imgW, imgH, 3, 3, 'F'); }
          } else {
            doc.setFillColor(238, 232, 255); doc.roundedRect(imgX, imgY, imgW, imgH, 3, 3, 'F');
            doc.setFontSize(19); doc.setTextColor(...gold); doc.text(asset.symbol || '✦', x + cardW / 2, imgY + imgH / 2 + 4, { align: 'center' });
          }
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.3);
          doc.setTextColor(...violet);
          const nameLines = doc.splitTextToSize(cleanPdfText(asset.name || ''), cardW - 4).slice(0, 2);
          doc.text(nameLines, x + cardW / 2, boxY + boxH - 13, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.4);
          doc.setTextColor(...ink);
          const foot = asset.reversed ? 'Invertida' : 'Al derecho';
          doc.text(foot, x + cardW / 2, boxY + boxH - 5, { align: 'center' });
        } else if (asset.kind === 'runa') {
          const imgW = Math.min(cardW - 10, 20);
          const imgH = 27;
          const imgX = x + (cardW - imgW) / 2;
          const imgY = boxY + 12;
          let dataUrl = await canvasDataUrlFromImage(asset.image);
          if (!dataUrl) dataUrl = runeSvgDataUrl(asset.symbol || 'ᚱ');
          try { doc.addImage(dataUrl, 'PNG', imgX, imgY, imgW, imgH); }
          catch {
            try { doc.addImage(dataUrl, 'SVG', imgX, imgY, imgW, imgH); }
            catch {
              doc.setFillColor(238, 232, 255); doc.roundedRect(imgX, imgY, imgW, imgH, 3, 3, 'F');
              doc.setFontSize(22); doc.setTextColor(...violet); doc.text(cleanPdfText(asset.name || 'Runa'), x + cardW / 2, imgY + 11, { align: 'center' });
            }
          }
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.1);
          doc.setTextColor(...violet);
          const nm = doc.splitTextToSize(cleanPdfText(asset.name || ''), cardW - 4).slice(0, 2);
          doc.text(nm, x + cardW / 2, boxY + boxH - 10, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.2);
          doc.setTextColor(...ink);
          doc.text(asset.reversed ? 'Invertida' : 'Al derecho', x + cardW / 2, boxY + boxH - 4, { align: 'center' });
        } else {
          const dataUrl = await canvasDataUrlFromImage(asset.image);
          if (dataUrl) {
            try { doc.addImage(dataUrl, 'PNG', x + 4, boxY + 12, cardW - 8, 24); } catch {}
          } else {
            doc.setFillColor(238, 232, 255); doc.roundedRect(x + 4, boxY + 12, cardW - 8, 24, 3, 3, 'F');
            doc.setFontSize(17); doc.setTextColor(...gold); doc.text(asset.symbol || '✦', x + cardW / 2, boxY + 27, { align: 'center' });
          }
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(...violet);
          doc.text(doc.splitTextToSize(cleanPdfText(asset.name || ''), cardW - 4).slice(0, 2), x + cardW / 2, boxY + boxH - 8, { align: 'center' });
        }
      }
      y += rowHeights.reduce((a, b) => a + b, 0) + gap * (rowHeights.length - 1) + 4;
    }
    const summaryText = compact.join('\n') || cleanPdfText(text).slice(0, 500);
    const summaryLines = doc.splitTextToSize(cleanPdfText(summaryText), W - margin * 2 - 16);
    const summaryH = Math.min(44, 12 + summaryLines.slice(0, 7).length * 5);
    if (y + summaryH > H - 18) { addFooter(); doc.addPage(); y = addHeader(title); }
    doc.setFillColor(228, 224, 235);
    doc.setDrawColor(...line);
    doc.roundedRect(margin, y, W - margin * 2, summaryH, 5, 5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...ink);
    doc.text('Resumen de la lectura', margin + 5, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(summaryLines.slice(0, 7), margin + 7, y + 14);
    y += summaryH + 6;
    function addTextBox(heading, body, accent = false) {
      let content = cleanPdfText(body);
      if (!content) return;
      let lines = doc.splitTextToSize(content, W - margin * 2 - 18);
      let idx = 0;
      while (idx < lines.length) {
        if (y > H - 48) { addFooter(); doc.addPage(); y = addHeader(title); }
        const room = H - y - 28;
        const take = Math.max(5, Math.min(lines.length - idx, Math.floor((room - 18) / 4.7)));
        const chunk = lines.slice(idx, idx + take);
        const h = 18 + chunk.length * 4.7;
        doc.setFillColor(...(accent ? soft : [249, 246, 238]));
        doc.setDrawColor(...(accent ? [114, 139, 214] : line));
        doc.roundedRect(margin, y, W - margin * 2, h, 5, 5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...violet);
        doc.setFontSize(11);
        doc.text(heading, margin + 7, y + 8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...ink);
        doc.setFontSize(9.1);
        doc.text(chunk, margin + 7, y + 16);
        y += h + 6;
        idx += take;
      }
    }
    const removeAIBlock = (value = '') => String(value || '')
      .replace(/Interpretaci[oó]n IA:\s*[\s\S]*$/i, '')
      .replace(/Interpretacion IA\s*[\s\S]*$/i, '')
      .trim();
    const symbolicBody = removeAIBlock(long || text);
    if (symbolicBody) addTextBox('Interpretacion simbolica', symbolicBody, true);
    const aiBody = cleanPdfText(reading?.ai || '');
    if (aiBody) addTextBox('Interpretacion IA', aiBody, true);
    addFooter();
    doc.save(`${filename}-${style}.pdf`);
    unlockAchievement('first_pdf');
  } catch (err) {
    console.warn('PDF profesional no disponible:', err);
    downloadTextFile(`${filename}.txt`, `${title}

${text}`);
    toast(t('tsPdfToTxt'));
  }
}

async function connectPuter() {
  if (window.AndroidTTS) {
    const nativePlatform = window.AndroidTTS.platform?.() || 'android';
    const isIOSApp = nativePlatform === 'ios';
    openModal({
      icon: '🤖',
      title: isIOSApp ? 'IA en iPhone' : 'IA en Android',
      subtitle: `Google no permite iniciar sesión dentro del visor interno de la app ${isIOSApp ? 'iPhone' : 'Android'}.`,
      body: `<div class="result-card">
        <h3>${escapeHTML(t('stConexionSegura'))}</h3>
        <p>${escapeHTML(t('stAbreLaVersionWebEnEl'))}</p>
        <p class="notice">${escapeHTML(t('stLaSesionWebYLosDatos'))}</p>
      </div>`,
      actions: `<button class="btn primary" data-act="open-web-ai" type="button">Abrir versión web</button>
        <button class="btn" data-close-modal type="button">Ahora no</button>`
    });
    return false;
  }
  try {
    if (!window.puter?.auth) { toast(t('tsPuterLoading')); return false; }
    await window.puter.auth.signIn();
    localStorage.setItem(LS.puter, 'true');
    updateHome();
    toast(t('tsAiOn'));
    return true;
  } catch {
    localStorage.setItem(LS.puter, 'false');
    updateHome();
    toast(t('tsPuterFail'));
    return false;
  }
}
async function askAI(prompt, options = {}) {
  if (localStorage.getItem(LS.puter) !== 'true') {
    toast(t('tsConnectAi'));
    return '';
  }
  try {
    if (!window.puter?.ai?.chat) throw new Error('Puter AI no disponible');
    const personalizedPrompt = `${options.prefix || personalPrefix()}${aiLanguageInstruction()}No incluyas iconos, emojis ni símbolos decorativos en la respuesta textual. ${prompt}`;
    const result = await window.puter.ai.chat(personalizedPrompt);
    if (typeof result === 'string') return cleanInterpretation(result);
    return cleanInterpretation(result?.message?.content || result?.text || String(result || ''));
  } catch (err) {
    toast(t('tsAiFailed'));
    return '';
  }
}

function getVoicePreset(preset = 'mistica_femenina') {
  const presets = {
    mistica_femenina: { label:'Mística femenina', gender:'female', rate:0.88, pitch:1.04, hints:['mónica','monica','paulina','maría','maria','helena','sabina','laura','female','mujer','premium','enhanced','natural'] },
    guia_suave: { label:'Guía suave', gender:'female', rate:0.82, pitch:1.08, hints:['helena','sabina','mónica','monica','female','mujer','premium','enhanced','natural'] },
    oraculo_neutro: { label:'Oráculo neutro', gender:'neutral', rate:0.92, pitch:1.0, hints:['spanish','español','espanol','google','microsoft','premium','enhanced','natural'] },
    sabio_masculino: { label:'Sabio masculino', gender:'male', rate:0.86, pitch:0.86, hints:['jorge','diego','carlos','pablo','sergio','male','hombre','premium','enhanced','natural'] },
    guardian_profundo: { label:'Guardián profundo', gender:'male', rate:0.78, pitch:0.75, hints:['carlos','jorge','diego','male','hombre','premium','enhanced','natural'] },
    lectura_rapida: { label:'Lectura rápida', gender:'neutral', rate:1.04, pitch:1.0, hints:['spanish','español','espanol','google','microsoft'] }
  };
  return presets[preset] || presets.mistica_femenina;
}
function getVoicePrefs() {
  const saved = storeGet(LS.voice, null);
  if (saved?.preset) {
    const migrated = Number(saved.localePreferenceVersion || 0) >= 2 ? saved : { ...saved, language:'auto', localePreferenceVersion:3 };
    return { engine:'device', remoteVoice:'coral', voiceFilter:'all', keepScreenAwake:true, avatarStyle:'auto', avatarRenderMode:'auto', avatarRenderModePreferenceVersion:4, avatarEnabled:true, avatarPosition:'right', avatarSize:'medium', avatarMood:'auto', avatarSpeechMode:'auto', ...getVoicePreset(saved.preset), ...migrated, avatarRenderMode:normalizeAvatarRenderMode(migrated), avatarRenderModePreferenceVersion:4 };
  }
  return { engine:'device', remoteVoice:'coral', preset:'mistica_femenina', language:'auto', localePreferenceVersion:3, voiceFilter:'all', keepScreenAwake:true, avatarStyle:'auto', avatarRenderMode:'auto', avatarRenderModePreferenceVersion:4, avatarEnabled:true, avatarPosition:'right', avatarSize:'medium', avatarMood:'auto', avatarSpeechMode:'auto', ...getVoicePreset('mistica_femenina') };
}
function normalizeAvatarRenderMode(saved = {}) {
  const mode = ['auto', '2d', '3d'].includes(saved.avatarRenderMode) ? saved.avatarRenderMode : 'auto';
  if (Number(saved.avatarRenderModePreferenceVersion || 0) < 4 && mode === '2d') return 'auto';
  return mode;
}
function setVoicePrefs(prefs) {
  const preset = prefs.preset || getVoicePrefs().preset || 'mistica_femenina';
  const base = getVoicePreset(preset);
  const current = getVoicePrefs();
  const next = { engine:'device', remoteVoice:'coral', voiceFilter:'all', keepScreenAwake:true, avatarStyle:'auto', avatarRenderMode:'auto', avatarRenderModePreferenceVersion:4, avatarEnabled:true, avatarPosition:'right', avatarSize:'medium', avatarMood:'auto', avatarSpeechMode:'auto', ...base, ...current, ...prefs, preset, localePreferenceVersion:3, avatarRenderModePreferenceVersion:4 };
  next.avatarRenderMode = normalizeAvatarRenderMode(next);
  storeSet(LS.voice, next);
}
function getNativeAndroidVoices() {
  if (!window.AndroidTTS?.getVoices) return [];
  try {
    const voices = JSON.parse(window.AndroidTTS.getVoices() || '[]');
    return Array.isArray(voices) ? voices.map(voice => ({
      name:voice.name || voice.id || 'Voz Android',
      voiceURI:voice.id || voice.name || '',
      lang:voice.lang || '',
      localService:voice.local !== false,
      nativeAndroid:true
    })) : [];
  } catch {
    return [];
  }
}
function getAllDeviceVoices() {
  const nativeVoices = getNativeAndroidVoices();
  const currentWebVoices = window.speechSynthesis?.getVoices?.() || [];
  if (currentWebVoices.length) cachedWebVoices = [...currentWebVoices];
  const voices = nativeVoices.length ? nativeVoices : (currentWebVoices.length ? currentWebVoices : cachedWebVoices);
  const seen = new Set();
  return voices.filter(voice => {
    const key = `${voice.voiceURI || voice.name}|${voice.name}|${voice.lang}|${voice.localService}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function normalizeVoiceLocale(locale = '') {
  const clean = String(locale || '').replace('_', '-').trim();
  if (!clean) return '';
  const [language, region] = clean.split('-');
  return region ? `${language.toLowerCase()}-${region.toUpperCase()}` : language.toLowerCase();
}
function getDeviceLocale() {
  if (getAppLanguagePreference() !== 'auto') return normalizeVoiceLocale(getAppLocale());
  const locales = [...(navigator.languages || []), navigator.language].map(normalizeVoiceLocale).filter(Boolean);
  return locales[0] || 'es-ES';
}
function getDeviceRegion() {
  return getDeviceLocale().split('-')[1] || 'ES';
}
function getAutomaticSpanishLocale(voices = getAllDeviceVoices()) {
  const deviceLocale = getDeviceLocale();
  const deviceLanguage = deviceLocale.split('-')[0];
  const region = getDeviceRegion();
  const matching = voices.filter(voice => normalizeVoiceLocale(voice.lang).split('-')[0] === deviceLanguage);
  return matching.find(voice => normalizeVoiceLocale(voice.lang) === deviceLocale)?.lang
    || matching.find(voice => normalizeVoiceLocale(voice.lang).endsWith(`-${region}`))?.lang
    || matching[0]?.lang
    || getAppLocale();
}
function getEffectiveVoiceLocale(prefs = getVoicePrefs(), voices = getAllDeviceVoices()) {
  return prefs.language && !['auto','all'].includes(prefs.language) ? prefs.language : getAutomaticSpanishLocale(voices);
}
function isSpanishVoice(v) {
  return /^es(?:[-_]|$)/i.test(v.lang || '') || /spanish|español|espanol|castellano/i.test(`${v.name || ''} ${v.voiceURI || ''}`);
}
function scoreHumanSpanishVoice(v, prefs = getVoicePrefs()) {
  const name = `${v.name || ''} ${v.voiceURI || ''}`.toLowerCase();
  const lang = normalizeVoiceLocale(v.lang);
  const preferredLocale = normalizeVoiceLocale(getEffectiveVoiceLocale(prefs));
  const deviceRegion = getDeviceRegion();
  const preset = typeof prefs === 'string' ? getVoicePreset(prefs) : prefs;
  let score = 0;
  if (lang.split('-')[0] === preferredLocale.split('-')[0]) score += 100;
  if (preferredLocale === lang) score += 80;
  if (lang.endsWith(`-${deviceRegion}`)) score += 45;
  if (lang.startsWith(preferredLocale.split('-')[0])) score += 20;
  if (/premium|enhanced|natural|neural|online|google|microsoft|apple|siri|paulina|mónica|monica|jorge|helena|marisol|sabina|diego|carlos/i.test(name)) score += 18;
  if (v.localService) score += 6;
  (preset.hints || []).forEach(h => { if (name.includes(String(h).toLowerCase())) score += 10; });
  return score;
}
function getVisibleDeviceVoices(prefs = getVoicePrefs()) {
  const voices = getAllDeviceVoices();
  const language = normalizeVoiceLocale(prefs.language || 'auto');
  let filtered = prefs.voiceFilter === 'all' ? voices : voices.filter(isSpanishVoice);
  if (language && language !== 'auto' && language !== 'all') {
    filtered = filtered.filter(voice => normalizeVoiceLocale(voice.lang) === language);
  }
  return [...filtered].sort((a,b) => scoreHumanSpanishVoice(b, prefs) - scoreHumanSpanishVoice(a, prefs) || String(a.name).localeCompare(String(b.name), 'es'));
}
function deviceVoiceKey(voice) {
  return `${voice.voiceURI || voice.name || ''}|||${normalizeVoiceLocale(voice.lang)}`;
}
function voiceLabel(v) {
  const tags = [];
  if (v.lang) tags.push(v.lang);
  if (v.localService) tags.push('instalada/local');
  if (/premium|enhanced|natural|neural|google|microsoft|apple|siri/i.test(`${v.name} ${v.voiceURI}`)) tags.push('más natural');
  return `${v.name || 'Voz'}${tags.length ? ' · ' + tags.join(' · ') : ''}`;
}
function getDeviceVoiceOptionsHTML(selected = '', prefs = getVoicePrefs()) {
  const voices = getVisibleDeviceVoices(prefs);
  const automaticLocale = normalizeVoiceLocale(getEffectiveVoiceLocale(prefs, voices));
  const automaticLabel = getVoicePlatform() === 'android'
    ? `Automática: Google TTS del sistema · ${automaticLocale}`
    : `Automática: ${automaticLocale} · país del dispositivo`;
  return [`<option value="">${escapeHTML(automaticLabel)}</option>`].concat(voices.map(v => {
    const id = deviceVoiceKey(v);
    const legacyId = v.voiceURI || v.name || '';
    return `<option value="${escapeHTML(id)}" ${(selected && (selected === id || selected === legacyId)) ? 'selected' : ''}>${escapeHTML(voiceLabel(v))}</option>`;
  })).join('');
}
function getVoiceLanguageOptionsHTML(selected = 'auto', filter = getVoicePrefs().voiceFilter || 'all') {
  const voices = filter === 'spanish' ? getAllDeviceVoices().filter(isSpanishVoice) : getAllDeviceVoices();
  const automaticLocale = normalizeVoiceLocale(getAutomaticSpanishLocale(voices));
  const locales = [...new Set(voices.map(voice => normalizeVoiceLocale(voice.lang)).filter(Boolean))].sort((a,b) => {
    if (a === automaticLocale) return -1;
    if (b === automaticLocale) return 1;
    return a.localeCompare(b, 'es');
  });
  return [`<option value="auto" ${!selected || selected === 'auto' ? 'selected' : ''}>Automático · ${escapeHTML(automaticLocale)} (país del dispositivo)</option>`,
    `<option value="all" ${selected === 'all' ? 'selected' : ''}>${escapeHTML(t('stTodosLosIdiomasVisibles'))}</option>`]
    .concat(locales.map(locale => `<option value="${escapeHTML(locale)}" ${normalizeVoiceLocale(selected) === locale ? 'selected' : ''}>${escapeHTML(locale)}</option>`))
    .join('');
}
function refreshDeviceVoiceSelect() {
  const languageSelect = $('#voiceLanguage');
  const currentPrefs = getVoicePrefs();
  const filter = $('#voiceFilter')?.value || currentPrefs.voiceFilter || 'all';
  if (languageSelect) {
    const language = languageSelect.value || currentPrefs.language || 'auto';
    languageSelect.innerHTML = getVoiceLanguageOptionsHTML(language, filter);
    languageSelect.value = ['auto','all'].includes(language) ? language : normalizeVoiceLocale(language);
  }
  const select = $('#deviceVoiceURI');
  if (!select) return;
  const current = select.value || currentPrefs.deviceVoiceURI || '';
  const livePrefs = {
    ...currentPrefs,
    language:languageSelect?.value || currentPrefs.language || 'auto',
    voiceFilter:filter
  };
  select.innerHTML = getDeviceVoiceOptionsHTML(current, livePrefs);
  if (current) select.value = current;
}
function voiceCatalogSignature() {
  return getAllDeviceVoices().map(voice => `${voice.voiceURI}|${voice.name}|${voice.lang}|${voice.localService}`).sort().join('\n');
}
async function reloadDeviceVoices({ reopenLibrary = false, awaken = true } = {}) {
  const before = voiceCatalogSignature();
  refreshDeviceVoiceSelect();
  if (awaken && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume?.();
      const wake = new SpeechSynthesisUtterance('.');
      wake.lang = getAutomaticSpanishLocale();
      wake.volume = 0;
      wake.rate = 10;
      wake.onend = refreshDeviceVoiceSelect;
      window.speechSynthesis.speak(wake);
      setTimeout(() => {
        window.speechSynthesis.cancel();
        refreshDeviceVoiceSelect();
      }, 650);
    } catch {}
  }
  const waits = getVoicePlatform() === 'android'
    ? [150, 300, 600, 1000, 1500, 2200, 3000]
    : [150, 250, 350, 500, 700, 900];
  for (const wait of waits) {
    await new Promise(resolve => setTimeout(resolve, wait));
    getAllDeviceVoices();
    refreshDeviceVoiceSelect();
  }
  const changed = voiceCatalogSignature() !== before;
  if (reopenLibrary) {
    const platform = getVoicePlatform();
    const inventory = voiceInventory();
    const status = changed
      ? t('tsVocesActualizado')
      : platform === 'android' && !inventory.all.length
        ? t('stVocesAndroidAuto')
        : platform === 'android'
          ? t('stVocesAndroidRevisado')
          : t('stVocesRevisado');
    showVoiceLibrary(status);
  }
  return changed;
}
function getVoicePlatform() {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}
function voiceInventory() {
  const all = getAllDeviceVoices();
  const spanish = all.filter(isSpanishVoice);
  return { all, spanish, local:all.filter(voice => voice.localService) };
}
function showVoiceLibrary(statusMessage = '') {
  const platform = getVoicePlatform();
  const inventory = voiceInventory();
  const iosSteps = `
    <div class="result-card"><h3>${escapeHTML(t('stIphoneOIpad'))}</h3>
      <p>1. Abre Ajustes → Accesibilidad → Leer y hablar.<br>
      2. Entra en Voces → Español.<br>
      3. Elige el dialecto y descarga una voz mejorada o premium si aparece.<br>
      4. Vuelve a Oráculo Místico y pulsa “Volver a detectar”.</p>
      <p class="subtle">${escapeHTML(t('stIosPuedeMantenerElMismoNombre'))}</p>
      <p><a href="https://support.apple.com/guide/iphone/hear-whats-on-the-screen-or-typed-iph96b214f0/ios" target="_blank" rel="noopener">Guía oficial de Apple</a></p>
    </div>`;
  const androidSteps = `
    <div class="result-card"><h3>Android</h3>
      <p>1. Abre Ajustes → Accesibilidad → Salida de texto a voz.<br>
      2. Elige el motor de voz preferido.<br>
      3. Pulsa “Instalar datos de voz” y descarga Español de España o Latinoamérica.<br>
      4. Regresa a la app y pulsa “Volver a detectar”.</p>
      <p class="subtle">Chrome Android puede usar Google TTS sin mostrar cada voz descargada. En ese caso selecciona “Automática: Google TTS del sistema”; Android aplicará el motor, idioma y voz predeterminados.</p>
      <p><a href="https://support.google.com/accessibility/android/answer/6006983" target="_blank" rel="noopener">Guía oficial de Android</a></p>
    </div>`;
  openModal({ icon:'🎙️', title:t('mdVoces'), subtitle:`${inventory.spanish.length} voces españolas detectadas.`, body:`
    <div class="status-grid">
      <div class="status-card"><strong>${escapeHTML(t('stVocesTotales'))}</strong><span>${inventory.all.length}</span></div>
      <div class="status-card"><strong>${escapeHTML(t('stEspanolas'))}</strong><span>${inventory.spanish.length}</span></div>
      <div class="status-card"><strong>${escapeHTML(t('stLocalesVisibles'))}</strong><span>${inventory.local.length}</span></div>
      <div class="status-card"><strong>${escapeHTML(t('stDispositivo'))}</strong><span>${platform==='ios'?'iPhone/iPad':platform==='android'?'Android':'Otro'}</span></div>
    </div>
    <p class="notice mt">${statusMessage ? `${escapeHTML(statusMessage)}<br>` : ''}${window.AndroidTTS ? 'Versión Android nativa: el catálogo procede directamente del motor TTS del teléfono.' : 'La app muestra todo el catálogo que este navegador permite consultar. Firefox, Chrome y Safari pueden mostrar listas diferentes aunque estén instaladas las mismas voces.'}</p>
    ${platform === 'ios' ? iosSteps : platform === 'android' ? androidSteps : iosSteps + androidSteps}
    <div class="actions mt"><button class="btn primary" data-act="refresh-voices">Volver a detectar</button><button class="btn" data-act="test-voice">Probar voz elegida</button>${window.AndroidTTS?.openSettings ? '<button class="btn" data-act="open-tts-settings">Ajustes TTS de Android</button>' : ''}</div>` });
}
function collectVoicePrefsFromControls() {
  const current = getVoicePrefs();
  const value = (id, fallback) => $(id)?.value ?? fallback;
  const preset = value('#voicePreset', current.preset || 'mistica_femenina');
  return {
    engine:value('#voiceEngine', current.engine || 'device'),
    remoteVoice:value('#remoteVoice', current.remoteVoice || 'coral'),
    voiceFilter:value('#voiceFilter', current.voiceFilter || 'all'),
    keepScreenAwake:value('#keepScreenAwake', String(current.keepScreenAwake !== false)) !== 'false',
    language:value('#voiceLanguage', current.language || 'auto'),
    deviceVoiceURI:value('#deviceVoiceURI', current.deviceVoiceURI || ''),
    preset,
    avatarStyle:value('#oracleAvatarStyle', current.avatarStyle || 'auto'),
    avatarRenderMode:value('#oracleAvatarRenderMode', current.avatarRenderMode || 'auto'),
    avatarEnabled:value('#oracleAvatarEnabled', String(current.avatarEnabled !== false)) !== 'false',
    avatarPosition:value('#oracleAvatarPosition', current.avatarPosition || 'right'),
    avatarSize:value('#oracleAvatarSize', current.avatarSize || 'medium'),
    avatarMood:value('#oracleAvatarMood', current.avatarMood || 'auto'),
    avatarSpeechMode:value('#oracleAvatarSpeechMode', current.avatarSpeechMode || 'auto'),
    rate:Number(value('#voiceRate', current.rate || getVoicePreset(preset).rate))
  };
}
function applyLiveAvatarControls() {
  if ($('#oracleAvatarRenderMode') || $('#voicePreset')) setVoicePrefs(collectVoicePrefsFromControls());
  if ($('#effects3dSelect')) set3dPreference($('#effects3dSelect')?.value || get3dPreference());
}
function testVoiceSettings() {
  applyLiveAvatarControls();
  refreshDeviceVoiceSelect();
  previewOracleAvatar();
  unlockAchievement('first_voice');
  const samples = {
    es:'Hola. Esta es una prueba de la voz seleccionada. Respira con calma y escucha el mensaje.',
    ca:'Hola. Aquesta és una prova de la veu seleccionada. Respira amb calma i escolta el missatge.',
    en:'Hello. This is a test of the selected voice. Breathe calmly and listen to the message.',
    fr:'Bonjour. Ceci est un test de la voix sélectionnée. Respirez calmement et écoutez le message.',
    de:'Hallo. Dies ist ein Test der ausgewählten Stimme. Atme ruhig und höre die Nachricht.',
    zh:'你好。这是所选语音的测试。请平静呼吸并聆听这段讯息。'
  };
  speakText(samples[getAppLanguage()] || samples.es);
}
function getPreferredVoice(prefs = getVoicePrefs()) {
  const voices = getAllDeviceVoices();
  if (!voices.length) return null;
  if (prefs.deviceVoiceURI) {
    const chosen = voices.find(v => deviceVoiceKey(v) === prefs.deviceVoiceURI || v.voiceURI === prefs.deviceVoiceURI || v.name === prefs.deviceVoiceURI);
    if (chosen) return chosen;
  }
  const preferredLanguage = normalizeVoiceLocale(getEffectiveVoiceLocale(prefs)).split('-')[0];
  const matching = voices.filter(voice => normalizeVoiceLocale(voice.lang).split('-')[0] === preferredLanguage);
  const spanish = voices.filter(isSpanishVoice);
  const pool = matching.length ? matching : (spanish.length ? spanish : voices);
  return [...pool].sort((a,b) => scoreHumanSpanishVoice(b, prefs) - scoreHumanSpanishVoice(a, prefs))[0] || null;
}
function cleanSpeechText(text = '') {
  return cleanInterpretation(String(text || ''))
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ')
    .replace(/\b(destellos?|iconos?|estrella|brillo|orbe|emoji|bot[oó]n|pdf|guardar|compartir)\b/gi, ' ')
    .replace(/\b(Profundizar IA|Leer IA|Parar|Copiar todo|Incluir IA en PDF|PDF|Guardar|Compartir)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function hasSpanishDeviceVoice() {
  return getAllDeviceVoices().some(isSpanishVoice);
}

function resolveOracleAvatarStyle(prefs = getVoicePrefs()) {
  const style = prefs.avatarStyle || 'auto';
  if (style && style !== 'auto') return style;
  const preset = String(prefs.preset || '').toLowerCase();
  if (preset.includes('masc')) return 'male';
  return 'female';
}
function shouldUseOracleAvatar3D(prefs = getVoicePrefs()) {
  const mode = normalizeAvatarRenderMode(prefs);
  const quality = get3dPreference();
  if (mode !== '3d') return false;
  if (quality !== 'high') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return false;
  if (!window.WebGLRenderingContext) return false;
  return true;
}
function resolveOracleAvatarTheme(message = '', reading = lastReading || {}) {
  const text = `${message || ''} ${reading?.type || ''} ${reading?.title || ''}`.toLowerCase();
  if (/runa|runas/.test(text)) return 'runes';
  if (/luna|moon|fase/.test(text)) return 'moon';
  if (/tarot|arcano|carta/.test(text)) return 'tarot';
  return 'chat';
}
function resolveOracleAvatarMood(message = '', prefs = getVoicePrefs()) {
  if (prefs.avatarMood && prefs.avatarMood !== 'auto') return prefs.avatarMood;
  const text = String(message || '').toLowerCase();
  if (/amor|corazón|corazon|pareja|cariño|carino|ternura|vínculo|vinculo/.test(text)) return 'love';
  if (/éxito|exito|logro|avance|victoria|luz|crecimiento|celebra|buenas noticias|alegr/.test(text)) return 'smile';
  if (/advertencia|atenci[oó]n|cuidado|sombra|riesgo|límite|limite|prudencia/.test(text)) return 'warning';
  if (/bloqueo|bloqueada|estancad|peso|miedo|duda|confusi[oó]n|nudo/.test(text)) return 'blocked';
  if (/luna|sueño|sueno|intuici[oó]n|silencio|descanso|emocion|emoción/.test(text)) return 'dream';
  if (/runa|fuerza|ra[ií]z|protecci[oó]n|guardi[aá]n/.test(text)) return 'power';
  return 'calm';
}
function resolveOracleSpeechMode(message = '', prefs = getVoicePrefs()) {
  if (prefs.avatarSpeechMode && prefs.avatarSpeechMode !== 'auto') return prefs.avatarSpeechMode;
  const text = String(message || '').toLowerCase();
  if (/canaliz|universo|energ[ií]a|mensaje/.test(text) || text.length > 180) return 'channeling';
  return 'whisper';
}
function getOracleSpeechLabel(mode = 'channeling') {
  return mode === 'whisper' ? 'El oráculo está susurrando…' : 'El oráculo está canalizando…';
}

function getOracleMoodLabel(mood = 'calm') {
  const labels = {
    calm:'Serenidad',
    smile:'Luz',
    serious:'Claridad',
    love:'Amor',
    warning:'Atención',
    blocked:'Bloqueo',
    dream:'Intuición',
    power:'Fuerza'
  };
  return labels[mood] || 'Serenidad';
}
function getOracleReadingVisuals(reading = lastReading) {
  const cardVisuals = resolveReadingAssets(reading).filter(asset => asset.kind === 'tarot' || asset.kind === 'runa').slice(0, 12).map(asset => ({
    kind: asset.kind || 'lectura',
    name: asset.name || '',
    image: asset.image || '',
    symbol: asset.symbol || (asset.kind === 'runa' ? 'ᚱ' : asset.kind === 'luna' ? '🌙' : '🃏'),
    reversed: !!asset.reversed
  }));
  if (cardVisuals.length) return cardVisuals;
  const meta = reading?.meta || {};
  if (reading?.type === 'Sueños' && meta.dreamElement) {
    const symbols = { Agua:'💧', Fuego:'🔥', Aire:'◌', Tierra:'◆', Éter:'✦' };
    return [{
      kind:'dream-element',
      name:meta.dreamElement.name,
      subtitle:meta.dreamElement.explanation,
      symbol:symbols[meta.dreamElement.name] || '✦'
    }];
  }
  if (reading?.type === 'Numerología' && meta.numbers) {
    return [
      { kind:'number', name:'Camino', value:String(meta.numbers.life), subtitle:'Camino de vida' },
      { kind:'number', name:'Expresión', value:String(meta.numbers.expression), subtitle:'Número de expresión' },
      { kind:'number', name:'Año', value:String(meta.numbers.personalYear), subtitle:'Año personal' }
    ];
  }
  if (reading?.type === 'Grabovoi' && meta.grabovoiCode) {
    return [{
      kind:'grabovoi',
      name:'Código consultado',
      value:String(meta.grabovoiCode),
      subtitle:meta.grabovoiPurpose || reading.title || ''
    }];
  }
  return [];
}
function buildOracleReadingVisualsHTML(visuals = []) {
  if (!visuals.length) return '<div class="oracle-avatar-symbol">🔮</div>';
  if (visuals[0].kind === 'dream-element') {
    const visual = visuals[0];
    return `<div class="oracle-reading-special oracle-dream-special">
      <span class="oracle-special-symbol">${escapeHTML(visual.symbol)}</span>
      <div><small>${escapeHTML(t('stPredomina'))}</small><strong>${escapeHTML(visual.name)}</strong><p>${escapeHTML(clampText(visual.subtitle, 105))}</p></div>
    </div>`;
  }
  if (visuals[0].kind === 'number') {
    return `<div class="oracle-reading-special oracle-number-special">${visuals.map(visual => `
      <div class="oracle-number-chip" title="${escapeHTML(visual.subtitle)}"><span>${escapeHTML(visual.value)}</span><small>${escapeHTML(visual.name)}</small></div>`).join('')}
    </div>`;
  }
  if (visuals[0].kind === 'grabovoi') {
    const visual = visuals[0];
    return `<div class="oracle-reading-special oracle-grabovoi-special">
      <small>${escapeHTML(visual.name)}</small>
      <strong>${escapeHTML(visual.value)}</strong>
      <p>${escapeHTML(clampText(visual.subtitle, 85))}</p>
    </div>`;
  }
  return `<div class="oracle-reading-visuals count-${visuals.length} ${visuals.length > 3 ? 'many' : ''} ${visuals.length > 5 ? 'dense' : ''}">${visuals.map(visual => `
    <div class="oracle-reading-visual ${visual.reversed ? 'reversed' : ''}" title="${escapeHTML(visual.name)}">
      ${visual.image
        ? `<img src="${escapeHTML(visual.image)}" alt="${escapeHTML(visual.name)}" loading="eager" referrerpolicy="no-referrer">`
        : `<span>${escapeHTML(visual.symbol)}</span>`}
      <small>${escapeHTML(clampText(visual.name, 24))}</small>
    </div>`).join('')}</div>`;
}
function buildOracleAvatarHTML(style = 'female', message = 'El oráculo está canalizando…', theme = 'chat', mood = 'calm', speechMode = 'channeling') {
  const prefs = getVoicePrefs();
  const isMale = style === 'male';
  const title = isMale ? 'Oráculo guardián' : 'Oráculo guía';
  const speechLabel = speechMode === 'whisper' ? 'Susurrando' : 'Canalizando';
  const portrait = isMale ? 'img/avatars/oracle-male-realistic.webp' : 'img/avatars/oracle-female-realistic.webp';
  const portraitMedium = isMale ? 'img/avatars/oracle-male-mouth-medium.webp' : 'img/avatars/oracle-female-mouth-medium.webp';
  const portraitOpen = isMale ? 'img/avatars/oracle-male-mouth-open.webp' : 'img/avatars/oracle-female-mouth-open.webp';
  const readingVisuals = getOracleReadingVisuals();
  const avatar3d = shouldUseOracleAvatar3D(prefs);
  const avatar3dAsset = isMale ? 'avatarMale' : 'avatarFemale';
  return `
    <div class="oracle-avatar-window ${isMale ? 'male' : 'female'} theme-${theme} mood-${mood} mode-${speechMode} ${avatar3d ? 'uses-avatar-3d' : ''} ${readingVisuals.length ? 'has-reading-visuals' : ''}">
      <button class="oracle-avatar-close" type="button" data-act="hide-avatar" aria-label="Cerrar avatar">×</button>
      <div class="oracle-avatar-stage ${avatar3d ? 'has-avatar-3d' : ''}">
        <div class="oracle-avatar-aura"></div>
        <div class="oracle-avatar-stars"><span></span><span></span><span></span><span></span></div>
        <div class="oracle-avatar-realistic">
          <div class="oracle-avatar-frames" aria-label="${title}">
            <img class="oracle-avatar-frame frame-closed active" src="${portrait}" alt="${title}" width="720" height="900">
            <img class="oracle-avatar-frame frame-medium" src="${portraitMedium}" alt="" width="720" height="900">
            <img class="oracle-avatar-frame frame-wide" src="${portraitOpen}" alt="" width="720" height="900">
          </div>
          <div class="oracle-avatar-realistic-shade"></div>
          <div class="oracle-avatar-voice-ring" aria-hidden="true"></div>
        </div>
        ${avatar3d ? `<div class="om-3d-stage oracle-avatar-3d-stage" data-oraculo-3d-asset="${avatar3dAsset}" aria-hidden="true"></div>` : ''}
      </div>
      <div class="oracle-avatar-copy">
        <div class="oracle-avatar-badge">${speechLabel} · ${getOracleMoodLabel(mood)}</div>
        <strong>${title}</strong>
        ${readingVisuals.length ? buildOracleReadingVisualsHTML(readingVisuals) : `<small>${escapeHTML(message)}</small>`}
        <div class="oracle-avatar-status"><span></span><span></span><span></span></div>
      </div>
    </div>`;
}
function ensureOracleAvatarHost() {
  let host = document.getElementById('oracleVoiceAvatarHost');
  if (!host) {
    host = document.createElement('div');
    host.id = 'oracleVoiceAvatarHost';
    host.className = 'oracle-avatar-host';
    document.body.appendChild(host);
  }
  return host;
}
function setOracleAvatarState(host, state = 'idle') {
  if (!host) return;
  host.classList.remove('attending', 'paused', 'closing');
  if (state && state !== 'idle') host.classList.add(state);
  host.dataset.avatarState = state || 'idle';
}
function setOracleProsodyCue(cue = 'neutral', duration = 360) {
  const host = document.getElementById('oracleVoiceAvatarHost');
  if (!host) return;
  if (oracleProsodyTimer) clearTimeout(oracleProsodyTimer);
  host.classList.remove('prosody-pause', 'prosody-emphasis', 'prosody-question');
  const cleanCue = ['pause', 'emphasis', 'question'].includes(cue) ? cue : 'neutral';
  host.dataset.prosodyCue = cleanCue;
  host.style.setProperty('--oracle-prosody-emphasis', cleanCue === 'emphasis' ? '1' : cleanCue === 'question' ? '.72' : '0');
  host.style.setProperty('--oracle-prosody-pause', cleanCue === 'pause' ? '1' : '0');
  if (cleanCue !== 'neutral') host.classList.add(`prosody-${cleanCue}`);
  oracleProsodyTimer = setTimeout(() => {
    host.classList.remove('prosody-pause', 'prosody-emphasis', 'prosody-question');
    host.dataset.prosodyCue = 'neutral';
    host.style.setProperty('--oracle-prosody-emphasis', '0');
    host.style.setProperty('--oracle-prosody-pause', '0');
    oracleProsodyTimer = null;
  }, Math.max(160, Number(duration) || 360));
}
function applyOracleAvatarPrefs(host, prefs = getVoicePrefs()) {
  host.classList.remove('pos-left','pos-right','size-small','size-medium','size-large');
  host.classList.add(`pos-${prefs.avatarPosition || 'right'}`, `size-${prefs.avatarSize || 'medium'}`);
}
function showOracleVoiceAvatar(message = '') {
  const prefs = getVoicePrefs();
  if (prefs.avatarEnabled === false) return;
  const host = ensureOracleAvatarHost();
  const cleaned = clampText(cleanSpeechText(message), 180) || getOracleSpeechLabel(resolveOracleSpeechMode(message, prefs));
  const theme = resolveOracleAvatarTheme(message);
  const mood = resolveOracleAvatarMood(message, prefs);
  const speechMode = resolveOracleSpeechMode(message, prefs);
  if (oracleAvatarHideTimer) clearTimeout(oracleAvatarHideTimer);
  oracleAvatarHideTimer = null;
  host.innerHTML = buildOracleAvatarHTML(resolveOracleAvatarStyle(prefs), cleaned, theme, mood, speechMode);
  applyOracleAvatarPrefs(host, prefs);
  setOracleMouthShape('closed');
  setOracleProsodyCue('neutral', 180);
  setOracleAvatarState(host, 'attending');
  host.classList.add('visible', 'speaking');
  if (shouldUseOracleAvatar3D(prefs)) requestAnimationFrame(() => window.Oraculo3D?.refresh?.());
  setTimeout(() => {
    if (host.classList.contains('visible')) setOracleAvatarState(host, 'idle');
  }, 640);
}
function updateOracleVoiceAvatarSpeaking(speaking = true) {
  const host = ensureOracleAvatarHost();
  host.classList.toggle('speaking', !!speaking);
  setOracleAvatarState(host, speaking ? 'idle' : 'paused');
  if (!speaking) stopOracleLipSync();
}
function mouthIntensityForShape(shape = 'closed') {
  if (shape === 'wide') return 1;
  if (shape === 'medium') return 0.58;
  return 0;
}
function setOracleMouthShape(shape = 'closed') {
  const host = document.getElementById('oracleVoiceAvatarHost');
  if (host) {
    const intensity = mouthIntensityForShape(shape);
    host.dataset.mouthShape = shape;
    host.style.setProperty('--oracle-mouth-intensity', String(intensity));
  }
  const frames = $$('.oracle-avatar-frame');
  if (!frames.length) return;
  frames.forEach(frame => frame.classList.toggle('active', frame.classList.contains(`frame-${shape}`)));
}
/* ------------------------------------------------------------------
   Movimiento de boca

   Antes se avanzaba letra a letra y toda consonante devolvia 'closed',
   asi que en "oraculo" la boca hacia o-cerrada-a-cerrada-u-cerrada-o:
   se veia masticar, no hablar. Ademas se cerraba tras cada vocal dentro
   de la misma palabra.

   Ahora manda la silaba, que es la unidad que de verdad abre la boca al
   hablar. Dentro de una palabra la boca no se cierra: pasa de una forma
   a la siguiente. Solo se cierra donde se cierra de verdad: en las
   bilabiales (p, b, m), en las pausas y al final.
   ------------------------------------------------------------------ */

const VOCALES = 'aeiouáéíóúüAEIOUÁÉÍÓÚÜ';
const VOCAL_FUERTE = 'aeoáéóAEOÁÉÓ';
/* Grupos que nunca se separan al silabear. */
const GRUPOS_UNIDOS = ['ch', 'll', 'rr', 'pr', 'br', 'tr', 'dr', 'cr', 'gr', 'fr',
                       'pl', 'bl', 'cl', 'gl', 'fl'];

function esVocal(c) { return VOCALES.includes(c); }
function esFuerte(c) { return VOCAL_FUERTE.includes(c); }

/* Dos vocales seguidas forman diptongo salvo que ambas sean fuertes o
   la debil lleve tilde: ahi hay hiato y son dos silabas. */
function hayDiptongo(a, b) {
  if (!esVocal(a) || !esVocal(b)) return false;
  if (esFuerte(a) && esFuerte(b)) return false;
  if ('íúÍÚ'.includes(a) || 'íúÍÚ'.includes(b)) return false;
  return true;
}

function silabear(palabra) {
  const w = String(palabra || '');
  if (!w) return [];
  const silabas = [];
  let actual = '';
  let i = 0;
  while (i < w.length) {
    actual += w[i];
    if (esVocal(w[i])) {
      /* Se absorbe el diptongo o triptongo. */
      while (i + 1 < w.length && hayDiptongo(w[i], w[i + 1])) {
        i += 1; actual += w[i];
      }
      /* Consonantes hasta la siguiente vocal: deciden donde se corta. */
      let j = i + 1, grupo = '';
      while (j < w.length && !esVocal(w[j])) { grupo += w[j]; j += 1; }
      if (j >= w.length) { actual += grupo; break; }          // final de palabra
      if (grupo.length === 0) {
        silabas.push(actual); actual = '';
      } else if (grupo.length === 1) {
        silabas.push(actual); actual = '';                     // V-CV
      } else if (grupo.length === 2) {
        if (GRUPOS_UNIDOS.includes(grupo.toLowerCase())) {
          silabas.push(actual); actual = '';                   // el grupo pasa entero
        } else {
          actual += grupo[0]; silabas.push(actual); actual = ''; i += 1;   // VC-CV
        }
      } else {
        const dos = grupo.slice(-2).toLowerCase();
        const corte = GRUPOS_UNIDOS.includes(dos) ? grupo.length - 2 : grupo.length - 1;
        actual += grupo.slice(0, corte); silabas.push(actual); actual = '';
        i += corte;
      }
    }
    i += 1;
  }
  if (actual) {
    if (silabas.length && !/[aeiouáéíóúü]/i.test(actual)) silabas[silabas.length - 1] += actual;
    else silabas.push(actual);
  }
  return silabas.filter(Boolean);
}

/* Con tres imagenes solo caben tres aperturas. Se reparten por como se
   abre la boca de verdad: a y o abiertas, el resto entreabierta. */
function formaDeVocal(v) {
  const c = String(v).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if ('ao'.includes(c)) return 'wide';
  if ('eiu'.includes(c)) return 'medium';
  return 'closed';
}

function nucleoDeSilaba(silaba) {
  const v = [...String(silaba)].filter(esVocal);
  if (!v.length) return null;
  /* Manda la vocal mas abierta del nucleo. */
  return v.find(x => esFuerte(x)) || v[0];
}

/* Pasos de boca de una palabra: uno por silaba, con cierre solo donde
   la lengua lo hace. Cada paso lleva su peso de duracion. */
function pasosDeBoca(palabra) {
  const silabas = silabear(palabra);
  if (!silabas.length) return [{ forma: 'closed', peso: 1 }];
  const pasos = [];
  silabas.forEach(silaba => {
    /* Bilabial al empezar: los labios se juntan un instante. */
    if (/^[pbm]/i.test(silaba)) pasos.push({ forma: 'closed', peso: .35 });
    const nucleo = nucleoDeSilaba(silaba);
    pasos.push({ forma: nucleo ? formaDeVocal(nucleo) : 'medium', peso: 1 });
  });
  /* Al terminar la palabra la boca se relaja, no se cierra de golpe. */
  pasos.push({ forma: 'closed', peso: .5 });
  return pasos;
}

/* Pasos de tamano de texto. El 100 no pone atributo: asi respeta el
   tamano base del navegador de quien lo tenga cambiado. */
const ESCALAS_TEXTO = [100, 112, 125, 140];

function getEscalaTexto() {
  const p = storeGet(LS.prefs, {});
  if (ESCALAS_TEXTO.includes(Number(p.textScale))) return Number(p.textScale);
  /* Quien tenia activado el antiguo "Texto grande" pasa a un paso que
     de verdad se note. */
  return p.largeText ? 125 : 100;
}

function aplicarEscalaTexto() {
  const e = getEscalaTexto();
  if (e === 100) document.documentElement.removeAttribute('data-text-scale');
  else document.documentElement.setAttribute('data-text-scale', String(e));
}

function siguienteEscalaTexto() {
  const i = ESCALAS_TEXTO.indexOf(getEscalaTexto());
  return ESCALAS_TEXTO[(i + 1) % ESCALAS_TEXTO.length];
}

function mouthShapeForCharacter(character = '') {
  const clean = character.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/[ao]/.test(clean)) return 'wide';
  if (/[e]/.test(clean)) return 'medium';
  if (/[iu]/.test(clean)) return 'medium';
  return 'closed';
}
function getSpokenWordAt(text = '', charIndex = 0) {
  const source = String(text || '');
  let start = Math.max(0, Math.min(Number(charIndex) || 0, source.length));
  while (start > 0 && /[\p{L}\p{N}]/u.test(source[start - 1])) start -= 1;
  let end = start;
  while (end < source.length && /[\p{L}\p{N}]/u.test(source[end])) end += 1;
  return { start, end, word:source.slice(start, end) };
}
function buildWordMouthSequence(word = '') {
  return pasosDeBoca(word);
}
function resolveOracleProsodyCue(text = '', charIndex = 0, spoken = null) {
  const source = String(text || '');
  const i = Math.max(0, Math.min(Number(charIndex) || 0, source.length));
  const before = source.slice(Math.max(0, i - 4), i + 1);
  const after = source.slice(i, Math.min(source.length, i + 4));
  if (/[?¿]/.test(before + after)) return 'question';
  if (/[!¡]/.test(before + after)) return 'emphasis';
  if (/[.;:,…]/.test(before)) return 'pause';
  const word = String((spoken || getSpokenWordAt(source, i)).word || '');
  if (word.length >= 10) return 'emphasis';
  return 'neutral';
}
function decorateMouthStepsWithWordCue(steps = [], word = '') {
  if (!steps.length) return steps;
  if (String(word || '').length >= 10) steps[0] = { ...steps[0], cue:'emphasis' };
  return steps;
}
function syncOracleMouthToText(text = '', charIndex = 0, rate = 0.92) {
  const spoken = getSpokenWordAt(text, charIndex);
  const cue = resolveOracleProsodyCue(text, charIndex, spoken);
  if (!spoken.word) {
    setOracleProsodyCue(cue === 'neutral' ? 'pause' : cue, 320);
    stopOracleLipSync();
    return;
  }
  if (spoken.start === oracleLipWordStart && oracleLipTimer) return;
  stopOracleLipSync(false);
  oracleLipWordStart = spoken.start;
  const pasos = decorateMouthStepsWithWordCue(buildWordMouthSequence(spoken.word), spoken.word);
  setOracleProsodyCue(cue, cue === 'pause' ? 380 : 460);
  /* Una silaba castellana ronda los 180 ms a velocidad normal. El tiempo
     se reparte segun el peso: el cierre bilabial dura menos que la vocal. */
  const velocidad = Math.max(Number(rate) || 0.92, 0.55);
  const pesoTotal = pasos.reduce((a, x) => a + x.peso, 0) || 1;
  const duracion = (pasos.length * 150) / velocidad;
  let index = 0;
  const advance = () => {
    const paso = pasos[index];
    if (!paso) {
      setOracleMouthShape('closed');
      oracleLipTimer = null;
      return;
    }
    setOracleMouthShape(paso.forma);
    const ms = Math.max(45, Math.min(220, (duracion * paso.peso) / pesoTotal));
    index += 1;
    oracleLipTimer = setTimeout(advance, ms);
  };
  advance();
}
/* Cuando el navegador no avisa de los limites de palabra se recorre el
   texto por silabas al ritmo estimado, en vez de letra a letra. */
function pasosDeTexto(texto) {
  const pasos = [];
  String(texto || 'oráculo').split(/(\s+|[.,;:!?¡¿…]+)/).forEach(trozo => {
    if (!trozo) return;
    if (/^[\s.,;:!?¡¿…]+$/.test(trozo)) {
      const cue = /[?¿]/.test(trozo) ? 'question' : /[!¡]/.test(trozo) ? 'emphasis' : /[.;:,…]/.test(trozo) ? 'pause' : 'neutral';
      pasos.push({ forma: 'closed', peso: /[.;:!?…]/.test(trozo) ? 2.4 : 1, cue });
      return;
    }
    decorateMouthStepsWithWordCue(pasosDeBoca(trozo), trozo).forEach(x => pasos.push(x));
  });
  return pasos.length ? pasos : [{ forma: 'closed', peso: 1 }];
}

function startOracleLipSync(text = 'oráculo', rate = 0.92) {
  stopOracleLipSync(false);
  const pasos = pasosDeTexto(text);
  const velocidad = Math.max(Number(rate) || .92, .55);
  let index = 0;
  const advance = () => {
    const paso = pasos[index % pasos.length];
    setOracleMouthShape(paso.forma);
    if (paso.cue && paso.cue !== 'neutral') setOracleProsodyCue(paso.cue, paso.cue === 'pause' ? 420 : 360);
    index += 1;
    oracleLipTimer = setTimeout(advance, Math.max(50, (150 * paso.peso) / velocidad));
  };
  advance();
}
function startRemoteAudioLipSync(audio, text = '') {
  stopOracleLipSync(false);
  const source = String(text || '');
  const pasosAudio = pasosDeTexto(source);
  const estimatedDuration = Math.max(1, (source.split(/\s+/).filter(Boolean).length / 2.35));
  const tick = () => {
    if (!audio || audio.ended) {
      stopOracleLipSync();
      return;
    }
    if (audio.paused) {
      setOracleMouthShape('closed');
    } else {
      /* Se sigue el progreso real del audio, pero sobre la lista de
         silabas: antes se tomaba la letra que tocaba y las consonantes
         cerraban la boca a destiempo. */
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : estimatedDuration;
      const progress = Math.max(0, Math.min(0.999, (audio.currentTime || 0) / duration));
      const i = Math.min(pasosAudio.length - 1, Math.floor(progress * pasosAudio.length));
      const paso = pasosAudio[Math.max(0, i)] || {};
      setOracleMouthShape(paso.forma || 'closed');
      if (paso.cue && paso.cue !== 'neutral') setOracleProsodyCue(paso.cue, paso.cue === 'pause' ? 420 : 360);
    }
    oracleLipTimer = setTimeout(tick, 65);
  };
  tick();
}
function stopOracleLipSync(reset = true) {
  if (oracleLipTimer) clearTimeout(oracleLipTimer);
  oracleLipTimer = null;
  oracleLipWordStart = -1;
  if (reset) setOracleMouthShape('closed');
}
function pulseOracleMouth(charIndex = 0, text = activeSpeech.text, rate = getVoicePrefs().rate) {
  syncOracleMouthToText(text, charIndex, rate);
}
function hideOracleVoiceAvatar() {
  stopOracleLipSync();
  const host = document.getElementById('oracleVoiceAvatarHost');
  if (!host) return;
  if (oracleAvatarHideTimer) clearTimeout(oracleAvatarHideTimer);
  if (oracleProsodyTimer) clearTimeout(oracleProsodyTimer);
  setOracleProsodyCue('neutral', 120);
  setOracleAvatarState(host, 'closing');
  host.classList.remove('speaking');
  oracleAvatarHideTimer = setTimeout(() => {
    host.classList.remove('visible');
    setOracleAvatarState(host, 'idle');
    oracleAvatarHideTimer = null;
  }, 220);
}
function previewOracleAvatar() {
  applyLiveAvatarControls();
  const prefs = getVoicePrefs();
  const mode = resolveOracleSpeechMode('El oráculo comparte un mensaje de prueba.', prefs);
  const previewText = mode === 'whisper' ? 'El oráculo comparte un susurro de prueba para ti.' : 'El oráculo está canalizando un mensaje de prueba para ti.';
  showOracleVoiceAvatar(previewText);
  startOracleLipSync(previewText, prefs.rate);
  setTimeout(()=>hideOracleVoiceAvatar(), 3800);
}
function previewOracleAvatarEmotions() {
  const samples = [
    'Amor y ternura abren una puerta suave en tu camino.',
    'La alegría confirma que hay luz suficiente para dar el paso.',
    'Hay una advertencia: actúa con prudencia y cuida tus límites.',
    'La claridad llega cuando miras el asunto con calma y precisión.',
    'Un bloqueo empieza a transformarse cuando aceptas tu duda.',
    'La luna y la intuición te piden escuchar en silencio.',
    'La fuerza rúnica te protege y te invita a avanzar.'
  ];
  let i = 0;
  const run = () => {
    showOracleVoiceAvatar(samples[i]);
    startOracleLipSync(samples[i], getVoicePrefs().rate);
    i += 1;
    if (i < samples.length) setTimeout(run, 1600);
    else setTimeout(()=>hideOracleVoiceAvatar(), 2200);
  };
  run();
}

async function requestVoiceWakeLock() {
  if (!getVoicePrefs().keepScreenAwake || !navigator.wakeLock?.request || document.hidden) return false;
  try {
    if (!voiceWakeLock) {
      const lock = await navigator.wakeLock.request('screen');
      voiceWakeLock = lock;
      lock.addEventListener?.('release', () => {
        if (voiceWakeLock === lock) voiceWakeLock = null;
      });
    }
    return true;
  } catch {
    voiceWakeLock = null;
    return false;
  }
}
async function releaseVoiceWakeLock() {
  try { await voiceWakeLock?.release?.(); } catch {}
  voiceWakeLock = null;
}
function resetActiveSpeech() {
  activeSpeech = { text: '', charIndex: 0, active: false, interrupted: false };
}
function setFloatingVoiceStopVisible(visible) {
  const button = document.getElementById('floatingVoiceStop');
  if (!button) return;
  button.classList.toggle('visible', Boolean(visible));
  button.setAttribute('aria-hidden', visible ? 'false' : 'true');
  button.tabIndex = visible ? 0 : -1;
}
function resumeInterruptedSpeech() {
  if (!activeSpeech.active || !activeSpeech.interrupted || document.hidden || window.speechSynthesis?.speaking) return;
  const start = Math.max(0, activeSpeech.charIndex - 18);
  const remaining = activeSpeech.text.slice(start).trim();
  if (!remaining) return resetActiveSpeech();
  activeSpeech.interrupted = false;
  speakWithDevice(remaining, { resume: true, fullText: activeSpeech.text, offset: start });
  toast(t('tsResumed'));
}
function handleSpeechVisibility() {
  if (document.hidden) {
    if (activeSpeech.active) activeSpeech.interrupted = true;
    return;
  }
  if (activeSpeech.active) requestVoiceWakeLock();
  setTimeout(resumeInterruptedSpeech, 350);
}

function speakWithDevice(clean, options = {}) {
  if (window.AndroidTTS?.speak && window.AndroidTTS?.isReady?.()) {
    const prefs = getVoicePrefs();
    const voice = getPreferredVoice(prefs);
    activeSpeech = { text:options.fullText || clean, charIndex:Number(options.offset || 0), active:true, interrupted:false };
    showOracleVoiceAvatar(clean);
    requestVoiceWakeLock();
    const started = window.AndroidTTS.speak(clean, voice?.voiceURI || '', Number(prefs.rate || 0.92), Number(prefs.pitch || 1));
    if (started) {
      setFloatingVoiceStopVisible(true);
      return true;
    }
    setFloatingVoiceStopVisible(false);
    resetActiveSpeech();
    releaseVoiceWakeLock();
    hideOracleVoiceAvatar();
  }
  if (!('speechSynthesis' in window)) return false;
  const sessionId = ++voiceSpeechSession;
  window.speechSynthesis.cancel();
  const prefs = getVoicePrefs();
  const offset = Number(options.offset || 0);
  if (!options.resume) activeSpeech = { text: clean, charIndex: 0, active: true, interrupted: false };
  else activeSpeech = { text: options.fullText || activeSpeech.text || clean, charIndex: offset, active: true, interrupted: false };
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = getEffectiveVoiceLocale(prefs);
  utter.rate = Number(prefs.rate || 0.92);
  utter.pitch = Number(prefs.pitch || 1);
  utter.volume = 1;
  const voice = getPreferredVoice(prefs);
  if (voice) {
    utter.voice = voice;
    utter.lang = voice.lang || utter.lang;
  }
  utter.onstart = () => {
    if (sessionId !== voiceSpeechSession) return;
    setFloatingVoiceStopVisible(true);
    requestVoiceWakeLock(); showOracleVoiceAvatar(clean); setOracleMouthShape('closed');
  };
  utter.onboundary = event => {
    if (sessionId !== voiceSpeechSession) return;
    activeSpeech.charIndex = offset + Number(event?.charIndex || 0);
    pulseOracleMouth(activeSpeech.charIndex, activeSpeech.text, prefs.rate);
  };
  utter.onresume = () => { if (sessionId === voiceSpeechSession) updateOracleVoiceAvatarSpeaking(true); };
  utter.onpause = () => { if (sessionId === voiceSpeechSession) updateOracleVoiceAvatarSpeaking(false); };
  utter.onend = () => {
    if (sessionId !== voiceSpeechSession) return;
    if (document.hidden && activeSpeech.active) activeSpeech.interrupted = true;
    else { setFloatingVoiceStopVisible(false); resetActiveSpeech(); releaseVoiceWakeLock(); hideOracleVoiceAvatar(); }
  };
  utter.onerror = (event) => {
    if (sessionId !== voiceSpeechSession) return;
    if (document.hidden && activeSpeech.active) activeSpeech.interrupted = true;
    else {
      pushErrorLog('tts-avatar', event?.error || 'Error de voz', 'speech avatar');
      setFloatingVoiceStopVisible(false);
      resetActiveSpeech();
      releaseVoiceWakeLock();
      hideOracleVoiceAvatar();
    }
  };
  showOracleVoiceAvatar(clean);
  setFloatingVoiceStopVisible(true);
  window.speechSynthesis.speak(utter);
  return true;
}
window.onNativeTTSStart = () => {
  setFloatingVoiceStopVisible(true);
  updateOracleVoiceAvatarSpeaking(true);
  setOracleMouthShape('closed');
  requestVoiceWakeLock();
};
window.onNativeTTSRange = charIndex => {
  activeSpeech.charIndex = Number(charIndex || 0);
  pulseOracleMouth(activeSpeech.charIndex, activeSpeech.text, getVoicePrefs().rate);
};
window.onNativeTTSDone = () => {
  setFloatingVoiceStopVisible(false);
  resetActiveSpeech();
  releaseVoiceWakeLock();
  hideOracleVoiceAvatar();
};
window.onNativeTTSError = message => {
  pushErrorLog('android-native-tts', message || 'Error de voz Android', 'native speech');
  setFloatingVoiceStopVisible(false);
  resetActiveSpeech();
  releaseVoiceWakeLock();
  hideOracleVoiceAvatar();
};
async function speakText(text) {
  const clean = cleanSpeechText(text);
  if (!clean) return toast(t('tsNoAiText'));
  stopSpeech();
  const prefs = getVoicePrefs();
  const usePuter = prefs.engine === 'puter' || (prefs.engine === 'auto' && localStorage.getItem(LS.puter) === 'true');
  if (usePuter) {
    const remoteOk = await speakWithPuter(clean);
    if (remoteOk) return;
    toast(t('tsAiVoiceOff'));
  }
  const ok = speakWithDevice(clean);
  if (!ok) return toast(t('tsVoiceOff'));
  const inventory = voiceInventory();
  if (!hasSpanishDeviceVoice() && inventory.all.length) toast(t('tsNoEsVoice'));
  else if (getVoicePlatform() === 'android' && !inventory.all.length) toast(t('tsGoogleTts'));
}
function generatedSpeechKey(clean, prefs = getVoicePrefs()) {
  return `${prefs.remoteVoice || 'coral'}|${clean}`;
}
async function generatePuterSpeech(clean) {
  if (!window.puter?.ai?.txt2speech) return null;
  const prefs = getVoicePrefs();
  const key = generatedSpeechKey(clean, prefs);
  if (lastGeneratedSpeech?.key === key && lastGeneratedSpeech.audio?.src) return lastGeneratedSpeech.audio;
  const audio = await window.puter.ai.txt2speech(clean.slice(0, 2990), {
    provider:'openai',
    model:'gpt-4o-mini-tts',
    voice:prefs.remoteVoice || (resolveOracleAvatarStyle(prefs) === 'male' ? 'onyx' : 'coral'),
    response_format:'mp3',
    instructions:`Usa el idioma ${getAppLocale()} con voz cálida, natural, serena y clara. Ritmo pausado, sin dramatización excesiva.`
  });
  lastGeneratedSpeech = { key, audio };
  return audio;
}
function setMediaSessionForReading() {
  if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title:lastReading?.title || 'Lectura del Oráculo',
      artist:'Oráculo Místico',
      album:'Voz IA'
    });
    navigator.mediaSession.setActionHandler('play', () => remoteSpeechAudio?.play());
    navigator.mediaSession.setActionHandler('pause', () => remoteSpeechAudio?.pause());
  } catch {}
}
async function speakWithPuter(clean) {
  if (!window.puter?.ai?.txt2speech) return false;
  try {
    showOracleVoiceAvatar(clean);
    requestVoiceWakeLock();
    const audio = await generatePuterSpeech(clean);
    if (!audio) throw new Error('Audio IA no disponible');
    remoteSpeechAudio = audio;
    try { audio.currentTime = 0; } catch {}
    setMediaSessionForReading();
    audio.onplay = () => {
      setFloatingVoiceStopVisible(true);
      updateOracleVoiceAvatarSpeaking(true);
      startRemoteAudioLipSync(audio, clean);
    };
    audio.onpause = () => {
      updateOracleVoiceAvatarSpeaking(false);
      setOracleMouthShape('closed');
    };
    audio.onended = () => { setFloatingVoiceStopVisible(false); remoteSpeechAudio = null; releaseVoiceWakeLock(); hideOracleVoiceAvatar(); };
    audio.onerror = () => { setFloatingVoiceStopVisible(false); remoteSpeechAudio = null; releaseVoiceWakeLock(); hideOracleVoiceAvatar(); };
    await audio.play();
    setFloatingVoiceStopVisible(true);
    return true;
  } catch (error) {
    pushErrorLog('puter-tts', error?.message || 'Error de voz IA', 'remote speech');
    setFloatingVoiceStopVisible(false);
    remoteSpeechAudio = null;
    releaseVoiceWakeLock();
    hideOracleVoiceAvatar();
    return false;
  }
}
async function downloadReadingMP3() {
  const clean = cleanSpeechText(getReadingText());
  if (!clean) return toast(t('tsNeedReading'));
  if (localStorage.getItem(LS.puter) !== 'true' && !(await connectPuter())) return;
  try {
    toast(t('tsMakingMp3'));
    const audio = await generatePuterSpeech(clean);
    if (!audio?.src) throw new Error('El servicio no devolvió un archivo descargable');
    const response = await fetch(audio.src);
    if (!response.ok) throw new Error('No se pudo preparar el MP3');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeFileName(lastReading?.title || 'lectura-oraculo')}.mp3`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(t('tsMp3Ready'));
  } catch (error) {
    pushErrorLog('download-tts-mp3', error?.message || error, lastReading?.title || '');
    toast(t('tsMp3Fail'));
  }
}
function stopSpeech() {
  voiceSpeechSession += 1;
  setFloatingVoiceStopVisible(false);
  try { window.AndroidTTS?.stop?.(); } catch {}
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  if (remoteSpeechAudio) {
    try { remoteSpeechAudio.pause(); remoteSpeechAudio.currentTime = 0; } catch {}
    remoteSpeechAudio = null;
  }
  resetActiveSpeech();
  releaseVoiceWakeLock();
  hideOracleVoiceAvatar();
}

function micButton(targetId, label = 'Dictar con micrófono') {
  return `<button class="mic-btn" data-mic-target="${escapeHTML(targetId)}" type="button" aria-label="${escapeHTML(label)}" title="${escapeHTML(label)}" aria-pressed="false">🎙️</button>`;
}
function speechRecognitionSupport() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}
let activeDictation = null;
const DICTATION_MAX_MS = 11000;
const SPEECH_DICTATION_MAX_MS = 18000;

async function waitForPuterSpeechToText(timeout = 1400) {
  if (window.puter?.ai?.speech2txt) return true;
  const start = Date.now();
  while (Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, 120));
    if (window.puter?.ai?.speech2txt) return true;
  }
  return false;
}

function isIosLikeDevice() {
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function supportedAudioMimeType() {
  if (!window.MediaRecorder?.isTypeSupported) return '';
  return [
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4;codecs=aac',
    'audio/mp4',
    'audio/aac',
    'audio/mpeg',
    'audio/webm;codecs=opus',
    'audio/webm'
  ].find(type => MediaRecorder.isTypeSupported(type)) || '';
}

function createAudioRecorder(stream) {
  const mimeType = supportedAudioMimeType();
  if (mimeType) {
    try {
      return { recorder:new MediaRecorder(stream, { mimeType }), mimeType };
    } catch (error) {
      pushErrorLog('mic-recorder-mime', `${mimeType}: ${error?.message || 'formato no disponible'}`, 'microphone');
    }
  }
  return { recorder:new MediaRecorder(stream), mimeType:'' };
}

function cssAttrEscape(value = '') {
  if (window.CSS?.escape) return CSS.escape(value);
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function setMicButtonState(targetId, active) {
  document.querySelectorAll(`[data-mic-target="${cssAttrEscape(targetId)}"]`).forEach(btn => {
    btn.classList.toggle('recording', !!active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.title = active ? t('tsMicTapStop') : 'Dictar con micrófono';
    btn.setAttribute('aria-label', btn.title);
  });
}

function appendDictationText(target, original, transcript) {
  const text = String(transcript || '').trim();
  if (!text) return false;
  target.value = `${original}${original && text ? ' ' : ''}${text}`.trim();
  target.dispatchEvent(new Event('input', { bubbles: true }));
  target.focus();
  clearMicInlineHint(target);
  return true;
}

function micNativeDictationHintText() {
  const lang = (getAppLanguage() || 'es').slice(0, 2);
  const texts = {
    es: 'Este navegador no ofrece reconocimiento de voz desde el botón. Toca el campo y usa el micrófono del teclado del dispositivo.',
    ca: 'Aquest navegador no ofereix reconeixement de veu des del botó. Toca el camp i fes servir el micròfon del teclat del dispositiu.',
    en: 'This browser does not offer speech recognition from the button. Tap the field and use the device keyboard microphone.',
    fr: 'Ce navigateur ne propose pas la reconnaissance vocale depuis le bouton. Touche le champ et utilise le micro du clavier.',
    de: 'Dieser Browser bietet keine Spracherkennung über die Taste. Tippe ins Feld und nutze das Mikrofon der Tastatur.',
    zh: '此浏览器不支持通过按钮语音识别。请点按输入框，并使用设备键盘上的麦克风。'
  };
  return texts[lang] || texts.es;
}

function micAiDictationHintText() {
  const lang = (getAppLanguage() || 'es').slice(0, 2);
  const texts = {
    es: 'El dictado nativo no está disponible en este navegador. Prueba Chrome o Edge, y revisa el permiso de micrófono.',
    ca: 'El dictat natiu no està disponible en aquest navegador. Prova Chrome o Edge i revisa el permís de micròfon.',
    en: 'Native dictation is not available in this browser. Try Chrome or Edge and check microphone permission.',
    fr: 'La dictée native n’est pas disponible dans ce navigateur. Essaie Chrome ou Edge et vérifie l’autorisation du micro.',
    de: 'Natives Diktieren ist in diesem Browser nicht verfügbar. Versuch Chrome oder Edge und prüfe die Mikrofonberechtigung.',
    zh: '此浏览器不支持原生听写。请尝试 Chrome 或 Edge，并检查麦克风权限。'
  };
  return texts[lang] || texts.es;
}

function micPcNoAudioHintText() {
  const lang = (getAppLanguage() || 'es').slice(0, 2);
  const texts = {
    es: 'Chrome ha abierto el micrófono, pero no ha detectado voz. Revisa el micrófono elegido en Windows, el permiso del sitio y habla cerca del micro.',
    ca: 'Chrome ha obert el micròfon, però no ha detectat veu. Revisa el micròfon triat a Windows, el permís del lloc i parla a prop del micro.',
    en: 'Chrome opened the microphone, but did not detect speech. Check the selected Windows microphone, the site permission and speak close to the mic.',
    fr: 'Chrome a ouvert le micro, mais n’a détecté aucune voix. Vérifie le micro choisi dans Windows, l’autorisation du site et parle près du micro.',
    de: 'Chrome hat das Mikrofon geöffnet, aber keine Stimme erkannt. Prüfe das ausgewählte Windows-Mikrofon, die Website-Berechtigung und sprich nah am Mikrofon.',
    zh: 'Chrome 已打开麦克风，但没有检测到语音。请检查 Windows 选择的麦克风、网站权限，并靠近麦克风说话。'
  };
  return texts[lang] || texts.es;
}

async function requestMicrophoneProbe() {
  if (!navigator.mediaDevices?.getUserMedia) return { ok:false, reason:'unsupported' };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: { ideal: true },
        noiseSuppression: { ideal: true },
        autoGainControl: { ideal: true }
      }
    });
    return { ok:true, stream };
  } catch (error) {
    return { ok:false, error, reason:error?.name || 'blocked' };
  }
}

function stopMicrophoneProbe(stream) {
  try { stream?.getTracks?.().forEach(track => track.stop()); } catch {}
}

function clearMicInlineHint(target) {
  const wrap = target?.closest?.('.input-mic-wrap');
  wrap?.parentElement?.querySelector?.(`[data-mic-help-for="${cssAttrEscape(target.id)}"]`)?.remove();
}

function showMicInlineHint(target, message = '') {
  if (!target) return toast(message || t('tsMicNoBrowser'));
  const text = message || (isIosLikeDevice() ? micNativeDictationHintText() : t('tsMicNoBrowser'));
  toast(text);
  target.focus();
  const wrap = target.closest?.('.input-mic-wrap');
  const parent = wrap?.parentElement;
  if (!wrap || !parent) return;
  clearMicInlineHint(target);
  const hint = document.createElement('small');
  hint.className = 'subtle mic-inline-help';
  hint.dataset.micHelpFor = target.id;
  hint.setAttribute('role', 'status');
  hint.textContent = text;
  parent.insertBefore(hint, wrap.nextSibling);
}

function extractTranscript(result) {
  if (typeof result === 'string') return result;
  if (result?.text) return result.text;
  if (result?.transcript) return result.transcript;
  if (Array.isArray(result?.segments)) return result.segments.map(s => s.text || '').join(' ');
  return '';
}

function stopActiveDictation() {
  const current = activeDictation;
  if (!current) return false;
  activeDictation = null;
  clearTimeout(current.timer);
  setMicButtonState(current.targetId, false);
  try { current.recognition?.stop?.(); } catch {}
  try {
    if (current.recorder?.state && current.recorder.state !== 'inactive') current.recorder.stop();
  } catch {}
  try { current.stream?.getTracks?.().forEach(track => track.stop()); } catch {}
  return true;
}

async function transcribeRecordedDictation(target, original, blob) {
  if (!blob?.size) return toast(t('tsMicNoAudio'));
  if (!window.puter?.ai?.speech2txt) return showMicInlineHint(target, isIosLikeDevice() ? micNativeDictationHintText() : micAiDictationHintText());
  toast(t('tsMicTranscribing'));
  try {
    const language = (getAppLanguage() || 'es').slice(0, 2);
    const audio = dictationAudioPayload(blob);
    const result = await window.puter.ai.speech2txt(audio, {
      language,
      response_format: 'json',
      model: 'gpt-4o-mini-transcribe'
    });
    const transcript = extractTranscript(result);
    if (!appendDictationText(target, original, transcript)) toast(t('tsMicNoAudio'));
  } catch (error) {
    pushErrorLog('mic-stt', error?.message || 'No se pudo transcribir el audio', 'speech to text');
    toast(t('tsMicFail'));
  }
}

function dictationAudioPayload(blob) {
  if (typeof File === 'undefined') return blob;
  const type = blob.type || 'audio/mp4';
  const ext = /webm/i.test(type) ? 'webm' : /mpeg|mp3/i.test(type) ? 'mp3' : /aac/i.test(type) ? 'aac' : 'm4a';
  try {
    return new File([blob], `dictado-oraculo.${ext}`, { type });
  } catch {
    return blob;
  }
}

async function startRecordedDictation(target) {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return false;
  if (isIosLikeDevice() && !window.puter?.ai?.speech2txt) {
    showMicInlineHint(target, micNativeDictationHintText());
    return true;
  }
  const targetId = target.id;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: { ideal: true },
        noiseSuppression: { ideal: true },
        autoGainControl: { ideal: true }
      }
    });
    const { recorder, mimeType } = createAudioRecorder(stream);
    const chunks = [];
    const original = target.value || '';

    recorder.addEventListener('dataavailable', event => {
      if (event.data?.size) chunks.push(event.data);
    });
    recorder.addEventListener('stop', () => {
      const blobType = recorder.mimeType || mimeType || 'audio/webm';
      const blob = new Blob(chunks, { type: blobType });
      stream.getTracks().forEach(track => track.stop());
      if (activeDictation?.recorder === recorder) activeDictation = null;
      setMicButtonState(targetId, false);
      transcribeRecordedDictation(target, original, blob);
    }, { once: true });

    activeDictation = {
      mode: 'record',
      targetId,
      recorder,
      stream,
      timer: setTimeout(() => {
        toast(t('tsMicTranscribing'));
        stopActiveDictation();
      }, DICTATION_MAX_MS)
    };
    setMicButtonState(targetId, true);
    recorder.start();
    toast(t('tsMicTapStop'));
    return true;
  } catch (error) {
    pushErrorLog('mic-recorder', error?.message || 'No se pudo iniciar la grabación', 'microphone');
    setMicButtonState(targetId, false);
    const message = error?.name === 'NotAllowedError' ? t('tsMicPermission') : isIosLikeDevice() ? micNativeDictationHintText() : t('tsMicNoStart');
    showMicInlineHint(target, message);
    return true;
  }
}

async function startBrowserSpeechDictation(target) {
  const Recognition = speechRecognitionSupport();
  if (!Recognition) return false;
  if (window.isSecureContext === false) {
    showMicInlineHint(target, t('tsMicPermission'));
    return true;
  }
  const targetId = target.id;
  const probe = await requestMicrophoneProbe();
  if (!probe.ok) {
    const blocked = /NotAllowed|Permission|Security/i.test(probe.reason || '');
    showMicInlineHint(target, blocked ? t('tsMicPermission') : t('tsMicNoStart'));
    pushErrorLog('mic-permission-probe', probe.error?.message || probe.reason || 'No se pudo abrir el microfono', 'microphone');
    return true;
  }
  try {
    const recognition = new Recognition();
    recognition.lang = getAppLocale();
    recognition.interimResults = true;
    recognition.continuous = !isIosLikeDevice();
    recognition.maxAlternatives = 1;
    const original = target.value || '';
    let gotResult = false;
    const timer = setTimeout(() => {
      if (activeDictation?.recognition !== recognition) return;
      toast(t('tsMicTranscribing'));
      try { recognition.stop(); } catch {}
    }, SPEECH_DICTATION_MAX_MS);
    activeDictation = { mode: 'speech', targetId, recognition, stream:probe.stream, timer };
    setMicButtonState(targetId, true);
    toast(t('tsListening'));
    recognition.onresult = event => {
      const transcript = Array.from(event.results).map(r => r[0]?.transcript || '').join('\n\n').trim();
      gotResult = appendDictationText(target, original, transcript) || gotResult;
      if (gotResult) {
        clearTimeout(timer);
        try { recognition.stop(); } catch {}
      }
    };
    recognition.onerror = event => {
      pushErrorLog('mic-browser-speech', event?.error || 'Speech recognition failed', 'speech recognition');
      const err = event?.error || '';
      const message = err === 'not-allowed' || err === 'service-not-allowed'
        ? t('tsMicPermission')
        : err === 'no-speech'
          ? micPcNoAudioHintText()
          : err === 'network'
            ? t('tsMicNoStart')
            : isIosLikeDevice() ? micNativeDictationHintText() : t('tsMicFail');
      showMicInlineHint(target, message);
    };
    recognition.onend = () => {
      clearTimeout(timer);
      stopMicrophoneProbe(probe.stream);
      if (activeDictation?.recognition === recognition) activeDictation = null;
      setMicButtonState(targetId, false);
      target.focus();
    };
    recognition.start();
    return true;
  } catch (error) {
    stopMicrophoneProbe(probe.stream);
    pushErrorLog('mic-browser-start', error?.message || 'Speech recognition could not start', 'speech recognition');
    setMicButtonState(targetId, false);
    showMicInlineHint(target, isIosLikeDevice() ? micNativeDictationHintText() : t('tsMicNoStart'));
    return true;
  }
}

async function startDictation(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return toast(t('tsNoField'));
  if (activeDictation?.targetId === targetId) return stopActiveDictation();
  if (activeDictation) stopActiveDictation();

  if (await startBrowserSpeechDictation(target)) return;

  if (localStorage.getItem(LS.puter) === 'true' && await waitForPuterSpeechToText(650) && await startRecordedDictation(target)) return;

  if (isIosLikeDevice()) {
    showMicInlineHint(target, micNativeDictationHintText());
    return;
  }

  showMicInlineHint(target, micAiDictationHintText());
}
function inputWithMic(id, attrs = '') {
  return `<div class="input-mic-wrap"><input id="${escapeHTML(id)}" class="input" ${attrs}>${micButton(id)}</div>`;
}
function textareaWithMic(id, attrs = '') {
  return `<div class="input-mic-wrap textarea-mic-wrap"><textarea id="${escapeHTML(id)}" ${attrs}></textarea>${micButton(id)}</div>`;
}

function updateHome() {
  const name = localStorage.getItem(LS.name) || '';
  applyAppTranslations(document);
  $('#userGreeting').textContent = name ? `${getAppLanguage() === 'en' ? 'Hello' : getAppLanguage() === 'fr' ? 'Bonjour' : getAppLanguage() === 'de' ? 'Hallo' : getAppLanguage() === 'zh' ? '你好' : getAppLanguage() === 'ca' ? 'Hola' : 'Hola'}, ${name}` : t('greeting');
  /* Se reconstruye el span interior en lugar de pisar el textContent:
     al pisarlo se destruia el data-i18n y el chip se quedaba en el
     idioma que hubiera al arrancar, en TODAS las pantallas. */
  const chipIA = $('#iaStatusChip');
  if (chipIA) {
    const conectada = localStorage.getItem(LS.puter) === 'true';
    const clave = conectada ? 'aiConnected' : 'aiSymbolic';
    chipIA.innerHTML = `🤖 <span data-i18n="${clave}">${escapeHTML(t(clave))}</span>`;
  }
  const intention = intencionVisible(localStorage.getItem(LS.intention) || getProfile().intention || 'libre');
  /* La intencion la escribe la persona: se muestra tal cual. Lo que
     se traduce es la etiqueta y el aviso de modo privado. */
  $('#intentionChip').textContent = `🧭 ${t('pmIntentionSet', { v: intention })}${isPrivateMode() ? ' · ' + t('pmPrivateTag') : ''}`;
  const platformChip = $('#platformStatusChip');
  if (platformChip) {
    const nativePlatform = window.AndroidTTS?.platform?.() || (window.AndroidTTS ? 'android' : '');
    platformChip.textContent = nativePlatform === 'ios' ? '📱 App iPhone' : nativePlatform === 'android' ? '📱 App Android' : `📱 ${t('installable')}`;
  }
  const prefs = storeGet(LS.prefs, {});
  aplicarEscalaTexto();
  document.body.classList.toggle('large-text', !!prefs.largeText);
  document.body.classList.toggle('high-contrast', !!prefs.highContrast);
  document.body.classList.toggle('private-mode', isPrivateMode());
  document.body.classList.toggle('focus-mode', isFocusMode());
  document.body.classList.toggle('performance-mode', isPerformanceMode());
  applyAppearanceMode();
  applyTheme();
}

function showGuide(force = false) {
  if (!force && localStorage.getItem(LS.guide) === 'yes') return;
  const currentName = escapeHTML(localStorage.getItem(LS.name) || '');
  openModal({
    icon: '✨', title: t('guideTitle'), subtitle: t('guideSub'),
    body: `
      <div class="panel-grid">
        ${[1,2,3,4].map(n => `<div class="result-card"><h3>${escapeHTML(t('guide'+n))}</h3><p>${escapeHTML(t('guide'+n+'T'))}</p></div>`).join('')}
      </div>
      <div class="field mt"><label>${escapeHTML(t('guideName'))}</label>${inputWithMic('guideName', `value="${currentName}" placeholder="${escapeHTML(t('guideNamePh'))}"`)}</div>
      <p class="notice mt">${escapeHTML(t('guideNotice'))}</p>`,
    actions: `<button class="btn primary" data-act="save-guide" type="button">${escapeHTML(t('guideEnter'))}</button><button class="btn" data-act="first-reading" type="button">${escapeHTML(t('guideFirst'))}</button><button class="btn" data-act="connect-ai" type="button">${escapeHTML(t('connectAI'))}</button>`
  });
}

function showFirstReading() {
  openModal({ icon: '✨', title: t('mdPrimeras'), subtitle: t('mdPrimerasS'), body: `
    <div class="panel-grid">
      <button class="choice" data-act="tarot-one"><strong>${escapeHTML(t('stCartaRapida2'))}</strong><small>${escapeHTML(t('stUnaCartaParaOrientarTuPregunta'))}</small></button>
      <button class="choice" data-act="rune-one"><strong>${escapeHTML(t('stRunaRapida'))}</strong><small>${escapeHTML(t('stUnSimboloBreveParaEmpezar'))}</small></button>
      <button class="choice" data-act="tarot-three"><strong>${escapeHTML(t('stTirada3Cartas'))}</strong><small>${escapeHTML(t('stPasadoPresenteYConsejo'))}</small></button>
      <button class="choice" data-module="astros"><strong>${escapeHTML(t('stAstros'))}</strong><small>${escapeHTML(t('stCartaAstralYTiradaAstralDel'))}</small></button>
      <button class="choice" data-module="numerologia"><strong>${escapeHTML(t('stNumerologia'))}</strong><small>${escapeHTML(t('stPerfilCompletoYSinastriaEntreDos'))}</small></button>
    </div>` });
}

function showMap() {
  const modules = [
    ['tarot','🃏','Tarot'], ['runas','ᚱ','Runas'], ['luna','🌙','Luna'], ['astros','☉','Astros'], ['suenos','💭','Sueños'],
    ['numerologia','🔢','Numerología'], ['grabovoi','📜','Grabovoi'], ['biblioteca','📚','Biblioteca'], ['settings','⚙️','Ajustes']
  ];
  openModal({ icon:'🗺️', title:t('mdMapa'), subtitle:t('mdMapaS'), body:`<div class="panel-grid">${modules.map(([m,i,t])=>`<button class="choice" data-module="${m}"><strong>${i} ${t}</strong><small>${escapeHTML(t('stAbrirEsteApartado'))}</small></button>`).join('\n\n')}</div>` });
}

const TAROT_SPREADS = {
  one: { count: 1, icon:'🃏', i18n:'spOne', title: 'Carta rápida', positions: ['Mensaje principal'] },
  three: { count: 3, icon:'⏳', i18n:'spThree', title: 'Pasado · Presente · Futuro', positions: ['Pasado', 'Presente', 'Futuro'] },
  five: { count: 5, icon:'✨', i18n:'spFive', title: 'Tirada de 5 cartas', positions: ['Situación', 'Reto', 'Apoyo', 'Consejo', 'Resultado probable'] },
  love: { count: 5, icon:'💕', i18n:'spLove', title: 'Tirada del amor', positions: ['Tu energía', 'La otra energía', 'Vínculo', 'Bloqueo', 'Consejo'] },
  yesno: { count: 1, icon:'✅', i18n:'spYesno', title: 'Sí o No orientativo', positions: ['Respuesta simbólica'] },
  decision: { count: 4, icon:'⚖️', i18n:'spDecision', title: 'Tirada de decisión', positions: ['Opción A', 'Opción B', 'Lo que debes mirar', 'Consejo final'] },
  week: { count: 7, icon:'📅', i18n:'spWeek', title: 'Semana', positions: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] },
  chakras: { count: 7, icon:'🌈', i18n:'spChakras', title: '7 Chakras', positions: ['Raíz', 'Sacro', 'Plexo solar', 'Corazón', 'Garganta', 'Tercer ojo', 'Corona'] },
  horseshoe: { count: 7, icon:'🧲', i18n:'spHorseshoe', title: 'Herradura', positions: ['Pasado', 'Presente', 'Influencias ocultas', 'Obstáculos', 'Entorno', 'Consejo', 'Resultado'] },
  star: { count: 5, icon:'⭐', i18n:'spStar', title: 'Estrella', positions: ['Centro', 'Norte', 'Sur', 'Este', 'Oeste'] },
  pyramid: { count: 6, icon:'🔺', i18n:'spPyramid', title: 'Pirámide', positions: ['Base 1', 'Base 2', 'Base 3', 'Puente 1', 'Puente 2', 'Cima'] },
  elements: { count: 5, icon:'🌍', i18n:'spElements', title: '5 Elementos', positions: ['Fuego', 'Agua', 'Aire', 'Tierra', 'Espíritu'] },
  karma: { count: 5, icon:'🌀', i18n:'spKarma', title: 'Karma', positions: ['Origen', 'Patrón', 'Aprendizaje', 'Liberación', 'Consejo'] },
  work: { count: 5, icon:'💼', i18n:'spWork', title: 'Trabajo / estudios', positions: ['Situación', 'Talento', 'Reto', 'Oportunidad', 'Consejo'] },
  blockage: { count: 4, icon:'🔓', i18n:'spBlockage', title: 'Bloqueo y consejo', positions: ['Bloqueo', 'Origen', 'Llave', 'Paso práctico'] },
  relation: { count: 6, icon:'💞', i18n:'spRelation', title: 'Relación', positions: ['Tú', 'La otra persona', 'Lo que une', 'Lo que separa', 'Potencial', 'Consejo'] },
  month: { count: 12, icon:'🗓️', i18n:'spMonth', title: 'Mes completo', positions: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Amor', 'Trabajo', 'Energía', 'Sombra', 'Apoyo', 'Consejo', 'Resultado', 'Clave'] },
  celtic: { count: 10, icon:'✝️', i18n:'spCeltic', title: 'Cruz Celta', positions: ['Situación actual', 'Cruce o reto', 'Base', 'Pasado reciente', 'Posible futuro', 'Próximo paso', 'Tu actitud', 'Entorno', 'Esperanzas o miedos', 'Resultado probable'] },
  astrologic: { count: 12, icon:'🌟', i18n:'spAstrologic', premium:true, title: 'Astrológica', positions: ['Casa 1 · Yo', 'Casa 2 · Recursos', 'Casa 3 · Comunicación', 'Casa 4 · Hogar', 'Casa 5 · Creatividad', 'Casa 6 · Rutina', 'Casa 7 · Vínculos', 'Casa 8 · Transformación', 'Casa 9 · Visión', 'Casa 10 · Propósito', 'Casa 11 · Comunidad', 'Casa 12 · Alma'] },
  karmicRelations: { count: 9, icon:'🌀', i18n:'spKarmic', premium:true, title: 'Relaciones kármicas', positions: ['Origen', 'Vínculo', 'Lección', 'Herida', 'Don', 'Bloqueo', 'Liberación', 'Potencial', 'Consejo'] },
  treeLife: { count: 10, icon:'🌳', premium:true, i18n:'spTree', title: 'Árbol de la Vida', positions: ['Kéter', 'Jokmá', 'Biná', 'Jésed', 'Guevurá', 'Tiféret', 'Nétsaj', 'Hod', 'Yesod', 'Maljut'] }
};
function getTarotSpread(key = 'one') { return TAROT_SPREADS[key] || TAROT_SPREADS.one; }

/* Las cartas y runas se muestran a menos de 200px, así que basta la miniatura:
   una tirada de 12 casas descarga la mitad y falla mucho menos. `data-full`
   guarda el original por si la miniatura no llega. */
function cardImage(card) { return card.img ? `<img class="tarot-img" src="${escapeHTML(thumbFor(card.img))}" data-full="${escapeHTML(card.img)}" alt="${escapeHTML(card.name)}" loading="lazy" decoding="async">` : `<div class="rune-big">🃏</div>`; }
/** La runa ilustrada; conserva el glifo como distintivo y como respaldo. */
function runeImage(rune) { return rune.img ? `<img class="rune-img" src="${escapeHTML(thumbFor(rune.img))}" data-full="${escapeHTML(rune.img)}" alt="${escapeHTML(rune.name)}" loading="lazy" decoding="async"><span class="symbol glyph-badge">${rune.sym}</span>` : `<span class="symbol">${rune.sym}</span>`; }

/* Si una imagen no carga -red inestable, muchas a la vez- se reintenta una sola
   vez con el original antes de darla por perdida. */
document.addEventListener('error', (event) => {
  const img = event.target;
  if (!img || img.tagName !== 'IMG' || img.dataset.retried) return;
  const full = img.dataset.full;
  if (!full || img.getAttribute('src') === full) return;
  img.dataset.retried = '1';
  img.src = full;
}, true);


function getProfile() {
  return { birth:'', birthTime:'', birthPlace:null, astroHouseSystem:getAstroHouseSystem(), sign:'', intention:'Claridad', favoriteSpread:'three', favoriteModule:'Tarot', ...(storeGet(LS.profile, {}) || {}) };
}
function setProfile(profile) { storeSet(LS.profile, { ...getProfile(), ...profile }); }
function isPrivateMode() { return localStorage.getItem(LS.privateMode) === 'true'; }
function setPrivateMode(value) {
  localStorage.setItem(LS.privateMode, value ? 'true' : 'false');
  if (value) unlockAchievement('private_mode');
  document.body.classList.toggle('private-mode', !!value);
}
function getTheme() { return localStorage.getItem(LS.theme) || 'gold'; }
function setTheme(theme) {
  localStorage.setItem(LS.theme, theme || 'gold');
  applyTheme();
}
function applyTheme() {
  const theme = getTheme();
  document.body.classList.remove('theme-gold','theme-violet','theme-forest','theme-blue','theme-classic','theme-light');
  document.body.classList.add('theme-' + theme);
}
function getAppearanceMode() {
  return localStorage.getItem(LS.appearanceMode) === 'light' ? 'light' : 'dark';
}
function setAppearanceMode(mode) {
  localStorage.setItem(LS.appearanceMode, mode === 'light' ? 'light' : 'dark');
  applyAppearanceMode();
  document.dispatchEvent(new CustomEvent('om:appearance-changed', { detail: { modo: getAppearanceMode() } }));
}
function applyAppearanceMode() {
  const mode = getAppearanceMode();
  document.documentElement.dataset.appearanceMode = mode;
  document.body?.setAttribute('data-appearance-mode', mode);
  const meta = document.querySelector('meta[name="theme-color"]');
  const rootBg = getComputedStyle(document.documentElement).getPropertyValue('--om-void').trim();
  if (meta && rootBg) meta.setAttribute('content', rootBg);
  document.querySelectorAll?.('[data-om-appearance-select]').forEach(select => { select.value = mode; });
  document.querySelectorAll?.('[data-om-appearance]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.omAppearance === mode)));
  document.querySelectorAll?.('[data-om-appearance-toggle]').forEach(button => {
    button.setAttribute('aria-pressed', String(mode === 'light'));
    button.setAttribute('aria-label', t(mode === 'light' ? 'arCambiarNoche' : 'arCambiarDia'));
    const icon = button.querySelector('[data-om-appearance-icon]');
    const label = button.querySelector('[data-om-appearance-label]');
    if (icon) icon.textContent = mode === 'light' ? '☼' : '☾';
    if (label) label.textContent = mode === 'light' ? 'Día' : 'Noche';
  });
}

function getPdfStyle() { return localStorage.getItem(LS.pdfStyle) || 'premium'; }
function setPdfStyle(style) { localStorage.setItem(LS.pdfStyle, style || 'premium'); }
function isFocusMode() { return localStorage.getItem(LS.focusMode) === 'true'; }
function setFocusMode(value) { localStorage.setItem(LS.focusMode, value ? 'true' : 'false'); }
function isPerformanceMode() { return localStorage.getItem(LS.performanceMode) === 'true'; }
function setPerformanceMode(value) { localStorage.setItem(LS.performanceMode, value ? 'true' : 'false'); }

function migrateData() {
  try {
    const version = localStorage.getItem(LS.migration);
    if (version === '1.0.73') return;
    const oldDiary = storeGet('oraculo.diary', null);
    const oldChat = storeGet('oraculo.chatRitual', null);
    const oldGuide = localStorage.getItem('oraculo.guideSeen');
    if (!storeGet(LS.diary, null) && Array.isArray(oldDiary)) storeSet(LS.diary, oldDiary);
    if (!storeGet(LS.chat, null) && Array.isArray(oldChat)) storeSet(LS.chat, oldChat);
    if (!localStorage.getItem(LS.guide) && oldGuide) localStorage.setItem(LS.guide, oldGuide);
    const profile = getProfile();
    if (profile.favoriteSpread === 'cross') setProfile({ favoriteSpread: 'celtic' });
    localStorage.setItem(LS.migration, '1.0.73');
  } catch {}
}

function pushErrorLog(source, message, context = '') {
  try {
    const log = storeGet(LS.errorLog, []);
    log.unshift({ source, message: String(message || 'Error'), context, date: new Date().toISOString() });
    storeSet(LS.errorLog, log.slice(0, 50));
  } catch {}
}
function unlockAchievement(id) {
  const achievements = storeGet(LS.achievements, {});
  if (!achievements[id]) {
    achievements[id] = new Date().toISOString();
    storeSet(LS.achievements, achievements);
  }
}
function validateBackupData(data) {
  const valid = !!data && typeof data === 'object' && !Array.isArray(data)
    && (!data.diary || Array.isArray(data.diary)) && (!data.chat || Array.isArray(data.chat));
  return { valid };
}
function showBackupPreview(data) {
  return `Backup ${data?.version || 'sin versión'}\n${Array.isArray(data?.diary) ? data.diary.length : 0} lecturas · ${Array.isArray(data?.chat) ? data.chat.length : 0} mensajes`;
}
function openDiaryItem(id) {
  const item = storeGet(LS.diary, []).find(entry => entry.id === id);
  if (!item) return toast(t('tsReadingLost'));
  lastReading = { ...item };
  openModal({ icon:'📚', title:item.title || 'Lectura guardada', subtitle:item.type || 'Biblioteca', body:`<div class="result-card"><p>${escapeHTML(item.text || '').replace(/\n/g,'<br>')}</p>${readingActions(item.text || '', item.type || 'Lectura')}</div>` });
}

function showControlCenter() {
  openModal({ icon:'🧭', title:t('mdControl'), subtitle:getAppVersionLabel(), body:`<div class="status-grid"><div class="status-card"><strong>${escapeHTML(t('stLecturas'))}</strong><span>${storeGet(LS.diary, []).length}</span></div><div class="status-card"><strong>${escapeHTML(t('stModoPrivado'))}</strong><span>${isPrivateMode()?'Activo':'Inactivo'}</span></div><div class="status-card"><strong>IA</strong><span>${localStorage.getItem(LS.puter)==='true'?'Conectada':'Simbólica'}</span></div><div class="status-card"><strong>${escapeHTML(t('stInstalacion'))}</strong><span>${'serviceWorker' in navigator?'Disponible':'Solo navegador'}</span></div></div><div class="panel-grid mt"><button class="choice" data-act="global-search"><strong>${escapeHTML(t('stBuscar'))}</strong></button><button class="choice" data-act="privacy-center"><strong>${escapeHTML(t('stPrivacidad'))}</strong></button><button class="choice" data-act="backup-data"><strong>${escapeHTML(t('stBackup'))}</strong></button><button class="choice" data-act="install-help"><strong>${escapeHTML(t('stInstalar'))}</strong></button></div>` });
}
function appSummary() {
  return {
    version:getAppVersionLabel(),
    tarot:ALL_TAROT.length,
    runes:RUNAS.length,
    serviceWorker:'serviceWorker' in navigator,
    speech:'speechSynthesis' in window,
    storage:!!window.localStorage
  };
}
function showVersionStatus() { appHealthCheck(); }
async function repairCacheAndReload() {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
    const registrations = await navigator.serviceWorker?.getRegistrations?.() || [];
    await Promise.all(registrations.map(registration => registration.update()));
  } catch {}
  location.reload();
}
function showErrorLog() {
  const errors = storeGet(LS.errorLog, []);
  openModal({ icon:'🧾', title:t('mdErrores'), subtitle:`${errors.length} entradas locales.`, body:`<div class="diary-list">${errors.map(error=>`<article class="diary-item"><strong>${escapeHTML(error.source)}</strong><small>${escapeHTML(error.date || '')}</small><p>${escapeHTML(error.message)}</p></article>`).join('') || `<p class="subtle">${escapeHTML(t('stNoHayErroresRegistrados'))}</p>`}</div><div class="actions mt"><button class="btn" data-act="download-error-log">Descargar</button><button class="btn danger" data-act="clear-error-log">Vaciar</button></div>` });
}
function clearErrorLog() { storeSet(LS.errorLog, []); showErrorLog(); }
function downloadErrorLog() { downloadTextFile('oraculo-errores.json', JSON.stringify(storeGet(LS.errorLog, []), null, 2)); }

function showPdfOptions() {
  if (!lastReading) return toast(t('tsNeedReading'));
  if (getAstroPdfChart(lastReading)) {
    return openModal({ icon:'☉', title:t('mdPdfAstral'), subtitle:t('mdPdfAstralS'), body:`<div class="panel-grid"><button class="choice" data-act="pdf-style-premium"><strong>Informe astral profesional</strong><small>Rueda grande, posiciones, casas, aspectos y síntesis.</small></button></div>` });
  }
  if (isPersonalNumerologyReading()) {
    return openModal({ icon:'📄', title:t('mdPdfNum'), subtitle:t('mdPdfNumS'), body:`<div class="panel-grid"><button class="choice" data-act="pdf-style-premium"><strong>Informe profesional</strong><small>Diseño claro, tabla de números y síntesis breve.</small></button></div>` });
  }
  openModal({ icon:'📄', title:t('mdPdfEstilo'), subtitle:t('mdPdfEstiloS'), body:`<div class="panel-grid"><button class="choice" data-act="pdf-style-premium"><strong>${escapeHTML(t('stPremiumMistico'))}</strong></button><button class="choice" data-act="pdf-style-light"><strong>${escapeHTML(t('stClaroElegante'))}</strong></button><button class="choice" data-act="pdf-style-summary"><strong>${escapeHTML(t('stResumen'))}</strong></button></div>` });
}
function exportDiaryPDF() {
  const diary = storeGet(LS.diary, []);
  const text = diary.map(item=>`${item.title}\n${item.text}`).join('\n\n---\n\n');
  exportPDF('Biblioteca Mística', text || 'Sin lecturas guardadas.', null);
}
function showPublicLaunch() {
  openModal({ icon:'📣', title:t('mdPublicacion'), subtitle:t('mdPublicacionS'), body:`<div class="result-card"><h3>${escapeHTML(t('stTextoBreve'))}</h3><p>${escapeHTML(t('stOraculoMisticoReuneTarotRunasLuna'))}</p></div><div class="actions mt"><button class="btn" data-act="copy-short-public-text">Copiar texto breve</button><button class="btn" data-act="share-app">Compartir app</button><button class="btn" data-act="public-package">Paquete público</button></div>` });
}
function showPublicPackage() {
  openModal({ icon:'📦', title:t('mdPaquete'), subtitle:t('mdPaqueteS'), body:`<div class="result-card"><p>${escapeHTML(t('stIncluyeLaAppCompletaManualPolitica'))}</p></div><div class="actions"><button class="btn" data-act="download-readme">Descargar README</button><button class="btn" data-act="copy-public-text">Copiar presentación</button></div>` });
}
function publicText(short = false) {
  return short ? 'Descubre Oráculo Místico: tarot, runas, luna, sueños y diario en una PWA simbólica.'
    : 'Oráculo Místico es una experiencia simbólica y de entretenimiento con tarot, runas, luna, sueños, numerología, diario local, voz y exportación PDF.';
}
function copyShortPublicText() { copyText(publicText(true)); }
function copyPublicText() { copyText(publicText(false)); }
function shareApp() { shareText(`${publicText(true)}\n${location.href}`, 'Oráculo Místico'); }
function downloadReadme() { downloadTextFile('README-Oraculo-Mistico.txt', `${publicText(false)}\n\n${location.href}`); }
function showShareVisual() { openModal({ icon:'🖼️', title:t('mdTarjeta'), body:`<div class="result-card center"><h3>${escapeHTML(lastReading?.title || 'Oráculo Místico')}</h3><p>${escapeHTML(clampText(getReadingText() || publicText(true), 320))}</p></div><div class="actions"><button class="btn" data-act="download-share-card">Descargar texto</button></div>` }); }
function downloadShareCard() { downloadTextFile('tarjeta-oraculo.txt', getReadingText() || publicText(true)); }

function showInstallHelp() {
  openModal({ icon:'📲', title:t('mdInstalar'), subtitle:t('mdInstalarS'), body:`<div class="result-card"><h3>${escapeHTML(t('stChromeYEdge'))}</h3><p>${escapeHTML(t('stUsaElBotonInstalarDeLa'))}</p><h3>${escapeHTML(t('stSafariEnIphoneOIpad'))}</h3><p>${escapeHTML(t('stCompartirAnadirAPantallaDeInicio'))}</p><h3>${escapeHTML(t('stFirefox'))}</h3><p>${escapeHTML(t('stLaInstalacionDependeDelSistemaTambien'))}</p></div><div class="actions"><button class="btn primary" data-act="try-install-pwa">Intentar instalar</button></div>` });
}
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredInstallPrompt = event; });
async function tryInstallPWA() {
  if (!deferredInstallPrompt) return toast(t('tsUseInstall'));
  deferredInstallPrompt.prompt();
  try { await deferredInstallPrompt.userChoice; } catch {}
  deferredInstallPrompt = null;
}
function showAppTutorial() {
  openModal({ icon:'🎓', title:t('mdTutorial'), subtitle:t('mdTutorialS'), body:`<div class="panel-grid"><div class="result-card"><h3>${escapeHTML(t('st1EligeUnModulo'))}</h3><p>${escapeHTML(t('stPruebaTarotRunasOElMensaje'))}</p></div><div class="result-card"><h3>${escapeHTML(t('st2Guarda'))}</h3><p>${escapeHTML(t('stConservaTusLecturasEnLaBiblioteca'))}</p></div><div class="result-card"><h3>${escapeHTML(t('st3Personaliza'))}</h3><p>${escapeHTML(t('stAjustaVozTemaYPrivacidad'))}</p></div><div class="result-card"><h3>${escapeHTML(t('st4IaOpcional'))}</h3><p>${escapeHTML(t('stConectaPuterSoloSiQuieresAmpliar'))}</p></div></div>` });
}
function showSuggestedQuestions() { openModal({ icon:'💡', title:t('mdPreguntas'), body:`<div class="diary-list">${['¿Qué necesito observar hoy?','¿Qué bloquea mi siguiente paso?','¿Qué energía acompaña mi relación?','¿Qué puedo aprender de este sueño?'].map(q=>`<button class="choice" data-copy-question="${escapeHTML(q)}">${escapeHTML(q)}</button>`).join('')}</div>` }); }
function showHelpCenter() { showAppTutorial(); }
function showWhatsNew() { openModal({ icon:'✨', title:t('mdNovedades'), subtitle:getAppVersionLabel(), body:`<div class="result-card"><p>${escapeHTML(t('stCorreccionesDeFirefoxArranqueMigracionEstabilidad'))}</p></div>` }); }
function showReportTemplate() { openModal({ icon:'🐞', title:t('mdProblema'), body:`<div class="result-card"><p>Navegador y versión:<br>Dispositivo:<br>Acción realizada:<br>Resultado esperado:<br>Error visible:</p></div><button class="btn" data-act="copy-bug-template">Copiar plantilla</button>` }); }
function copyBugTemplate() { copyText('Navegador y versión:\\nDispositivo:\\nAcción realizada:\\nResultado esperado:\\nError visible:'); }
function diagnosticsText() { return JSON.stringify({ ...appSummary(), url:location.href, userAgent:navigator.userAgent, errors:storeGet(LS.errorLog, []) }, null, 2); }
function showDiagnostics() { openModal({ icon:'🩺', title:t('mdDiagnostico'), body:`<pre class="result-card">${escapeHTML(diagnosticsText())}</pre><div class="actions"><button class="btn" data-act="copy-diagnostics">Copiar</button><button class="btn" data-act="download-diagnostics">Descargar</button></div>` }); }
function copyDiagnostics() { copyText(diagnosticsText()); }
function downloadDiagnostics() { downloadTextFile('oraculo-diagnostico.json', diagnosticsText()); }

const SEARCH_ITEMS = [
  ['Tarot','tarot'], ['Runas','runas'], ['Luna','luna'], ['Astros','astros'], ['Sueños','suenos'],
  ['Numerología','numerologia'], ['Grabovoi','grabovoi'], ['Biblioteca','biblioteca'], ['Chat Ritual','chat']
];
function renderGlobalSearchResults(query = '') {
  const q = query.toLowerCase().trim();
  const items = SEARCH_ITEMS.filter(([label]) => !q || label.toLowerCase().includes(q));
  return items.map(([label,module])=>`<button class="choice" data-module="${module}"><strong>${escapeHTML(label)}</strong><small>${escapeHTML(t('stAbrirModulo'))}</small></button>`).join('') || `<p class="subtle">${escapeHTML(t('gbNoResults'))}</p>`;
}
function showGlobalSearch() { openModal({ icon:'🔎', title:t('mdBuscar'), body:`<div class="field"><label>${escapeHTML(t('stBuscarModulo'))}</label><input id="globalSearchInput" class="input" placeholder="Tarot, luna, astros, biblioteca..."></div><div id="globalSearchResults" class="diary-list mt">${renderGlobalSearchResults()}</div>` }); }
function showPrivacyCenter() {
  openModal({ icon:'🔒', title:t('mdPrivacidad'), subtitle:t('mdPrivacidadS'), body:`<div class="result-card"><p>${escapeHTML(t('stLasLecturasElPerfilYEl'))}</p><p><a href="privacy.html" target="_blank" rel="noopener">Leer política de privacidad</a></p></div><div class="actions"><button class="btn" data-act="backup-data">Crear backup</button><button class="btn" data-act="clear-chat">Borrar chat</button><button class="btn" data-act="clear-profile">Borrar perfil</button><button class="btn danger" data-act="factory-reset">Restablecer app</button></div>` });
}
function clearChatData() { if (confirm(t('cfBorrarChat'))) { storeSet(LS.chat, []); toast(t('tsChatCleared')); } }
function clearProfileData() { if (confirm(t('cfBorrarPerfil'))) { localStorage.removeItem(LS.name); localStorage.removeItem(LS.profile); localStorage.removeItem(LS.intention); localStorage.removeItem(LS.birthDate); localStorage.removeItem(LS.birthTime); localStorage.removeItem(LS.birthPlace); localStorage.removeItem(LS.astroHouseSystem); updateHome(); toast(t('tsProfileCleared')); } }
function factoryResetData() {
  if (!confirm('¿Restablecer todos los datos de Oráculo Místico en este navegador?')) return;
  Object.values(LS).forEach(key => localStorage.removeItem(key));
  localStorage.removeItem('oraculo.ceremony.v1');
  location.reload();
}

const ACHIEVEMENT_LABELS = {
  first_reading:'Primera lectura', first_save:'Primera lectura guardada', first_pdf:'Primer PDF',
  private_mode:'Modo privado', first_favorite:'Primera favorita', first_backup:'Primer backup',
  first_daily:'Primer mensaje diario', first_voice:'Primera prueba de voz'
};
function showAchievements() {
  const unlocked = storeGet(LS.achievements, {});
  openModal({ icon:'🏆', title:t('mdLogros'), body:`<div class="diary-list">${Object.entries(ACHIEVEMENT_LABELS).map(([id,label])=>`<div class="result-card"><strong>${unlocked[id]?'🏆':'🔒'} ${label}</strong></div>`).join('')}</div>` });
}
function showGuidedReveal() { openModal({ icon:'🕯️', title:t('mdGuiada'), subtitle:t('mdGuiadaS'), body:`<div class="result-card"><p>${escapeHTML(t('stFormulaTuPreguntaYPulsaComenzar'))}</p></div><button class="btn primary" data-act="start-guided-three">${escapeHTML(t('stComenzar'))}</button>` }); }
function startGuidedThree() { drawTarotSpread('three'); }
function guidedNext() { return; }
function saveDailyReflection() {
  const entries = storeGet(LS.dailyJournal, []);
  entries.unshift({ date:new Date().toISOString(), mood:$('#dailyMood')?.value || '', intention:$('#dailyIntention')?.value || '', reflection:$('#dailyReflection')?.value || '' });
  storeSet(LS.dailyJournal, entries.slice(0, 365));
  toast(t('tsDailySaved'));
}
function showDailyHistory() {
  const entries = storeGet(LS.dailyJournal, []);
  openModal({ icon:'📅', title:t('mdHistorial'), subtitle:`${entries.length} entradas.`, body:`<div class="diary-list">${entries.map(entry=>`<article class="diary-item"><strong>${new Date(entry.date).toLocaleDateString()}</strong><p>${escapeHTML(entry.mood)} · ${escapeHTML(entry.intention)}</p><p>${escapeHTML(entry.reflection)}</p></article>`).join('') || `<p class="subtle">${escapeHTML(t('stTodaviaNoHayReflexiones'))}</p>`}</div>` });
}
function toggleDiaryFavorite(id) {
  const diary = storeGet(LS.diary, []);
  const item = diary.find(x => x.id === id);
  if (item) { item.favorite = !item.favorite; if (item.favorite) unlockAchievement('first_favorite'); }
  storeSet(LS.diary, diary);
  showBiblioteca($('#diaryFilter')?.value || 'all');
}
function saveDiaryNote(id) {
  const diary = storeGet(LS.diary, []);
  const item = diary.find(x => x.id === id);
  const note = prompt('Nota personal para esta lectura:', item?.note || '');
  if (item && note !== null) {
    item.note = note.trim();
    storeSet(LS.diary, diary);
    showBiblioteca($('#diaryFilter')?.value || 'all');
  }
}
function showMiOraculo() {
  const profile = getProfile();
  if (!profile.birth) profile.birth = getBirthDate();
  if (!profile.birthTime) profile.birthTime = getBirthTime();
  if (!profile.birthPlace) profile.birthPlace = getBirthPlace();
  const diary = storeGet(LS.diary, []);
  const favs = diary.filter(d => d.favorite).slice(0, 3);
  const last = diary.slice(0, 3);
  const name = escapeHTML(getUserName() || 'Sin nombre');
  openModal({ icon:'🪬', title:t('mdMiOraculo'), subtitle:t('mdMiOraculoS'), body:`
    <div class="profile-hero">
      <div class="profile-orb">🪬</div>
      <div><h3>${name}</h3><p>${escapeHTML(t('ixIntencionActiva'))}: <strong>${escapeHTML(intencionVisible(profile.intention || 'Claridad'))}</strong> · Signo: <strong>${escapeHTML(profile.sign || 'No indicado')}</strong></p><p>Modo privado: <strong>${isPrivateMode()?'Activado':'Desactivado'}</strong></p></div>
    </div>
    <div class="form-grid mt">
      <div class="field"><label>${escapeHTML(t('stFechaDeNacimiento'))}</label><input class="input" id="profileBirth" type="date" value="${escapeHTML(profile.birth || '')}"></div>
      <div class="field"><label>${escapeHTML(t('stHoraDeNacimiento'))}</label><input class="input" id="profileBirthTime" type="time" value="${escapeHTML(profile.birthTime || '')}"></div>
      <div class="field"><label>${escapeHTML(t('stLugarDeNacimiento'))}</label><input class="input" id="profileBirthPlace" value="${escapeHTML(profile.birthPlace?.label || '')}" placeholder="${escapeHTML(t('phCiudadPais'))}"></div>
      <div class="field"><label>${escapeHTML(t('stSignoEnergia'))}</label><input class="input" id="profileSign" value="${escapeHTML(profile.sign || '')}" placeholder="Aries, Luna, Agua..."></div>
      <div class="field"><label>${escapeHTML(t('stIntencionPrincipal'))}</label><input class="input" id="profileIntention" value="${escapeHTML(profile.intention || '')}" placeholder="Claridad, amor, calma..."></div>
      <div class="field"><label>${escapeHTML(t('stTiradaFavorita'))}</label><select id="profileSpread"><option value="one" ${profile.favoriteSpread==='one'?'selected':''}>${escapeHTML(t('stCartaRapida'))}</option><option value="three" ${(profile.favoriteSpread||'three')==='three'?'selected':''}>${escapeHTML(t('stPasadoPresenteFuturo'))}</option><option value="love" ${profile.favoriteSpread==='love'?'selected':''}>${escapeHTML(t('stAmor'))}</option><option value="decision" ${profile.favoriteSpread==='decision'?'selected':''}>${escapeHTML(t('stDecision'))}</option><option value="celtic" ${profile.favoriteSpread==='celtic'?'selected':''}>${escapeHTML(t('stCruzCelta'))}</option></select></div>
    </div>
    <div class="actions mt"><button class="btn primary" data-act="save-profile">Guardar Mi Oráculo</button><button class="btn" data-act="profile-favorite-spread">Tirada favorita</button><button class="btn" data-act="toggle-private">Modo privado ${isPrivateMode()?'OFF':'ON'}</button></div>
    <h3 class="section-title">${escapeHTML(t('stFavoritas'))}</h3>
    <div class="mini-history">${favs.map(d=>`<article><strong>${escapeHTML(d.title)}</strong><small>${new Date(d.date || Date.now()).toLocaleDateString()}</small><p>${escapeHTML(clampText(d.text,120))}</p></article>`).join('') || `<p class="subtle">${escapeHTML(t('stMarcaLecturasComoFavoritasDesdeBiblioteca'))}</p>`}</div>
    <h3 class="section-title">${escapeHTML(t('stUltimasLecturas'))}</h3>
    <div class="mini-history">${last.map(d=>`<article><strong>${escapeHTML(d.title)}</strong><small>${new Date(d.date || Date.now()).toLocaleDateString()}</small><p>${escapeHTML(clampText(d.text,120))}</p></article>`).join('') || `<p class="subtle">${escapeHTML(t('stTodaviaNoHayLecturasGuardadas'))}</p>`}</div>` });
}
function importBackupFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || '{}'));
      const preview = showBackupPreview(data);
      if (!validateBackupData(data).valid) return toast(t('tsBackupBad'));
      if (!confirm(`${preview}\n\n¿Restaurar este backup? Se reemplazarán diario, ajustes compatibles, perfil y chat.`)) return;
      if (data.name !== undefined) localStorage.setItem(LS.name, data.name || '');
      if (data.prefs) storeSet(LS.prefs, data.prefs);
      if (data.voice) storeSet(LS.voice, data.voice);
      if (data.ceremony) storeSet('oraculo.ceremony.v1', data.ceremony);
      if (data.profile) storeSet(LS.profile, data.profile);
      if (data.birthDate) localStorage.setItem(LS.birthDate, data.birthDate);
      if (data.birthTime) localStorage.setItem(LS.birthTime, data.birthTime);
      if (data.birthPlace) localStorage.setItem(LS.birthPlace, typeof data.birthPlace === 'string' ? data.birthPlace : JSON.stringify(data.birthPlace));
      if (data.astroHouseSystem) setAstroHouseSystem(data.astroHouseSystem);
      if (data.theme) localStorage.setItem(LS.theme, data.theme);
      if (data.pdfStyle) localStorage.setItem(LS.pdfStyle, data.pdfStyle);
      if (Array.isArray(data.diary)) storeSet(LS.diary, data.diary);
      if (Array.isArray(data.chat)) storeSet(LS.chat, data.chat);
      migrateData();
      applyTheme();
      updateHome();
      toast(t('tsBackupOk'));
      showMiOraculo();
    } catch (err) {
      pushErrorLog('import-backup', err?.message || err, 'importBackupFromFile');
      toast(t('tsBackupBad'));
    }
  };
  reader.readAsText(file);
}

function getCeremonyPrefs() {
  return { sounds:false, vibration:false, speed:'normal', ...(storeGet('oraculo.ceremony.v1', {}) || {}) };
}
function setCeremonyPrefs(prefs) { storeSet('oraculo.ceremony.v1', { ...getCeremonyPrefs(), ...prefs }); }
function ceremonyDelay(base) {
  const s = getCeremonyPrefs().speed || 'normal';
  if (s === 'slow') return Math.round(base * 1.35);
  if (s === 'fast') return Math.round(base * .72);
  return base;
}
function ceremonyVibrate(pattern = 22) {
  const prefs = getCeremonyPrefs();
  if (prefs.vibration && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch {}
  }
}
/* Fase 13D. El sonido ya existia pero se quedaba mudo en movil: el
   navegador crea el contexto suspendido y nadie lo reanudaba. Ademas
   ignoraba el silencio general de la app. Se corrigen ambas cosas y
   se abre a la capa V2, que hasta ahora no sonaba.
   Sigue apagado por defecto: nada suena sin activarlo en Ajustes. */
const TONOS = {
  shuffle: { f: 196, a: 1.35, d: .34, v: .038 },
  reveal:  { f: 432, a: 1.45, d: .42, v: .045 },
  rune:    { f: 174, a: 1.40, d: .40, v: .042 },
  pick:    { f: 288, a: 1.18, d: .22, v: .030 },
  close:   { f: 324, a: 0.75, d: .70, v: .040 }
};

function audioSilenciado() {
  try { return localStorage.getItem('oraculo.v2.voz.silencio') === '1'; } catch { return false; }
}

function audioCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = window.__oraculoAudioCtx || (window.__oraculoAudioCtx = new AC());
  /* Sin gesto previo el contexto nace suspendido y todo suena a nada. */
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function ceremonyTone(kind = 'reveal') {
  if (!getCeremonyPrefs().sounds) return;
  if (audioSilenciado()) return;
  try {
    const ctx = audioCtx();
    if (!ctx) return;
    const p = TONOS[kind] || TONOS.reveal;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(p.v, now + .03);
    master.gain.exponentialRampToValueAtTime(0.0001, now + p.d);
    master.connect(ctx.destination);
    /* Fundamental mas una quinta muy tenue: da cuerpo sin necesitar
       ningun archivo de audio, que engordaria la app sin conexion. */
    [[1, 1], [1.5, .28]].forEach(([mult, peso]) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.value = peso;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.f * mult, now);
      osc.frequency.exponentialRampToValueAtTime(p.f * mult * p.a, now + p.d * .42);
      osc.connect(g).connect(master);
      osc.start(now);
      osc.stop(now + p.d + .04);
    });
  } catch {}
}

/* La capa V2 es script clasico y no ve estas funciones. */
window.OraculoSonido = {
  tono: ceremonyTone,
  activo: () => !!getCeremonyPrefs().sounds && !audioSilenciado(),
  vibrar: (p) => ceremonyVibrate(p)
};
function openCeremonyIntro(kind = 'tarot') {
  const isTarot = kind === 'tarot';
  openModal({ icon:isTarot?'🃏':'ᚱ', title:t(isTarot?'mdRitualTarot':'mdRitualRunas'), subtitle:t('mdAntesS'), body:`
    <div class="ceremony-intro">
      <div class="ceremony-orb">${isTarot?'🔮':'ᚱ'}</div>
      <h3>${escapeHTML(t(isTarot?'stMazoPreparado':'stSaquitoPreparado'))}</h3>
      <p>${escapeHTML(t('stEligeUnaPreguntaClaraRespiraTres'))}</p>
      <div class="actions mt"><button class="btn primary" data-module="${isTarot?'tarot':'runas'}">${escapeHTML(t(isTarot?'stElegirTirada':'stElegirRunas'))}</button><button class="btn" data-act="settings">${escapeHTML(t('settings'))}</button></div>
    </div>` });
}
function getAppVersionLabel() { return 'v1.0'; }
function get3dPreference() { try { return localStorage.getItem(LS.effects3d) || 'auto'; } catch { return 'auto'; } }
function set3dPreference(value = 'auto') {
  const allowed = ['auto', 'high', 'balanced', 'reduced', 'off'];
  const next = allowed.includes(value) ? value : 'auto';
  try { localStorage.setItem(LS.effects3d, next); } catch {}
  window.Oraculo3D?.setPreference?.(next);
}
function appHealthCheck() {
  const voices = ('speechSynthesis' in window) ? speechSynthesis.getVoices().length : 0;
  openModal({ icon:'🧪', title:t('mdEstado'), subtitle:getAppVersionLabel(), body:`
    <div class="status-grid">
      <div class="status-card"><strong>${escapeHTML(t('stVersion'))}</strong><span>${getAppVersionLabel()}</span></div>
      <div class="status-card"><strong>${escapeHTML(t('stVocesDetectadas'))}</strong><span>${voices}</span></div>
      <div class="status-card"><strong>IA</strong><span>${localStorage.getItem(LS.puter)==='true'?'Conectada':'Modo simbólico'}</span></div>
      <div class="status-card"><strong>${escapeHTML(t('stPwa'))}</strong><span>${navigator.serviceWorker?'Compatible':'No disponible'}</span></div>
    </div>
    <p class="notice mt">${escapeHTML(t('stSiDespuesDeSubirUnaVersion'))}</p>` });
}
function backupData() {
  const data = {
    createdAt:new Date().toISOString(),
    version:getAppVersionLabel(),
    name:localStorage.getItem(LS.name) || '',
    prefs:storeGet(LS.prefs,{}),
    voice:storeGet(LS.voice,{}),
    ceremony:getCeremonyPrefs(),
    profile:getProfile(),
    birthDate:getBirthDate(),
    birthTime:getBirthTime(),
    birthPlace:getBirthPlace(),
    astroHouseSystem:getAstroHouseSystem(),
    theme:getTheme(),
    privateMode:isPrivateMode(),
    pdfStyle:getPdfStyle(),
    performanceMode:isPerformanceMode(),
    migration:localStorage.getItem(LS.migration) || '',
    diary:storeGet(LS.diary,[]),
    chat:storeGet(LS.chat,[])
  };
  downloadTextFile('oraculo-mistico-backup.json', JSON.stringify(data,null,2));
  unlockAchievement('first_backup');
}

function tarotReading(cards, title = 'Lectura de Tarot') {
  const question = $('#tarotPrompt')?.value?.trim() || '';
  const subject = getReadingSubject();
  const linesOnly = cards.map((c, i) => `${i + 1}. ${c.position ? posLabel(c.position) + ' — ' : ''}${c.card.name}${c.rev ? ' ' + t('lblReversed') : ''}: ${c.rev ? (c.card.reversedMeaning || c.card.rv) : (c.card.uprightMeaning || c.card.up)}${contextoDePosicion(c.position) ? " " + contextoDePosicion(c.position) : ""}`).join('\n\n');
  const lines = `${subjectPrefix(subject)}${question ? `${t('lblQuestion')}: ${question}

` : ''}${linesOnly}`;
  setLastReading({ type: 'Tarot', title, text: lines, items: cards.map(c => ({ kind:'tarot', name:c.card.name, subtitle:c.card.key || c.card.el || '', image:c.card.img || '', symbol:'🃏', position:c.position || '', reversed:!!c.rev })), meta:subjectMeta(subject) });
  const content = cards.length === 1 ? `
    <div class="reading-layout">
      <div>${cardImage(cards[0].card)}</div>
      <div class="result-card"><h3>${escapeHTML(cards[0].card.name)} ${cards[0].rev ? t('lblReversed') : ''}</h3>${subject ? `<p><strong>${escapeHTML(t('lblFor'))}:</strong> ${escapeHTML(subject)}</p>` : ''}${question ? `<p><strong>${escapeHTML(t('lblQuestion'))}:</strong> ${escapeHTML(question)}</p>` : ''}<p>${escapeHTML(cards[0].rev ? cards[0].card.rv : cards[0].card.up)}</p><p><strong>${escapeHTML(t('lblKey'))}:</strong> ${escapeHTML(cards[0].card.key || '')}</p>${readingActions(lines,'Tarot')}</div>
    </div>` : `
    <div class="library-grid">${cards.map(c=>`<button class="mini-card" data-card-name="${escapeHTML(c.card.name)}">${c.card.img ? `<img src="${escapeHTML(c.card.img)}" alt="${escapeHTML(c.card.name)}">` : ''}<strong>${escapeHTML(c.card.name)}</strong><small>${escapeHTML(posLabel(c.position) || (c.rev ? t('lblReversed') : t('lblUpright')))}</small></button>`).join('\n\n')}</div>
    <div class="result-card"><h3>${escapeHTML(title)}</h3>${subject ? `<p><strong>${escapeHTML(t('lblFor'))}:</strong> ${escapeHTML(subject)}</p>` : ''}${question ? `<p><strong>${escapeHTML(t('lblQuestion'))}:</strong> ${escapeHTML(question)}</p>` : ''}<p>${escapeHTML(linesOnly).replace(/\n/g,'<br>')}</p>${readingActions(lines,'Tarot')}</div>`;
  openModal({ icon:'🃏', title, subtitle:subjectSubtitle('Lectura completa.', subject), body: content });
}
/* ============================================================
   Fase 12 · Contexto por posición
   La misma carta no dice lo mismo en «Pasado» que en «Consejo».
   Se antepone una frase que sitúa la lectura, elegida por el
   tipo de posición y no por su nombre exacto, para que sirva a
   las 21 tiradas sin escribir una regla por cada una.
   ============================================================ */
/* Etiqueta visible de una posicion de tirada. El texto castellano
   sigue siendo la clave interna: con el casan los CONTEXTOS y con el
   se guardaron las lecturas anteriores. */
/* La intencion la escribe la persona y se muestra tal cual. Las dos
   unicas excepciones son los valores por defecto del sistema, que nadie
   ha tecleado: esos si se traducen. El valor guardado no cambia. */
function intencionVisible(v) {
  const s = String(v || '').trim();
  if (/^claridad$/i.test(s)) return t('intDefClarity');
  if (/^libre$/i.test(s)) return t('intDefFree');
  return s;
}

function posLabel(posicion) {
  if (!posicion) return '';
  const clave = 'pos' + String(posicion)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/ /g, '');
  const v = t(clave);
  return v && v !== clave ? v : posicion;
}

const CONTEXTOS = [
  [/pasado|origen|raíz|base|antes/i,            'ctxPast'],
  [/presente|situación|actual|centro|yo\b/i,    'ctxPresent'],
  [/futuro|resultado|potencial|posible|camino/i,'ctxFuture'],
  [/reto|obstáculo|bloqueo|cruce|dificultad/i,  'ctxChallenge'],
  [/consejo|clave|llave|paso|recomend/i,        'ctxAdvice'],
  [/otra persona|vínculo|relación|pareja|los dos/i, 'ctxBond'],
  [/energía|apoyo|fortaleza|don|talento/i,      'ctxResource'],
  [/oculto|inconsciente|miedo|sombra|interior/i,'ctxHidden'],
  [/entorno|influencia|casa \d|semana|mes|día/i,'ctxEnv']
];

/* El titulo visible sale de i18n; 'title' se conserva intacto porque
   viaja dentro de las lecturas ya guardadas. */
function spreadTitle(spread) {
  return spread?.i18n ? t(spread.i18n) : (spread?.title || '');
}

function contextoDePosicion(posicion = '') {
  if (!posicion) return '';
  const encontrado = CONTEXTOS.find(([re]) => re.test(posicion));
  return encontrado ? t(encontrado[1]) : '';
}

function animateTarotReading(cards, title = 'Lectura de Tarot', reversedRate = 0.3) {
  const question = $('#tarotPrompt')?.value?.trim() || '';
  const subject = getReadingSubject();
  const linesOnly = cards.map((c, i) => `${i + 1}. ${c.position ? posLabel(c.position) + ' — ' : ''}${c.card.name}${c.rev ? ' ' + t('lblReversed') : ''}: ${c.rev ? (c.card.reversedMeaning || c.card.rv) : (c.card.uprightMeaning || c.card.up)}${contextoDePosicion(c.position) ? " " + contextoDePosicion(c.position) : ""}`).join('\\n\\n');
  const lines = `${subjectPrefix(subject).replace(/\n/g, '\\n')}${question ? `${t('lblQuestion')}: ${question}\\n\\n` : ''}${linesOnly}`;
  setLastReading({ type: 'Tarot', title, text: lines, items: cards.map(c => ({ kind:'tarot', name:c.card.name, subtitle:c.card.key || c.card.el || '', image:c.card.img || '', symbol:'🃏', position:c.position || '', reversed:!!c.rev })), meta:subjectMeta(subject, { reversedRate }) });
  ceremonyTone('shuffle');
  ceremonyVibrate([18, 40, 18]);
  openModal({ icon:'🃏', title, subtitle:t('cerSub'), body:`
    <div class="draw-experience spectacular-stage tarot-stage">
      <div class="om-3d-stage om-3d-ritual" data-oraculo-3d-asset="tarotCard" aria-label="Carta Arcana"></div>
      <div class="ritual-particles">${Array.from({length:12}, (_,i)=>`<span style="--i:${i}"></span>`).join('')}</div>
      <div class="channeling card-glow ritual-banner"><span class="orb-pulse">🔮</span><div><h3>${escapeHTML(t('cerTitle'))}</h3><p>${escapeHTML(t('cerText'))}</p></div></div>
      <div id="tarotShuffleBoard" class="shuffle-board tarot-board deluxe-board"><div class="altar-ring"></div><img src="img/tarot-shuffle-hero.svg" alt="Mezcla de cartas del oráculo" class="shuffle-hero tarot-hero">${cards.map((c, i) => `<div class="card-back shuffle-card deluxe-card" style="--i:${i}"><div class="card-back-inner"><span class="back-logo">🔮</span><strong>${escapeHTML(t('stOraculo'))}</strong><small>${c.rev ? 'Invertida' : 'Directa'}</small></div></div>`).join('')}</div>
      <div id="tarotRevealGrid" class="draw-reveal-grid tarot-reveal-grid tarot-count-${cards.length}">${cards.map((c, i) => `<div class="reveal-slot tarot-slot waiting cinematic-slot" id="tarot-slot-${i}"><div class="slot-aura"></div><div class="slot-label">${escapeHTML(posLabel(c.position) || t('lblCardN', { n: i + 1 }))}</div><div class="slot-wait">${escapeHTML(t('lblVeilOpening'))}</div></div>`).join('')}</div>
      <div id="tarotResultWrap" class="hidden"></div>
    </div>` });
  cards.forEach((item, index) => {
    setTimeout(() => {
      const slot = $(`#tarot-slot-${index}`);
      if (!slot) return;
      slot.className = 'reveal-slot tarot-slot revealed cinematic-slot';
      ceremonyTone('reveal'); ceremonyVibrate(28);
      /* La carta revelada muestra sus tres conceptos y su energía. El texto
         base viene del catálogo local: funciona sin IA y sin conexión. */
      const claves = Array.isArray(item.card.keywords) ? item.card.keywords.join(' · ') : (item.card.key || '');
      const lectura = item.rev ? (item.card.reversedMeaning || item.card.rv) : (item.card.uprightMeaning || item.card.up);
      slot.innerHTML = `<div class="slot-aura reveal-burst"></div><div class="slot-label">${escapeHTML(posLabel(item.position) || t('lblCardN', { n: index + 1 }))}</div><div class="card-frame ${item.rev ? 'reversed' : ''}">${cardImage(item.card)}${item.card.num ? `<span class="card-roman">${escapeHTML(item.card.num)}</span>` : ''}<strong>${escapeHTML(item.card.name)}</strong>${claves ? `<span class="card-keys">${escapeHTML(claves)}</span>` : ''}${item.card.energy ? `<span class="card-energy">${escapeHTML(item.card.energy)}</span>` : ''}<small>${escapeHTML(item.rev ? t('lblReversed180') : t('lblUprightFull'))}</small></div>`;
      if (index === cards.length - 1) {
        const board = $('#tarotShuffleBoard');
        if (board) board.classList.add('fade-out');
      }
    }, ceremonyDelay(1000 + index * 1150));
  });
  setTimeout(() => {
    const wrap = $('#tarotResultWrap');
    if (!wrap) return;
    wrap.className = 'result-appear';
    wrap.innerHTML = `<div class="result-card ritual-result"><h3>${escapeHTML(title)}</h3>${subject ? `<p><strong>${escapeHTML(t('lblFor'))}:</strong> ${escapeHTML(subject)}</p>` : ''}${question ? `<p><strong>${escapeHTML(t('lblQuestion'))}:</strong> ${escapeHTML(question)}</p>` : ''}<p>${escapeHTML(linesOnly).replace(/\\n/g,'<br>')}</p>${reversalRateNotice(reversedRate)}${readingActions(lines,'Tarot')}</div>`;
  }, ceremonyDelay(1500 + cards.length * 1150));
}
function drawTarot(count = 1, title = 'Carta de Tarot', positions = []) {
  const reversedRate = chooseReversedRate();
  const deck = [...ALL_TAROT]
    .sort(() => Math.random() - .5)
    .slice(0, count)
    .map((card, index) => ({ card, rev: isReversed(reversedRate), position: positions[index] || '' }));
  animateTarotReading(deck, title, reversedRate);
}
function drawTarotSpread(key = 'one') {
  const spread = getTarotSpread(key);
  drawTarot(spread.count, spreadTitle(spread), spread.positions);
}

/* Puente para la capa V2: el ritual necesita las tiradas y el mazo, y
   entregar las cartas que la persona ha elegido a la misma revelación
   de siempre. Se expone lo mínimo; la lógica sigue viviendo aquí. */
/* El sistema de traducción, al alcance de la capa V2, que son scripts
   clásicos y no pueden importar el módulo. No es un segundo sistema:
   es el mismo, accesible. */
window.OraculoI18n = {
  t,
  idioma: getAppLanguage,
  locale: getAppLocale
};

/* Todo el saber que la app ya contenía, disponible para la Biblioteca.
   Estaba repartido en catálogos de cada módulo; aquí solo se expone. */
/* Catalogo de los 78 Arcanos, con su validacion. La comprobacion no
   molesta a quien usa la app: se consulta desde la consola con
   OraculoArcanos.validar(). */
window.OraculoArcanos = {
  get catalogo() { return ARCANOS; },
  get mazo() { return ALL_TAROT; },
  elementos: ELEMENTOS,
  validar: (idiomas) => validarArcanos(ALL_TAROT, idiomas || ['es','ca','en','fr','de','zh']),
  usarIdioma: usarIdiomaTarot,
  estadoIdiomas,
  etiquetaTendencia: (cod, l) => (TENDENCIA_TRAD[l] || TENDENCIA_TRAD.es)[cod] || cod,
  /* Un nombre guardado puede venir de cualquier idioma. */
  codigoPorNombre,
  esArcanoMayor
};

window.OraculoSaber = {
  get tarot()  { return ALL_TAROT; },
  get runas()  { return RUNAS; },
  get lunas()  { return MOON_PHASES; },
  get suenos() { return dreamSymbols; }
};

window.OraculoTarot = {
  spreads: TAROT_SPREADS,
  getSpread: getTarotSpread,
  deck: ALL_TAROT,
  drawSpread: drawTarotSpread,
  revelar: animateTarotReading,
  tasaInvertidas: chooseReversedRate,
  esInvertida: isReversed
};
function renderSpreadButton(key, spread) {
  return `<button class="spread-card" data-act="spread-${escapeHTML(key)}" type="button"><span>${spread.icon || '🃏'}</span><strong>${escapeHTML(spreadTitle(spread))}</strong><small>${spread.count} ${escapeHTML(spread.count > 1 ? t('bCards') : t('bCard'))}</small></button>`;
}
function showTarot() {
  const normalKeys = Object.keys(TAROT_SPREADS).filter(k => !TAROT_SPREADS[k].premium);
  const premiumKeys = Object.keys(TAROT_SPREADS).filter(k => TAROT_SPREADS[k].premium);
  openModal({ icon:'🃏', title:t('tarot'), subtitle:t('tarotSub'), body:`
    <div class="om-3d-stage om-modal-3d" data-oraculo-3d-asset="tarotTable" aria-label="Mesa de Lectura"></div>
    <div class="form-grid">${readingSubjectField()}<div class="field"><label>${escapeHTML(t('tarotQ'))}</label>${inputWithMic('tarotPrompt', `placeholder="${escapeHTML(t('tarotQPh'))}"`)}</div></div>
    <div class="actions mt"><button class="btn primary" data-act="ceremony-tarot" type="button">✨ ${escapeHTML(t('guidedRitual'))}</button><button class="btn" data-module="runas" type="button">ᚱ ${escapeHTML(t('runeSpreads'))}</button><button class="btn" data-act="tarot-library" type="button">📚 ${escapeHTML(t('deckLibrary'))}</button></div>
    <div class="spread-grid mt">${normalKeys.map(k => renderSpreadButton(k, TAROT_SPREADS[k])).join('\n\n')}</div>
    <hr class="soft-line"><h3 class="section-title">${escapeHTML(t('stTiradasPremium'))}</h3>
    <div class="spread-grid premium-spreads">${premiumKeys.map(k => renderSpreadButton(k, TAROT_SPREADS[k])).join('\n\n')}</div>
    <p class="notice mt">${escapeHTML(t('tarotNote'))}</p>` });
}
function showTarotLibrary(filter = 'all') {
  const tabs = `<div class="tabs"><button class="tab ${filter==='all'?'active':''}" data-act="tarot-lib-all">Todas</button><button class="tab ${filter==='major'?'active':''}" data-act="tarot-lib-major">Mayores</button><button class="tab ${filter==='minor'?'active':''}" data-act="tarot-lib-minor">Menores</button></div>`;
  const cards = filter === 'major' ? MAJOR_ARCANA : filter === 'minor' ? MINOR_ARCANA : ALL_TAROT;
  openModal({ icon:'🃏', title:t('mdBibTarot'), subtitle:`${cards.length} cartas visibles en galería.`, body:`${tabs}<div class="library-grid">${cards.map(c=>`<button class="mini-card" data-open-card="${escapeHTML(c.name)}">${c.img ? `<img src="${escapeHTML(thumbFor(c.img))}" alt="${escapeHTML(c.name)}" loading="lazy" decoding="async">` : ''}<strong>${escapeHTML(c.name)}</strong><small>${escapeHTML(c.key || c.el || '')}</small></button>`).join('\n\n')}</div>` });
}
function showCardDetail(card) {
  setLastReading({ type: 'Tarot', title: card.name, text: `${card.up}\n\nInvertida: ${card.rv}`, items: [card.name] });
  openModal({ icon:'🃏', title:card.name, subtitle:card.key || card.el || 'Carta de Tarot', body:`<div class="om-3d-stage om-modal-3d" data-oraculo-3d-asset="tarotCard" aria-label="Carta Arcana"></div><div class="reading-layout"><div>${cardImage(card)}</div><div class="result-card"><h3>${escapeHTML(t('stAlDerecho'))}</h3><p>${escapeHTML(card.up)}</p><h3>${escapeHTML(t('stInvertida'))}</h3><p>${escapeHTML(card.rv || 'Sin lectura invertida específica.')}</p>${readingActions(`${card.name}\n${card.up}`,'Tarot')}</div></div>` });
}

function animateRuneReading(runes, title = 'Lectura de Runas', reversedRate = 0.3) {
  const subject = getReadingSubject();
  const intention = $('#runeIntention')?.value?.trim() || '';
  const linesOnly = runes.map((r, i) => `${i + 1}. ${r.rune.name} ${r.rev ? t('lblReversed') : ''}: ${r.rev ? (r.rune.rv || r.rune.up) : r.rune.up}`).join('\n\n');
  const lines = `${subjectPrefix(subject)}${intention ? `${t('lblIntent')}: ${intention}\n` : ''}${linesOnly}`;
  setLastReading({ type: 'Runas', title, text: lines, items: runes.map(r => ({ kind:'runa', name:r.rune.name, subtitle:r.rune.up || '', image:r.rune.img || '', symbol:r.rune.sym || 'ᚱ', reversed:!!r.rev })), meta:subjectMeta(subject, { reversedRate, intention }) });
  ceremonyTone('shuffle');
  ceremonyVibrate([14, 35, 14]);
  openModal({ icon:'ᚱ', title, subtitle:t('mdRitualRunasS'), body:`
    <div class="draw-experience spectacular-stage rune-stage">
      <div class="ritual-particles rune-particles">${Array.from({length:10}, (_,i)=>`<span style="--i:${i}"></span>`).join('')}</div>
      <div class="channeling card-glow ritual-banner"><span class="orb-pulse">✨</span><div><h3>${escapeHTML(t('stElSaquitoRunicoDespierta'))}</h3><p>${escapeHTML(t('stLasPiedrasSagradasSeAgitanY'))}</p></div></div>
      <div class="rune-bag-stage deluxe-rune-stage"><div class="rune-vortex"></div><img src="img/rune-pouch.svg" id="runeBag" class="rune-bag-image deluxe-pouch" alt="Saquito místico de runas"><p class="notice">${escapeHTML(t('stConcentrateCadaRunaApareceraDesdeEl'))}</p></div>
      <div id="runeRevealGrid" class="draw-reveal-grid rune-reveal-grid rune-count-${runes.length}">${runes.map((r, i) => `<div class="reveal-slot rune-slot waiting cinematic-slot" id="rune-slot-${i}"><div class="slot-aura"></div><div class="slot-label">Runa ${i + 1}</div><img src="img/rune-pouch.svg" alt="Saquito de runas" class="slot-pouch"><div class="slot-wait">La piedra está despertando...</div></div>`).join('')}</div>
      <div id="runeResultWrap" class="hidden"></div>
    </div>` });
  runes.forEach((item, index) => {
    setTimeout(() => {
      const slot = $(`#rune-slot-${index}`);
      if (!slot) return;
      slot.className = 'reveal-slot rune-slot revealed cinematic-slot';
      ceremonyTone('rune'); ceremonyVibrate(30);
      slot.innerHTML = `<div class="slot-aura reveal-burst"></div><div class="slot-label">${index === 0 ? 'Primera runa' : index === 1 ? 'Segunda runa' : index === 2 ? 'Tercera runa' : `Runa ${index + 1}`}</div><div class="rune-stone ${item.rune.img ? 'has-art' : ''} ${item.rev ? 'reversed' : ''}">${runeImage(item.rune)}<strong>${escapeHTML(item.rune.name)}</strong><small>${item.rev ? 'Invertida' : 'Al derecho'}</small></div>`;
      if (index === runes.length - 1) {
        const bag = $('#runeBag');
        if (bag) bag.classList.add('bag-rest');
      }
    }, ceremonyDelay(950 + index * 1100));
  });
  setTimeout(() => {
    const wrap = $('#runeResultWrap');
    if (!wrap) return;
    wrap.className = 'result-appear';
    wrap.innerHTML = `<div class="result-card ritual-result"><h3>${escapeHTML(title)}</h3>${subject ? `<p><strong>${escapeHTML(t('lblFor'))}:</strong> ${escapeHTML(subject)}</p>` : ''}${intention ? `<p><strong>${escapeHTML(t('stIntencion'))}</strong> ${escapeHTML(intention)}</p>` : ''}<p>${escapeHTML(linesOnly).replace(/\n/g,'<br>')}</p>${reversalRateNotice(reversedRate)}${readingActions(lines,'Runas')}</div>`;
  }, ceremonyDelay(1450 + runes.length * 1100));
}
function drawRunes(count = 1, title = 'Runa rápida') {
  const reversedRate = chooseReversedRate();
  const runes = [...RUNAS].sort(() => Math.random() - .5).slice(0, count).map(rune => ({ rune, rev: Boolean(rune.rv) && isReversed(reversedRate) }));
  animateRuneReading(runes, title, reversedRate);
}
function showRunas() {
  openModal({ icon:'ᚱ', title:t('runes'), subtitle:t('runesSub'), body:`<div class="om-3d-stage om-modal-3d" data-oraculo-3d-asset="runes" aria-label="${escapeHTML(t('a3dRunes'))}"></div><div class="form-grid">${readingSubjectField()}<div class="field"><label>${escapeHTML(t('runeIntent'))}</label><input id="runeIntention" class="input" placeholder="${escapeHTML(t('runeIntentPh'))}"></div></div><div class="actions mb mt"><button class="btn primary" data-act="ceremony-runes" type="button">✨ ${escapeHTML(t('guidedRitual'))}</button></div><div class="panel-grid"><button class="choice" data-act="rune-one"><strong>ᚱ ${escapeHTML(t('runeOne'))}</strong><small>${escapeHTML(t('runeOneSub'))}</small></button><button class="choice" data-act="runes-three"><strong>ᚠᚢᚦ ${escapeHTML(t('runeThree'))}</strong><small>${escapeHTML(t('runeThreeSub'))}</small></button><button class="choice" data-act="runes-five"><strong>ᚠᚢᚦᚨᚱ ${escapeHTML(t('runeFive'))}</strong><small>${escapeHTML(t('runeFiveSub'))}</small></button><button class="choice" data-act="runes-library"><strong>📚 ${escapeHTML(t('runeLib'))}</strong><small>${escapeHTML(t('runeLibSub'))}</small></button></div>` });
}
function showRunesLibrary() {
  openModal({ icon:'ᚱ', title:t('mdBibRunas'), subtitle:t('mdBibRunasS'), body:`<div class="library-grid">${RUNAS.map(r=>`<button class="mini-card rune-mini" data-open-rune="${escapeHTML(r.name)}">${r.img ? `<img src="${escapeHTML(thumbFor(r.img))}" alt="${escapeHTML(r.name)}" loading="lazy" decoding="async">` : `<span class="symbol">${r.sym}</span>`}<strong>${r.sym} ${escapeHTML(r.name)}</strong><small>${escapeHTML(clampText(r.up,70))}</small></button>`).join('\n\n')}</div>` });
}
function showRuneDetail(r) {
  setLastReading({ type:'Runas', title:r.name, text:`${r.up}\n\nInvertida: ${r.rv || 'Sin posición invertida específica.'}`, items:[{ kind:'runa', name:r.name, subtitle:r.up || '', image:r.img || '', symbol:r.sym || 'ᚱ' }] });
  openModal({ icon:'ᚱ', title:r.name, subtitle:t('mdRunaFuthark'), body:`<div class="reading-layout"><div class="rune-big">${r.sym}</div><div class="result-card"><h3>${escapeHTML(t('stMensaje'))}</h3><p>${escapeHTML(r.up)}</p><h3>${escapeHTML(t('stInvertida'))}</h3><p>${escapeHTML(r.rv || 'Sin lectura invertida específica.')}</p>${readingActions(`${r.name}\n${r.up}`,'Runas')}</div></div>` });
}

/* La fase se calculaba como el día del mes entre ocho, así que casi nunca
   coincidía con la luna real. Ahora se deriva del ciclo sinódico a partir
   de una luna nueva conocida (6 de enero de 2000, 18:14 UTC). */
const LUNACION = 29.530588853;
const LUNA_CERO = Date.UTC(2000, 0, 6, 18, 14) / 86400000;

function edadLunar(fecha = new Date()) {
  const dias = fecha.getTime() / 86400000;
  const edad = (dias - LUNA_CERO) % LUNACION;
  return edad < 0 ? edad + LUNACION : edad;
}
function faseLunar(fecha = new Date()) {
  const edad = edadLunar(fecha);
  const ciclo = edad / LUNACION;                       // 0 a 1
  const indice = Math.round(ciclo * 8) % 8;            // 0 = nueva
  const iluminacion = Math.round((1 - Math.cos(2 * Math.PI * ciclo)) / 2 * 100);
  return { fase: MOON_PHASES[indice] || MOON_PHASES[0], indice, edad, iluminacion, creciente: ciclo < 0.5 };
}
/** Cuándo llega la próxima fase principal: nueva, creciente, llena o menguante. */
function proximaFasePrincipal(fecha = new Date()) {
  const edad = edadLunar(fecha);
  const hitos = [0, LUNACION * 0.25, LUNACION * 0.5, LUNACION * 0.75, LUNACION];
  const nombres = ['Luna Nueva', 'Cuarto Creciente', 'Luna Llena', 'Cuarto Menguante', 'Luna Nueva'];
  for (let i = 0; i < hitos.length; i++) {
    if (edad < hitos[i] - 0.02) {
      const faltan = hitos[i] - edad;
      return { nombre: nombres[i], dias: Math.max(1, Math.round(faltan)) };
    }
  }
  return { nombre: 'Luna Nueva', dias: Math.max(1, Math.round(LUNACION - edad)) };
}
/** Los próximos siete días, para el calendario lunar. */
function semanaLunar(fecha = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(fecha.getTime() + i * 86400000);
    const f = faseLunar(d);
    return { dia: d.getDate(), inicial: ['D', 'L', 'M', 'X', 'J', 'V', 'S'][d.getDay()], sym: f.fase.sym, iluminacion: f.iluminacion, hoy: i === 0 };
  });
}

function showLuna() {
  const { fase: cruda, iluminacion, edad, creciente } = faseLunar();
  /* Solo para pintar: el objeto original sigue intacto porque su
     nombre viaja dentro de las lecturas ya guardadas. */
  const phase = faseTraducida(cruda);
  const proxima = proximaFasePrincipal();
  const dias = semanaLunar();
  const body = `<div class="om-3d-stage om-modal-3d" data-oraculo-3d-asset="moon" aria-label="Luna Celestial"></div><div class="om-luna">
      <div class="om-luna-astro" role="img" aria-label="${escapeHTML(phase.name)}, ${iluminacion}% ${escapeHTML(t('lunLit'))}">
        <div class="om-luna-disco" style="--ilum:${iluminacion}%; --lado:${creciente ? 'right' : 'left'}"></div>
      </div>
      <p class="om-luna-fase">${phase.sym} ${escapeHTML(phase.name)}</p>
      <div class="om-luna-datos">
        <span><b>${iluminacion}%</b> ${escapeHTML(t('lunLit'))}</span>
        <span><b>${escapeHTML(t('lunDay'))} ${Math.floor(edad) + 1}</b> ${escapeHTML(t('lunOfCycle'))}</span>
        <span><b>${escapeHTML(proxima.nombre)}</b> en ${proxima.dias} día${proxima.dias > 1 ? 's' : ''}</span>
      </div>
      <div class="om-luna-semana" aria-label="Próximos siete días">
        ${dias.map(d => `<div class="om-luna-dia${d.hoy ? ' hoy' : ''}"><small>${d.inicial}</small><span>${d.sym}</span><b>${d.dia}</b><i>${d.iluminacion}%</i></div>`).join('')}
      </div>
    </div>
    <div class="result-card"><p>${escapeHTML(phase.meaning)}</p><p><strong>${escapeHTML(t('moonRitual'))}:</strong> ${escapeHTML(phase.ritual)}</p><p><strong>${escapeHTML(t('moonAffirm'))}:</strong> ${escapeHTML(phase.affirmation)}</p></div><div class="form-grid mt">${readingSubjectField()}<div class="field"><label>${escapeHTML(t('moonFocus'))}</label><select id="moonFocus">${[['focusClarity','Claridad'],['focusLove','Amor'],['focusWork','Trabajo / estudios'],['focusRest','Descanso'],['focusRelease','Soltar']].map(([k,v]) => `<option value="${v}">${escapeHTML(t(k))}</option>`).join('')}</select></div><div class="field"><label>${escapeHTML(t('moonQ'))}</label>${inputWithMic('moonQuestion', `placeholder="${escapeHTML(t('moonQPh'))}"`)}</div></div><div class="actions mt"><button class="btn primary" data-act="moon-reading">${escapeHTML(t('moonGo'))}</button></div>`;
  openModal({ icon:'🌙', title:t('mdLuna'), subtitle:t('mdLunaS'), body });
}
function moonReading() {
  const cruda = faseLunar().fase;
  const phase = faseTraducida(cruda);
  const subject = getReadingSubject();
  const focus = $('#moonFocus')?.value || 'Claridad';
  const q = $('#moonQuestion')?.value || 'Sin pregunta';
  const text = `${subjectPrefix(subject)}${phase.name}\n${t('moonFocus')}: ${focus}\n${t('lblQuestion')}: ${q}\n${phase.meaning}\n${t('moonRitual')}: ${phase.ritual}\n${t('moonAffirm')}: ${phase.affirmation}`;
  setLastReading({ type:'Luna', title:`${t('moonReading')}: ${phase.name}`, text, items:[phase.name], meta:subjectMeta(subject, { focus, question:q, phaseIndex:MOON_PHASES.indexOf(cruda) }) });
  openModal({ icon:'🌙', title:`${t('moonReading')}: ${phase.name}`, subtitle:subjectSubtitle(focus, subject), body:`<div class="result-card"><h3>${phase.sym} ${escapeHTML(phase.name)}</h3>${subject ? `<p><strong>${escapeHTML(t('lblFor'))}:</strong> ${escapeHTML(subject)}</p>` : ''}<p>${escapeHTML(phase.meaning)}</p><p><strong>${escapeHTML(t('moonAdvice'))}:</strong> ${escapeHTML(t('moonAdviceText'))}</p><p><strong>${escapeHTML(t('moonRitual'))}:</strong> ${escapeHTML(phase.ritual)}</p><p><strong>${escapeHTML(t('moonAffirm'))}:</strong> ${escapeHTML(phase.affirmation)}</p>${readingActions(text,'Luna')}</div>` });
}

const dreamSymbols = {
  agua:'Emociones, intuición y limpieza interior.', volar:'Deseo de libertad, perspectiva y expansión.', casa:'Tu mundo interno, seguridad y memoria.', persecución:'Algo pide atención; puede ser estrés o evitación.', dientes:'Cambios, comunicación o preocupación por la imagen.', animal:'Instinto, guía y energía natural.', escuela:'Aprendizaje, evaluación o crecimiento.', noche:'Misterio, descanso y partes ocultas de ti.'
};
/* Los simbolos de sueno tenian doble papel: etiqueta visible y palabra
   que se busca en el texto. En otro idioma la etiqueta salia en
   castellano y la deteccion no encontraba nada, porque quien escribe
   lo hace en su lengua. La clave interna no cambia. */
function indiceSimbolo(clave) { return Object.keys(dreamSymbols).indexOf(clave); }

function simboloSueno(clave) {
  const i = indiceSimbolo(clave);
  if (i < 0) return { etiqueta: clave, significado: dreamSymbols[clave] || '', palabras: [clave] };
  return {
    etiqueta: t('ds' + i + 'L'),
    significado: t('ds' + i + 'M'),
    palabras: String(t('ds' + i + 'W')).split('|').map(x => x.trim().toLowerCase()).filter(Boolean)
  };
}

const dreamElements = {
  Agua:{
    words:['agua','mar','río','rio','lluvia','lago','océano','oceano','piscina','ola','barco','nadar','lágrima','lagrima','inundación','inundacion'],
    explanation:'El agua señala un sueño centrado en emociones, intuición, memoria afectiva y procesos de limpieza o adaptación.'
  },
  Fuego:{
    words:['fuego','llama','incendio','sol','calor','quemar','volcán','volcan','chispa','luz intensa'],
    explanation:'El fuego concentra transformación, impulso, deseo, creatividad y la necesidad de actuar o renovar una situación.'
  },
  Aire:{
    words:['volar','viento','cielo','nube','tormenta','pájaro','pajaro','avión','avion','altura','respirar'],
    explanation:'El aire habla de ideas, comunicación, libertad, perspectiva y necesidad de tomar distancia mental.'
  },
  Tierra:{
    words:['tierra','casa','bosque','árbol','arbol','montaña','montana','piedra','camino','jardín','jardin','cueva','animal'],
    explanation:'La tierra representa seguridad, cuerpo, raíces, hogar, límites y asuntos prácticos que buscan estabilidad.'
  }
};
function analyzeDreamElement(dream = '', foundSymbols = []) {
  const source = `${dream} ${foundSymbols.join(' ')}`.toLowerCase();
  const scores = Object.entries(dreamElements).map(([name, config]) => ({
    name,
    score:config.words.reduce((total, word) => total + (source.includes(word) ? 1 : 0), 0),
    explanation:config.explanation
  })).sort((a,b) => b.score - a.score);
  if (!scores[0]?.score) return {
    name:'Éter',
    explanation:'No domina un elemento clásico. El sueño parece combinar símbolos y emociones, por lo que conviene atender al ambiente general y a la sensación al despertar.'
  };
  return scores[0];
}
function showSuenos() {
  /* El value de cada opcion se queda en castellano: viaja dentro de las
     lecturas ya guardadas y hay codigo que lo compara. Solo cambia la
     etiqueta que se ve. */
  const opc = (id, pares) => `<select id="${id}">${pares.map(([k, v]) => `<option value="${v}">${escapeHTML(t(k))}</option>`).join('')}</select>`;
  openModal({ icon:'💭', title:t('drTitle'), subtitle:t('drSub'), body:`<div class="om-3d-stage om-modal-3d" data-oraculo-3d-asset="dreamMirror" aria-label="${escapeHTML(t('a3dMirror'))}"></div><div class="form-grid"><div class="field"><label>${escapeHTML(t('drDescribe'))}</label>${textareaWithMic('dreamText', `placeholder="${escapeHTML(t('drDescribePh'))}"`)}</div>${readingSubjectField('dreamSubject')}</div><div class="form-grid mt"><div class="field"><label>${escapeHTML(t('drMood'))}</label>${opc('dreamMood', [['drCuriosity','Curiosidad'],['drCalm','Tranquilidad'],['drFear','Miedo'],['drJoy','Alegría'],['drConfusion','Confusión']])}</div><div class="field"><label>${escapeHTML(t('drType'))}</label>${opc('dreamType', [['drSymbolic','Simbólica'],['drEmotional','Emocional'],['drPractical','Práctica'],['drSpiritual','Espiritual suave']])}</div></div><div class="tabs mt">${Object.keys(dreamSymbols).map(k=>`<button class="tab" data-add-symbol="${escapeHTML(simboloSueno(k).etiqueta)}">${escapeHTML(simboloSueno(k).etiqueta)}</button>`).join('')}</div><div class="actions"><button class="btn primary" data-act="dream-reading">${escapeHTML(t('drGo'))}</button></div>` });
}
function dreamReading() {
  const dream = $('#dreamText')?.value || '';
  const subject = getReadingSubject('dreamSubject');
  const mood = $('#dreamMood')?.value || 'Curiosidad';
  const type = $('#dreamType')?.value || 'Simbólica';
  const texto = dream.toLowerCase();
  const found = Object.keys(dreamSymbols).filter(k =>
    texto.includes(k) || simboloSueno(k).palabras.some(w => w && texto.includes(w)));
  const element = analyzeDreamElement(dream, found);
  const symbols = found.length ? found.map(k => `${simboloSueno(k).etiqueta}: ${simboloSueno(k).significado}`).join('\n') : t('drNoSymbols');
  const text = `${subjectPrefix(subject)}Sueño: ${dream || 'Sin descripción'}\nEmoción: ${mood}\nLectura: ${type}\nElemento predominante: ${element.name}\n${element.explanation}\n\nSímbolos:\n${symbols}\n\nConsejo: observa qué emoción se repite y qué parte del sueño pide orden, descanso o claridad.`;
  setLastReading({ type:'Sueños', title:subject ? `Interpretación de sueño · ${subject}` : 'Interpretación de sueño', text, items:[], meta:subjectMeta(subject, { dreamElement:element, dreamSymbols:found, mood, readingType:type }) });
  openModal({ icon:'💭', title:t('drResult'), subtitle:subjectSubtitle(`${mood} · ${type}`, subject), body:`<div class="result-card"><h3>${escapeHTML(t('drElement'))}: ${escapeHTML(element.name)}</h3>${subject ? `<p><strong>${escapeHTML(t('lblFor'))}:</strong> ${escapeHTML(subject)}</p>` : ''}<p>${escapeHTML(element.explanation)}</p></div><div class="result-card mt"><h3>${escapeHTML(t('drReadingSym'))}</h3><p>${escapeHTML(text).replace(/\n/g,'<br>')}</p>${readingActions(text,'Sueños')}</div>` });
}

function letterValue(ch) {
  const clean = ch.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  return clean >= 'A' && clean <= 'Z' ? ((clean.charCodeAt(0) - 65) % 9) + 1 : 0;
}
function reduceNum(n) { while (n > 9 && ![11,22,33].includes(n)) n = String(n).split('').reduce((a,b)=>a+Number(b),0); return n || 0; }
/* Los significados viven ahora en i18n: antes estaban fijos en
   espanol y la app en otro idioma mostraba media ficha traducida.
   La clave numerica no cambia, asi que las lecturas guardadas
   siguen siendo validas. */
const NUMEROLOGY_KEYS = [1,2,3,4,5,6,7,8,9,11,22,33];
function numerologyMeaning(number) {
  const k = NUMEROLOGY_KEYS.includes(Number(number)) ? Number(number) : 0;
  return { title:t(`nuM${k}T`), gift:t(`nuM${k}G`), challenge:t(`nuM${k}C`), advice:t(`nuM${k}A`) };
}
function normalizeNumerologyName(name = '') {
  return String(name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z]/g,'');
}
function nameNumber(name = '', mode = 'all') {
  const vowels = 'AEIOU';
  return reduceNum([...normalizeNumerologyName(name)].reduce((sum, char) => {
    const isVowel = vowels.includes(char);
    if (mode === 'vowels' && !isVowel) return sum;
    if (mode === 'consonants' && isVowel) return sum;
    return sum + letterValue(char);
  }, 0));
}
function dateParts(value = '') {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? { year:Number(match[1]), month:Number(match[2]), day:Number(match[3]) } : null;
}
function calculateNumerologyProfile(name, date) {
  const parts = dateParts(date);
  if (!parts) return null;
  const life = reduceNum(String(date).replace(/\D/g,'').split('').reduce((sum, digit) => sum + Number(digit), 0));
  const expression = nameNumber(name);
  const soul = nameNumber(name, 'vowels');
  const personality = nameNumber(name, 'consonants');
  const birthday = reduceNum(parts.day);
  const attitude = reduceNum(parts.month + parts.day);
  const personalYear = reduceNum(new Date().getFullYear() + parts.month + parts.day);
  const maturity = reduceNum(life + expression);
  return { name, date, life, expression, soul, personality, birthday, attitude, maturity, personalYear };
}
function numerologyFields(profile) {
  const year = new Date().getFullYear();
  return [
    [t('nuLife'), profile.life, t('nuLifeD')],
    [t('nuExpr'), profile.expression, t('nuExprD')],
    [t('nuSoul'), profile.soul, t('nuSoulD')],
    [t('nuPers'), profile.personality, t('nuPersD')],
    [t('nuBday'), profile.birthday, t('nuBdayD')],
    [t('nuAtt'), profile.attitude, t('nuAttD')],
    [t('nuMat'), profile.maturity, t('nuMatD')],
    [t('nuYear'), profile.personalYear, t('nuYearD', { year })]
  ].filter(([, number]) => number);
}
function numerologyCard(label, number, description) {
  const meaning = numerologyMeaning(number);
  return `<article class="result-card numerology-card">
    <div class="numerology-number">${number}</div>
    <div><h3>${escapeHTML(label)} · ${escapeHTML(meaning.title)}</h3><p>${escapeHTML(description)}</p><p><strong>${escapeHTML(t('nuStrength'))}:</strong> ${escapeHTML(meaning.gift)}.</p><p><strong>${escapeHTML(t('nuChallenge'))}:</strong> ${escapeHTML(meaning.challenge)}.</p><p><strong>${escapeHTML(t('nuAdvice'))}:</strong> ${escapeHTML(meaning.advice)}.</p></div>
  </article>`;
}
/* La fecha de nacimiento no se guardaba en ninguna parte: habia
   que reescribirla en cada visita. Se conserva en local, junto al
   nombre que ya se guardaba, y nunca sale del dispositivo. */
function getBirthDate() { try { return localStorage.getItem(LS.birthDate) || ''; } catch { return ''; } }
function setBirthDate(v) { try { if (/^\d{4}-\d{2}-\d{2}$/.test(v)) localStorage.setItem(LS.birthDate, v); } catch {} }
function getBirthTime() { try { return localStorage.getItem(LS.birthTime) || ''; } catch { return ''; } }
function setBirthTime(v) { try { if (/^\d{2}:\d{2}$/.test(v)) localStorage.setItem(LS.birthTime, v); } catch {} }
function getAstroHouseSystem() {
  try {
    const system = localStorage.getItem(LS.astroHouseSystem);
    const migratedKey = 'oraculo.astroHouseSystem.placidusMigrated.v1';
    if (system === 'quadrant' && localStorage.getItem(migratedKey) !== '1') {
      localStorage.setItem(LS.astroHouseSystem, 'placidus');
      localStorage.setItem(migratedKey, '1');
      return 'placidus';
    }
    return ['placidus','quadrant','whole','equal'].includes(system) ? system : 'placidus';
  } catch { return 'placidus'; }
}
function setAstroHouseSystem(v) { try { localStorage.setItem(LS.astroHouseSystem, ['placidus','quadrant','whole','equal'].includes(v) ? v : 'placidus'); } catch {} }
function getBirthPlace() {
  try {
    const raw = localStorage.getItem(LS.birthPlace);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function setBirthPlace(place) {
  try {
    if (place?.label) localStorage.setItem(LS.birthPlace, JSON.stringify(place));
  } catch {}
}
function normalizeCityText(value = '') {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function countryLabel(code = '') {
  const map = { ES:'España', AD:'Andorra', PT:'Portugal', FR:'Francia', US:'Estados Unidos', MX:'México', AR:'Argentina', CO:'Colombia', CL:'Chile', PE:'Perú', VE:'Venezuela', UY:'Uruguay', IT:'Italia', DE:'Alemania', GB:'Reino Unido', CN:'China' };
  return map[code] || code;
}
function cityLabel(city) {
  if (!city) return '';
  return `${city.name}, ${countryLabel(city.country)}${city.admin ? ` · ${city.admin}` : ''}`;
}
async function loadAstroCities() {
  if (astroCitiesCache) return astroCitiesCache;
  const response = await fetch('data/cities500-astro.json');
  if (!response.ok) throw new Error('No se pudo cargar la base de ciudades');
  const payload = await response.json();
  astroCitiesCache = (payload.cities || []).map((row, index) => {
    const city = { id:index, name:row[0], ascii:row[1], country:row[2], admin:row[3], lat:row[4], lon:row[5], timezone:row[6], population:row[7] };
    city.label = cityLabel(city);
    city.search = normalizeCityText(`${city.name} ${city.ascii} ${city.country} ${countryLabel(city.country)} ${city.admin}`);
    return city;
  });
  return astroCitiesCache;
}
function serializeBirthPlace(city) {
  if (!city) return '';
  return JSON.stringify({ label:city.label || cityLabel(city), name:city.name, country:city.country, admin:city.admin || '', lat:Number(city.lat), lon:Number(city.lon), timezone:city.timezone || '', population:Number(city.population || 0) });
}
async function updateAstroCitySuggestions(query = '') {
  const box = $('#astroPlaceSuggestions');
  if (!box) return;
  const q = normalizeCityText(query);
  if (q.length < 2) {
    astroCityMatches = [];
    box.innerHTML = `<p class="subtle">${escapeHTML(t('stEscribeAlMenosDosLetrasPara'))}</p>`;
    return;
  }
  box.innerHTML = `<p class="subtle">${escapeHTML(t('stBuscandoCiudades'))}</p>`;
  try {
    const cities = await loadAstroCities();
    const terms = q.split(' ').filter(Boolean);
    astroCityMatches = cities
      .filter(city => terms.every(term => city.search.includes(term)))
      .sort((a,b) => {
        const aStart = normalizeCityText(a.name).startsWith(terms[0]) ? 1 : 0;
        const bStart = normalizeCityText(b.name).startsWith(terms[0]) ? 1 : 0;
        return bStart - aStart || b.population - a.population;
      })
      .slice(0, 8);
    box.innerHTML = astroCityMatches.map((city, index) => `<button class="astro-city-option" data-astro-city="${index}" type="button"><strong>${escapeHTML(city.label)}</strong><small>${escapeHTML(city.timezone)} · ${Number(city.population || 0).toLocaleString('es-ES')} hab.</small></button>`).join('') || `<p class="subtle">${escapeHTML(t('stNoEncuentroEsaCiudadPuedesEscribir'))}</p>`;
  } catch {
    box.innerHTML = `<p class="subtle">${escapeHTML(t('stNoSePudoCargarLaBase'))}</p>`;
  }
}
function selectAstroCity(index) {
  const city = astroCityMatches[Number(index)];
  if (!city) return;
  const input = $('#astroPlace');
  const hidden = $('#astroPlaceData');
  if (input) input.value = city.label;
  if (hidden) hidden.value = serializeBirthPlace(city);
  const box = $('#astroPlaceSuggestions');
  if (box) box.innerHTML = `<p class="subtle">Ciudad seleccionada: ${escapeHTML(city.label)}.</p>`;
}
async function resolveAstroPlace(inputPlace = null, label = '') {
  if (hasAstroCoordinates(inputPlace)) return inputPlace;
  const query = normalizeCityText(label || inputPlace?.label || inputPlace?.name || '');
  if (query.length < 2) return inputPlace || (label ? { label } : null);
  try {
    const cities = await loadAstroCities();
    const terms = query.split(' ').filter(Boolean);
    const scored = cities.map(city => {
      const name = normalizeCityText(city.name);
      const ascii = normalizeCityText(city.ascii);
      const full = city.search || normalizeCityText(`${city.name} ${city.ascii} ${city.country} ${city.admin}`);
      const exact = name === query || ascii === query ? 8 : 0;
      const starts = name.startsWith(query) || ascii.startsWith(query) ? 4 : 0;
      const allTerms = terms.every(term => full.includes(term)) ? 2 : 0;
      const countryBoost = /(^|\s)(espana|spain|es)(\s|$)/.test(query) && city.country === 'ES' ? 2 : 0;
      const score = exact + starts + allTerms + countryBoost + Math.min(2, Math.log10(Number(city.population || 0) + 1) / 4);
      return { city, score };
    }).filter(item => item.score >= 2).sort((a, b) => b.score - a.score || Number(b.city.population || 0) - Number(a.city.population || 0));
    const match = scored[0]?.city;
    if (!match) return inputPlace || (label ? { label } : null);
    const resolved = JSON.parse(serializeBirthPlace(match));
    const hidden = $('#astroPlaceData');
    const input = $('#astroPlace');
    if (hidden) hidden.value = JSON.stringify(resolved);
    if (input && !input.value.trim()) input.value = resolved.label;
    return resolved;
  } catch {
    return inputPlace || (label ? { label } : null);
  }
}

function showNumerologia() {
  const n = escapeHTML(localStorage.getItem(LS.name) || '');
  const d = escapeHTML(getBirthDate());
  const tm = escapeHTML(getBirthTime());
  openModal({ icon:'🔢', title:t('nuTitle'), subtitle:t('nuSub'), body:`
    <div class="om-3d-stage om-modal-3d" data-oraculo-3d-asset="astrolabe" aria-label="Astrolabio Celestial"></div>
    <div class="numerology-intro result-card"><h3>${escapeHTML(t('nuPersonal'))}</h3><p>${escapeHTML(t('nuPersonalIntro'))}</p></div>
    <div class="form-grid mt"><div class="field"><label>${escapeHTML(t('nuName'))}</label>${inputWithMic('numName', `value="${n}" placeholder="${escapeHTML(t('nuNamePh'))}"`)}</div><div class="field"><label>${escapeHTML(t('nuBirth'))}</label><input id="numDate" class="input" type="date" value="${d}"></div><div class="field"><label>${escapeHTML(t('nuBirthTime'))}</label><input id="numTime" class="input" type="time" value="${tm}" aria-describedby="numTimeHelp"><small id="numTimeHelp" class="subtle">${escapeHTML(t('nuBirthTimePh'))}</small></div></div>
    <div class="actions mt"><button class="btn primary" data-act="calc-num">${escapeHTML(t('nuMake'))}</button></div>
    <hr class="soft-line">
    <div class="numerology-intro result-card"><h3>${escapeHTML(t('nuSynTitle'))}</h3><p>${escapeHTML(t('nuSynIntro'))}</p></div>
    <div class="synastry-grid mt">
      <div class="result-card"><h3>${escapeHTML(t('nuPersonA'))}</h3><div class="field"><label>${escapeHTML(t('nuName'))}</label><input id="synNameA" class="input" value="${n}" placeholder="${escapeHTML(t('nuNamePh'))}"></div><div class="field mt"><label>${escapeHTML(t('nuBirth'))}</label><input id="synDateA" class="input" type="date" value="${d}"></div><div class="field mt"><label>${escapeHTML(t('nuBirthTime'))}</label><input id="synTimeA" class="input" type="time" value="${tm}"></div></div>
      <div class="result-card"><h3>${escapeHTML(t('nuPersonB'))}</h3><div class="field"><label>${escapeHTML(t('nuName'))}</label><input id="synNameB" class="input" placeholder="${escapeHTML(t('nuNamePh'))}"></div><div class="field mt"><label>${escapeHTML(t('nuBirth'))}</label><input id="synDateB" class="input" type="date"></div><div class="field mt"><label>${escapeHTML(t('nuBirthTime'))}</label><input id="synTimeB" class="input" type="time"></div></div>
    </div>
    <div class="actions mt"><button class="btn primary" data-act="calc-synastry">${escapeHTML(t('nuSynMake'))}</button></div>
    <p class="notice mt">${escapeHTML(t('nuNotice'))}</p>` });
}

function calcNumerologia() {
  const name = $('#numName')?.value?.trim() || '';
  const date = $('#numDate')?.value || '';
  const time = $('#numTime')?.value || '';
  if (!name || !date) return toast(t('nuNeedNameDate'));
  const profile = calculateNumerologyProfile(name, date);
  if (!profile) return toast(t('nuCheckDate'));
  localStorage.setItem(LS.name, name);
  setBirthDate(date);
  setBirthTime(time);
  const fields = numerologyFields(profile);
  const text = `${t('nuReading').toUpperCase()} · ${name}\n${date}${time ? ` · ${t('nuBirthTime')}: ${time}` : ''}\n\n${fields.map(([label, number, description]) => {
    const meaning = numerologyMeaning(number);
    return `${label}: ${number} · ${meaning.title}. ${description} ${t('nuStrength')}: ${meaning.gift}. ${t('nuChallenge')}: ${meaning.challenge}. ${t('nuAdvice')}: ${meaning.advice}.`;
  }).join('\n')}\n\n${t('nuSynthesisText')}`;
  setLastReading({ type:'Numerología', title:`${t('nuTitle')} · ${name}`, text, items:[], meta:{ numbers:{ ...profile, time }, numerologyFields:fields, name, birthDate:date, birthTime:time } });
  openModal({ icon:'🔢', title:t('nuReading'), subtitle:`${name} · ${date}`, body:`
    <div class="numerology-results">${fields.map(([label, number, description]) => numerologyCard(label, number, description)).join('')}</div>
    <div class="result-card mt"><h3>${escapeHTML(t('nuSynthesis'))}</h3><p>${escapeHTML(t('nuSynthesisText'))}</p>${readingActions(text,'Numerología')}</div>` });
}
/* Un maestro es la octava alta de su raiz: 11 y 2 no son opuestos.
   Para medir distancia se compara la raiz, no la cifra. */
function numRoot(n) {
  let x = Number(n) || 0;
  while (x > 9) x = String(x).split('').reduce((a, b) => a + Number(b), 0);
  return x || 9;
}
/* Los numeros del 1 al 9 forman un ciclo: 1 y 9 son vecinos, no
   los extremos. La distancia lineal los daba por contrarios. */
function numDistance(a, b) {
  const x = numRoot(a), y = numRoot(b);
  const d = Math.abs(x - y);
  return Math.min(d, 9 - d);
}
function synastryTheme(a, b) {
  if (a === b) return t('synSame');
  if (numRoot(a) === numRoot(b)) return t('synOctave');
  const d = numDistance(a, b);
  if (d <= 1) return t('synClose');
  if (d <= 3) return t('synComplement');
  return t('synContrast');
}
function calculateSynastry() {
  const nameA = $('#synNameA')?.value?.trim() || '';
  const dateA = $('#synDateA')?.value || '';
  const timeA = $('#synTimeA')?.value || '';
  const nameB = $('#synNameB')?.value?.trim() || '';
  const dateB = $('#synDateB')?.value || '';
  const timeB = $('#synTimeB')?.value || '';
  if (!nameA || !dateA || !nameB || !dateB) return toast(t('nuNeedBoth'));
  const a = calculateNumerologyProfile(nameA, dateA);
  const b = calculateNumerologyProfile(nameB, dateB);
  if (!a || !b) return toast(t('nuCheckDate'));
  setBirthDate(dateA);
  setBirthTime(timeA);
  a.time = timeA;
  b.time = timeB;
  const relationship = reduceNum(a.life + b.life);
  const m = numerologyMeaning(relationship);
  const sections = [
    [t('synDirection'), a.life, b.life, synastryTheme(a.life, b.life)],
    [t('synCommunication'), a.expression, b.expression, synastryTheme(a.expression, b.expression)],
    [t('synEmotional'), a.soul, b.soul, synastryTheme(a.soul, b.soul)],
    [t('synCoexistence'), a.personality, b.personality, synastryTheme(a.personality, b.personality)]
  ];
  const advice = t('synAdvice', { n: relationship, title: m.title, gift: m.gift, challenge: m.challenge, advice: m.advice });
  const linea = (nm, x) => `${nm}: ${t('nuLife')} ${x.life}, ${t('nuExpr')} ${x.expression}, ${t('nuSoul')} ${x.soul}, ${t('nuPers')} ${x.personality}.`;
  const text = `${t('synTitle').toUpperCase()}\n${linea(nameA, a)}\n${linea(nameB, b)}\n\n${sections.map(([label, nA, nB, interp]) => `${label}: ${nA} · ${nB}\n${interp}`).join('\n\n')}\n\n${t('synRelNumber')}: ${relationship} · ${m.title}\n${advice}\n\n${t('synNotice')}`;
  setLastReading({ type:'Numerología · Sinastría', title:`${t('synTitle')}: ${nameA} · ${nameB}`, text, items:[], meta:{ synastry:{ a, b, relationship }, numbers:{ life:relationship, expression:reduceNum(a.expression + b.expression), personalYear:reduceNum(a.personalYear + b.personalYear) } } });
  openModal({ icon:'💞', title:t('synTitle'), subtitle:`${nameA} · ${nameB}`, body:`
    <div class="synastry-summary">
      <div class="result-card center"><small>${escapeHTML(nameA)}</small><div class="numerology-number">${a.life}</div><strong>${escapeHTML(numerologyMeaning(a.life).title)}</strong></div>
      <div class="synastry-link"><span>∞</span><small>${escapeHTML(t('synRelation'))} ${relationship}</small></div>
      <div class="result-card center"><small>${escapeHTML(nameB)}</small><div class="numerology-number">${b.life}</div><strong>${escapeHTML(numerologyMeaning(b.life).title)}</strong></div>
    </div>
    <div class="numerology-results mt">${sections.map(([label, nA, nB, interp]) => `<article class="result-card numerology-card"><div class="numerology-pair">${nA}<span>·</span>${nB}</div><div><h3>${escapeHTML(label)}</h3><p>${escapeHTML(interp)}</p></div></article>`).join('')}</div>
    <div class="result-card mt"><h3>${escapeHTML(t('synRelNumber'))}: ${relationship} · ${escapeHTML(m.title)}</h3><p>${escapeHTML(advice)}</p><p class="notice">${escapeHTML(t('synNotice'))}</p>${readingActions(text,'Numerología · Sinastría')}</div>` });
}

const ASTRO_SIGNS = [
  { name:'Aries', symbol:'♈', element:'Fuego', mode:'Cardinal', keywords:['inicio','valor','impulso'] },
  { name:'Tauro', symbol:'♉', element:'Tierra', mode:'Fijo', keywords:['cuerpo','calma','valor'] },
  { name:'Géminis', symbol:'♊', element:'Aire', mode:'Mutable', keywords:['palabra','curiosidad','vínculos'] },
  { name:'Cáncer', symbol:'♋', element:'Agua', mode:'Cardinal', keywords:['cuidado','memoria','hogar'] },
  { name:'Leo', symbol:'♌', element:'Fuego', mode:'Fijo', keywords:['brillo','corazón','creatividad'] },
  { name:'Virgo', symbol:'♍', element:'Tierra', mode:'Mutable', keywords:['orden','servicio','detalle'] },
  { name:'Libra', symbol:'♎', element:'Aire', mode:'Cardinal', keywords:['equilibrio','belleza','acuerdo'] },
  { name:'Escorpio', symbol:'♏', element:'Agua', mode:'Fijo', keywords:['profundidad','verdad','transformación'] },
  { name:'Sagitario', symbol:'♐', element:'Fuego', mode:'Mutable', keywords:['sentido','viaje','confianza'] },
  { name:'Capricornio', symbol:'♑', element:'Tierra', mode:'Cardinal', keywords:['estructura','tiempo','responsabilidad'] },
  { name:'Acuario', symbol:'♒', element:'Aire', mode:'Fijo', keywords:['visión','comunidad','libertad'] },
  { name:'Piscis', symbol:'♓', element:'Agua', mode:'Mutable', keywords:['intuición','entrega','sueño'] }
];
const ASTRO_PLANETS = [
  { id:'sun', name:'Sol', symbol:'☉', role:'identidad y dirección', cycle:365.2422, offset:280.466, type:'luminary' },
  { id:'moon', name:'Luna', symbol:'☽', role:'emoción y necesidad íntima', cycle:27.3217, offset:218.316, type:'luminary' },
  { id:'mercury', name:'Mercurio', symbol:'☿', role:'mente y palabra', cycle:87.969, offset:252.251, retroCycle:115.88 },
  { id:'venus', name:'Venus', symbol:'♀', role:'vínculos y deseo', cycle:224.701, offset:181.98, retroCycle:583.92 },
  { id:'mars', name:'Marte', symbol:'♂', role:'acción y coraje', cycle:686.98, offset:355.433, retroCycle:779.94 },
  { id:'jupiter', name:'Júpiter', symbol:'♃', role:'expansión y confianza', cycle:4332.59, offset:34.351, retroCycle:398.88 },
  { id:'saturn', name:'Saturno', symbol:'♄', role:'límite y madurez', cycle:10759.22, offset:50.077, retroCycle:378.09 },
  { id:'uranus', name:'Urano', symbol:'♅', role:'despertar y cambio', cycle:30685.4, offset:314.055, retroCycle:369.66 },
  { id:'neptune', name:'Neptuno', symbol:'♆', role:'visión, niebla e intuición', cycle:60189, offset:304.348, retroCycle:367.49 },
  { id:'pluto', name:'Plutón', symbol:'♇', role:'sombra y transformación profunda', cycle:90560, offset:238.929, retroCycle:366.73 },
  { id:'node', name:'Nodo real', symbol:'☊', role:'dirección evolutiva simbólica', cycle:-6798.38, offset:125.044, type:'point' },
  { id:'chiron', name:'Quirón', symbol:'⚷', role:'herida sabia e integración', cycle:18453.3, offset:243.56, retroCycle:346 },
  { id:'lilith', name:'Lilith', symbol:'⚸', role:'instinto, límite y voz propia', cycle:3232.61, offset:83.353, type:'point' }
];
const ASTRO_SIGN_SHORT = { ar:0, ta:1, ge:2, cn:3, le:4, vi:5, li:6, sc:7, sa:8, cp:9, aq:10, pi:11 };
const CHIRON_MONTHLY_EPHEMERIS = {
  1975:['19 ar 57','20 ar 24','21 ar 29','23 ar 9','24 ar 56','26 ar 36','27 ar 43','28 ar 9','27 ar 45 rx','26 ar 42 rx','25 ar 17 rx','24 ar 7 rx'],
  1976:['23 ar 35 rx','23 ar 56','25 ar 0','26 ar 39','28 ar 27','0 ta 10','1 ta 22','1 ta 54','1 ta 35 rx','0 ta 34 rx','29 ar 9 rx','27 ar 56 rx'],
  1977:['27 ar 18 rx','27 ar 35','28 ar 33','0 ta 11','2 ta 0','3 ta 47','5 ta 5','5 ta 44','5 ta 32 rx','4 ta 36 rx','3 ta 10 rx','1 ta 53 rx'],
  1978:['1 ta 9 rx','1 ta 19','2 ta 12','3 ta 48','5 ta 39','7 ta 30','8 ta 54','9 ta 41','9 ta 37 rx','8 ta 45 rx','7 ta 20 rx','5 ta 59 rx'],
  1979:['5 ta 8 rx','5 ta 10','5 ta 59','7 ta 33','9 ta 25','11 ta 20','12 ta 51','13 ta 46','13 ta 50 rx','13 ta 4 rx','11 ta 41 rx','10 ta 16 rx'],
  1980:['9 ta 17 rx','9 ta 12','9 ta 58','11 ta 31','13 ta 24','15 ta 23','17 ta 0','18 ta 3','18 ta 14 rx','17 ta 32 rx','16 ta 10 rx','14 ta 42 rx']
};
const CHIRON_SIGN_PERIODS = [
  ['1960-03-26',11], ['1960-08-19',10], ['1961-01-20',11],
  ['1968-04-01',0], ['1968-10-18',11], ['1969-01-30',0],
  ['1976-05-28',1], ['1976-10-13',0], ['1977-03-28',1],
  ['1983-06-21',2], ['1983-11-29',1], ['1984-04-10',2],
  ['1988-06-21',3], ['1991-07-21',4], ['1993-09-03',5],
  ['1995-09-09',6], ['1996-12-29',7], ['1997-04-04',6],
  ['1997-09-02',7], ['1999-01-07',8], ['1999-06-01',7],
  ['1999-09-21',8], ['2001-12-11',9], ['2005-02-21',10],
  ['2005-07-31',9], ['2005-12-05',10], ['2010-04-20',11],
  ['2010-07-20',10], ['2011-02-08',11], ['2018-04-17',0],
  ['2018-09-25',11], ['2019-02-18',0], ['2026-06-19',1],
  ['2026-09-17',0], ['2027-04-14',1], ['2033-07-19',2],
  ['2033-10-23',1], ['2034-05-05',2], ['2038-07-22',3],
  ['2039-01-08',2], ['2039-04-26',3], ['2041-08-28',4],
  ['2042-02-09',3], ['2042-05-16',4], ['2043-10-23',5],
  ['2044-02-10',4], ['2044-07-01',5], ['2045-10-24',6]
].map(([date, sign]) => ({ ms:Date.parse(`${date}T12:00:00Z`), sign }));
let chironAnchorsCache = null;
const ASTRO_ORBITAL_ELEMENTS = {
  mercury: d => ({ N:48.3313 + 3.24587e-5 * d, i:7.0047 + 5e-8 * d, w:29.1241 + 1.01444e-5 * d, a:0.387098, e:0.205635 + 5.59e-10 * d, M:168.6562 + 4.0923344368 * d }),
  venus: d => ({ N:76.6799 + 2.4659e-5 * d, i:3.3946 + 2.75e-8 * d, w:54.891 + 1.38374e-5 * d, a:0.72333, e:0.006773 - 1.302e-9 * d, M:48.0052 + 1.6021302244 * d }),
  mars: d => ({ N:49.5574 + 2.11081e-5 * d, i:1.8497 - 1.78e-8 * d, w:286.5016 + 2.92961e-5 * d, a:1.523688, e:0.093405 + 2.516e-9 * d, M:18.6021 + 0.5240207766 * d }),
  jupiter: d => ({ N:100.4542 + 2.76854e-5 * d, i:1.303 - 1.557e-7 * d, w:273.8777 + 1.64505e-5 * d, a:5.20256, e:0.048498 + 4.469e-9 * d, M:19.895 + 0.0830853001 * d }),
  saturn: d => ({ N:113.6634 + 2.3898e-5 * d, i:2.4886 - 1.081e-7 * d, w:339.3939 + 2.97661e-5 * d, a:9.55475, e:0.055546 - 9.499e-9 * d, M:316.967 + 0.0334442282 * d }),
  uranus: d => ({ N:74.0005 + 1.3978e-5 * d, i:0.7733 + 1.9e-8 * d, w:96.6612 + 3.0565e-5 * d, a:19.18171 - 1.55e-8 * d, e:0.047318 + 7.45e-9 * d, M:142.5905 + 0.011725806 * d }),
  neptune: d => ({ N:131.7806 + 3.0173e-5 * d, i:1.77 - 2.55e-7 * d, w:272.8461 - 6.027e-6 * d, a:30.05826 + 3.313e-8 * d, e:0.008606 + 2.15e-9 * d, M:260.2471 + 0.005995147 * d })
};
const ASTRONOMY_ENGINE_BODY = {
  sun:'Sun',
  moon:'Moon',
  mercury:'Mercury',
  venus:'Venus',
  mars:'Mars',
  jupiter:'Jupiter',
  saturn:'Saturn',
  uranus:'Uranus',
  neptune:'Neptune',
  pluto:'Pluto'
};
const ASTRO_ASPECTS = [
  { name:'Conjunción', symbol:'☌', code:'CONJ', angle:0, orb:7, text:'dos fuerzas piden actuar como una sola voz' },
  { name:'Sextil', symbol:'⚹', code:'SEXT', angle:60, orb:5, text:'aparece una cooperación sutil si se da el primer paso' },
  { name:'Cuadratura', symbol:'□', code:'CUAD', angle:90, orb:6, text:'la tensión muestra dónde conviene ajustar el rumbo' },
  { name:'Trígono', symbol:'△', code:'TRIG', angle:120, orb:6, text:'hay fluidez natural para integrar esas energías' },
  { name:'Oposición', symbol:'☍', code:'OPOS', angle:180, orb:7, text:'dos polos se miran y piden equilibrio consciente' }
];
const ASTRO_HOUSES = ['Yo','Recursos','Palabra','Hogar','Creatividad','Rutina','Vínculos','Transformación','Visión','Propósito','Comunidad','Alma'];

function normalizeDegree(value) {
  return ((Number(value) % 360) + 360) % 360;
}
function degToRad(value) { return Number(value) * Math.PI / 180; }
function radToDeg(value) { return Number(value) * 180 / Math.PI; }
function sinDeg(value) { return Math.sin(degToRad(value)); }
function cosDeg(value) { return Math.cos(degToRad(value)); }
function tanDeg(value) { return Math.tan(degToRad(value)); }
function astroEngineLabel() { return t('asEngine'); }
function astronomyEngine() {
  return typeof window !== 'undefined' && window.Astronomy ? window.Astronomy : null;
}
function astroHouseSystemLabel(system = 'whole') {
  if (system === 'placidus') return 'Placidus';
  if (system === 'quadrant') return 'Cuadrantes locales aproximados';
  return system === 'equal' ? 'Casas iguales desde el ascendente' : 'Casa entera por signo ascendente';
}
function hasAstroCoordinates(place = null) {
  return Boolean(place?.timezone && Number.isFinite(Number(place?.lat)) && Number.isFinite(Number(place?.lon)));
}
function timeZoneOffsetMinutes(timeZone = '', utcDate = new Date()) {
  if (!timeZone || !Intl?.DateTimeFormat) return 0;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone, hour12:false, year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', second:'2-digit'
    }).formatToParts(utcDate).reduce((acc, part) => ({ ...acc, [part.type]:part.value }), {});
    const asUTC = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour === '24' ? '0' : parts.hour), Number(parts.minute), Number(parts.second));
    return Math.round((asUTC - utcDate.getTime()) / 60000);
  } catch { return 0; }
}
function astroDateUTC(date = '', time = '12:00', timeZone = '') {
  const parts = dateParts(date);
  if (!parts) return null;
  const [hour = 12, minute = 0] = String(time || '12:00').split(':').map(Number);
  const localAsUTC = Date.UTC(parts.year, parts.month - 1, parts.day, Number.isFinite(hour) ? hour : 12, Number.isFinite(minute) ? minute : 0);
  if (!timeZone) return localAsUTC;
  let utc = localAsUTC;
  for (let step = 0; step < 4; step += 1) {
    const offset = timeZoneOffsetMinutes(timeZone, new Date(utc));
    const nextUtc = localAsUTC - offset * 60000;
    if (Math.abs(nextUtc - utc) < 1000) return nextUtc;
    utc = nextUtc;
  }
  return utc;
}
function astroDayCount(date = '', time = '12:00', place = null) {
  const ms = astroDateUTC(date, time, place?.timezone || '');
  if (ms === null) return null;
  const jd = ms / 86400000 + 2440587.5;
  return { ms, days:(ms - Date.UTC(2000, 0, 1, 12, 0)) / 86400000, jd, t:(jd - 2451545.0) / 36525 };
}
function julianCenturiesFromDays(days = 0) {
  return Number(days) / 36525;
}
function meanObliquityDegree(t = 0) {
  const seconds = 21.448 - 46.8150 * t - 0.00059 * t * t + 0.001813 * t * t * t;
  return 23 + 26 / 60 + seconds / 3600;
}
function nutationLongitudeDegree(t = 0) {
  const omega = 125.04452 - 1934.136261 * t;
  const sunMean = 280.4665 + 36000.7698 * t;
  const moonMean = 218.3165 + 481267.8813 * t;
  return (-17.20 * sinDeg(omega) - 1.32 * sinDeg(2 * sunMean) - 0.23 * sinDeg(2 * moonMean) + 0.21 * sinDeg(2 * omega)) / 3600;
}
function trueObliquityDegree(t = 0) {
  const omega = 125.04452 - 1934.136261 * t;
  const sunMean = 280.4665 + 36000.7698 * t;
  const moonMean = 218.3165 + 481267.8813 * t;
  return meanObliquityDegree(t) + (9.20 * cosDeg(omega) + 0.57 * cosDeg(2 * sunMean) + 0.10 * cosDeg(2 * moonMean) - 0.09 * cosDeg(2 * omega)) / 3600;
}
function zodiacFromDegree(degree) {
  const normalized = normalizeDegree(Math.round(normalizeDegree(degree) * 3600) / 3600);
  const index = Math.floor(normalized / 30) % 12;
  const decimal = normalized % 30;
  const totalSeconds = Math.round(decimal * 3600);
  const signDegree = Math.floor(totalSeconds / 3600);
  const minute = Math.floor((totalSeconds % 3600) / 60);
  const second = totalSeconds % 60;
  return { ...ASTRO_SIGNS[index], degree:signDegree, minute, second, degreeLabel:`${signDegree}°${String(minute).padStart(2, '0')}'${String(second).padStart(2, '0')}"`, decimalDegree:Number(decimal.toFixed(4)), index, absolute:normalized };
}
function formatHMSFromHours(hours = 0) {
  const totalSeconds = Math.round(normalizeDegree(Number(hours) * 15) * 240);
  const normalized = ((totalSeconds % 86400) + 86400) % 86400;
  const h = Math.floor(normalized / 3600);
  const m = Math.floor((normalized % 3600) / 60);
  const s = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function siderealTimeLabelFromDegree(degree = 0) {
  return formatHMSFromHours(normalizeDegree(degree) / 15);
}
function astroDaysFromMs(ms) {
  return (Number(ms) - Date.UTC(2000, 0, 1, 12, 0)) / 86400000;
}
function astroGlyph(symbol = '') {
  return symbol && !/^[a-z0-9]+$/i.test(symbol) ? `${symbol}\uFE0E` : symbol;
}
function parseAstroShortDegree(text = '') {
  const match = String(text).trim().match(/^(\d{1,2})\s+([a-z]{2})\s+(\d{1,2})(?:\s+(rx))?$/i);
  if (!match) return null;
  const sign = ASTRO_SIGN_SHORT[match[2].toLowerCase()];
  if (!Number.isFinite(sign)) return null;
  return {
    degree:normalizeDegree(sign * 30 + Number(match[1]) + Number(match[3]) / 60),
    retrograde:Boolean(match[4])
  };
}
function buildChironAnchors() {
  if (chironAnchorsCache) return chironAnchorsCache;
  const anchors = [];
  Object.entries(CHIRON_MONTHLY_EPHEMERIS).forEach(([year, months]) => {
    months.forEach((value, monthIndex) => {
      const parsed = parseAstroShortDegree(value);
      if (!parsed) return;
      anchors.push({ ms:Date.UTC(Number(year), monthIndex, 1, 0, 0), ...parsed });
    });
  });
  chironAnchorsCache = anchors.sort((a, b) => a.ms - b.ms);
  return chironAnchorsCache;
}
function signedDegreeDelta(start = 0, end = 0) {
  return ((normalizeDegree(end) - normalizeDegree(start) + 540) % 360) - 180;
}
function interpolatedChironFromAnchors(ms) {
  const anchors = buildChironAnchors();
  if (!anchors.length || ms < anchors[0].ms || ms > anchors[anchors.length - 1].ms) return null;
  const nextIndex = anchors.findIndex(anchor => anchor.ms >= ms);
  if (nextIndex <= 0) return { degree:anchors[0].degree, retrograde:anchors[0].retrograde };
  const prev = anchors[nextIndex - 1];
  const next = anchors[nextIndex];
  const ratio = Math.max(0, Math.min(1, (ms - prev.ms) / (next.ms - prev.ms || 1)));
  const delta = signedDegreeDelta(prev.degree, next.degree);
  return { degree:normalizeDegree(prev.degree + delta * ratio), retrograde:delta < 0 || prev.retrograde || next.retrograde };
}
function chironFromSignPeriods(ms, fallbackDegree = 0) {
  if (!Number.isFinite(ms)) return { degree:fallbackDegree, retrograde:false };
  let index = -1;
  for (let i = 0; i < CHIRON_SIGN_PERIODS.length; i += 1) {
    if (CHIRON_SIGN_PERIODS[i].ms <= ms) index = i;
    else break;
  }
  if (index < 0 || !CHIRON_SIGN_PERIODS[index + 1]) return { degree:fallbackDegree, retrograde:false };
  const current = CHIRON_SIGN_PERIODS[index];
  const next = CHIRON_SIGN_PERIODS[index + 1];
  const ratio = Math.max(0, Math.min(1, (ms - current.ms) / (next.ms - current.ms || 1)));
  const nextStep = (next.sign - current.sign + 12) % 12;
  const retrograde = nextStep === 11;
  const degreeInSign = retrograde ? 29.9 * (1 - ratio) : 29.9 * ratio;
  return { degree:normalizeDegree(current.sign * 30 + degreeInSign), retrograde };
}
function chironLongitudeFromDateInfo(dateInfo, fallbackDegree = 0) {
  const fromAnchors = interpolatedChironFromAnchors(dateInfo?.ms);
  if (fromAnchors) return fromAnchors;
  return chironFromSignPeriods(dateInfo?.ms, fallbackDegree);
}
function meanBlackMoonLilithLongitude(days = 0) {
  const t = Number(days) / 36525;
  const moonMean = 218.3164477 + 481267.88123421 * t - 0.0015786 * t * t + t * t * t / 538841 - Math.pow(t, 4) / 65194000;
  const moonAnomaly = 134.9633964 + 477198.8675055 * t + 0.0087414 * t * t + t * t * t / 69699 - Math.pow(t, 4) / 14712000;
  return normalizeDegree(moonMean - moonAnomaly + 180);
}
function daysSinceOrbitalEpoch(ms) {
  return (Number(ms) - Date.UTC(1999, 11, 31, 0, 0)) / 86400000;
}
function solveEccentricAnomaly(meanAnomaly = 0, eccentricity = 0) {
  const m = normalizeDegree(meanAnomaly);
  let e = m + radToDeg(eccentricity * sinDeg(m) * (1 + eccentricity * cosDeg(m)));
  for (let step = 0; step < 5; step += 1) {
    const eRad = degToRad(e);
    const delta = (e - radToDeg(eccentricity * Math.sin(eRad)) - m) / (1 - eccentricity * Math.cos(eRad));
    e -= delta;
    if (Math.abs(delta) < 1e-6) break;
  }
  return e;
}
function heliocentricPosition(elements) {
  const eccentricAnomaly = solveEccentricAnomaly(elements.M, elements.e);
  const xv = elements.a * (cosDeg(eccentricAnomaly) - elements.e);
  const yv = elements.a * Math.sqrt(1 - elements.e * elements.e) * sinDeg(eccentricAnomaly);
  const trueAnomaly = radToDeg(Math.atan2(yv, xv));
  const radius = Math.sqrt(xv * xv + yv * yv);
  const vw = trueAnomaly + elements.w;
  return {
    x:radius * (cosDeg(elements.N) * cosDeg(vw) - sinDeg(elements.N) * sinDeg(vw) * cosDeg(elements.i)),
    y:radius * (sinDeg(elements.N) * cosDeg(vw) + cosDeg(elements.N) * sinDeg(vw) * cosDeg(elements.i)),
    z:radius * sinDeg(vw) * sinDeg(elements.i)
  };
}
function eclipticFromCartesian(position) {
  const radius = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);
  return {
    longitude:normalizeDegree(radToDeg(Math.atan2(position.y, position.x))),
    latitude:radToDeg(Math.atan2(position.z, Math.sqrt(position.x * position.x + position.y * position.y))),
    radius
  };
}
function cartesianFromEcliptic(longitude = 0, latitude = 0, radius = 1) {
  return {
    x:radius * cosDeg(longitude) * cosDeg(latitude),
    y:radius * sinDeg(longitude) * cosDeg(latitude),
    z:radius * sinDeg(latitude)
  };
}
function correctedHeliocentricPosition(id = '', d = 0) {
  const model = ASTRO_ORBITAL_ELEMENTS[id];
  if (!model) return null;
  const base = eclipticFromCartesian(heliocentricPosition(model(d)));
  let { longitude, latitude, radius } = base;
  if (id === 'jupiter' || id === 'saturn' || id === 'uranus') {
    const jupiterM = normalizeDegree(ASTRO_ORBITAL_ELEMENTS.jupiter(d).M);
    const saturnM = normalizeDegree(ASTRO_ORBITAL_ELEMENTS.saturn(d).M);
    const uranusM = normalizeDegree(ASTRO_ORBITAL_ELEMENTS.uranus(d).M);
    if (id === 'jupiter') {
      longitude += -0.332 * sinDeg(2 * jupiterM - 5 * saturnM - 67.6) - 0.056 * sinDeg(2 * jupiterM - 2 * saturnM + 21) + 0.042 * sinDeg(3 * jupiterM - 5 * saturnM + 21) - 0.036 * sinDeg(jupiterM - 2 * saturnM) + 0.022 * cosDeg(jupiterM - saturnM) + 0.023 * sinDeg(2 * jupiterM - 3 * saturnM + 52) - 0.016 * sinDeg(jupiterM - 5 * saturnM - 69);
    } else if (id === 'saturn') {
      longitude += 0.812 * sinDeg(2 * jupiterM - 5 * saturnM - 67.6) - 0.229 * cosDeg(2 * jupiterM - 4 * saturnM - 2) + 0.119 * sinDeg(jupiterM - 2 * saturnM - 3) + 0.046 * sinDeg(2 * jupiterM - 6 * saturnM - 69) + 0.014 * sinDeg(jupiterM - 3 * saturnM + 32);
      latitude += -0.020 * cosDeg(2 * jupiterM - 4 * saturnM - 2) + 0.018 * sinDeg(2 * jupiterM - 6 * saturnM - 49);
    } else if (id === 'uranus') {
      longitude += 0.040 * sinDeg(saturnM - 2 * uranusM + 6) + 0.035 * sinDeg(saturnM - 3 * uranusM + 33) - 0.015 * sinDeg(jupiterM - uranusM + 20);
    }
  }
  return cartesianFromEcliptic(longitude, latitude, radius);
}
function plutoHeliocentricPosition(d = 0) {
  const s = 50.03 + 0.033459652 * d;
  const p = 238.95 + 0.003968789 * d;
  const longitude = 238.9508 + 0.00400703 * d
    - 19.799 * sinDeg(p) + 19.848 * cosDeg(p)
    + 0.897 * sinDeg(2 * p) - 4.956 * cosDeg(2 * p)
    + 0.610 * sinDeg(3 * p) + 1.211 * cosDeg(3 * p)
    - 0.341 * sinDeg(4 * p) - 0.190 * cosDeg(4 * p)
    + 0.128 * sinDeg(5 * p) - 0.034 * cosDeg(5 * p)
    - 0.038 * sinDeg(6 * p) + 0.031 * cosDeg(6 * p)
    + 0.020 * sinDeg(s - p) - 0.010 * cosDeg(s - p);
  const latitude = -3.9082
    - 5.453 * sinDeg(p) - 14.975 * cosDeg(p)
    + 3.527 * sinDeg(2 * p) + 1.673 * cosDeg(2 * p)
    - 1.051 * sinDeg(3 * p) + 0.328 * cosDeg(3 * p)
    + 0.179 * sinDeg(4 * p) - 0.292 * cosDeg(4 * p)
    + 0.019 * sinDeg(5 * p) + 0.100 * cosDeg(5 * p)
    - 0.031 * sinDeg(6 * p) - 0.026 * cosDeg(6 * p)
    + 0.011 * cosDeg(s - p);
  const radius = 40.72
    + 6.68 * sinDeg(p) + 6.90 * cosDeg(p)
    - 1.18 * sinDeg(2 * p) - 0.03 * cosDeg(2 * p)
    + 0.15 * sinDeg(3 * p) - 0.14 * cosDeg(3 * p);
  return {
    x:radius * cosDeg(longitude) * cosDeg(latitude),
    y:radius * sinDeg(longitude) * cosDeg(latitude),
    z:radius * sinDeg(latitude)
  };
}
function sunGeocentricPosition(d = 0) {
  const w = 282.9404 + 4.70935e-5 * d;
  const e = 0.016709 - 1.151e-9 * d;
  const M = 356.047 + 0.9856002585 * d;
  const eccentricAnomaly = solveEccentricAnomaly(M, e);
  const xv = cosDeg(eccentricAnomaly) - e;
  const yv = Math.sqrt(1 - e * e) * sinDeg(eccentricAnomaly);
  const trueAnomaly = radToDeg(Math.atan2(yv, xv));
  const radius = Math.sqrt(xv * xv + yv * yv);
  return { x:radius * cosDeg(trueAnomaly + w), y:radius * sinDeg(trueAnomaly + w), z:0 };
}
function geocentricPlanetLongitude(id = '', dateInfo = null) {
  const model = ASTRO_ORBITAL_ELEMENTS[id];
  if ((!model && id !== 'pluto') || !Number.isFinite(dateInfo?.ms)) return null;
  const d = daysSinceOrbitalEpoch(dateInfo.ms);
  const sun = sunGeocentricPosition(d);
  const planet = id === 'pluto' ? plutoHeliocentricPosition(d) : correctedHeliocentricPosition(id, d);
  const degree = normalizeDegree(radToDeg(Math.atan2(planet.y + sun.y, planet.x + sun.x)));
  const tomorrowD = daysSinceOrbitalEpoch(dateInfo.ms + 86400000);
  const tomorrowSun = sunGeocentricPosition(tomorrowD);
  const tomorrowPlanet = id === 'pluto' ? plutoHeliocentricPosition(tomorrowD) : correctedHeliocentricPosition(id, tomorrowD);
  const tomorrowDegree = normalizeDegree(radToDeg(Math.atan2(tomorrowPlanet.y + tomorrowSun.y, tomorrowPlanet.x + tomorrowSun.x)));
  return { degree, retrograde:signedDegreeDelta(degree, tomorrowDegree) < 0 };
}
function astronomyEngineLongitude(id = '', dateInfo = null) {
  const Astronomy = astronomyEngine();
  const bodyName = ASTRONOMY_ENGINE_BODY[id];
  const body = bodyName && Astronomy?.Body?.[bodyName];
  if (!body || !Number.isFinite(dateInfo?.ms) || typeof Astronomy.GeoVector !== 'function' || typeof Astronomy.Ecliptic !== 'function') return null;
  try {
    const longitudeAt = ms => {
      const days = astroDaysFromMs(ms);
      const candidates = [new Date(ms), days];
      for (const instant of candidates) {
        try {
          const vector = Astronomy.GeoVector(body, instant, true);
          return normalizeDegree(Astronomy.Ecliptic(vector).elon);
        } catch {}
      }
      return null;
    };
    const degree = longitudeAt(dateInfo.ms);
    const tomorrowDegree = longitudeAt(dateInfo.ms + 86400000);
    if (!Number.isFinite(degree) || !Number.isFinite(tomorrowDegree)) return null;
    return { degree, retrograde:id !== 'sun' && id !== 'moon' && signedDegreeDelta(degree, tomorrowDegree) < 0, engine:'astronomy-engine' };
  } catch {
    return null;
  }
}
function sunLongitudeFromDays(days = 0) {
  const t = julianCenturiesFromDays(days);
  const sunMean = normalizeDegree(280.46646 + 36000.76983 * t + 0.0003032 * t * t);
  const sunAnomaly = normalizeDegree(357.52911 + 35999.05029 * t - 0.0001537 * t * t);
  const center = (1.914602 - 0.004817 * t - 0.000014 * t * t) * sinDeg(sunAnomaly) + (0.019993 - 0.000101 * t) * sinDeg(2 * sunAnomaly) + 0.000289 * sinDeg(3 * sunAnomaly);
  const omega = 125.04 - 1934.136 * t;
  return normalizeDegree(sunMean + center - 0.00569 - 0.00478 * sinDeg(omega));
}
function moonLongitudeFromDays(days = 0) {
  const t = julianCenturiesFromDays(days);
  const moonMean = normalizeDegree(218.3164477 + 481267.88123421 * t - 0.0015786 * t * t + t * t * t / 538841 - Math.pow(t, 4) / 65194000);
  const moonElongation = normalizeDegree(297.8501921 + 445267.1114034 * t - 0.0018819 * t * t + t * t * t / 545868 - Math.pow(t, 4) / 113065000);
  const sunAnomaly = normalizeDegree(357.5291092 + 35999.0502909 * t - 0.0001536 * t * t + t * t * t / 24490000);
  const moonAnomaly = normalizeDegree(134.9633964 + 477198.8675055 * t + 0.0087414 * t * t + t * t * t / 69699 - Math.pow(t, 4) / 14712000);
  const moonArgument = normalizeDegree(93.2720950 + 483202.0175233 * t - 0.0036539 * t * t - t * t * t / 3526000 + Math.pow(t, 4) / 863310000);
  const correction = 6.288774 * sinDeg(moonAnomaly)
    + 1.274027 * sinDeg(2 * moonElongation - moonAnomaly)
    + 0.658314 * sinDeg(2 * moonElongation)
    + 0.213618 * sinDeg(2 * moonAnomaly)
    - 0.185116 * sinDeg(sunAnomaly)
    - 0.114332 * sinDeg(2 * moonArgument)
    + 0.058793 * sinDeg(2 * moonElongation - 2 * moonAnomaly)
    + 0.057066 * sinDeg(2 * moonElongation - sunAnomaly - moonAnomaly)
    + 0.053322 * sinDeg(2 * moonElongation + moonAnomaly)
    + 0.045758 * sinDeg(2 * moonElongation - sunAnomaly)
    - 0.040923 * sinDeg(sunAnomaly - moonAnomaly)
    - 0.034720 * sinDeg(moonElongation)
    - 0.030383 * sinDeg(sunAnomaly + moonAnomaly)
    + 0.015327 * sinDeg(2 * moonElongation - 2 * moonArgument)
    - 0.012528 * sinDeg(moonAnomaly + 2 * moonArgument)
    + 0.010980 * sinDeg(moonAnomaly - 2 * moonArgument)
    + 0.010675 * sinDeg(4 * moonElongation - moonAnomaly)
    + 0.010034 * sinDeg(3 * moonAnomaly);
  return normalizeDegree(moonMean + correction + nutationLongitudeDegree(t));
}
function meanNorthNodeLongitude(days = 0) {
  const t = julianCenturiesFromDays(days);
  return normalizeDegree(125.04455501 - 1934.1361849 * t + 0.0020762 * t * t + t * t * t / 467410 - Math.pow(t, 4) / 60616000);
}
function trueNorthNodeLongitude(days = 0) {
  const t = julianCenturiesFromDays(days);
  const meanNode = meanNorthNodeLongitude(days);
  const moonElongation = 297.8501921 + 445267.1114034 * t - 0.0018819 * t * t + t * t * t / 545868 - Math.pow(t, 4) / 113065000;
  const sunAnomaly = 357.5291092 + 35999.0502909 * t - 0.0001536 * t * t + t * t * t / 24490000;
  const moonAnomaly = 134.9633964 + 477198.8675055 * t + 0.0087414 * t * t + t * t * t / 69699 - Math.pow(t, 4) / 14712000;
  const moonArgument = 93.2720950 + 483202.0175233 * t - 0.0036539 * t * t - t * t * t / 3526000 + Math.pow(t, 4) / 863310000;
  return normalizeDegree(
    meanNode
    - 1.4979 * sinDeg(2 * (moonElongation - moonArgument))
    - 0.1500 * sinDeg(sunAnomaly)
    - 0.1226 * sinDeg(2 * moonElongation)
    + 0.1176 * sinDeg(2 * moonArgument)
    - 0.0801 * sinDeg(2 * (moonAnomaly - moonArgument))
  );
}
function angularDistance(a = 0, b = 0) {
  const diff = Math.abs(normalizeDegree(a) - normalizeDegree(b));
  return Math.min(diff, 360 - diff);
}
function sunSignFromDate(date = '') {
  const parts = dateParts(date);
  if (!parts) return null;
  const md = parts.month * 100 + parts.day;
  const ranges = [
    [321, 419, 0], [420, 520, 1], [521, 620, 2], [621, 722, 3],
    [723, 822, 4], [823, 922, 5], [923, 1022, 6], [1023, 1121, 7],
    [1122, 1221, 8], [120, 218, 10], [219, 320, 11]
  ];
  const range = ranges.find(([start, end]) => md >= start && md <= end);
  const index = md >= 1222 || md <= 119 ? 9 : (range?.[2] ?? 0);
  return { ...ASTRO_SIGNS[index], index };
}
function planetPositions(date = '', time = '12:00', place = null) {
  const dateInfo = astroDayCount(date, time, place);
  if (!dateInfo) return [];
  const { days } = dateInfo;
  const sunLongitude = astronomyEngineLongitude('sun', dateInfo)?.degree ?? sunLongitudeFromDays(days);
  const moonLongitude = astronomyEngineLongitude('moon', dateInfo)?.degree ?? moonLongitudeFromDays(days);
  const nodeLongitude = trueNorthNodeLongitude(days);
  return ASTRO_PLANETS.map(planet => {
    let degree = normalizeDegree(planet.offset + days * 360 / planet.cycle);
    if (planet.id === 'sun') degree = sunLongitude;
    if (planet.id === 'moon') degree = moonLongitude;
    if (planet.id === 'node') degree = nodeLongitude;
    let pointOverride = null;
    const orbitalPosition = astronomyEngineLongitude(planet.id, dateInfo) || geocentricPlanetLongitude(planet.id, dateInfo);
    if (orbitalPosition) pointOverride = orbitalPosition;
    if (planet.id === 'chiron') pointOverride = chironLongitudeFromDateInfo(dateInfo, degree);
    if (planet.id === 'lilith') pointOverride = { degree:meanBlackMoonLilithLongitude(days), retrograde:false };
    if (pointOverride) degree = pointOverride.degree;
    const retroPhase = planet.retroCycle ? normalizeDegree(days * 360 / planet.retroCycle + planet.offset) : 0;
    const retrograde = planet.id === 'node' ? true : (pointOverride ? Boolean(pointOverride.retrograde) : Boolean(planet.retroCycle && cosDeg(retroPhase) < -0.58));
    const sign = zodiacFromDegree(degree);
    return { ...planet, degree, retrograde, sign:sign.name, signSymbol:sign.symbol, signDegree:sign.degree, signMinute:sign.minute, signSecond:sign.second, degreeLabel:sign.degreeLabel, element:sign.element, keywords:sign.keywords };
  });
}
function astroHash(value = '') {
  let hash = 2166136261;
  for (const ch of String(value)) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function localSiderealDegree(date = '', time = '12:00', place = null) {
  const dateInfo = astroDayCount(date, time, place);
  if (!dateInfo) return 0;
  const longitude = Number.isFinite(Number(place?.lon)) ? Number(place.lon) : 0;
  const t = dateInfo.t;
  const mean = 280.46061837 + 360.98564736629 * (dateInfo.jd - 2451545.0) + 0.000387933 * t * t - (t * t * t) / 38710000;
  const apparent = mean + nutationLongitudeDegree(t) * cosDeg(trueObliquityDegree(t));
  return normalizeDegree(apparent + longitude);
}
function fallbackAscendant(date = '', time = '12:00', name = '', place = null) {
  const lst = localSiderealDegree(date, time, place);
  const lat = Number.isFinite(Number(place?.lat)) ? Math.max(-66, Math.min(66, Number(place.lat))) : 0;
  const eps = trueObliquityDegree(astroDayCount(date, time, place)?.t || 0);
  let degree = normalizeDegree(180 + radToDeg(Math.atan2(-cosDeg(lst), sinDeg(lst) * cosDeg(eps) + tanDeg(lat) * sinDeg(eps))));
  if (!Number.isFinite(degree)) degree = normalizeDegree(lst + (astroHash(name) % 18));
  if (!place?.lat) degree = normalizeDegree(degree + (astroHash(name) % 18));
  return zodiacFromDegree(degree);
}
function astronomicalAscendant(date = '', time = '12:00', place = null) {
  if (!hasAstroCoordinates(place)) return null;
  const lst = localSiderealDegree(date, time, place);
  const lat = Math.max(-66, Math.min(66, Number(place.lat)));
  const eps = trueObliquityDegree(astroDayCount(date, time, place)?.t || 0);
  const raw = 180 + radToDeg(Math.atan2(-cosDeg(lst), sinDeg(lst) * cosDeg(eps) + tanDeg(lat) * sinDeg(eps)));
  return Number.isFinite(raw) ? zodiacFromDegree(normalizeDegree(raw)) : null;
}
function eclipticLongitudeFromRightAscension(rightAscension = 0, obliquity = 23.439) {
  return normalizeDegree(radToDeg(Math.atan2(sinDeg(rightAscension) / cosDeg(obliquity), cosDeg(rightAscension))));
}
function astronomicalMc(date = '', time = '12:00', place = null) {
  if (!hasAstroCoordinates(place)) return null;
  const lst = localSiderealDegree(date, time, place);
  const eps = trueObliquityDegree(astroDayCount(date, time, place)?.t || 0);
  return zodiacFromDegree(eclipticLongitudeFromRightAscension(lst, eps));
}
function directedArc(start = 0, end = 0) {
  return normalizeDegree(Number(end) - Number(start));
}
function quadrantCusp(start = 0, end = 0, step = 0) {
  return normalizeDegree(Number(start) + directedArc(start, end) * step / 3);
}
function solvePlacidusRightAscension(ramc = 0, latitude = 0, obliquity = 23.439, house = 11) {
  const config = {
    11:{ start:30, factor:3, upper:true },
    12:{ start:60, factor:1.5, upper:true },
    2:{ start:120, factor:1.5, upper:false },
    3:{ start:150, factor:3, upper:false }
  }[house];
  if (!config) return null;
  let ra = normalizeDegree(ramc + config.start);
  for (let step = 0; step < 30; step += 1) {
    const argument = (config.upper ? -1 : 1) * sinDeg(ra) * tanDeg(obliquity) * tanDeg(latitude);
    const arc = radToDeg(Math.acos(Math.max(-1, Math.min(1, argument))));
    const next = normalizeDegree(config.upper ? ramc + arc / config.factor : ramc + 180 - arc / config.factor);
    if (Math.abs(signedDegreeDelta(ra, next)) < 0.000001) return next;
    ra = next;
  }
  return ra;
}
function calculatePlacidusHouses(asc, mc, date = '', time = '12:00', place = null) {
  if (!asc || !mc || !hasAstroCoordinates(place)) return null;
  const dateInfo = astroDayCount(date, time, place);
  if (!dateInfo) return null;
  const lat = Math.max(-66, Math.min(66, Number(place.lat)));
  const eps = trueObliquityDegree(dateInfo.t);
  const ramc = localSiderealDegree(date, time, place);
  const cusp = house => {
    const ra = solvePlacidusRightAscension(ramc, lat, eps, house);
    return Number.isFinite(ra) ? eclipticLongitudeFromRightAscension(ra, eps) : null;
  };
  const h2 = cusp(2);
  const h3 = cusp(3);
  const h11 = cusp(11);
  const h12 = cusp(12);
  if (![h2, h3, h11, h12].every(Number.isFinite)) return null;
  return [
    asc.absolute,
    h2,
    h3,
    normalizeDegree(mc.absolute + 180),
    normalizeDegree(h11 + 180),
    normalizeDegree(h12 + 180),
    normalizeDegree(asc.absolute + 180),
    normalizeDegree(h2 + 180),
    normalizeDegree(h3 + 180),
    mc.absolute,
    h11,
    h12
  ].map(normalizeDegree);
}
function calculateAstroHouses(asc, mc, houseSystem = 'placidus', date = '', time = '12:00', place = null) {
  if (!asc) return [];
  if (houseSystem === 'placidus') {
    const placidus = calculatePlacidusHouses(asc, mc, date, time, place);
    if (placidus) return placidus;
  }
  if (houseSystem === 'whole') {
    return ASTRO_HOUSES.map((label, index) => normalizeDegree(asc.index * 30 + index * 30));
  }
  if (houseSystem === 'equal' || !mc) {
    return ASTRO_HOUSES.map((label, index) => normalizeDegree(asc.absolute + index * 30));
  }
  const ascDeg = asc.absolute;
  const dcDeg = normalizeDegree(ascDeg + 180);
  const mcDeg = mc.absolute;
  const icDeg = normalizeDegree(mcDeg + 180);
  return [
    ascDeg,
    quadrantCusp(ascDeg, icDeg, 1),
    quadrantCusp(ascDeg, icDeg, 2),
    icDeg,
    quadrantCusp(icDeg, dcDeg, 1),
    quadrantCusp(icDeg, dcDeg, 2),
    dcDeg,
    quadrantCusp(dcDeg, mcDeg, 1),
    quadrantCusp(dcDeg, mcDeg, 2),
    mcDeg,
    quadrantCusp(mcDeg, ascDeg, 1),
    quadrantCusp(mcDeg, ascDeg, 2)
  ].map(normalizeDegree);
}
function calculateAstroProfile(name = '', date = '', time = '', place = null, options = {}) {
  if (!name || !date || !time) return null;
  const dateInfo = astroDayCount(date, time, place);
  const planets = planetPositions(date, time, place);
  if (!planets.length) return null;
  const sunBody = planets.find(p => p.id === 'sun');
  const sun = { ...zodiacFromDegree(sunBody?.degree || 0) };
  const preciseAngles = hasAstroCoordinates(place);
  const asc = astronomicalAscendant(date, time, place) || fallbackAscendant(date, time, name, place);
  const moon = planets.find(p => p.id === 'moon');
  const mc = astronomicalMc(date, time, place) || zodiacFromDegree(normalizeDegree(asc.absolute + 90));
  const houseSystem = options.houseSystem || getAstroHouseSystem();
  const houseCusps = calculateAstroHouses(asc, mc, houseSystem, date, time, place);
  const houses = ASTRO_HOUSES.map((label, index) => {
    const cusp = houseCusps[index] ?? normalizeDegree(asc.absolute + index * 30);
    const sign = zodiacFromDegree(cusp);
    return { number:index + 1, label, sign:sign.name, symbol:sign.symbol, element:sign.element, cusp, degree:sign.degree, minute:sign.minute, second:sign.second, degreeLabel:sign.degreeLabel };
  });
  const aspects = [];
  planets.forEach((a, i) => planets.slice(i + 1).forEach(b => {
    const diff = Math.abs(a.degree - b.degree);
    const angle = Math.min(diff, 360 - diff);
    const aspect = ASTRO_ASPECTS.map(item => ({ ...item, delta:Math.abs(angle - item.angle) })).sort((x,y) => x.delta - y.delta)[0];
    if (aspect && aspect.delta <= aspect.orb) aspects.push({ a:a.name, b:b.name, name:aspect.name, symbol:aspect.symbol, code:aspect.code, angle:aspect.angle, orb:aspect.delta.toFixed(1), text:aspect.text });
  }));
  const timeZoneOffset = timeZoneOffsetMinutes(place?.timezone || '', new Date(astroDateUTC(date, time, place?.timezone || '') || Date.now()));
  const utcLabel = Number.isFinite(dateInfo?.ms) ? `${String(new Date(dateInfo.ms).getUTCHours()).padStart(2, '0')}:${String(new Date(dateInfo.ms).getUTCMinutes()).padStart(2, '0')}` : '';
  const siderealDegree = preciseAngles ? localSiderealDegree(date, time, place) : null;
  const siderealTimeLabel = Number.isFinite(siderealDegree) ? siderealTimeLabelFromDegree(siderealDegree) : '';
  const quality = preciseAngles
    ? `Lugar, zona horaria, planetas, ascendente, Medio Cielo y casas ${astroHouseSystemLabel(houseSystem)} calculados con coordenadas locales`
    : 'Lugar manual: ascendente y casas aproximados; selecciona una ciudad de la lista para afinar';
  aspects.sort((a, b) => Number(a.orb) - Number(b.orb));
  return { name, date, time, place, sun, moon, asc, mc, planets, houses, aspects:aspects.slice(0, 12), houseSystem, engine:astroEngineLabel(), quality, timeZoneOffset, utcLabel, siderealDegree, siderealTimeLabel, preciseAngles };
}
function formatAstroLocalFromMs(ms, timeZone = '') {
  const date = new Date(ms);
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone:timeZone || undefined,
      hour12:false,
      hourCycle:'h23',
      year:'numeric',
      month:'2-digit',
      day:'2-digit',
      hour:'2-digit',
      minute:'2-digit'
    }).formatToParts(date).reduce((acc, part) => ({ ...acc, [part.type]:part.value }), {});
    const day = `${parts.year}-${parts.month}-${parts.day}`;
    const time = `${parts.hour}:${parts.minute}`;
    return {
      date:day,
      time,
      label:new Intl.DateTimeFormat('es-ES', { timeZone:timeZone || undefined, dateStyle:'medium', timeStyle:'short' }).format(date)
    };
  } catch {
    return { date:date.toISOString().slice(0, 10), time:date.toISOString().slice(11, 16), label:date.toLocaleString('es-ES') };
  }
}
function solarReturnForYear(natalChart, year = new Date().getFullYear()) {
  const parts = dateParts(natalChart?.date || '');
  const natalSun = natalChart?.planets?.find(p => p.id === 'sun')?.degree;
  if (!parts || !Number.isFinite(natalSun)) return null;
  const safeYear = Math.max(1900, Math.min(2100, Number(year) || new Date().getFullYear()));
  const birthTime = natalChart.time || '12:00';
  const birthday = `${safeYear}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  const center = astroDateUTC(birthday, birthTime, natalChart.place?.timezone || '') || Date.UTC(safeYear, parts.month - 1, parts.day, 12, 0);
  const score = ms => angularDistance(sunLongitudeFromDays(astroDaysFromMs(ms)), natalSun);
  let bestMs = center;
  let bestScore = Infinity;
  for (let ms = center - 3 * 86400000; ms <= center + 3 * 86400000; ms += 60 * 60000) {
    const delta = score(ms);
    if (delta < bestScore) { bestScore = delta; bestMs = ms; }
  }
  [10 * 60000, 60 * 1000].forEach(step => {
    const span = step * 18;
    for (let ms = bestMs - span; ms <= bestMs + span; ms += step) {
      const delta = score(ms);
      if (delta < bestScore) { bestScore = delta; bestMs = ms; }
    }
  });
  const local = formatAstroLocalFromMs(bestMs, natalChart.place?.timezone || '');
  const chart = calculateAstroProfile(natalChart.name, local.date, local.time, natalChart.place, { houseSystem:natalChart.houseSystem });
  return chart ? { year:safeYear, exactMs:bestMs, localDate:local.date, localTime:local.time, localLabel:local.label, sunDelta:bestScore, chart } : null;
}
function astroAdviceForElement(element = '') {
  const map = {
    Fuego:'actúa con intención, sin quemar etapas',
    Tierra:'ponlo en agenda, en cuerpo y en pasos concretos',
    Aire:'nombra lo que piensas antes de decidir',
    Agua:'escucha la emoción sin dejar que decida sola'
  };
  return map[element] || 'busca un gesto simple que te devuelva centro';
}
function astroEngineNoticeHTML(chart = null) {
  const quality = chart?.quality || 'Usa fecha, hora, lugar, coordenadas y zona horaria cuando hay ciudad seleccionada.';
  return `<div class="astro-engine-note" role="note"><strong>${escapeHTML(astroEngineLabel())}</strong><span>${escapeHTML(quality)} · Sin Swiss Ephemeris ni marcas externas.</span></div>`;
}
function astroWheelAngle(chart, degree) {
  return normalizeDegree(Number(chart?.asc?.absolute || 0) - Number(degree || 0) + 270);
}
function astroAspectClass(name = '') {
  const map = { Conjunción:'conjunction', Sextil:'sextile', Cuadratura:'square', Trígono:'trine', Oposición:'opposition' };
  return map[name] || 'minor';
}
function astroAspectMeta(name = '') {
  return ASTRO_ASPECTS.find(aspect => aspect.name === name) || { name, symbol:'·', code:'ASP', angle:0, orb:0, text:'' };
}
function astroAspectTone(name = '') {
  if (name === 'Cuadratura' || name === 'Oposición') return { key:'tension', label:'Tensión creativa' };
  if (name === 'Sextil' || name === 'Trígono') return { key:'flow', label:'Fluidez' };
  return { key:'focus', label:'Foco' };
}
function astroAspectOrbLabel(orb = 0) {
  const value = Number(orb);
  if (value <= 1) return 'muy exacto';
  if (value <= 3) return 'cercano';
  return 'amplio';
}
function astroAspectStats(chart) {
  const aspects = Array.isArray(chart?.aspects) ? chart.aspects : [];
  const counts = aspects.reduce((acc, aspect) => {
    const tone = astroAspectTone(aspect.name).key;
    acc[tone] = (acc[tone] || 0) + 1;
    return acc;
  }, { flow:0, tension:0, focus:0 });
  const tightest = aspects.slice().sort((a, b) => Number(a.orb) - Number(b.orb))[0] || null;
  return { counts, tightest };
}
function astroAspectLegendHTML() {
  return `<div class="astro-aspect-legend" aria-label="Leyenda de aspectos">${ASTRO_ASPECTS.map(aspect => `<span class="astro-aspect-key astro-aspect-key-${astroAspectClass(aspect.name)}"><b aria-hidden="true">${astroGlyph(aspect.symbol)}</b><small>${escapeHTML(aspect.name)} · ${aspect.angle}°</small></span>`).join('')}</div>`;
}
function astroAspectWebHTML(chart) {
  const clipId = `astro-aspect-clip-${astroHash(`${chart.name || ''}|${chart.date || ''}|${chart.time || ''}`)}`;
  const byName = Object.fromEntries(chart.planets.map(planet => [planet.name, planet]));
  const point = (degree, radius) => {
    const angle = degToRad(astroWheelAngle(chart, degree) - 90);
    return { x:50 + Math.cos(angle) * radius, y:50 + Math.sin(angle) * radius };
  };
  const houseLines = (chart.houses || []).map(house => {
    const inner = point(house.cusp, house.number === 1 || house.number === 4 || house.number === 7 || house.number === 10 ? 6.6 : 9);
    const outer = point(house.cusp, 44.5);
    const main = house.number === 1 || house.number === 4 || house.number === 7 || house.number === 10;
    return `<line class="astro-house-ray${main ? ' astro-house-ray-main' : ''}" x1="${inner.x.toFixed(2)}" y1="${inner.y.toFixed(2)}" x2="${outer.x.toFixed(2)}" y2="${outer.y.toFixed(2)}"></line>`;
  }).join('');
  const lines = (chart.aspects || []).map(aspect => {
    const a = byName[aspect.a];
    const b = byName[aspect.b];
    if (!a || !b) return '';
    const p1 = point(a.degree, 28.8);
    const p2 = point(b.degree, 28.8);
    return `<line class="astro-aspect-line astro-aspect-${astroAspectClass(aspect.name)}" x1="${p1.x.toFixed(2)}" y1="${p1.y.toFixed(2)}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}"></line>`;
  }).join('');
  if (!houseLines && !lines) return '';
  return `<svg class="astro-aspect-web" viewBox="0 0 100 100" aria-hidden="true"><defs><clipPath id="${clipId}"><circle cx="50" cy="50" r="39"></circle></clipPath></defs><g class="astro-house-rays" clip-path="url(#${clipId})">${houseLines}</g><g class="astro-aspect-rays" clip-path="url(#${clipId})">${lines}</g></svg>`;
}
const ASTRO_WHEEL_ZOOM_MIN = 1;
const ASTRO_WHEEL_ZOOM_MAX = 2.8;
const ASTRO_WHEEL_ZOOM_STEP = .35;
let astroWheelGesture = { viewport:null, pointers:new Map(), startScale:1, startDistance:0, startMid:null, startX:0, startY:0, baseX:0, baseY:0 };
let astroWheelModalFocus = null;
function astroWheelViewportFrom(node) {
  const wrap = node?.closest?.('.astro-wheel-wrap');
  return node?.closest?.('[data-astro-wheel-viewport]') || wrap?.querySelector?.('[data-astro-wheel-viewport]') || null;
}
function astroWheelState(viewport) {
  return {
    scale: Number(viewport?.dataset?.astroScale || 1) || 1,
    x: Number(viewport?.dataset?.astroPanX || 0) || 0,
    y: Number(viewport?.dataset?.astroPanY || 0) || 0
  };
}
function astroWheelClampPan(viewport, x, y, scale) {
  const width = viewport?.clientWidth || 300;
  const height = viewport?.clientHeight || width;
  const maxX = Math.max(0, (scale - 1) * width * .46);
  const maxY = Math.max(0, (scale - 1) * height * .46);
  return {
    x: Math.max(-maxX, Math.min(maxX, x)),
    y: Math.max(-maxY, Math.min(maxY, y))
  };
}
function setAstroWheelZoom(viewport, next) {
  if (!viewport) return;
  const scale = Math.max(ASTRO_WHEEL_ZOOM_MIN, Math.min(ASTRO_WHEEL_ZOOM_MAX, Number(next.scale) || 1));
  const pan = scale <= 1.01 ? { x:0, y:0 } : astroWheelClampPan(viewport, Number(next.x) || 0, Number(next.y) || 0, scale);
  viewport.dataset.astroScale = scale.toFixed(2);
  viewport.dataset.astroPanX = pan.x.toFixed(1);
  viewport.dataset.astroPanY = pan.y.toFixed(1);
  const target = viewport.querySelector('.astro-wheel-zoom-target');
  target?.style.setProperty('--astro-scale', scale.toFixed(2));
  target?.style.setProperty('--astro-pan-x', `${pan.x.toFixed(1)}px`);
  target?.style.setProperty('--astro-pan-y', `${pan.y.toFixed(1)}px`);
  viewport.closest('.astro-wheel-wrap')?.classList.toggle('astro-wheel-zoomed', scale > 1.01);
  const status = viewport.closest('.astro-wheel-wrap')?.querySelector('[data-astro-zoom-status]');
  if (status) status.textContent = `${Math.round(scale * 100)}%`;
}
function handleAstroWheelZoomControl(button) {
  const viewport = astroWheelViewportFrom(button);
  if (!viewport) return;
  const state = astroWheelState(viewport);
  const action = button.dataset.astroZoom;
  if (action === 'full') return toggleAstroWheelFullscreen(viewport.closest('.astro-wheel-wrap'));
  if (action === 'reset') return setAstroWheelZoom(viewport, { scale:1, x:0, y:0 });
  const direction = action === 'out' ? -1 : 1;
  setAstroWheelZoom(viewport, { ...state, scale:state.scale + direction * ASTRO_WHEEL_ZOOM_STEP });
}
function repairAstroWheelCloneIds(clone) {
  const idMap = new Map();
  clone.querySelectorAll('[id]').forEach(node => {
    const oldId = node.id;
    if (!oldId) return;
    const nextId = `${oldId}-modal`;
    node.id = nextId;
    idMap.set(oldId, nextId);
  });
  clone.querySelectorAll('[clip-path]').forEach(node => {
    const value = node.getAttribute('clip-path') || '';
    idMap.forEach((nextId, oldId) => {
      if (value.includes(`#${oldId}`)) node.setAttribute('clip-path', value.replace(`#${oldId}`, `#${nextId}`));
    });
  });
}
function openAstroWheelModal(wrap) {
  if (!wrap) return;
  closeAstroWheelFullscreen();
  astroWheelModalFocus = document.activeElement;
  const clone = wrap.cloneNode(true);
  clone.classList.remove('astro-wheel-fullscreen', 'astro-wheel-zoomed');
  clone.classList.add('astro-wheel-modal-copy');
  repairAstroWheelCloneIds(clone);
  const fullButton = clone.querySelector('[data-astro-zoom="full"]');
  if (fullButton) {
    fullButton.textContent = '×';
    fullButton.setAttribute('aria-label', 'Cerrar rueda astral grande');
  }
  const root = document.createElement('div');
  root.id = 'astroWheelModal';
  root.className = 'astro-wheel-modal-root';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Rueda astral ampliada');
  root.innerHTML = '<div class="astro-wheel-modal-backdrop" data-astro-wheel-modal-close></div><section class="astro-wheel-modal-panel"></section>';
  root.querySelector('.astro-wheel-modal-panel')?.appendChild(clone);
  document.body.appendChild(root);
  document.body.classList.add('astro-wheel-fullscreen-open');
  setAstroWheelZoom(clone.querySelector('[data-astro-wheel-viewport]'), { scale:1, x:0, y:0 });
  requestAnimationFrame(() => {
    root.classList.add('open');
    clone.querySelector('[data-astro-wheel-viewport]')?.focus?.({ preventScroll:true });
  });
}
function toggleAstroWheelFullscreen(wrap) {
  const modal = document.getElementById('astroWheelModal');
  if (modal && (!wrap || modal.contains(wrap))) {
    closeAstroWheelFullscreen();
    return;
  }
  openAstroWheelModal(wrap);
}
function closeAstroWheelFullscreen() {
  const modal = document.getElementById('astroWheelModal');
  if (!modal) return false;
  if (astroWheelGesture.viewport && modal.contains(astroWheelGesture.viewport)) {
    astroWheelGesture.pointers.clear();
    astroWheelGesture.viewport = null;
  }
  modal.remove();
  document.body.classList.remove('astro-wheel-fullscreen-open');
  if (astroWheelModalFocus && document.contains(astroWheelModalFocus)) {
    try { astroWheelModalFocus.focus({ preventScroll:true }); } catch {}
  }
  astroWheelModalFocus = null;
  return true;
}
function astroWheelPointerList() {
  return Array.from(astroWheelGesture.pointers.values());
}
function astroWheelDistance(points) {
  if (points.length < 2) return 0;
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}
function astroWheelMidpoint(points) {
  if (points.length < 2) return { x:points[0]?.x || 0, y:points[0]?.y || 0 };
  return { x:(points[0].x + points[1].x) / 2, y:(points[0].y + points[1].y) / 2 };
}
function resetAstroWheelGesture(viewport) {
  const state = astroWheelState(viewport);
  const points = astroWheelPointerList();
  astroWheelGesture.startScale = state.scale;
  astroWheelGesture.startX = state.x;
  astroWheelGesture.startY = state.y;
  astroWheelGesture.startDistance = astroWheelDistance(points);
  astroWheelGesture.startMid = astroWheelMidpoint(points);
}
function astroWheelPointerDown(e) {
  if (e.target.closest?.('[data-astro-zoom]')) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const viewport = astroWheelViewportFrom(e.target);
  if (!viewport) return;
  e.preventDefault();
  if (astroWheelGesture.viewport && astroWheelGesture.viewport !== viewport) astroWheelGesture.pointers.clear();
  astroWheelGesture.viewport = viewport;
  viewport.classList.add('astro-wheel-dragging');
  try { viewport.setPointerCapture?.(e.pointerId); } catch {}
  const now = Date.now();
  const lastTap = Number(viewport.dataset.astroLastTap || 0);
  if (now - lastTap < 320 && astroWheelGesture.pointers.size === 0) {
    const state = astroWheelState(viewport);
    setAstroWheelZoom(viewport, { ...state, scale:state.scale > 1.05 ? 1 : 1.8 });
    viewport.dataset.astroLastTap = '0';
    return;
  }
  viewport.dataset.astroLastTap = String(now);
  astroWheelGesture.pointers.set(e.pointerId, { x:e.clientX, y:e.clientY });
  resetAstroWheelGesture(viewport);
}
function astroWheelPointerMove(e) {
  const viewport = astroWheelGesture.viewport;
  if (!viewport || !document.contains(viewport) || !astroWheelGesture.pointers.has(e.pointerId)) {
    if (viewport && !document.contains(viewport)) {
      astroWheelGesture.pointers.clear();
      astroWheelGesture.viewport = null;
    }
    return;
  }
  e.preventDefault();
  astroWheelGesture.pointers.set(e.pointerId, { x:e.clientX, y:e.clientY });
  const points = astroWheelPointerList();
  if (points.length >= 2 && astroWheelGesture.startDistance > 0) {
    const distance = astroWheelDistance(points);
    const mid = astroWheelMidpoint(points);
    const scale = astroWheelGesture.startScale * (distance / astroWheelGesture.startDistance);
    setAstroWheelZoom(viewport, {
      scale,
      x:astroWheelGesture.startX + (mid.x - astroWheelGesture.startMid.x),
      y:astroWheelGesture.startY + (mid.y - astroWheelGesture.startMid.y)
    });
    return;
  }
  const state = astroWheelState(viewport);
  if (state.scale <= 1.01) return;
  const point = points[0];
  setAstroWheelZoom(viewport, {
    scale:state.scale,
    x:astroWheelGesture.startX + point.x - astroWheelGesture.startMid.x,
    y:astroWheelGesture.startY + point.y - astroWheelGesture.startMid.y
  });
}
function astroWheelPointerEnd(e) {
  if (!astroWheelGesture.viewport) return;
  try { astroWheelGesture.viewport.releasePointerCapture?.(e.pointerId); } catch {}
  astroWheelGesture.pointers.delete(e.pointerId);
  if (astroWheelGesture.pointers.size) resetAstroWheelGesture(astroWheelGesture.viewport);
  else {
    astroWheelGesture.viewport.classList.remove('astro-wheel-dragging');
    astroWheelGesture.viewport = null;
  }
}
function astroWheelHTML(chart) {
  const signs = ASTRO_SIGNS.map((sign, index) => `<span class="astro-sign" style="--angle:${astroWheelAngle(chart, index * 30 + 15)}deg;--sign-color:${ASTRO_SIGN_COLORS[index] || '#bd3b75'}" aria-hidden="true">${astroGlyph(sign.symbol)}</span>`).join('');
  const houses = chart.houses.map(house => `<span class="astro-house-number" style="--angle:${astroWheelAngle(chart, house.cusp + 15)}deg" aria-hidden="true">${house.number}</span>`).join('');
  const planets = chart.planets.map((planet, index) => {
    const radius = [-.315, -.275, -.235, -.195][index % 4];
    const planetLabel = `${planet.name} en ${planet.sign} ${planet.degreeLabel || ''}${planet.retrograde ? ' retrógrado' : ''}`.trim();
    return `<span class="astro-planet-dot astro-planet-${index}" style="--angle:${astroWheelAngle(chart, planet.degree)}deg; --radius:calc(var(--wheel-size) * ${radius})" title="${escapeHTML(planetLabel)}" aria-label="${escapeHTML(planetLabel)}">${astroGlyph(planet.symbol)}${planet.retrograde ? '<small>R</small>' : ''}</span>`;
  }).join('');
  const caption = `${chart.name || ''}, ${chart.date || ''}, ${chart.time || ''}${chart.place?.label ? ` · ${chart.place.label}` : ''}`;
  return `<div class="astro-wheel-wrap astro-wheel-paper"><div class="astro-wheel-tools" aria-label="Zoom de la rueda astral"><button type="button" data-astro-zoom="out" aria-label="Reducir rueda astral">−</button><span data-astro-zoom-status aria-live="polite">100%</span><button type="button" data-astro-zoom="reset" aria-label="Restablecer rueda astral">⟲</button><button type="button" data-astro-zoom="full" aria-label="Ver rueda astral grande">⛶</button><button type="button" data-astro-zoom="in" aria-label="Ampliar rueda astral">+</button></div><div class="astro-wheel-viewport" data-astro-wheel-viewport tabindex="0" aria-label="Rueda astral ampliable. Usa los botones de zoom, doble toque para ampliar y arrastra para mover."><div class="astro-wheel-zoom-target"><div class="astro-wheel" role="img" aria-label="${escapeHTML(t('asWheelAlt', { name: chart.name }))}"><div class="astro-zodiac">${signs}</div>${houses}${astroAspectWebHTML(chart)}<span class="astro-axis-label astro-axis-ac" aria-hidden="true">AC</span><span class="astro-axis-label astro-axis-dc" aria-hidden="true">DC</span><span class="astro-axis-label astro-axis-mc" style="--angle:${astroWheelAngle(chart, chart.mc.absolute)}deg" aria-hidden="true">MC</span><span class="astro-axis-label astro-axis-ic" style="--angle:${astroWheelAngle(chart, chart.mc.absolute + 180)}deg" aria-hidden="true">IC</span><span class="astro-asc-line" aria-hidden="true"></span><span class="astro-dc-line" aria-hidden="true"></span><span class="astro-mc-line" style="--angle:${astroWheelAngle(chart, chart.mc.absolute)}deg" aria-hidden="true"></span>${planets}</div></div></div><p class="astro-wheel-caption">${escapeHTML(caption)}</p>${astroAspectLegendHTML()}</div>`;
}
function astroPositionsHTML(chart) {
  return `<div class="astro-panel-list astro-positions-list">${chart.planets.map(planet => `<article class="astro-chip"><span class="astro-symbol" aria-hidden="true">${astroGlyph(planet.symbol)}</span><span><strong>${escapeHTML(planet.name)} en ${escapeHTML(planet.sign)} ${escapeHTML(planet.degreeLabel || `${planet.signDegree}°`)}${planet.retrograde ? ' Rx' : ''}</strong><small>${escapeHTML(planet.role)} · ${escapeHTML(planet.element)}</small></span><small>${escapeHTML(Number(planet.degree || 0).toFixed(4))}°</small></article>`).join('')}</div>`;
}
function astroHousesHTML(chart) {
  return `<div class="astro-panel-list">${chart.houses.map(house => `<article class="astro-chip"><span class="astro-symbol" aria-hidden="true">${astroGlyph(house.symbol)}</span><span><strong>Casa ${house.number} · ${escapeHTML(house.label)}</strong><small>${escapeHTML(house.sign)} · ${escapeHTML(house.element)} · ${escapeHTML(house.degreeLabel || `${house.degree}°`)}</small></span></article>`).join('')}</div>`;
}
function astroAspectsHTML(chart) {
  if (!chart.aspects.length) return `<p class="subtle">${escapeHTML(t('stLaRuedaNoMarcaAspectosMayores'))}</p>`;
  const stats = astroAspectStats(chart);
  const tight = stats.tightest;
  const overview = `<div class="astro-aspect-overview" aria-label="Resumen de aspectos">
    <div><strong>${chart.aspects.length}</strong><small>${escapeHTML(t('stAspectosMayores'))}</small></div>
    <div><strong>${stats.counts.flow}</strong><small>${escapeHTML(t('stFluidos'))}</small></div>
    <div><strong>${stats.counts.tension}</strong><small>${escapeHTML(t('stDeAjuste'))}</small></div>
    <div><strong>${tight ? `${escapeHTML(tight.name)} ${escapeHTML(tight.orb)}°` : '—'}</strong><small>${escapeHTML(t('stMasExacto'))}</small></div>
  </div>`;
  return chart.aspects.length
    ? `${overview}<div class="astro-aspects">${chart.aspects.map(item => { const meta = astroAspectMeta(item.name); const tone = astroAspectTone(item.name); return `<article class="astro-aspect astro-aspect-card-${astroAspectClass(item.name)}"><span class="astro-aspect-glyph" aria-hidden="true">${astroGlyph(meta.symbol)}</span><div><strong>${escapeHTML(item.name)} · ${escapeHTML(item.a)} / ${escapeHTML(item.b)}</strong><small>${meta.angle}° · orbe ${escapeHTML(item.orb)}° · ${escapeHTML(astroAspectOrbLabel(item.orb))} · ${escapeHTML(tone.label)}</small><p>${escapeHTML(item.text)}.</p></div></article>`; }).join('')}</div>`
    : `<p class="subtle">${escapeHTML(t('stLaRuedaNoMarcaAspectosMayores'))}</p>`;
}
function astroReadingText(chart) {
  const dominant = chart.planets.reduce((acc, p) => ({ ...acc, [p.element]:(acc[p.element] || 0) + 1 }), {});
  const element = Object.entries(dominant).sort((a,b) => b[1] - a[1])[0]?.[0] || chart.sun.element;
  const aspects = chart.aspects.map(item => `${item.symbol || astroAspectMeta(item.name).symbol} ${item.name} (${item.angle}°) entre ${item.a} y ${item.b}, orbe ${item.orb}°: ${item.text}.`).join('\n') || 'Sin aspectos mayores exactos en esta lectura simbólica.';
  return `CARTA ASTRAL SIMBÓLICA · ${chart.name}
Fecha: ${chart.date} · Hora de nacimiento: ${chart.time}
Hora universal: ${chart.utcLabel || 'No calculada'}${chart.siderealTimeLabel ? ` · Tiempo sideral: ${chart.siderealTimeLabel}` : ''}
Lugar: ${chart.place?.label || 'No indicado'}${chart.place?.timezone ? ` · Zona horaria: ${chart.place.timezone}` : ''}
${Number.isFinite(Number(chart.place?.lat)) ? `Coordenadas: ${chart.place.lat}, ${chart.place.lon}` : 'Coordenadas: no seleccionadas'}
Motor: ${chart.engine}
Sistema de casas: ${astroHouseSystemLabel(chart.houseSystem)}
Calidad del cálculo: ${chart.quality}

Sol en ${chart.sun.symbol} ${chart.sun.name}: tu dirección principal busca ${chart.sun.keywords.join(', ')}.
Luna en ${chart.moon.signSymbol} ${chart.moon.sign}: tu mundo emocional se ordena desde ${chart.moon.keywords.join(', ')}.
Ascendente en ${chart.asc.symbol} ${chart.asc.name}: la primera puerta de la experiencia habla de ${chart.asc.keywords.join(', ')}.
Medio Cielo en ${chart.mc.symbol} ${chart.mc.name}: el propósito visible toma ese color de fondo.

Elemento dominante: ${element}. Consejo: ${astroAdviceForElement(element)}.

Posiciones:
${chart.planets.map(p => `${p.symbol} ${p.name}: ${p.degreeLabel || `${p.signDegree}°`} ${p.sign}${p.retrograde ? ' Rx' : ''}`).join('\n')}

Aspectos principales:
${aspects}

Casas:
${chart.houses.map(h => `Casa ${h.number} · ${h.label}: ${h.degreeLabel || `${h.degree}°`} ${h.symbol} ${h.sign}`).join('\n')}

Nota: lectura simbólica local con motor abierto propio. Con ciudad seleccionada usa zona horaria histórica del navegador, coordenadas, ascendente, Medio Cielo y el sistema de casas elegido; no sustituye un cálculo astrológico profesional con efemérides completas.`;
}
function astroReadingItems(chart) {
  return chart.planets.map(p => ({ kind:'astro', name:`${p.name} en ${p.sign}`, subtitle:p.role, image:'', symbol:p.symbol, position:p.element }));
}
function solarReturnText(natalChart, solarReturn, intention = '') {
  const chart = solarReturn.chart;
  const dominant = chart.planets.reduce((acc, p) => ({ ...acc, [p.element]:(acc[p.element] || 0) + 1 }), {});
  const element = Object.entries(dominant).sort((a,b) => b[1] - a[1])[0]?.[0] || chart.sun.element;
  const aspects = chart.aspects.map(item => `${item.symbol || astroAspectMeta(item.name).symbol} ${item.name} (${item.angle}°) entre ${item.a} y ${item.b}, orbe ${item.orb}°: ${item.text}.`).join('\n') || 'Sin aspectos mayores exactos en esta revolucion solar simbolica.';
  return `REVOLUCIÓN SOLAR SIMBÓLICA ${solarReturn.year} · ${chart.name}
Nacimiento: ${natalChart.date} · Hora natal: ${natalChart.time}
Hora universal natal: ${natalChart.utcLabel || 'No calculada'}${natalChart.siderealTimeLabel ? ` · Tiempo sideral natal: ${natalChart.siderealTimeLabel}` : ''}
Lugar usado: ${chart.place?.label || 'No indicado'}
Retorno solar aproximado: ${solarReturn.localLabel}
Intención: ${intention || 'Claridad'}
Motor: ${chart.engine}
Sistema de casas: ${astroHouseSystemLabel(chart.houseSystem)}

Base natal:
Sol natal en ${natalChart.sun.name}. Luna natal en ${natalChart.moon.sign}. Ascendente natal en ${natalChart.asc.name}. Medio Cielo natal en ${natalChart.mc.name}.

Carta de revolución solar:
Sol de retorno en ${chart.sun.name}; la identidad del año pide volver al centro desde ${chart.sun.keywords.join(', ')}.
Luna de retorno en ${chart.moon.sign}; el clima emocional del ciclo se expresa desde ${chart.moon.keywords.join(', ')}.
Ascendente de revolución en ${chart.asc.name}; la puerta del año habla de ${chart.asc.keywords.join(', ')}.
Medio Cielo de revolución en ${chart.mc.name}; la zona visible del año se tiñe de ${chart.mc.keywords.join(', ')}.

Elemento dominante del año: ${element}. Consejo: ${astroAdviceForElement(element)}.

Posiciones de la revolución:
${chart.planets.map(p => `${p.symbol} ${p.name}: ${p.degreeLabel || `${p.signDegree}°`} ${p.sign}${p.retrograde ? ' Rx' : ''}`).join('\n')}

Aspectos principales:
${aspects}

Casas de revolución:
${chart.houses.map(h => `Casa ${h.number} · ${h.label}: ${h.degreeLabel || `${h.degree}°`} ${h.symbol} ${h.sign}`).join('\n')}

Nota: esta revolución solar usa el motor abierto del Oráculo, coordenadas locales y una aproximación al momento en que el Sol vuelve al grado natal. No sustituye una carta profesional con efemérides astronómicas completas.`;
}
function solarReturnBridgeHTML(natalChart, solarReturn) {
  const chart = solarReturn.chart;
  const items = [
    ['Sol natal', `${astroGlyph(natalChart.sun.symbol)} ${natalChart.sun.name} ${natalChart.sun.degreeLabel || ''}`, 'Punto de partida'],
    ['Asc natal', `${astroGlyph(natalChart.asc.symbol)} ${natalChart.asc.name} ${natalChart.asc.degreeLabel || ''}`, 'Puerta habitual'],
    ['Asc anual', `${astroGlyph(chart.asc.symbol)} ${chart.asc.name} ${chart.asc.degreeLabel || ''}`, 'Puerta del año'],
    ['Luna anual', `${astroGlyph(chart.moon.signSymbol)} ${chart.moon.sign} ${chart.moon.degreeLabel || ''}`, 'Clima emocional'],
    ['MC anual', `${astroGlyph(chart.mc.symbol)} ${chart.mc.name} ${chart.mc.degreeLabel || ''}`, 'Zona visible'],
    ['Retorno', solarReturn.localLabel, `Diferencia solar ${solarReturn.sunDelta.toFixed(3)}°`]
  ];
  return `<div class="astro-return-bridge">${items.map(([label, value, detail]) => `<article><small>${escapeHTML(label)}</small><strong>${escapeHTML(value)}</strong><span>${escapeHTML(detail)}</span></article>`).join('')}</div>`;
}
function renderSolarReturnReading(natalChart, solarReturn, text, title) {
  const chart = solarReturn.chart;
  openModal({ icon:'☉', title, subtitle:`${chart.name} · ${solarReturn.year} · ${solarReturn.localLabel}`, body:`
    <div class="astro-grid">
      ${astroWheelHTML(chart)}
      <div class="result-card astro-summary-card"><h3>${escapeHTML(t('stRevolucionSolar'))}</h3><p><strong>${escapeHTML(t('stRetorno'))}</strong> ${escapeHTML(solarReturn.localLabel)}</p><p><strong>${escapeHTML(t('stSol'))}</strong> ${escapeHTML(astroGlyph(chart.sun.symbol))} ${escapeHTML(chart.sun.name)} ${escapeHTML(chart.sun.degreeLabel || '')}</p><p><strong>${escapeHTML(t('stLuna'))}</strong> ${escapeHTML(astroGlyph(chart.moon.signSymbol))} ${escapeHTML(chart.moon.sign)} ${escapeHTML(chart.moon.degreeLabel || '')}</p><p><strong>${escapeHTML(t('stAscendente'))}</strong> ${escapeHTML(astroGlyph(chart.asc.symbol))} ${escapeHTML(chart.asc.name)} ${escapeHTML(chart.asc.degreeLabel || '')}</p><p><strong>${escapeHTML(t('stMedioCielo'))}</strong> ${escapeHTML(astroGlyph(chart.mc.symbol))} ${escapeHTML(chart.mc.name)} ${escapeHTML(chart.mc.degreeLabel || '')}</p>${chart.utcLabel ? `<p><strong>${escapeHTML(t('stHoraUniversal'))}</strong> ${escapeHTML(chart.utcLabel)}</p>` : ''}${chart.siderealTimeLabel ? `<p><strong>${escapeHTML(t('stTiempoSideral'))}</strong> ${escapeHTML(chart.siderealTimeLabel)}</p>` : ''}${astroEngineNoticeHTML(chart)}</div>
    </div>
    <h3 class="section-title">${escapeHTML(t('stNatalYAno'))}</h3>
    ${solarReturnBridgeHTML(natalChart, solarReturn)}
    <h3 class="section-title">${escapeHTML(t('stPosicionesDelAno'))}</h3>
    ${astroPositionsHTML(chart)}
    <h3 class="section-title">${escapeHTML(t('stAspectos'))}</h3>
    ${astroAspectsHTML(chart)}
    <h3 class="section-title">${escapeHTML(t('stCasas'))}</h3>
    ${astroHousesHTML(chart)}
    <div class="result-card mt"><h3>${escapeHTML(t('stSintesis'))}</h3><p>${escapeHTML(cleanInterpretation(text)).replace(/\n/g,'<br>')}</p>${readingActions(text,'Astros')}</div>` });
}
function showAstros() {
  const n = escapeHTML(localStorage.getItem(LS.name) || '');
  const profile = getProfile();
  const d = escapeHTML(getBirthDate() || profile.birth || '');
  const tm = escapeHTML(getBirthTime() || profile.birthTime || '');
  const place = getBirthPlace() || profile.birthPlace || null;
  const placeValue = escapeHTML(place?.label || '');
  const placeData = escapeHTML(place ? JSON.stringify(place) : '');
  const houseSystem = getAstroHouseSystem();
  openModal({ icon:'☉', title:t('asTitle'), subtitle:t('asSub'), body:`
    <div class="result-card astro-hero">
      <div class="om-3d-stage om-modal-3d" data-oraculo-3d-asset="astrolabe" aria-label="${escapeHTML(t('a3dAstrolabe'))}"></div>
      <h3>${escapeHTML(t('asWheel'))}</h3>
      <p>${escapeHTML(t('asIntro'))}</p>
      ${astroEngineNoticeHTML()}
    </div>
    <div class="form-grid mt astro-form">
      <div class="field"><label>${escapeHTML(t('nuName'))}</label>${inputWithMic('astroName', `value="${n}" placeholder="${escapeHTML(t('nuNamePh'))}"`)}</div>
      <div class="field"><label>${escapeHTML(t('nuBirth'))}</label><input id="astroDate" class="input" type="date" value="${d}"></div>
      <div class="field"><label>${escapeHTML(t('nuBirthTime'))}</label><input id="astroTime" class="input" type="time" value="${tm}"><small class="subtle">${escapeHTML(t('nuBirthTimePh'))}</small></div>
      <div class="field astro-place-field"><label>${escapeHTML(t('asPlace'))}</label>${inputWithMic('astroPlace', `value="${placeValue}" placeholder="${escapeHTML(t('asPlacePh'))}" autocomplete="off" aria-describedby="astroPlaceHelp"`)}<input id="astroPlaceData" type="hidden" value="${placeData}"><small id="astroPlaceHelp" class="subtle">${escapeHTML(t('asPlaceHelp'))}</small><div id="astroPlaceSuggestions" class="astro-city-suggestions" aria-live="polite"></div></div>
      <div class="field"><label>${escapeHTML(t('asHouses'))}</label><select id="astroHouseSystem" class="input"><option value="placidus" ${houseSystem === 'placidus' ? 'selected' : ''}>${escapeHTML(t('asHousesPlacidus'))}</option><option value="quadrant" ${houseSystem === 'quadrant' ? 'selected' : ''}>${escapeHTML(t('asHousesQuadrant'))}</option><option value="equal" ${houseSystem === 'equal' ? 'selected' : ''}>${escapeHTML(t('asHousesEqual'))}</option><option value="whole" ${houseSystem === 'whole' ? 'selected' : ''}>${escapeHTML(t('asHousesWhole'))}</option></select></div>
      <div class="field"><label>${escapeHTML(t('asIntent'))}</label>${inputWithMic('astroIntention', `placeholder="${escapeHTML(t('asIntentPh'))}"`)}</div>
      <div class="field"><label>${escapeHTML(t('asSolarYear'))}</label><input id="astroSolarYear" class="input" type="number" min="1900" max="2100" step="1" value="${new Date().getFullYear()}"></div>
    </div>
    <div class="actions mt"><button class="btn primary" data-act="astro-chart" type="button">${escapeHTML(t('asChart'))}</button><button class="btn" data-act="astro-daily" type="button">${escapeHTML(t('asDaily'))}</button><button class="btn" data-act="astro-solar-return" type="button">${escapeHTML(t('asSolarReturn'))}</button></div>
    <p class="notice mt">${escapeHTML(t('asNotice'))}</p>` });
}
function getAstroFormData() {
  const profile = getProfile();
  let place = null;
  try { place = JSON.parse($('#astroPlaceData')?.value || 'null'); } catch {}
  const placeLabel = ($('#astroPlace')?.value || place?.label || getBirthPlace()?.label || profile.birthPlace?.label || '').trim();
  if (!place && placeLabel) place = { label:placeLabel };
  return {
    name:($('#astroName')?.value || localStorage.getItem(LS.name) || '').trim(),
    date:$('#astroDate')?.value || getBirthDate() || profile.birth || '',
    time:$('#astroTime')?.value || getBirthTime() || profile.birthTime || '',
    place,
    houseSystem:$('#astroHouseSystem')?.value || getAstroHouseSystem(),
    solarYear:Math.max(1900, Math.min(2100, Number($('#astroSolarYear')?.value) || new Date().getFullYear())),
    intention:($('#astroIntention')?.value || localStorage.getItem(LS.intention) || profile.intention || 'Claridad').trim()
  };
}
function persistAstroData(data) {
  if (data.name) localStorage.setItem(LS.name, data.name);
  if (data.date) setBirthDate(data.date);
  if (data.time) setBirthTime(data.time);
  if (data.place?.label) setBirthPlace(data.place);
  if (data.houseSystem) setAstroHouseSystem(data.houseSystem);
  setProfile({ birth:data.date, birthTime:data.time, birthPlace:data.place || getProfile().birthPlace, sign:sunSignFromDate(data.date)?.name || getProfile().sign, intention:data.intention || getProfile().intention });
}
function renderAstroReading(chart, text, title) {
  openModal({ icon:'☉', title, subtitle:`${chart.name} · ${chart.date} · ${chart.time}${chart.place?.label ? ` · ${chart.place.label}` : ''}`, body:`
    <div class="astro-grid">
      ${astroWheelHTML(chart)}
      <div class="result-card astro-summary-card"><h3>${escapeHTML(t('stTriadaNatal'))}</h3><p><strong>${escapeHTML(t('stSol'))}</strong> ${escapeHTML(astroGlyph(chart.sun.symbol))} ${escapeHTML(chart.sun.name)} ${escapeHTML(chart.sun.degreeLabel || '')}</p><p><strong>${escapeHTML(t('stLuna'))}</strong> ${escapeHTML(astroGlyph(chart.moon.signSymbol))} ${escapeHTML(chart.moon.sign)} ${escapeHTML(chart.moon.degreeLabel || '')}</p><p><strong>${escapeHTML(t('stAscendente'))}</strong> ${escapeHTML(astroGlyph(chart.asc.symbol))} ${escapeHTML(chart.asc.name)} ${escapeHTML(chart.asc.degreeLabel || '')}</p><p><strong>${escapeHTML(t('stMedioCielo'))}</strong> ${escapeHTML(astroGlyph(chart.mc.symbol))} ${escapeHTML(chart.mc.name)} ${escapeHTML(chart.mc.degreeLabel || '')}</p><p><strong>${escapeHTML(t('stLugar'))}</strong> ${escapeHTML(chart.place?.label || 'No indicado')}</p>${chart.utcLabel ? `<p><strong>${escapeHTML(t('stHoraUniversal'))}</strong> ${escapeHTML(chart.utcLabel)}</p>` : ''}${chart.siderealTimeLabel ? `<p><strong>${escapeHTML(t('stTiempoSideral'))}</strong> ${escapeHTML(chart.siderealTimeLabel)}</p>` : ''}${astroEngineNoticeHTML(chart)}</div>
    </div>
    <h3 class="section-title">${escapeHTML(t('stPosiciones'))}</h3>
    ${astroPositionsHTML(chart)}
    <h3 class="section-title">${escapeHTML(t('stAspectos'))}</h3>
    ${astroAspectsHTML(chart)}
    <h3 class="section-title">${escapeHTML(t('stCasas'))}</h3>
    ${astroHousesHTML(chart)}
    <div class="result-card mt"><h3>${escapeHTML(t('stSintesis'))}</h3><p>${escapeHTML(cleanInterpretation(text)).replace(/\n/g,'<br>')}</p>${readingActions(text,'Astros')}</div>` });
}
async function calcAstroChart() {
  const data = getAstroFormData();
  if (!data.name || !data.date || !data.time || !data.place?.label) return toast(t('tsBirthMissing'));
  data.place = await resolveAstroPlace(data.place, data.place?.label);
  const chart = calculateAstroProfile(data.name, data.date, data.time, data.place, { houseSystem:data.houseSystem });
  if (!chart) return toast(t('tsCheckDate'));
  persistAstroData(data);
  const text = astroReadingText(chart);
  setLastReading({ type:'Astros', title:`Carta astral · ${data.name}`, text, items:astroReadingItems(chart), meta:{ name:data.name, birthDate:data.date, birthTime:data.time, birthPlace:data.place, intention:data.intention, houseSystem:data.houseSystem, astro:chart } });
  renderAstroReading(chart, text, `Carta astral · ${data.name}`);
}
async function solarReturnReading() {
  const data = getAstroFormData();
  if (!data.name || !data.date || !data.time || !data.place?.label) return toast(t('tsBirthMissing'));
  data.place = await resolveAstroPlace(data.place, data.place?.label);
  const natalChart = calculateAstroProfile(data.name, data.date, data.time, data.place, { houseSystem:data.houseSystem });
  if (!natalChart) return toast(t('tsCheckDate'));
  const solarReturn = solarReturnForYear(natalChart, data.solarYear);
  if (!solarReturn) return toast(t('tsNoSolar'));
  persistAstroData(data);
  const title = `Revolución solar ${solarReturn.year} · ${data.name}`;
  const text = solarReturnText(natalChart, solarReturn, data.intention);
  setLastReading({
    type:'Astros',
    title,
    text,
    items:astroReadingItems(solarReturn.chart),
    meta:{
      name:data.name,
      birthDate:data.date,
      birthTime:data.time,
      birthPlace:data.place,
      intention:data.intention,
      houseSystem:data.houseSystem,
      astro:natalChart,
      solarReturn
    }
  });
  renderSolarReturnReading(natalChart, solarReturn, text, title);
}
function dailyAstroCards(chart, todayChart, intention = '') {
  const seed = astroHash(`${chart.name}|${chart.date}|${chart.time}|${todayKey()}|${intention}`);
  const pool = [
    { title:'Clima', planet:todayChart.planets[(seed + 1) % todayChart.planets.length], text:'la atmósfera del día pide observar antes de responder' },
    { title:'Reto', planet:todayChart.planets[(seed + 3) % todayChart.planets.length], text:'la fricción útil está en no actuar por costumbre' },
    { title:'Consejo', planet:todayChart.planets[(seed + 5) % todayChart.planets.length], text:'elige una acción pequeña, visible y amable contigo' }
  ];
  return pool.map(card => ({ ...card, sign:card.planet.sign, symbol:astroGlyph(card.planet.symbol), element:card.planet.element }));
}
function dailyAstroText(chart, todayChart, cards, intention) {
  return `TIRADA ASTRAL DEL DÍA · ${chart.name}
Nacimiento: ${chart.date} · Hora: ${chart.time}
Lugar: ${chart.place?.label || 'No indicado'}
Intención: ${intention || 'Claridad'}
Motor: ${chart.engine}
Sistema de casas: ${astroHouseSystemLabel(chart.houseSystem)}

Base natal:
Sol en ${chart.sun.name}. Luna en ${chart.moon.sign}. Ascendente en ${chart.asc.name}. Medio Cielo en ${chart.mc.name}.

Astros de hoy:
Sol en ${todayChart.sun.name}. Luna en ${todayChart.moon.sign}. Elemento lunar: ${todayChart.moon.element}.

${cards.map(card => `${card.title}: ${card.symbol} ${card.planet.name} en ${card.sign}. ${card.text}. Consejo: ${astroAdviceForElement(card.element)}.`).join('\n\n')}

Síntesis:
Hoy conviene mirar la intención desde ${todayChart.moon.element.toLowerCase()} y responder con el cuerpo presente. La lectura no predice; orienta un gesto consciente para este día.`;
}
async function dailyAstroReading() {
  const data = getAstroFormData();
  if (!data.name || !data.date || !data.time || !data.place?.label) return toast(t('tsBirthMissing'));
  data.place = await resolveAstroPlace(data.place, data.place?.label);
  const chart = calculateAstroProfile(data.name, data.date, data.time, data.place, { houseSystem:data.houseSystem });
  if (!chart) return toast(t('tsCheckDate'));
  persistAstroData(data);
  const now = new Date();
  const today = todayKey();
  const todayTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const todayChart = calculateAstroProfile(data.name, today, todayTime, data.place, { houseSystem:data.houseSystem });
  const cards = dailyAstroCards(chart, todayChart, data.intention);
  let text = dailyAstroText(chart, todayChart, cards, data.intention);
  const title = `Tirada astral del día · ${data.name}`;
  setLastReading({ type:'Astros', title, text, items:cards.map(card => ({ kind:'astro', name:`${card.title}: ${card.planet.name}`, subtitle:`${card.sign} · ${card.element}`, image:'', symbol:card.symbol, position:card.title })), meta:{ name:data.name, birthDate:data.date, birthTime:data.time, birthPlace:data.place, intention:data.intention, houseSystem:data.houseSystem, astro:chart, astroToday:todayChart } });
  let ai = '';
  if (localStorage.getItem(LS.puter) === 'true') {
    mostrarPensando();
    ai = cleanClosedReading(await askAI(`Amplía esta tirada astral diaria de forma simbólica, clara y cerrada. No pidas más datos, no formules preguntas al final, no hagas predicciones absolutas y no des consejos médicos, legales ni financieros. Usa solo estas posiciones y esta intención; no menciones ninguna app externa ni marca ajena.

${text}`, { prefix:readingPersonalPrefix(lastReading) }));
    ocultarPensando();
    if (ai) {
      lastReading.ai = ai;
      text = `${text}\n\nInterpretación IA:\n${ai}`;
    }
  }
  openModal({ icon:'☉', title, subtitle:`${today} · ${data.intention || 'Claridad'}`, body:`
    <div class="astro-grid">
      ${astroWheelHTML(todayChart)}
      <div><div class="astro-day-grid">${cards.map(card => `<article class="astro-day-card"><span class="astro-symbol" aria-hidden="true">${card.symbol}</span><strong>${escapeHTML(card.title)}</strong><p>${escapeHTML(card.planet.name)} en ${escapeHTML(card.sign)}</p><small>${escapeHTML(card.text)}.</small></article>`).join('')}</div>${astroEngineNoticeHTML(todayChart)}</div>
    </div>
    <div class="result-card mt"><h3>${escapeHTML(t('stSintesisAstral'))}</h3><p>${escapeHTML(cleanInterpretation(text)).replace(/\n/g,'<br>')}</p>${readingActions(lastReading.text,'Astros')}</div>` });
}

async function loadGrabovoi() {
  if (grabovoiEntries.length) return grabovoiEntries;
  try {
    const res = await fetch('grabovoi_db.json');
    const data = await res.json();
    grabovoiGuide = {
      digitMeanings:Object.fromEntries((data.significado_numeros || []).map(item => [String(item.numero), item.significado])),
      methods:(data.metodos_concentracion || []).map(method => ({ name:method.nombre, description:method.descripcion }))
    };
    const entries = [];
    const pushGrabEntry = (item, key, nestedCode = '') => {
      const codigo = nestedCode || item.codigo || item.code || '';
      if (!codigo) return;
      entries.push({
        nombre: item.nombre || item.name || 'Código',
        codigo,
        categoria: item.categoria || item.sistema || key,
        uso: item.uso || item.descripcion || item.texto_completo || item.subcategoria || 'Uso simbólico de concentración.',
        /* De que lista viene. El filtro sanitario miraba solo palabras
           clave en el texto y se le colaban entradas como VIH o ebola,
           que traen su propio nombre clinico sin ninguna de esas voces. */
        origen: key
      });
    };
    for (const key of ['enfermedades','situaciones_personales','codigos_adicionales']) {
      (data[key] || []).forEach(item => pushGrabEntry(item, key));
    }
    for (const key of ['protocolos','pilotajes_especificos']) {
      (data[key] || []).forEach(item => {
        (item.codigos || []).forEach(code => pushGrabEntry(item, key, code));
      });
    }
    grabovoiEntries = entries.filter(e => e.codigo);
  } catch { grabovoiEntries = []; }
  return grabovoiEntries;
}
function normalizeGrabovoiSearch(value = '') {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function findGrabovoiManualMatch(query = '') {
  const normalized = normalizeGrabovoiSearch(query);
  const requestedCode = String(query).match(/\b[\d_]{3,}\b/)?.[0]?.replace(/_+/g, '') || '';
  if (requestedCode) {
    const exact = grabovoiEntries.find(entry => String(entry.codigo || '').replace(/\D/g, '') === requestedCode);
    if (exact) return exact;
  }
  const stop = new Set(['grabovoi','codigo','numero','para','quiero','busca','buscar','necesito','dame','cual','que','del','una','uno','por','favor']);
  const terms = normalized.split(' ').filter(term => term.length > 2 && !stop.has(term));
  if (!terms.length) return null;
  const scored = grabovoiEntries.map(entry => {
    const haystack = normalizeGrabovoiSearch(`${entry.nombre} ${entry.categoria} ${entry.uso}`);
    const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
    return { entry, score };
  }).sort((a,b) => b.score - a.score);
  return scored[0]?.score >= Math.min(2, terms.length) ? scored[0].entry : null;
}
function externalGrabovoiSearchURL(query = '') {
  return `https://duckduckgo.com/?q=${encodeURIComponent(`Grabovoi ${query}`)}`;
}
function extractExternalGrabovoiCode(text = '') {
  const labelled = String(text).match(/C[ÓO]DIGO\s*:\s*([0-9][0-9_\s]{2,})/i)?.[1];
  return labelled?.trim().replace(/\s+/g, '_') || '';
}
function externalSourceLinks(text = '') {
  const matches = String(text).match(/https?:\/\/[^\s<>()]+/g) || [];
  return [...new Set(matches.map(url => url.replace(/[\].,;]+$/, '')))].slice(0, 3);
}
async function searchExternalGrabovoi(query = '') {
  if (!window.puter?.ai?.chat || localStorage.getItem(LS.puter) !== 'true') return null;
  try {
    const result = await window.puter.ai.chat(`${aiLanguageInstruction()}Busca en la web una secuencia atribuida a Grabovoi relacionada con esta consulta: "${query}".

El manual local de la aplicación NO contiene una coincidencia. No inventes ninguna secuencia.
Solo responde ENCONTRADO si una o más páginas públicas muestran explícitamente el mismo número asociado al tema.
Usa exactamente este formato y conserva las etiquetas ESTADO, TEMA, CÓDIGO, DESCRIPCIÓN y FUENTES para que la aplicación pueda leerlo:
ESTADO: ENCONTRADO o NO_ENCONTRADO
TEMA: texto breve en ${aiLanguageName()}
CÓDIGO: secuencia o vacío
DESCRIPCIÓN: qué afirman las fuentes, en ${aiLanguageName()}, sin presentarlo como hecho médico ni promesa
FUENTES:
- URL completa
- URL completa

Incluye entre una y tres fuentes con URL completa. Si las fuentes discrepan, dilo.`, {
      tools:[{ type:'web_search' }],
      temperature:0.1
    });
    const content = result?.message?.content;
    const text = Array.isArray(content)
      ? content.map(part => part?.text || part?.content || '').filter(Boolean).join('\n')
      : content || result?.text || String(result || '');
    return cleanInterpretation(text);
  } catch (error) {
    pushErrorLog('grabovoi-web-search', error?.message || error, query);
    return null;
  }
}
async function handleChatGrabovoi(query = '') {
  await loadGrabovoi();
  const manualEntry = findGrabovoiManualMatch(query);
  if (manualEntry) {
    const index = grabovoiEntries.indexOf(manualEntry);
    addChat('oracle', `Encontré una coincidencia en el manual incluido:\n${manualEntry.codigo} · ${manualEntry.nombre}\n${manualEntry.uso}`, `<div class="actions mt"><button class="btn compact" data-grab-index="${index}">📜 Abrir ficha del manual</button></div>`);
    return;
  }
  addChat('oracle', 'No aparece una coincidencia clara en el manual incluido. Voy a comprobar fuentes públicas en internet sin añadir el resultado a la base oficial.');
  const result = await searchExternalGrabovoi(query);
  const found = result && /ESTADO\s*:\s*ENCONTRADO/i.test(result);
  const sources = externalSourceLinks(result || '');
  if (!found || !sources.length) {
    const url = externalGrabovoiSearchURL(query);
    addChat('oracle', 'No he encontrado un resultado externo suficientemente verificable con fuentes. No voy a inventar una secuencia.', `<div class="actions mt"><a class="btn compact" href="${escapeHTML(url)}" target="_blank" rel="noopener">🌐 Abrir búsqueda externa</a>${localStorage.getItem(LS.puter) !== 'true' ? '<button class="btn compact" data-act="connect-ai">🤖 Conectar búsqueda IA</button>' : ''}</div>`);
    return;
  }
  const code = extractExternalGrabovoiCode(result);
  const sourceButtons = sources.map((url, index) => `<a class="btn compact" href="${escapeHTML(url)}" target="_blank" rel="noopener">Fuente ${index + 1}</a>`).join('');
  const warning = `RESULTADO EXTERNO: este número no pertenece al manual incluido y no ha sido validado por Oráculo Místico.\n\n${result}`;
  if (code) {
    setLastReading({
      type:'Grabovoi',
      title:'Código Grabovoi externo',
      text:warning,
      items:[],
      meta:{ grabovoiCode:code, grabovoiPurpose:'Resultado localizado en fuentes externas', grabovoiCategory:'Fuente externa', external:true, sources }
    });
  }
  addChat('oracle', warning, `<div class="actions mt">${sourceButtons}${code ? '<button class="btn compact" data-act="pdf-options">📄 PDF con aviso externo</button>' : ''}</div>`);
}
/* ============================================================
   Grabovoi: seleccion multiple y PDF conjunto
   Antes solo se podia abrir una ficha, y el PDF conjunto exigia
   haber creado antes una lectura numerologica. Ahora se marcan
   varias secuencias aqui mismo y se exportan juntas.
   La seleccion vive en un Set de codigos, no en el DOM: asi
   buscar o cambiar de categoria no borra lo ya marcado.
   ============================================================ */
const GRAB_MAX = 12;
const GRAB_INITIAL_LIMIT = 60;
const GRAB_INCREMENT = 120;
/* La clave es el indice en el catalogo, no el codigo: 23 codigos
   estan repetidos en hasta 4 entradas distintas (varias formas de
   nombrar el mismo numero), y marcando una se arrastraban todas. */
const grabSeleccion = new Set();
let grabCategoria = '';
let grabConsulta = '';
let grabVisibleLimit = GRAB_INITIAL_LIMIT;

/* El catalogo completo del JSON. Las sanitarias se muestran
   marcadas y con aviso reforzado, pero no se ocultan: ya eran
   visibles en el navegador general del modulo. */
/* Etiqueta visible de una categoria Grabovoi. El valor original de la
   base de datos se conserva como clave interna: por el se filtra y
   viaja dentro de las lecturas ya guardadas. */
function grabCatLabel(cat) {
  if (!cat) return '';
  const clave = 'gbc' + String(cat)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/ /g, '');
  const v = t(clave);
  if (v && v !== clave) return v;
  return String(cat).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function grabDisponibles() {
  return grabovoiEntries;
}

function grabCategorias() {
  return [...new Set(grabDisponibles().map(e => e.categoria).filter(Boolean))].sort();
}

function grabFiltradas() {
  const q = normalizeGrabovoiSearch(grabConsulta);
  const terminos = q ? q.split(' ').filter(Boolean) : [];
  return grabDisponibles().filter(e => {
    if (grabCategoria && e.categoria !== grabCategoria) return false;
    if (!terminos.length) return true;
    const heno = normalizeGrabovoiSearch(`${e.codigo} ${e.nombre} ${e.categoria} ${e.uso}`);
    return terminos.every(t => heno.includes(t));
  });
}

function grabVisibles(list = grabFiltradas()) {
  return list.slice(0, Math.min(grabVisibleLimit, list.length));
}

/* ¿Hay alguna secuencia sanitaria entre las marcadas? */
function grabHaySalud() {
  return grabSeleccionadas().some(isHealthGrabovoiEntry);
}

function grabTextoContador() {
  const n = grabSeleccion.size;
  if (!n) return t('gbNone');
  return n === 1 ? t('gbCountOne') : t('gbCount', { n });
}

function grabTextoResultados() {
  const list = grabFiltradas();
  return t('gbShownAll', { shown: grabVisibles(list).length, total: list.length });
}

function renderGrabChips() {
  const cats = grabCategorias();
  const chip = (valor, etiqueta) =>
    `<button class="tab${grabCategoria === valor ? ' active' : ''}" data-grab-cat="${escapeHTML(valor)}" type="button">${escapeHTML(etiqueta)}</button>`;
  return `<div class="tabs mt grabovoi-cats">${chip('', t('gbAllCats'))}${cats.map(c => chip(c, grabCatLabel(c))).join('')}</div>`;
}

function renderGrabList(list) {
  if (!list || !list.length) return `<p class="subtle">${escapeHTML(t('gbNoResults'))}</p>`;
  return list.map(e => {
    const idx = grabovoiEntries.indexOf(e);
    const marcada = grabSeleccion.has(idx);
    const salud = isHealthGrabovoiEntry(e);
    return `<div class="grabovoi-fila${marcada ? ' marcada' : ''}">
      <label class="grabovoi-marca">
        <input type="checkbox" data-grab-pick="${idx}" ${marcada ? 'checked' : ''}>
        <span class="sr-only">${escapeHTML(t('gbPick'))}</span>
      </label>
      <button class="choice grabovoi-ficha${salud ? ' es-salud' : ''}" data-grab-index="${idx}" type="button">
        <strong>${escapeHTML(e.codigo)} · ${escapeHTML(e.nombre)}</strong>
        <small>${escapeHTML(grabCatLabel(e.categoria) || t('gbSeq'))}${salud ? ` · <em class="grabovoi-salud">${escapeHTML(t('gbHealthTag'))}</em>` : ''}</small>
      </button>
    </div>`;
  }).join('');
}

function refrescarGrabList() {
  const filtradas = grabFiltradas();
  const visibles = grabVisibles(filtradas);
  const caja = $('#grabList');
  if (caja) caja.innerHTML = renderGrabList(visibles);
  const resultados = $('#grabResultsCount');
  if (resultados) resultados.textContent = t('gbShownAll', { shown: visibles.length, total: filtradas.length });
  const more = $('#grabMoreBar');
  if (more) more.hidden = visibles.length >= filtradas.length;
  const cont = $('#grabCount');
  if (cont) cont.textContent = grabTextoContador();
  const boton = $('#grabPdfBtn');
  if (boton) boton.disabled = grabSeleccion.size === 0;
  const avisoSalud = $('#grabHealthChip');
  if (avisoSalud) avisoSalud.hidden = !grabHaySalud();
  const chips = $('.grabovoi-cats');
  if (chips) chips.outerHTML = renderGrabChips();
}

function grabovoiPanelHTML() {
  const inicial = grabFiltradas();
  const visibles = grabVisibles(inicial);
  return `
    <p class="notice">${escapeHTML(t('gbNotice'))}</p>
    <div class="field mt"><label>${escapeHTML(t('gbSearch'))}</label>${inputWithMic('grabSearch', `placeholder="${escapeHTML(t('gbSearchPh'))}"`)}</div>
    ${renderGrabChips()}
    <div class="grabovoi-barra mt">
      <span id="grabCount" class="chip" aria-live="polite">${escapeHTML(grabTextoContador())}</span>
      <span id="grabHealthChip" class="chip grabovoi-chip-salud"${grabHaySalud() ? '' : ' hidden'}>⚕ ${escapeHTML(t('gbHealthShort'))}</span>
      <button class="btn compact" data-act="grab-clear" type="button">${escapeHTML(t('gbClear'))}</button>
      <button class="btn primary compact" id="grabPdfBtn" data-act="grab-pdf" type="button" ${grabSeleccion.size ? '' : 'disabled'}>📄 ${escapeHTML(t('gbMakePdf'))}</button>
    </div>
    <p id="grabResultsCount" class="subtle">${escapeHTML(t('gbShownAll', { shown: visibles.length, total: inicial.length }))}</p>
    <p class="subtle">${escapeHTML(t('gbMax', { n: GRAB_MAX }))}</p>
    <div id="grabList" class="diary-list mt">${renderGrabList(visibles)}</div>
    <div id="grabMoreBar" class="grabovoi-more actions mt" ${visibles.length >= inicial.length ? 'hidden' : ''}>
      <button class="btn compact" data-act="grab-more" type="button">${escapeHTML(t('gbShowMore'))}</button>
      <button class="btn compact" data-act="grab-all" type="button">${escapeHTML(t('gbShowAll'))}</button>
    </div>`;
}

async function showGrabovoi() {
  grabConsulta = '';
  grabCategoria = '';
  grabVisibleLimit = GRAB_INITIAL_LIMIT;
  openModal({ icon:'📜', title:t('gbTitle'), subtitle:t('gbSub'), body:`<p class="notice">${escapeHTML(t('bLoading'))}</p>` });
  try {
    await loadGrabovoi();
    const body = $('#modalRoot .modal-body');
    if (body) body.innerHTML = grabovoiPanelHTML();
  } catch (error) {
    pushErrorLog('grabovoi-open', error?.message || error, 'open module');
    const body = $('#modalRoot .modal-body');
    if (body) body.innerHTML = `<p class="notice">No se pudo abrir Grabovoi. Prueba a recargar la app desde Ajustes.</p><div class="actions mt"><button class="btn compact" data-close-modal type="button">${escapeHTML(t('closed'))}</button></div>`;
  }
}

/** Las secuencias marcadas, en el orden del catalogo. */
function grabSeleccionadas() {
  return [...grabSeleccion]
    .map(i => grabovoiEntries[i])
    .filter(Boolean)
    .slice(0, GRAB_MAX);
}

/** Texto del PDF conjunto. Funciona sin lectura numerologica previa. */
function buildGrabovoiSheetText(entries = []) {
  const bloques = entries.map((entry, i) => {
    const guia = buildGrabovoiInterpretation(entry);
    return `${i + 1}. ${entry.nombre}
${t('gbCode')}: ${guia.code}
${t('gbCat')}: ${grabCatLabel(entry.categoria) || '—'}
${t('gbPurpose')}: ${entry.uso || t('gbSeq')}
${t('gbMethod')}: ${guia.method.name}
${guia.method.description}
${t('gbPractice')}:
${guia.steps.slice(0, 5).map((paso, j) => `  ${j + 1}. ${paso}`).join('\n')}`;
  }).join('\n\n');
  return `${t('gbSheet').toUpperCase()}
${t('gbSheetSub', { n: entries.length })}

${bloques}

${t('gbSheetNote')}${entries.some(isHealthGrabovoiEntry) ? `

${t('gbHealthWarn')}` : ''}`;
}

function exportGrabovoiSheetPDF() {
  const entries = grabSeleccionadas();
  if (!entries.length) return toast(t('gbPickSome'));
  const texto = buildGrabovoiSheetText(entries);
  const titulo = `${t('gbSheet')} · ${entries.length}`;
  const lectura = {
    type: 'Grabovoi',
    title: titulo,
    text: texto,
    items: [],
    meta: {
      grabovoiSelections: entries.map(e => ({ nombre:e.nombre, codigo:e.codigo, categoria:e.categoria || '', uso:e.uso || '' }))
    },
    date: new Date().toISOString()
  };
  setLastReading(lectura);
  exportPDF(titulo, texto, lectura);
}

function buildGrabovoiInterpretation(entry) {
  const code = String(entry.codigo || '').trim();
  const digits = code.match(/\d/g) || [];
  const groups = code.split(/[_+\s]+/).filter(Boolean);
  const counts = digits.reduce((map, digit) => ({ ...map, [digit]:(map[digit] || 0) + 1 }), {});
  const digitAnalysis = Object.keys(counts).sort().map(digit => ({
    digit,
    count:counts[digit],
    meaning:grabovoiGuide.digitMeanings[digit] || t('gbDigitFallback')
  }));
  const category = String(entry.categoria || '').toLowerCase();
  const isHealth = /salud|cardio|músculo|musculo|autoinmune|oncol|metab|psicol|enfermedad|físic|fisic/.test(category);
  const method = /tiempo|pasado|futuro/.test(category)
    ? { name:t('gbMethodLight'), description:t('gbMethodLightD') }
    : /amor|pareja|relaci/.test(`${category} ${entry.nombre}`)
      ? { name:t('gbMethodHarmony'), description:t('gbMethodHarmonyD') }
      : { name:t('gbMethodSphere'), description:t('gbMethodSphereD') };
  const groupText = groups.length > 1 ? groups.join(' · ') : t('gbContinuous');
  const digitText = digitAnalysis.map(item => `${item.digit} (${item.count}): ${item.meaning}`).join('\n');
  const steps = [
    t('gbStep1', { focus: entry.nombre }),
    t('gbStep2', { blocks: groupText }),
    t('gbStep3', { code }),
    method.description,
    t('gbStep5'),
    t('gbStep6')
  ];
  const text = `${entry.nombre}

Código: ${code}
Categoría: ${entry.categoria || 'General'}
Finalidad declarada en la base: ${entry.uso}

Estructura:
${groups.length} bloque${groups.length === 1 ? '' : 's'}: ${groupText}
${digits.length} dígitos numéricos.

Lectura simbólica de los dígitos:
${digitText || 'La secuencia contiene letras o fórmulas y debe conservarse exactamente como está escrita.'}

Método sugerido: ${method.name}
${steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

Consejo:
Usa la secuencia como ejercicio de atención y organización de una intención concreta. No es una predicción ni una garantía.${isHealth ? ' En temas de salud, no sustituye diagnóstico, tratamiento ni atención médica.' : ''}`;
  return { code, groups, digitAnalysis, method, steps, isHealth, text };
}
/* Toda la lista 'enfermedades' es sanitaria por definicion: se descarta
   por procedencia y no por como este redactado el nombre. La regex se
   mantiene para lo que aparezca en las otras listas. */
function isHealthGrabovoiEntry(entry = {}) {
  if (entry.origen === 'enfermedades') return true;
  return /salud|cardio|músculo|musculo|autoinmune|oncol|metab|psicol|enfermedad|físic|fisic|arter|artr|dolor|sangre|hueso|infecc|virus|bacteri|tumor|cancer|cáncer|diabet|hepat|renal|pulmon|neumon|herpes|vih|sida|anemia|leucem|tiroid|gastr|derma|curar|curaci|sanaci|regenera/i
    .test(`${entry.categoria || ''} ${entry.nombre || ''} ${entry.uso || ''}`);
}
function grabovoiPdfCandidates(reading = lastReading, query = '') {
  const normalized = normalizeGrabovoiSearch(query);
  if (normalized) {
    const terms = normalized.split(' ').filter(Boolean);
    return grabovoiEntries.filter(entry => {
      const haystack = normalizeGrabovoiSearch(`${entry.codigo} ${entry.nombre} ${entry.categoria} ${entry.uso}`);
      return terms.every(term => haystack.includes(term));
    });
  }
  const meta = reading?.meta || {};
  const numbers = meta.numbers || {};
  const roots = [numbers.life, numbers.expression, numbers.soul, numbers.personality, numbers.personalYear].map(numRoot).filter(Boolean);
  const focusByNumber = {
    1:['iniciativa','éxito','resultados','realidad'],
    2:['amor','armonía','relación','calma'],
    3:['creatividad','alegría','expresión','comunicación'],
    4:['estabilidad','trabajo','orden','protección'],
    5:['cambio','movimiento','libertad','energía'],
    6:['amor','familia','armonía','bienestar'],
    7:['claridad','intuición','concentración','protección'],
    8:['abundancia','éxito','dinero','realidad'],
    9:['paz','perdón','armonía','protección']
  };
  const terms = [...new Set(roots.flatMap(root => focusByNumber[root] || []))];
  return grabovoiEntries
    .map(entry => {
      const haystack = normalizeGrabovoiSearch(`${entry.codigo} ${entry.nombre} ${entry.categoria} ${entry.uso}`);
      const score = terms.reduce((total, term) => total + (haystack.includes(normalizeGrabovoiSearch(term)) ? 1 : 0), 0);
      return { entry, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.entry)
    .slice(0, 36);
}
function renderGrabovoiPdfList(list = []) {
  return list.map(entry => {
    const index = grabovoiEntries.indexOf(entry);
    const salud = isHealthGrabovoiEntry(entry);
    return `<label class="choice grabovoi-pdf-choice${salud ? ' es-salud' : ''}">
      <input type="checkbox" data-grab-pdf-index="${index}">
      <span><strong>${escapeHTML(entry.codigo)} · ${escapeHTML(entry.nombre)}</strong><small>${escapeHTML(grabCatLabel(entry.categoria) || entry.uso || t('gbSeq'))}${salud ? ` · <em class="grabovoi-salud">${escapeHTML(t('gbHealthTag'))}</em>` : ''}</small></span>
    </label>`;
  }).join('\n') || `<p class="subtle">${escapeHTML(t('gbPdfNone'))}</p>`;
}
async function showNumerologyGrabovoiPdfPicker() {
  if (!isNumerologyReading()) return toast(t('tsNeedNum'));
  await loadGrabovoi();
  const subject = getReadingSubjectName();
  const candidates = grabovoiPdfCandidates(lastReading);
  openModal({ icon:'📜', title:t('gbPdfTitle'), subtitle:subject ? `${t('lblFor')} ${subject}` : t('gbPdfPick'), body:`
    <p class="notice">${escapeHTML(t('gbPdfNotice'))}</p>
    <div class="field mt"><label>${escapeHTML(t('gbPdfSearch'))}</label>${inputWithMic('grabPdfSearch', `placeholder="${escapeHTML(t('gbPdfSearchPh'))}"`)}</div>
    <div id="grabPdfList" class="diary-list mt">${renderGrabovoiPdfList(candidates.length ? candidates : grabovoiEntries.slice(0, 36))}</div>
    <div class="actions mt"><button class="btn primary" data-act="export-numerology-grabovoi-pdf" type="button">${escapeHTML(t('gbPdfGo'))}</button><button class="btn" data-act="pdf-options" type="button">${escapeHTML(t('gbBack'))}</button></div>` });
}
function selectedGrabovoiPdfEntries() {
  return $$('[data-grab-pdf-index]:checked')
    .map(input => grabovoiEntries[Number(input.dataset.grabPdfIndex)])
    .filter(Boolean)
    .slice(0, 12);
}
function buildNumerologyGrabovoiText(reading = lastReading, entries = []) {
  const subject = getReadingSubjectName(reading);
  const blocks = entries.map((entry, index) => {
    const guide = buildGrabovoiInterpretation(entry);
    return `Secuencia ${index + 1}: ${entry.nombre}
Código: ${guide.code}
Categoría: ${entry.categoria || 'General'}
Finalidad: ${entry.uso || 'Uso simbólico de concentración.'}
Método sugerido: ${guide.method.name}
${guide.method.description}
Práctica breve:
${guide.steps.slice(0, 5).map((step, stepIndex) => `${stepIndex + 1}. ${step}`).join('\n')}`;
  }).join('\n\n');
  return `${reading.text}

SECUENCIAS GRABOVOI SELECCIONADAS${subject ? ` · ${subject}` : ''}

${blocks}

${t('gbSheetNote')}${entries.some(isHealthGrabovoiEntry) ? `

${t('gbHealthWarn')}` : ''}`;
}
function exportNumerologyGrabovoiPDFFromSelection() {
  if (!isNumerologyReading()) return toast(t('tsNeedNum'));
  const entries = selectedGrabovoiPdfEntries();
  if (!entries.length) return toast(t('tsPickGrab'));
  const combinedReading = {
    ...lastReading,
    type:'Numerología · Grabovoi',
    title:`${lastReading.title} · Grabovoi`,
    text:buildNumerologyGrabovoiText(lastReading, entries),
    meta:{
      ...(lastReading.meta || {}),
      grabovoiSelections:entries.map(entry => ({
        nombre:entry.nombre,
        codigo:entry.codigo,
        categoria:entry.categoria || '',
        uso:entry.uso || ''
      }))
    }
  };
  exportPDF(combinedReading.title, combinedReading.text, combinedReading);
}
function grabovoiActions() {
  return `<div class="actions mt reading-actions">
    <button class="btn compact" data-act="speak-reading" type="button">🔊 Escuchar guía</button>
    <button class="btn compact" data-act="download-reading-mp3" type="button">🎧 Descargar MP3</button>
    <button class="btn compact" data-act="ai-reading" type="button">🤖 Ampliar código</button>
    <button class="btn compact" data-act="save-reading" type="button">⭐ Guardar</button>
    <button class="btn compact" data-act="copy-reading" type="button">📋 Copiar</button>
    <button class="btn compact" data-act="pdf-options" type="button">📄 PDF</button>
  </div><div id="aiReadingPanel" class="ai-reading-panel hidden" aria-live="polite"></div>`;
}
function showGrabDetail(e) {
  const guide = buildGrabovoiInterpretation(e);
  setLastReading({ type:'Grabovoi', title:e.nombre, text:guide.text, items:[], meta:{ grabovoiCode:e.codigo, grabovoiPurpose:e.uso, grabovoiCategory:e.categoria } });
  openModal({ icon:'📜', title:e.nombre, subtitle:e.categoria || 'Código simbólico', body:`
    <div class="result-card center grabovoi-code-card">
      <div class="grabovoi-code">${escapeHTML(e.codigo)}</div>
      <p><strong>${escapeHTML(t('gbPurpose'))}:</strong> ${escapeHTML(e.uso || t('gbUseDefault'))}</p>
    </div>
    <div class="panel-grid mt">
      <div class="result-card"><h3>${escapeHTML(t('gbStructure'))}</h3><p>${escapeHTML(guide.groups.length === 1 ? t('gbBlock1') : t('gbBlocks', { n: guide.groups.length }))}: <strong>${escapeHTML(guide.groups.join(' · '))}</strong></p><p>${guide.code.match(/\d/g)?.length || 0} dígitos numéricos.</p></div>
      <div class="result-card"><h3>${escapeHTML(guide.method.name)}</h3><p>${escapeHTML(guide.method.description)}</p></div>
    </div>
    <div class="result-card mt"><h3>${escapeHTML(t('gbDigitMeaning'))}</h3>
      <div class="grabovoi-digit-grid">${guide.digitAnalysis.map(item => `<div><strong>${item.digit}${item.count > 1 ? ` ×${item.count}` : ''}</strong><span>${escapeHTML(item.meaning)}</span></div>`).join('') || `<p>${escapeHTML(t('stConservaLasLetrasYSimbolosExactamente'))}</p>`}</div>
    </div>
    <div class="result-card mt"><h3>${escapeHTML(t('gbHowTo'))}</h3><ol class="grabovoi-steps">${guide.steps.map(step => `<li>${escapeHTML(step)}</li>`).join('')}</ol></div>
    <p class="notice mt">${escapeHTML(guide.isHealth ? t('gbNoticeHealth') : t('gbNoticePlain'))}</p>
    ${grabovoiActions()}` });
  setTimeout(refreshDeviceVoiceSelect, 100);
}

function showBiblioteca(filter = 'all') {
  const diary = storeGet(LS.diary, []);
  const q = ($('#diarySearch')?.value || '').toLowerCase().trim();
  const types = ['all','favorites','Tarot','Runas','Sueños','Luna','Astros','Numerología','Grabovoi','Mensaje del día'];
  let list = diary;
  if (filter === 'favorites') list = list.filter(d => d.favorite);
  else if (filter !== 'all') list = list.filter(d => String(d.type || '').toLowerCase().includes(filter.toLowerCase()));
  if (q) list = list.filter(d => `${d.title} ${d.type} ${d.text} ${d.note || ''}`.toLowerCase().includes(q));
  openModal({ icon:'📚', title:t('mdBibMistica'), subtitle:`${list.length} de ${diary.length} lecturas guardadas.`, body:`
    <div class="om-3d-stage om-modal-3d" data-oraculo-3d-asset="library" aria-label="Biblioteca Arcana"></div>
    <div class="form-grid"><div class="field"><label>${escapeHTML(t('stBuscarEnElDiario'))}</label><input class="input" id="diarySearch" value="${escapeHTML(q)}" placeholder="Buscar por carta, runa, tema o nota..."></div><div class="field"><label>${escapeHTML(t('stFiltrarTipo'))}</label><select id="diaryFilter">${types.map(t=>`<option value="${escapeHTML(t)}" ${t===filter?'selected':''}>${t==='all'?'Todo':t==='favorites'?'Favoritas':escapeHTML(t)}</option>`).join('')}</select></div></div>
    <div class="actions mt"><button class="btn" data-act="refresh-diary">Aplicar filtro</button><button class="btn" data-act="export-diary">Exportar texto</button><button class="btn" data-act="export-diary-pdf">Crear PDF</button><button class="btn" data-act="backup-data">Copia de seguridad</button><button class="btn danger" data-act="clear-diary">Vaciar biblioteca</button></div>
    <div class="diary-list mt">${list.map(item=>`<article class="diary-item ${item.favorite?'favorite':''}"><div class="split"><h3>${item.favorite?'⭐ ':''}${escapeHTML(item.title)}</h3><small>${new Date(item.date || Date.now()).toLocaleDateString()}</small></div><small class="pill">${escapeHTML(item.type || 'Lectura')}</small>${item.note ? `<p class="diary-note"><strong>${escapeHTML(t('stNota'))}</strong> ${escapeHTML(item.note)}</p>` : ''}<p>${escapeHTML(clampText(item.text,260))}</p><div class="actions mt"><button class="btn compact" data-fav-diary="${item.id}">${item.favorite?'Quitar ⭐':'Favorita ⭐'}</button><button class="btn compact" data-note-diary="${item.id}">Nota</button><button class="btn compact" data-copy-diary="${item.id}">Copiar</button><button class="btn compact" data-delete-diary="${item.id}">Borrar</button></div></article>`).join('\n\n') || `<p class="subtle">${escapeHTML(t('stTodaviaNoHayLecturasGuardadasCon'))}</p>`}</div>` });
}

function showSettings() {
  const name = escapeHTML(localStorage.getItem(LS.name) || '');
  const prefs = storeGet(LS.prefs, {});
  const voice = getVoicePrefs();
  const ceremony = getCeremonyPrefs();
  const effects3d = get3dPreference();
  openModal({ icon:'⚙️', title:t('mdAjustes'), subtitle:t('mdAjustesS'), body:`
    <div class="settings-stack">
    <details class="settings-section" open>
    <summary>${escapeHTML(t('stPerfilEIa'))}</summary>
    <div class="settings-section-content">
    <div class="form-grid">
      <div class="field"><label>${escapeHTML(t('appLanguage'))}</label><select id="appLanguage">${languageOptionsHTML()}</select><small>${escapeHTML(t('languageHelp'))}</small></div>
      <div class="field"><label>${escapeHTML(t('stNombreOpcional'))}</label>${inputWithMic('settingsName', `value="${name}" placeholder="Tu nombre"`)}</div>
      <div class="field"><label>${escapeHTML(t('stEstadoIa'))}</label><input class="input" value="${localStorage.getItem(LS.puter)==='true'?'Conectada':'Modo simbólico'}" readonly></div>
      <div class="field"><label>${escapeHTML(t('stTipoDeLecturaIa'))}</label><select id="aiStyle"><option value="mistica" ${getAIStyle() === 'mistica' ? 'selected' : ''}>${escapeHTML(t('stMistica'))}</option><option value="razonable" ${getAIStyle() === 'razonable' ? 'selected' : ''}>${escapeHTML(t('stRazonable'))}</option><option value="corta" ${getAIStyle() === 'corta' ? 'selected' : ''}>${escapeHTML(t('stCorta'))}</option><option value="profunda" ${getAIStyle() === 'profunda' ? 'selected' : ''}>${escapeHTML(t('stProfunda'))}</option><option value="directa" ${getAIStyle() === 'directa' ? 'selected' : ''}>${escapeHTML(t('stDirecta'))}</option><option value="amorosa" ${getAIStyle() === 'amorosa' ? 'selected' : ''}>${escapeHTML(t('stAmorosa'))}</option></select></div>
    </div><p class="notice mt">${escapeHTML(t('internationalNote'))}</p></div></details>

    <details class="settings-section">
    <summary>${escapeHTML(t('stVozYLectura'))}</summary>
    <div class="settings-section-content">
    <div class="form-grid">
      <div class="field"><label>${escapeHTML(t('stMotorDeVoz'))}</label><select id="voiceEngine"><option value="device" ${voice.engine === 'device' ? 'selected' : ''}>${escapeHTML(t('stTtsDelSistemaSinPuter'))}</option><option value="auto" ${voice.engine === 'auto' ? 'selected' : ''}>${escapeHTML(t('stAutomaticoIaSiEstaConectada'))}</option><option value="puter" ${voice.engine === 'puter' ? 'selected' : ''}>${escapeHTML(t('stVozIaNaturalMediantePuter'))}</option></select></div>
      <div class="field"><label>${escapeHTML(t('stVozIaRemota'))}</label><select id="remoteVoice"><option value="coral" ${voice.remoteVoice === 'coral' ? 'selected' : ''}>${escapeHTML(t('stCoralFemeninaCalida'))}</option><option value="sage" ${voice.remoteVoice === 'sage' ? 'selected' : ''}>${escapeHTML(t('stSageFemeninaSerena'))}</option><option value="onyx" ${voice.remoteVoice === 'onyx' ? 'selected' : ''}>${escapeHTML(t('stOnyxMasculinaProfunda'))}</option><option value="ash" ${voice.remoteVoice === 'ash' ? 'selected' : ''}>${escapeHTML(t('stAshMasculinaNatural'))}</option></select></div>
      <div class="field"><label>${escapeHTML(t('stCatalogoDelSistema'))}</label><select id="voiceFilter"><option value="all" ${(voice.voiceFilter || 'all') === 'all' ? 'selected' : ''}>${escapeHTML(t('stTodasLasVocesVisibles'))}</option><option value="spanish" ${voice.voiceFilter === 'spanish' ? 'selected' : ''}>${escapeHTML(t('stSoloVocesEspanolas'))}</option></select></div>
      <div class="field"><label>${escapeHTML(t('stIdiomaDeVoz'))}</label><select id="voiceLanguage">${getVoiceLanguageOptionsHTML(voice.language || 'auto')}</select></div>
      <div class="field"><label>${escapeHTML(t('stVozConcretaDelDispositivo'))}</label><select id="deviceVoiceURI">${getDeviceVoiceOptionsHTML(voice.deviceVoiceURI || '')}</select></div>
      <div class="field"><label>${escapeHTML(t('stVozMistica'))}</label><select id="voicePreset"><option value="mistica_femenina" ${voice.preset === 'mistica_femenina' ? 'selected' : ''}>${escapeHTML(t('stMisticaFemenina'))}</option><option value="guia_suave" ${voice.preset === 'guia_suave' ? 'selected' : ''}>${escapeHTML(t('stGuiaSuave'))}</option><option value="oraculo_neutro" ${voice.preset === 'oraculo_neutro' ? 'selected' : ''}>${escapeHTML(t('stOraculoNeutro'))}</option><option value="sabio_masculino" ${voice.preset === 'sabio_masculino' ? 'selected' : ''}>${escapeHTML(t('stSabioMasculino'))}</option><option value="guardian_profundo" ${voice.preset === 'guardian_profundo' ? 'selected' : ''}>${escapeHTML(t('stGuardianProfundo'))}</option><option value="lectura_rapida" ${voice.preset === 'lectura_rapida' ? 'selected' : ''}>${escapeHTML(t('stLecturaRapida'))}</option></select></div>
      <div class="field"><label>${escapeHTML(t('stVelocidadDeVoz'))}</label><select id="voiceRate"><option value="0.78" ${String(voice.rate) === '0.78' ? 'selected' : ''}>${escapeHTML(t('stCeremonial'))}</option><option value="0.88" ${String(voice.rate) === '0.88' ? 'selected' : ''}>${escapeHTML(t('stHumanaSuave'))}</option><option value="0.92" ${String(voice.rate) === '0.92' ? 'selected' : ''}>${escapeHTML(t('stNatural'))}</option><option value="1.04" ${String(voice.rate) === '1.04' ? 'selected' : ''}>${escapeHTML(t('stAgil'))}</option></select></div>
      <div class="field"><label>${escapeHTML(t('stPantallaDuranteLaVoz'))}</label><select id="keepScreenAwake"><option value="true" ${voice.keepScreenAwake !== false ? 'selected' : ''}>${escapeHTML(t('stMantenerEncendida'))}</option><option value="false" ${voice.keepScreenAwake === false ? 'selected' : ''}>${escapeHTML(t('stPermitirApagadoAutomatico'))}</option></select></div>
    </div>
    <p class="notice mt">“TTS del sistema” no necesita Puter ni conexión. La app mostrará todas las voces que Firefox, Chrome o Safari permitan consultar; el navegador puede ocultar algunas voces instaladas. El modo IA y el MP3 quedan como opciones adicionales.</p>
    </div></details>

    <details class="settings-section">
    <summary>${escapeHTML(t('stCeremonia'))}</summary>
    <div class="settings-section-content">
    <div class="form-grid">
      <div class="field"><label>${escapeHTML(t('stVelocidadDeRevelacion'))}</label><select id="ceremonySpeed"><option value="slow" ${ceremony.speed==='slow'?'selected':''}>${escapeHTML(t('stLentaCeremonial'))}</option><option value="normal" ${(ceremony.speed||'normal')==='normal'?'selected':''}>${escapeHTML(t('stNormal'))}</option><option value="fast" ${ceremony.speed==='fast'?'selected':''}>${escapeHTML(t('stRapida'))}</option></select></div>
      <div class="field"><label>${escapeHTML(t('sndTitle'))}</label><select id="ceremonySounds"><option value="false" ${!ceremony.sounds?'selected':''}>${escapeHTML(t('sndOff'))}</option><option value="true" ${ceremony.sounds?'selected':''}>${escapeHTML(t('sndOn'))}</option></select><small>${escapeHTML(t('sndHelp'))}</small></div>
      <div class="field"><label>${escapeHTML(t('sndVib'))}</label><select id="ceremonyVibration"><option value="false" ${!ceremony.vibration?'selected':''}>${escapeHTML(t('sndVibOff'))}</option><option value="true" ${ceremony.vibration?'selected':''}>${escapeHTML(t('sndVibOn'))}</option></select></div>
    </div></div></details>


    <details class="settings-section">
    <summary>${escapeHTML(t('stAvatarDelOraculo'))}</summary>
    <div class="settings-section-content">
    <div class="form-grid">
      <div class="field"><label>${escapeHTML(t('stEstiloDeAvatar'))}</label><select id="oracleAvatarStyle"><option value="auto" ${getVoicePrefs().avatarStyle==='auto'?'selected':''}>${escapeHTML(t('stAutomaticoSegunVoz'))}</option><option value="female" ${getVoicePrefs().avatarStyle==='female'?'selected':''}>${escapeHTML(t('stChicaOraculo'))}</option><option value="male" ${getVoicePrefs().avatarStyle==='male'?'selected':''}>${escapeHTML(t('stChicoOraculo'))}</option></select></div>
      <div class="field"><label>${escapeHTML(t('stModeloAvatar'))}</label><select id="oracleAvatarRenderMode"><option value="auto" ${(voice.avatarRenderMode || 'auto')==='auto'?'selected':''}>${escapeHTML(t('stAvatarAuto3d'))}</option><option value="2d" ${voice.avatarRenderMode==='2d'?'selected':''}>${escapeHTML(t('stAvatar2dRealista'))}</option><option value="3d" ${voice.avatarRenderMode==='3d'?'selected':''}>${escapeHTML(t('stAvatar3dExperimental'))}</option></select><small>${escapeHTML(t('stAvatar3dNota'))}</small></div>
      <div class="field"><label>${escapeHTML(t('stMostrarAvatar'))}</label><select id="oracleAvatarEnabled"><option value="true" ${getVoicePrefs().avatarEnabled!==false?'selected':''}>${escapeHTML(t('stSiMostrarAlHablar'))}</option><option value="false" ${getVoicePrefs().avatarEnabled===false?'selected':''}>${escapeHTML(t('stNoMostrar'))}</option></select></div>
      <div class="field"><label>${escapeHTML(t('stPosicionDelAvatar'))}</label><select id="oracleAvatarPosition"><option value="right" ${getVoicePrefs().avatarPosition!=='left'?'selected':''}>${escapeHTML(t('stDerecha'))}</option><option value="left" ${getVoicePrefs().avatarPosition==='left'?'selected':''}>${escapeHTML(t('stIzquierda'))}</option></select></div>
      <div class="field"><label>${escapeHTML(t('stTamanoDelAvatar'))}</label><select id="oracleAvatarSize"><option value="small" ${getVoicePrefs().avatarSize==='small'?'selected':''}>${escapeHTML(t('stPequeno'))}</option><option value="medium" ${getVoicePrefs().avatarSize!=='small' && getVoicePrefs().avatarSize!=='large'?'selected':''}>${escapeHTML(t('stMediano'))}</option><option value="large" ${getVoicePrefs().avatarSize==='large'?'selected':''}>${escapeHTML(t('stGrande'))}</option></select></div>
      <div class="field"><label>${escapeHTML(t('stExpresionDelAvatar'))}</label><select id="oracleAvatarMood"><option value="auto" ${getVoicePrefs().avatarMood==='auto'?'selected':''}>${escapeHTML(t('stAutomaticaEmocional'))}</option><option value="calm" ${getVoicePrefs().avatarMood==='calm'?'selected':''}>${escapeHTML(t('stSerena'))}</option><option value="smile" ${getVoicePrefs().avatarMood==='smile'?'selected':''}>${escapeHTML(t('stSonriente'))}</option><option value="love" ${getVoicePrefs().avatarMood==='love'?'selected':''}>${escapeHTML(t('stAmor'))}</option><option value="warning" ${getVoicePrefs().avatarMood==='warning'?'selected':''}>${escapeHTML(t('stAdvertencia'))}</option><option value="blocked" ${getVoicePrefs().avatarMood==='blocked'?'selected':''}>${escapeHTML(t('stBloqueo'))}</option><option value="dream" ${getVoicePrefs().avatarMood==='dream'?'selected':''}>${escapeHTML(t('stIntuicion'))}</option><option value="power" ${getVoicePrefs().avatarMood==='power'?'selected':''}>${escapeHTML(t('stFuerza'))}</option><option value="serious" ${getVoicePrefs().avatarMood==='serious'?'selected':''}>${escapeHTML(t('stSeria'))}</option></select></div>
      <div class="field"><label>${escapeHTML(t('stModoAlHablar'))}</label><select id="oracleAvatarSpeechMode"><option value="auto" ${getVoicePrefs().avatarSpeechMode==='auto'?'selected':''}>${escapeHTML(t('stAutomatico'))}</option><option value="channeling" ${getVoicePrefs().avatarSpeechMode==='channeling'?'selected':''}>${escapeHTML(t('stCanalizando'))}</option><option value="whisper" ${getVoicePrefs().avatarSpeechMode==='whisper'?'selected':''}>${escapeHTML(t('stSusurrando'))}</option></select></div>
    </div></div></details>

    <details class="settings-section">
    <summary>${escapeHTML(t('stAparienciaYPrivacidad'))}</summary>
    <div class="settings-section-content">
    <div class="form-grid">
      <div class="field"><label>${escapeHTML(t('stTemaVisual'))}</label><select id="themeSelect"><option value="gold" ${getTheme()==='gold'?'selected':''}>${escapeHTML(t('stDoradoMistico'))}</option><option value="violet" ${getTheme()==='violet'?'selected':''}>${escapeHTML(t('stNocheVioleta'))}</option><option value="forest" ${getTheme()==='forest'?'selected':''}>${escapeHTML(t('stBosqueRunico'))}</option><option value="blue" ${getTheme()==='blue'?'selected':''}>${escapeHTML(t('stLunaAzul'))}</option><option value="classic" ${getTheme()==='classic'?'selected':''}>${escapeHTML(t('stTarotClasico'))}</option><option value="light" ${getTheme()==='light'?'selected':''}>${escapeHTML(t('stClaroElegante'))}</option></select></div>
      <div class="field"><label>${escapeHTML(t('stLuzDeLaApp'))}</label><select id="appearanceModeSelect" data-om-appearance-select><option value="dark" ${getAppearanceMode()==='dark'?'selected':''}>${escapeHTML(t('stNoche'))}</option><option value="light" ${getAppearanceMode()==='light'?'selected':''}>${escapeHTML(t('stDia'))}</option></select></div>
      <div class="field"><label>${escapeHTML(t('stModoPrivado'))}</label><select id="privateModeSelect"><option value="false" ${!isPrivateMode()?'selected':''}>${escapeHTML(t('stGuardarHistorialNormalmente'))}</option><option value="true" ${isPrivateMode()?'selected':''}>${escapeHTML(t('stNoGuardarNuevasLecturas'))}</option></select></div>
      <div class="field"><label>${escapeHTML(t('stEstiloPdfPorDefecto'))}</label><select id="pdfStyleSelect"><option value="premium" ${getPdfStyle()==='premium'?'selected':''}>${escapeHTML(t('stPremiumMistico'))}</option><option value="light" ${getPdfStyle()==='light'?'selected':''}>${escapeHTML(t('stClaroElegante'))}</option><option value="summary" ${getPdfStyle()==='summary'?'selected':''}>${escapeHTML(t('stResumen1Pagina'))}</option></select></div>
      <div class="field"><label>${escapeHTML(t('stModoFocoMenosAnimaciones'))}</label><select id="focusModeSelect"><option value="false" ${!isFocusMode()?'selected':''}>${escapeHTML(t('stAnimacionesCompletas'))}</option><option value="true" ${isFocusMode()?'selected':''}>${escapeHTML(t('stReducirAnimaciones'))}</option></select></div>
      <div class="field"><label>${escapeHTML(t('stModoRendimientoReal'))}</label><select id="performanceModeSelect"><option value="false" ${!isPerformanceMode()?'selected':''}>${escapeHTML(t('stNormal'))}</option><option value="true" ${isPerformanceMode()?'selected':''}>${escapeHTML(t('stRendimientoMovil'))}</option></select></div>
      <div class="field om-3d-control"><label>${escapeHTML(t('stEfectos3d'))}</label><select id="effects3dSelect"><option value="auto" ${effects3d==='auto'?'selected':''}>${escapeHTML(t('stAutomatico'))}</option><option value="high" ${effects3d==='high'?'selected':''}>${escapeHTML(t('stAlto'))}</option><option value="balanced" ${effects3d==='balanced'?'selected':''}>${escapeHTML(t('stEquilibrado'))}</option><option value="reduced" ${effects3d==='reduced'?'selected':''}>${escapeHTML(t('stReducido'))}</option><option value="off" ${effects3d==='off'?'selected':''}>${escapeHTML(t('stDesactivado'))}</option></select><small>${escapeHTML(t('stUsaFallback2dSiWebglFalla'))}</small></div>
    </div></div></details>
    </div>

    <h3 class="section-title">${escapeHTML(t('stAccionesRapidas'))}</h3>
    <div class="panel-grid settings-actions">
      <button class="choice" data-act="save-settings"><strong>${escapeHTML(t('stGuardarAjustes'))}</strong><small>${escapeHTML(t('stGuardaPerfilVozYCeremonia'))}</small></button>
      <button class="choice" data-act="connect-ai"><strong>${escapeHTML(t('stConectarPuterIa'))}</strong><small>${escapeHTML(t('stAmpliaLecturasYHabilitaBusquedasExternas'))}</small></button>
      <button class="choice" data-act="test-voice"><strong>${escapeHTML(t('stEscucharEjemplo'))}</strong><small>${escapeHTML(t('stCompruebaLaVozSeleccionada'))}</small></button>
      <button class="choice" data-act="voice-library"><strong>${escapeHTML(t('stAnadirVoces'))}</strong><small>${escapeHTML(t('stGuiaParaIphoneYAndroid'))}</small></button>
      <button class="choice" data-act="preview-avatar"><strong>${escapeHTML(t('stVistaPreviaDelAvatar'))}</strong><small>${escapeHTML(t('stVerElOraculoAnimado'))}</small></button>
      <button class="choice" data-act="stop-voice"><strong>${escapeHTML(t('stPararVoz'))}</strong><small>${escapeHTML(t('stDetieneLaLecturaHablada'))}</small></button>
      <button class="choice" data-act="toggle-contrast"><strong>${escapeHTML(t('stAltoContraste'))}</strong><small>${prefs.highContrast?'Activado':'Desactivado'}</small></button>
      <button class="choice" data-act="cycle-text-scale"><strong>${escapeHTML(t('stTamanoTexto'))}</strong><small>${getEscalaTexto()}% · ${escapeHTML(t(siguienteEscalaTexto() > getEscalaTexto() ? 'stTocaParaAumentar' : 'stTocaParaVolver'))}</small></button>
    </div>
    <h3 class="section-title">${escapeHTML(t('stDatosYAyuda'))}</h3>
    <div class="panel-grid settings-actions">
      <button class="choice" data-act="backup-data"><strong>${escapeHTML(t('stCrearCopiaDeSeguridad'))}</strong><small>${escapeHTML(t('stExportaTusDatosEnUnArchivo'))}</small></button>
      <button class="choice" data-act="import-backup"><strong>${escapeHTML(t('stRestaurarCopia'))}</strong><small>${escapeHTML(t('stRecuperaUnaCopiaGuardadaAnteriormente'))}</small></button>
      <button class="choice" data-act="privacy-center"><strong>${escapeHTML(t('stPrivacidadYDatos'))}</strong><small>${escapeHTML(t('stControlaElHistorialLocal'))}</small></button>
      <button class="choice" data-act="install-help"><strong>${escapeHTML(t('stInstalarAplicacion'))}</strong><small>${escapeHTML(t('stAnadelaAIphoneOAndroid'))}</small></button>
      <button class="choice" data-act="open-manual"><strong>${escapeHTML(t('stManualDeUsuario'))}</strong><small>${escapeHTML(t('stAbrirLaGuiaCompletaEnPdf'))}</small></button>
    </div>
    <p class="notice mt">${escapeHTML(t('stLasLecturasYPreferenciasSeGuardan'))}</p>` });
}


function daily() {
  unlockAchievement('first_daily');
  const key = 'oraculo.daily.' + todayKey();
  let saved = storeGet(key);
  if (!saved) {
    const c = sample(ALL_TAROT), r = sample(RUNAS), f = faseLunar().fase;
    /* Se guarda tambien el codigo de carta y el indice de fase. El
       nombre cambia con el idioma desde que el mazo es multiidioma, y
       buscar por nombre devolvia OTRA carta el mismo dia al cambiar de
       lengua. Se conservan los nombres para las entradas antiguas. */
    saved = { card: c.name, cardCode: c.codigo || '', rune: r.name, runeIndex: RUNAS.indexOf(r), phase: f.name, phaseIndex: MOON_PHASES.indexOf(f) };
    storeSet(key, saved);
  }
  const card = (saved.cardCode && ALL_TAROT.find(c => c.codigo === saved.cardCode))
    || ALL_TAROT.find(c => c.name === saved.card) || sample(ALL_TAROT);
  const rune = (Number.isInteger(saved.runeIndex) && RUNAS[saved.runeIndex])
    || RUNAS.find(r => r.name === saved.rune) || sample(RUNAS);
  const cruda = (Number.isInteger(saved.phaseIndex) && MOON_PHASES[saved.phaseIndex])
    || MOON_PHASES.find(m => m.name === saved.phase) || faseLunar().fase;
  const phase = faseTraducida(cruda);

  const text = `${t('dlDate')}: ${new Date().toLocaleDateString(window.OraculoI18n?.locale?.() || 'es-ES')}

${t('dlCard')}: ${card.name}
${card.up}

${t('dlRune')}: ${rune.name}
${rune.up}

${t('dlMoon')}: ${phase.name}
${phase.meaning}

${t('dlAdvice')}: ${t('dlAdviceText')}`;

  setLastReading({ type:'Mensaje del día', title:t('dailyMessage'), text, items:[
    { kind:'tarot', name:card.name, subtitle:card.key || card.el || '', image:card.img || '', symbol:'🃏', position:t('dlCard') },
    { kind:'runa', name:rune.name, subtitle:rune.up || '', image:rune.img || '', symbol:rune.sym || 'ᚱ', position:t('dlRune') },
    { kind:'luna', name:phase.name, subtitle:phase.meaning || '', image:'', symbol:phase.sym || '🌙', position:t('dlMoon') }
  ] });
  const chip = $('#dailyText');
  if (chip) chip.textContent = `${card.name} · ${rune.name} · ${phase.name}`;

  /* El value de cada animo se queda en castellano: viaja en el diario. */
  const animos = [['dlCalm','Calma'],['dlHope','Ilusión'],['dlDoubt','Duda'],['dlStrength','Fuerza'],['dlTired','Cansancio'],['dlThanks','Gratitud']];
  openModal({ icon:'🌟', title:t('dailyMessage'), subtitle:t('dlSub'), body:`
    <div class="om-3d-stage om-modal-3d" data-oraculo-3d-asset="dailyRelic" aria-label="${escapeHTML(t('a3dRelic'))}"></div>
    <div class="daily-oracle-grid">
      <div class="daily-oracle-card">${cardImage(card)}<strong>🃏 ${escapeHTML(card.name)}</strong><small>${escapeHTML(card.key || card.el || '')}</small></div>
      <div class="daily-oracle-card"><div class="rune-big compact-rune">${rune.sym}</div><strong>ᚱ ${escapeHTML(rune.name)}</strong><small>${escapeHTML(clampText(rune.up, 70))}</small></div>
      <div class="daily-oracle-card"><div class="moon-big">${phase.sym}</div><strong>🌙 ${escapeHTML(phase.name)}</strong><small>${escapeHTML(clampText(phase.meaning, 70))}</small></div>
    </div>
    <div class="result-card"><h3>${escapeHTML(t('dlSymbolic'))}</h3><p>${escapeHTML(text).replace(/\n/g,'<br>')}</p>${readingActions(text,'Mensaje del día')}</div>
    <div class="result-card mt daily-journal-card"><h3>${escapeHTML(t('dlJournal'))}</h3><div class="form-grid"><div class="field"><label>${escapeHTML(t('dlMood'))}</label><select id="dailyMood">${animos.map(([k,v]) => `<option value="${v}">${escapeHTML(t(k))}</option>`).join('')}</select></div><div class="field"><label>${escapeHTML(t('dlIntent'))}</label><input class="input" id="dailyIntention" placeholder="${escapeHTML(t('dlIntentPh'))}"></div></div><div class="field mt"><label>${escapeHTML(t('dlReflection'))}</label><textarea id="dailyReflection" placeholder="${escapeHTML(t('dlReflectionPh'))}"></textarea></div><div class="actions mt"><button class="btn primary" data-act="save-daily-reflection">${escapeHTML(t('dlSave'))}</button><button class="btn" data-act="daily-history">${escapeHTML(t('dlHistory'))}</button></div></div>` });
}

function getChatLog() { return storeGet(LS.chat, []); }
function setChatLog(log) { storeSet(LS.chat, log.slice(-80)); }
function getChatMemoryContext(limit = 12) {
  const log = getChatLog().slice(-limit);
  return log.map(m => `${m.role === 'user' ? 'Usuario' : 'Oráculo'}: ${cleanInterpretation(m.text).slice(0, 700)}`).join('\n');
}
function chatBubbleHTML(msg) {
  const who = msg.role === 'user' ? t('chatYou') : t('chatOracle');
  return `<article class="chat-bubble ${msg.role}"><strong>${who}</strong><p>${escapeHTML(cleanInterpretation(msg.text)).replace(/\n/g,'<br>')}</p>${msg.actions || ''}</article>`;
}
/* El aviso de "canalizando" se guardaba como un mensaje más y quedaba
   para siempre en el historial. Ahora es un indicador transitorio: el
   Orbe pensando, que desaparece en cuanto llega la respuesta. */
function mostrarPensando() {
  const box = $('#chatMessages');
  if (!box || box.querySelector('#omPensando')) return;
  const nodo = document.createElement('div');
  nodo.id = 'omPensando';
  nodo.className = 'om-pensando';
  nodo.setAttribute('aria-live', 'polite');
  nodo.innerHTML = `
    <span class="om-pensando-orbe" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="om-pensando-texto">El Oráculo está canalizando tu respuesta<b>.</b><b>.</b><b>.</b></span>`;
  box.appendChild(nodo);
  box.scrollTop = box.scrollHeight;
}
function ocultarPensando() {
  document.getElementById('omPensando')?.remove();
}

function renderChatMessages() {
  const box = $('#chatMessages');
  if (!box) return;
  const log = getChatLog();
  box.innerHTML = log.map(chatBubbleHTML).join('\n\n') || chatBubbleHTML({ role:'oracle', text:'Bienvenida a tu sala privada. Puedes pedirme una tirada de tarot, una runa, un mensaje del día, una lectura lunar, ayuda con un sueño o buscar un código Grabovoi.' });
  box.scrollTop = box.scrollHeight;
}
function addChat(role, text, actions = '') {
  const log = getChatLog();
  log.push({ role, text: cleanInterpretation(text), actions, date: new Date().toISOString() });
  setChatLog(log);
  renderChatMessages();
}
function chatTarotCardHTML(item) {
  return `<div class="chat-ritual-card ${item.rev ? 'reversed' : ''}"><div class="mini-label">${escapeHTML(posLabel(item.position) || t('lblCard'))}</div>${cardImage(item.card)}<strong>${escapeHTML(item.card.name)}</strong><small>${escapeHTML(item.rev ? t('lblReversedShort') : t('lblUprightFull'))}</small></div>`;
}
function chatRuneHTML(item, index) {
  return `<div class="chat-rune-card ${item.rev ? 'reversed' : ''}"><div class="mini-label">${index === 0 ? 'Primera runa' : index === 1 ? 'Segunda runa' : index === 2 ? 'Tercera runa' : `Runa ${index + 1}`}</div><div class="rune-big">${item.rune.sym}</div><strong>${escapeHTML(item.rune.name)}</strong><small>${item.rev ? 'Invertida' : 'Al derecho'}</small></div>`;
}
function showChatRitual() {
  openModal({ icon:'🕯️', title:t('chatTitle'), subtitle:t('chatSub'), body:`
    <div class="private-chat-wrap">
      <div class="om-3d-stage om-oracle-chat-3d" data-oraculo-3d-asset="orb" aria-label="Orbe del Oráculo"></div>
      <div class="privacy-note">🔒 ${escapeHTML(t('chatPrivacy'))}</div>
      <div id="chatMessages" class="chat-messages" aria-live="polite"></div>
      <div class="chat-quick-actions">
        <button class="btn compact" data-chat-quick="tirada de tarot de 3 cartas">🃏 ${escapeHTML(t('qk3'))}</button>
        <button class="btn compact" data-chat-quick="tirada del amor">❤️ ${escapeHTML(t('qkLove'))}</button>
        <button class="btn compact" data-chat-quick="sácame una runa">ᚱ ${escapeHTML(t('qkRune'))}</button>
        <button class="btn compact" data-chat-quick="mensaje del día">🌟 ${escapeHTML(t('chatQuickDay'))}</button>
        <button class="btn compact" data-chat-quick="tirada astral del día">☉ ${escapeHTML(t('qkAstro'))}</button>
      </div>
      <div class="chat-input-row">
        ${textareaWithMic('chatInput', 'rows="3" placeholder="Escribe: hazme una tirada de amor, sácame una runa, interpreta mi sueño..."')}
        <button class="btn primary" data-chat-send type="button">Enviar</button>
      </div>
      <div class="actions mt"><button class="btn compact" data-chat-clear type="button">${escapeHTML(t('chatClear'))}</button><button class="btn compact" data-act="save-reading" type="button">⭐ ${escapeHTML(t('chatSaveLast'))}</button><button class="btn compact" data-act="pdf-reading" type="button">📄 ${escapeHTML(t('chatPdfLast'))}</button></div>
    </div>` });
  renderChatMessages();
}
function detectChatIntent(text) {
  const t = text.toLowerCase();
  if (/astro|astral|carta natal|carta astral|zodiaco|hor[oó]scopo|tr[aá]nsito|astros/.test(t)) return { kind:/d[ií]a|diaria|hoy/.test(t) ? 'astroDaily' : 'astros' };
  if (/cruz celta|celt/.test(t)) return { kind:'tarot', spread:'celtic' };
  if (/amor|relaci[oó]n|pareja/.test(t) && /tarot|tirada|carta/.test(t)) return { kind:'tarot', spread:'love' };
  if (/decisi[oó]n|elegir|opci[oó]n/.test(t)) return { kind:'tarot', spread:'decision' };
  if (/semana|semanal/.test(t)) return { kind:'tarot', spread:'week' };
  if (/tres|3/.test(t) && /carta|tarot|tirada/.test(t)) return { kind:'tarot', spread:'three' };
  if (/carta|tarot|tirada/.test(t)) return { kind:'tarot', spread:'one' };
  if (/runa|runas/.test(t)) return { kind:'runes', count: /tres|3/.test(t) ? 3 : /cinco|5/.test(t) ? 5 : 1 };
  if (/tutorial|c[oó]mo usar|preguntas sugeridas|ayuda/.test(t)) return { kind:'tutorial' };
  if (/instalar|pwa|pantalla de inicio/.test(t)) return { kind:'install' };
  if (/publicar|difusi[oó]n|presentaci[oó]n|redes|tarjeta|compartir visual|paquete público|paquete publico/.test(t)) return { kind:'public' };
  if (/avatar|or[aá]culo hablando|boca|muñeco|dibujado|dibujo animado/.test(t)) return { kind:'avatar' };
  if (/centro|control|estado app|panel/.test(t)) return { kind:'control' };
  if (/privacidad|privado|borrar datos|backup/.test(t)) return { kind:'privacy' };
  if (/buscar|busca|encuentra/.test(t)) return { kind:'search' };
  if (/guiada|paso a paso|revelar/.test(t) && /tirada|carta|tarot/.test(t)) return { kind:'guided' };
  if (/mensaje del d[ií]a|ritual del d[ií]a|diaria/.test(t)) return { kind:'daily' };
  if (/luna|lunar/.test(t)) return { kind:'moon' };
  if (/sueñ|son[eé]|soñ[eé]/.test(t)) return { kind:'dream' };
  if (/grabovoi|c[oó]digo\s+grabovoi|n[uú]mero\s+grabovoi/.test(t)) return { kind:'grabovoi' };
  return { kind:'ai' };
}
function chatDrawTarot(spreadKey = 'one', subject = '') {
  const spread = getTarotSpread(spreadKey);
  const reversedRate = chooseReversedRate();
  const cards = [...ALL_TAROT].sort(() => Math.random() - .5).slice(0, spread.count).map((card, index) => ({ card, rev: isReversed(reversedRate), position: spread.positions[index] || '' }));
  const linesOnly = cards.map((c, i) => `${i + 1}. ${c.position ? posLabel(c.position) + ' — ' : ''}${c.card.name}${c.rev ? ' ' + t('lblReversed') : ''}: ${c.rev ? (c.card.reversedMeaning || c.card.rv) : (c.card.uprightMeaning || c.card.up)}${contextoDePosicion(c.position) ? " " + contextoDePosicion(c.position) : ""}`).join('\n\n');
  const lines = `${subjectPrefix(subject)}${linesOnly}`;
  setLastReading({ type:'Tarot privado', title:spreadTitle(spread), text:lines, items:cards.map(c=>({ kind:'tarot', name:c.card.name, subtitle:c.card.key || c.card.el || '', image:c.card.img || '', symbol:'🃏', position:c.position || '', reversed:!!c.rev })), ritual:{ module:'chat', action:'tarot', spread:spreadKey }, meta:subjectMeta(subject, { reversedRate }) });
  ceremonyTone('shuffle'); ceremonyVibrate([14,35,14]);
  addChat('oracle', `El oráculo está mezclando las cartas${subject ? ` para ${subject}` : ` para tu ${spreadTitle(spread)}`}...`);
  cards.forEach((c, i) => setTimeout(() => { ceremonyTone('reveal'); ceremonyVibrate(22); addChat('oracle', `${posLabel(c.position) || t('lblCardN', { n: i + 1 })}: ${c.card.name}${c.rev ? ' ' + t('lblReversed') : ''}
${c.rev ? c.card.rv : c.card.up}`, `<div class="chat-ritual-grid single">${chatTarotCardHTML(c)}</div>`); }, ceremonyDelay(650 + i * 950)));
  setTimeout(() => addChat('oracle', t('chatDone'), `<div class="chat-ritual-grid summary tarot-count-${cards.length}">${cards.map(chatTarotCardHTML).join('')}</div><div class="actions mt"><button class="btn compact" data-act="ai-reading">🤖 Profundizar IA</button><button class="btn compact" data-act="speak-ai">🔊 Leer IA</button><button class="btn compact" data-act="save-reading">⭐ Guardar</button><button class="btn compact" data-act="pdf-options">📄 PDF</button><button class="btn compact" data-chat-quick="otra ${spreadTitle(spread)}">🔄 ${escapeHTML(t('qkAgain'))}</button></div>`), ceremonyDelay(900 + cards.length * 950));
}
function chatDrawRunes(count = 1, subject = '') {
  const reversedRate = chooseReversedRate();
  const runes = [...RUNAS].sort(() => Math.random() - .5).slice(0, count).map(rune => ({ rune, rev: Boolean(rune.rv) && isReversed(reversedRate) }));
  const title = count === 1 ? 'Runa privada' : `Tirada privada de ${count} runas`;
  const lines = runes.map((r, i) => `${i + 1}. ${r.rune.name} ${r.rev ? t('lblReversed') : ''}: ${r.rev ? (r.rune.rv || r.rune.up) : r.rune.up}`).join('\n\n');
  const readingText = `${subjectPrefix(subject)}${lines}`;
  setLastReading({ type:'Runas privadas', title, text:readingText, items:runes.map(r=>({ kind:'runa', name:r.rune.name, subtitle:r.rune.up || '', image:r.rune.img || '', symbol:r.rune.sym || 'ᚱ', reversed:!!r.rev })), ritual:{ module:'chat', action:'runes', count }, meta:subjectMeta(subject, { reversedRate }) });
  ceremonyTone('shuffle'); ceremonyVibrate([14,35,14]);
  addChat('oracle', subject ? `El oráculo agita el saquito de runas para ${subject}...` : 'El oráculo agita el saquito de runas...');
  runes.forEach((r, i) => setTimeout(() => { ceremonyTone('rune'); ceremonyVibrate(22); addChat('oracle', `Runa ${i+1}: ${r.rune.sym} ${r.rune.name}${r.rev ? ' ' + t('lblReversed') : ''}
${r.rev ? (r.rune.rv || r.rune.up) : r.rune.up}`, `<div class="chat-ritual-grid runes single">${chatRuneHTML(r, i)}</div>`); }, ceremonyDelay(650 + i * 900)));
  setTimeout(() => addChat('oracle', t('chatRunesDone'), `<div class="chat-ritual-grid runes summary rune-count-${runes.length}">${runes.map((r,i)=>chatRuneHTML(r,i)).join('')}</div><div class="actions mt"><button class="btn compact" data-act="ai-reading">🤖 Profundizar IA</button><button class="btn compact" data-act="save-reading">⭐ Guardar</button><button class="btn compact" data-act="pdf-options">📄 PDF</button><button class="btn compact" data-chat-quick="otra runa">🔄 ${escapeHTML(t('qkAgain'))}</button></div>`), ceremonyDelay(900 + runes.length * 900));
}
async function processChatMessage(text) {
  const clean = cleanInterpretation(text);
  if (!clean) return;
  addChat('user', clean);
  const intent = detectChatIntent(clean);
  const subject = extractReadingSubjectFromText(clean);
  const followsLastReading = /última|ultima|lectura anterior|tirada anterior|presente|futuro|pasado|invertida|profundiza|explica|comparar|compara/.test(clean.toLowerCase()) && lastReading;
  if (intent.kind === 'tarot') return chatDrawTarot(intent.spread, subject);
  if (intent.kind === 'runes') return chatDrawRunes(intent.count, subject);
  if (intent.kind === 'tutorial') { showAppTutorial(); addChat('oracle','He abierto el tutorial guiado.'); return; }
  if (intent.kind === 'install') { showInstallHelp(); addChat('oracle','He abierto la guía de instalación PWA.'); return; }
  if (intent.kind === 'public') { showPublicLaunch(); addChat('oracle','He abierto Publicación y difusión.'); return; }
  if (intent.kind === 'avatar') { previewOracleAvatarEmotions(); addChat('oracle','He activado una vista previa del avatar emocional del oráculo.'); return; }
  if (intent.kind === 'control') { showControlCenter(); addChat('oracle','He abierto el Centro de control.'); return; }
  if (intent.kind === 'privacy') { showPrivacyCenter(); addChat('oracle','He abierto Privacidad y datos.'); return; }
  if (intent.kind === 'search') { showGlobalSearch(); addChat('oracle','He abierto el buscador global.'); return; }
  if (intent.kind === 'guided') { showGuidedReveal(); addChat('oracle','He abierto una tirada guiada paso a paso.'); return; }
  if (intent.kind === 'astros') { showAstros(); addChat('oracle','He abierto Astros. Completa nombre, fecha y hora de nacimiento para crear la carta astral o la tirada del día.'); return; }
  if (intent.kind === 'astroDaily') { showAstros(); addChat('oracle','He abierto la tirada astral del día. Si ya tienes tus datos guardados, pulsa “Tirada astral del día”.'); return; }
  if (intent.kind === 'daily') { daily(); addChat('oracle','He abierto tu mensaje del día en una lectura visual. También puedes pedirme: “hazlo aquí en el chat”.'); return; }
  if (intent.kind === 'moon') { showLuna(); addChat('oracle','He abierto la lectura lunar. Si prefieres, escribe “hazlo aquí en el chat” y lo mantenemos privado.'); return; }
  if (intent.kind === 'dream') return addChat('oracle','Cuéntame el sueño con todos los detalles que recuerdes. También puedes abrir el módulo Sueños si quieres guardar la interpretación.', `<div class="actions mt"><button class="btn compact" data-module="suenos">💭 Abrir Sueños</button></div>`);
  if (intent.kind === 'grabovoi') return handleChatGrabovoi(clean);
  if (followsLastReading && localStorage.getItem(LS.puter) !== 'true') {
    return addChat('oracle', `Puedo seguir el hilo de tu última lectura: ${lastReading.title}. En modo simbólico veo esto:\n\n${clampText(lastReading.text, 700)}\n\nPara una interpretación conversacional completa, conecta Puter IA; mientras tanto puedo hacer otra tirada, guardar, leer en voz o crear PDF.`, `<div class="actions mt"><button class="btn compact" data-act="connect-ai">🤖 Conectar IA</button><button class="btn compact" data-act="speak-ai">🔊 Voz</button><button class="btn compact" data-act="pdf-options">📄 PDF</button></div>`);
  }
  if (localStorage.getItem(LS.puter) === 'true') {
    mostrarPensando();
    const memory = getChatMemoryContext(14);
    const userName = getUserName();
    const answer = await askAI(`Responde como Oráculo Místico. Sé cálido, útil y simbólico. No des consejos médicos, legales ni financieros. ${!followsLastReading && userName ? `La persona se llama ${userName}; úsalo de forma natural, sin repetirlo demasiado.` : ''} ${followsLastReading ? 'Si respondes sobre la última lectura activa, respeta el destinatario indicado en esa lectura y no uses el nombre del perfil si es distinto.' : ''} Recuerda el hilo reciente de la conversación y responde con continuidad. Ten en cuenta el perfil personal si existe: intención ${getProfile().intention || 'no indicada'}, signo/energía ${getProfile().sign || 'no indicado'}. Si conviene, recomienda o realiza una tirada de tarot, runa, luna, sueños, astrología simbólica, numerología o Grabovoi.

Historial reciente:
${memory}

Última lectura activa, si existe:
${lastReading ? `${lastReading.title}\n${lastReading.text}${lastReading.ai ? '\nInterpretación IA previa:\n' + lastReading.ai : ''}` : 'No hay lectura activa.'}

Último mensaje del usuario:
${clean}`, { prefix:followsLastReading ? readingPersonalPrefix(lastReading) : personalPrefix() });
    ocultarPensando();
    const finalAnswer = answer || 'No he podido conectar con el Oráculo en este momento. Puedes pedirme una tirada directa: “hazme una tirada de tarot”.';
    addChat('oracle', finalAnswer, `<div class="actions mt"><button class="btn compact" data-act="speak-ai">🔊 ${escapeHTML(t('qkVoice'))}</button><button class="btn compact" data-chat-quick="hazme una tirada de tarot">🃏 ${escapeHTML(t('qkTarot'))}</button><button class="btn compact" data-chat-quick="sácame una runa">ᚱ ${escapeHTML(t('qkRune'))}</button></div>`);
    if (answer) {
      if (lastReading) lastReading.ai = finalAnswer;
      setTimeout(() => speakText(finalAnswer), 250);
    }
  } else {
    addChat('oracle', 'Puedo guiarte en modo simbólico. Para respuestas conversacionales con IA, conecta Puter IA. Mientras tanto puedes pedirme una tirada de tarot, una runa o tu mensaje del día.', `<div class="actions mt"><button class="btn compact" data-act="connect-ai">🤖 Conectar IA</button><button class="btn compact" data-chat-quick="hazme una tirada de tarot">🃏 Tarot</button><button class="btn compact" data-chat-quick="sácame una runa">ᚱ Runa</button></div>`);
  }
}

function handleAction(action) {
  if (action?.startsWith('spread-')) return drawTarotSpread(action.replace('spread-', ''));
  const actionMap = {
    'first-reading': showFirstReading,
    'connect-ai': connectPuter,
    'daily': daily,
    'tarot-one': () => drawTarotSpread('one'),
    'tarot-three': () => drawTarotSpread('three'),
    'draw-tarot-selected': () => drawTarotSpread($('#tarotSpread')?.value || 'one'),
    'tarot-library': () => showTarotLibrary('all'),
    'tarot-lib-all': () => showTarotLibrary('all'),
    'tarot-lib-major': () => showTarotLibrary('major'),
    'tarot-lib-minor': () => showTarotLibrary('minor'),
    'rune-one': () => drawRunes(1,'Runa rápida'),
    'runes-three': () => drawRunes(3,'Tirada de 3 runas'),
    'runes-five': () => drawRunes(5,'Tirada de 5 runas'),
    'runes-library': showRunesLibrary,
    'moon-reading': moonReading,
    'dream-reading': dreamReading,
    'astro-chart': calcAstroChart,
    'astro-daily': dailyAstroReading,
    'astro-solar-return': solarReturnReading,
    'calc-num': calcNumerologia,
    'calc-synastry': calculateSynastry,
    'biblioteca': () => showBiblioteca('all'),
    'settings': showSettings,
    'control-center': showControlCenter,
    'preview-avatar': previewOracleAvatar,
    'preview-avatar-emotions': previewOracleAvatarEmotions,
    'hide-avatar': stopSpeech,
    'version-status': showVersionStatus,
    'repair-cache': repairCacheAndReload,
    'error-log': showErrorLog,
    'clear-error-log': clearErrorLog,
    'download-error-log': downloadErrorLog,
    'export-diary-pdf': exportDiaryPDF,
    'public-launch': showPublicLaunch,
    'public-package': showPublicPackage,
    'install-help': showInstallHelp,
    'try-install-pwa': tryInstallPWA,
    'share-app': shareApp,
    'copy-short-public-text': copyShortPublicText,
    'download-readme': downloadReadme,
    'tutorial-app': showAppTutorial,
    'suggested-questions': showSuggestedQuestions,
    'copy-public-text': copyPublicText,
    'share-visual': showShareVisual,
    'download-share-card': downloadShareCard,
    'diagnostics': showDiagnostics,
    'download-diagnostics': downloadDiagnostics,
    'copy-diagnostics': copyDiagnostics,
    'help-center': showHelpCenter,
    'whats-new': showWhatsNew,
    'report-template': showReportTemplate,
    'copy-bug-template': copyBugTemplate,
    'global-search': showGlobalSearch,
    'privacy-center': showPrivacyCenter,
    'clear-chat': clearChatData,
    'clear-profile': clearProfileData,
    'factory-reset': factoryResetData,
    'save-guide': () => { const v=$('#guideName')?.value?.trim(); if(v) localStorage.setItem(LS.name,v); localStorage.setItem(LS.guide,'yes'); closeModal(); updateHome(); toast(t('tsGuideDone')); },
    'grab-clear': () => { grabSeleccion.clear(); refrescarGrabList(); },
    'grab-more': () => { grabVisibleLimit += GRAB_INCREMENT; refrescarGrabList(); },
    'grab-all': () => { grabVisibleLimit = Number.MAX_SAFE_INTEGER; refrescarGrabList(); },
    'grab-pdf': () => exportGrabovoiSheetPDF(),
    'save-settings': () => { const v=$('#settingsName')?.value?.trim(); if(v) localStorage.setItem(LS.name,v); setAppLanguage($('#appLanguage')?.value || 'auto'); localStorage.setItem(LS.aiStyle, $('#aiStyle')?.value || 'mistica'); setVoicePrefs({ engine: $('#voiceEngine')?.value || 'device', remoteVoice: $('#remoteVoice')?.value || 'coral', voiceFilter: $('#voiceFilter')?.value || 'all', keepScreenAwake: $('#keepScreenAwake')?.value !== 'false', language: $('#voiceLanguage')?.value || 'auto', deviceVoiceURI: $('#deviceVoiceURI')?.value || '', preset: $('#voicePreset')?.value || 'mistica_femenina', avatarStyle: $('#oracleAvatarStyle')?.value || 'auto', avatarRenderMode: $('#oracleAvatarRenderMode')?.value || 'auto', avatarEnabled: $('#oracleAvatarEnabled')?.value !== 'false', avatarPosition: $('#oracleAvatarPosition')?.value || 'right', avatarSize: $('#oracleAvatarSize')?.value || 'medium', avatarMood: $('#oracleAvatarMood')?.value || 'auto', avatarSpeechMode: $('#oracleAvatarSpeechMode')?.value || 'auto', rate: Number($('#voiceRate')?.value || getVoicePreset($('#voicePreset')?.value || 'mistica_femenina').rate) }); setCeremonyPrefs({ speed: $('#ceremonySpeed')?.value || 'normal', sounds: $('#ceremonySounds')?.value === 'true', vibration: $('#ceremonyVibration')?.value === 'true' }); setTheme($('#themeSelect')?.value || getTheme()); setAppearanceMode($('#appearanceModeSelect')?.value || getAppearanceMode()); setPrivateMode($('#privateModeSelect')?.value === 'true'); setPdfStyle($('#pdfStyleSelect')?.value || getPdfStyle()); setFocusMode($('#focusModeSelect')?.value === 'true'); setPerformanceMode($('#performanceModeSelect')?.value === 'true'); set3dPreference($('#effects3dSelect')?.value || get3dPreference()); closeModal(); updateHome(); toast(t('settingsSaved')); },
    'toggle-contrast': () => { const p=storeGet(LS.prefs,{}); p.highContrast=!p.highContrast; storeSet(LS.prefs,p); updateHome(); showSettings(); },
    'cycle-text-scale': () => { const p=storeGet(LS.prefs,{}); p.textScale=siguienteEscalaTexto(); delete p.largeText; storeSet(LS.prefs,p); aplicarEscalaTexto(); updateHome(); showSettings(); },
    'update-pwa': async () => { try { const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); } catch {} location.reload(); },
    'open-manual': () => window.open('docs/manual_usuario_oraculo_mistico_v1_0.pdf', '_blank'),
    'mi-oraculo': showMiOraculo,
    'save-profile': () => { const birth=$('#profileBirth')?.value || ''; const birthTime=$('#profileBirthTime')?.value || ''; const placeLabel=($('#profileBirthPlace')?.value || '').trim(); const birthPlace=placeLabel ? { ...(getBirthPlace() || {}), label:placeLabel } : null; setProfile({ birth, birthTime, birthPlace, sign: $('#profileSign')?.value || '', intention: $('#profileIntention')?.value || '', favoriteSpread: $('#profileSpread')?.value || 'three' }); setBirthDate(birth); setBirthTime(birthTime); if (birthPlace) setBirthPlace(birthPlace); localStorage.setItem(LS.intention, $('#profileIntention')?.value || 'libre'); updateHome(); toast(t('tsProfileSaved')); showMiOraculo(); },
    'profile-favorite-spread': () => drawTarotSpread(getProfile().favoriteSpread || 'three'),
    'toggle-private': () => { setPrivateMode(!isPrivateMode()); updateHome(); showMiOraculo(); },
    'import-backup': () => { const input=document.createElement('input'); input.type='file'; input.accept='application/json,.json'; input.onchange=()=>importBackupFromFile(input.files?.[0]); input.click(); },
    'test-ceremony': () => { setCeremonyPrefs({ speed: $('#ceremonySpeed')?.value || 'normal', sounds: $('#ceremonySounds')?.value === 'true', vibration: $('#ceremonyVibration')?.value === 'true' }); ceremonyTone('reveal'); ceremonyVibrate([25,40,25]); toast(t('sndTested')); },
    'backup-data': backupData,
    'app-health': appHealthCheck,
    'ceremony-tarot': () => openCeremonyIntro('tarot'),
    'ceremony-runes': () => openCeremonyIntro('runes'),
    'refresh-diary': () => showBiblioteca($('#diaryFilter')?.value || 'all'),
    'save-reading': () => saveReading(),
    'copy-reading': () => copyText(getReadingText()),
    'share-reading': () => shareText(getReadingText(), lastReading?.title),
    'pdf-reading': () => exportPDF(lastReading?.title || 'Oráculo Místico', getReadingText()),
    'pdf-options': showPdfOptions,
    'pdf-style-premium': () => { setPdfStyle('premium'); exportPDF(lastReading?.title || 'Oráculo Místico', getReadingText()); },
    'pdf-style-light': () => { setPdfStyle('light'); exportPDF(lastReading?.title || 'Oráculo Místico', getReadingText()); },
    'pdf-style-summary': () => { setPdfStyle('summary'); exportPDF(lastReading?.title || 'Oráculo Místico', getReadingText()); },
    'save-daily-reflection': saveDailyReflection,
    'daily-history': showDailyHistory,
    'achievements': showAchievements,
    'guided-reveal': showGuidedReveal,
    'start-guided-three': startGuidedThree,
    'ai-reading': async () => {
      const base = getReadingText();
      if (!lastReading) return toast(t('tsNeedReading'));
      window.Oraculo3D?.releaseMemory?.();
      if (localStorage.getItem(LS.puter) !== 'true') {
        setAIReadingPanel(`<h3>${escapeHTML(t('stIaNoConectada'))}</h3><p>${escapeHTML(t('stConectaPuterIaParaProfundizarEsta'))}</p><div class="actions mt"><button class="btn primary compact" data-act="connect-ai" type="button">Conectar IA</button></div>`, 'warning');
        return;
      }
      const isGrabovoi = lastReading.type === 'Grabovoi';
      const subjectName = getReadingSubjectName(lastReading);
      setAIReadingPanel(`<div class="channeling"><span class="orb-pulse">🔮</span><div><h3>${isGrabovoi ? 'Analizando el código Grabovoi...' : `${subjectName ? subjectName + ', e' : 'E'}l oráculo está canalizando...`}</h3><p>${isGrabovoi ? 'La ampliación se centrará únicamente en la secuencia, su práctica y sus límites.' : 'Estoy profundizando la lectura con IA. Puedes dejar esta pantalla abierta.'}</p></div></div>`, 'loading');
      const prompt = isGrabovoi
        ? `Analiza exclusivamente esta ficha de un código Grabovoi. No hables del usuario, su personalidad, energía ni destino. Explica: finalidad declarada, estructura y bloques de la secuencia, lectura simbólica de los dígitos sin inventar propiedades, una práctica de concentración paso a paso, duración prudente, formas de escribir o visualizar el número y consejos para registrar la práctica. No prometas resultados. Si trata salud, deja claro que no diagnostica, trata ni cura y que no sustituye atención médica. Esta pantalla no es un chat: entrega una interpretación completa y cerrada, sin formular preguntas, sin pedir datos y sin invitar al usuario a responder. Responde de forma clara y organizada:\n\n${base}`
        : `Amplía esta lectura de forma simbólica, clara, positiva y segura. Esta pantalla no es un chat: entrega una interpretación completa, autónoma y cerrada. No formules ninguna pregunta al usuario, no pidas aclaraciones o datos adicionales, no ofrezcas continuar conversando y no termines con una interrogación. Interpreta únicamente la información disponible. Si es una tirada de una carta, explica el mensaje central, cómo se relaciona con la pregunta si existe, la advertencia o matiz y un paso práctico concreto. En tiradas de varias cartas, integra sus posiciones y concluye con un consejo final. No hagas promesas absolutas. No des consejos médicos, legales ni financieros. Usa un tono místico, claro y útil:

${base}`;
      const rawAI = await askAI(prompt, { prefix: isGrabovoi ? aiStyleInstruction() : readingPersonalPrefix(lastReading) });
      const ai = cleanClosedReading(rawAI);
      if (ai) {
        lastReading.ai = ai;
        setAIReadingPanel(`<h3>${escapeHTML(t('stInterpretacionIa'))}</h3><p>${escapeHTML(ai).replace(/\n/g,'<br>')}</p><div class="actions mt"><button class="btn compact" data-act="speak-ai" type="button">🔊 Leer IA</button><button class="btn compact" data-act="stop-voice" type="button">⏹️ Parar</button><button class="btn compact" data-act="copy-reading" type="button">📋 Copiar todo</button><button class="btn compact" data-act="pdf-reading" type="button">📄 Incluir IA en PDF</button></div>`, 'success');
      } else {
        setAIReadingPanel(`<h3>${escapeHTML(t('stIaNoDisponibleAhora'))}</h3><p>${escapeHTML(t('stLaLecturaSimbolicaSigueActivaPuedes'))}</p>`, 'warning');
      }
    },
    'speak-reading': () => speakText(getReadingText()),
    'download-reading-mp3': downloadReadingMP3,
    'speak-ai': () => speakText(lastReading?.ai || ''),
    'stop-voice': stopSpeech,
    'test-voice': testVoiceSettings,
    'voice-library': showVoiceLibrary,
    'open-tts-settings': () => window.AndroidTTS?.openSettings?.(),
    'open-web-ai': () => window.AndroidTTS?.openExternal?.('https://appsjcm.github.io/oraculomistico2/'),
    'refresh-voices': () => { toast(t('tsCheckVoices')); reloadDeviceVoices({ reopenLibrary:true }); },
    'export-diary': () => { const diary=storeGet(LS.diary,[]); downloadTextFile('biblioteca-mistica.txt', diary.map(d=>`${d.title}\n${new Date(d.date).toLocaleString()}\n${d.text}`).join('\n\n---\n\n')); },
    'clear-diary': () => { if(confirm('¿Vaciar la Biblioteca Mística?')){ storeSet(LS.diary,[]); showBiblioteca(); } },
    'open-chat': showChatRitual
  };
  actionMap[action]?.();
}
function openModule(module) {
  const map = { map: showMap, tarot: showTarot, runas: showRunas, luna: showLuna, astros: showAstros, suenos: showSuenos, numerologia: showNumerologia, grabovoi: showGrabovoi, biblioteca: showBiblioteca, chat: showChatRitual, settings: showSettings };
  const run = map[module];
  if (!run) return;
  try {
    const result = run();
    if (result?.catch) result.catch(error => {
      pushErrorLog('module-open', error?.message || error, module);
      toast('No se pudo abrir este módulo. Prueba a recargar la app.');
    });
  } catch (error) {
    pushErrorLog('module-open', error?.message || error, module);
    toast('No se pudo abrir este módulo. Prueba a recargar la app.');
  }
}

function attachGlobalEvents() {
  document.addEventListener('click', async e => {
    if (e.target.closest('[data-astro-wheel-modal-close]')) {
      e.preventDefault();
      return closeAstroWheelFullscreen();
    }
    const astroZoom = e.target.closest('[data-astro-zoom]');
    if (astroZoom) {
      e.preventDefault();
      return handleAstroWheelZoomControl(astroZoom);
    }
    const micTarget = e.target.closest('[data-mic-target]')?.dataset.micTarget;
    if (micTarget) {
      e.preventDefault();
      return startDictation(micTarget);
    }
    if (e.target.closest('[data-chat-send]')) return processChatMessage($('#chatInput')?.value || '').then(() => { const i=$('#chatInput'); if(i) i.value=''; });
    const chatQuick = e.target.closest('[data-chat-quick]')?.dataset.chatQuick;
    if (chatQuick) return processChatMessage(chatQuick);
    if (e.target.closest('[data-chat-clear]')) { storeSet(LS.chat, []); renderChatMessages(); return; }
    const mod = e.target.closest('[data-module]')?.dataset.module;
    if (mod) return openModule(mod);
    const action = e.target.closest('[data-action],[data-act]')?.dataset.action || e.target.closest('[data-action],[data-act]')?.dataset.act;
    if (action) return handleAction(action);
    const openCard = e.target.closest('[data-open-card]')?.dataset.openCard;
    if (openCard) return showCardDetail(ALL_TAROT.find(c => c.name === openCard));
    const openRune = e.target.closest('[data-open-rune]')?.dataset.openRune;
    if (openRune) return showRuneDetail(RUNAS.find(r => r.name === openRune));
    /* La casilla se gestiona en el evento change; aqui solo se evita
       que el clic sobre ella abra la ficha. */
    if (e.target.closest('[data-grab-pick]')) return;

    const grabCat = e.target.closest('[data-grab-cat]');
    if (grabCat) {
      grabCategoria = grabCat.dataset.grabCat || '';
      grabVisibleLimit = GRAB_INITIAL_LIMIT;
      refrescarGrabList();
      return;
    }

    const grabIndex = e.target.closest('[data-grab-index]')?.dataset.grabIndex;
    if (grabIndex !== undefined) return showGrabDetail(grabovoiEntries[Number(grabIndex)]);
    const astroCity = e.target.closest('[data-astro-city]')?.dataset.astroCity;
    if (astroCity !== undefined) return selectAstroCity(astroCity);
    const addSymbol = e.target.closest('[data-add-symbol]')?.dataset.addSymbol;
    if (addSymbol) { const t=$('#dreamText'); if(t) t.value = `${t.value}${t.value?' ':''}${addSymbol}`; }
    const copyQuestion = e.target.closest('[data-copy-question]')?.dataset.copyQuestion;
    if (copyQuestion) return copyText(copyQuestion);
    const openDiary = e.target.closest('[data-open-diary]')?.dataset.openDiary;
    if (openDiary) return openDiaryItem(openDiary);
    const copyDiary = e.target.closest('[data-copy-diary]')?.dataset.copyDiary;
    if (copyDiary) { const d=storeGet(LS.diary,[]).find(x=>x.id===copyDiary); if(d) copyText(`${d.title}\n\n${d.text}`); }
    const favDiary = e.target.closest('[data-fav-diary]')?.dataset.favDiary;
    if (favDiary) return toggleDiaryFavorite(favDiary);
    const noteDiary = e.target.closest('[data-note-diary]')?.dataset.noteDiary;
    if (noteDiary) return saveDiaryNote(noteDiary);
    const delDiary = e.target.closest('[data-delete-diary]')?.dataset.deleteDiary;
    if (delDiary) { storeSet(LS.diary, storeGet(LS.diary,[]).filter(x=>x.id!==delDiary)); showBiblioteca($('#diaryFilter')?.value || 'all'); }
  });
  /* Marcar una secuencia. Se controla aqui y no en el clic para que
     funcione tambien con teclado. */
  document.addEventListener('change', e => {
    const pick = e.target.closest?.('[data-grab-pick]');
    if (!pick) return;
    const idx = Number(pick.dataset.grabPick);
    if (!Number.isInteger(idx)) return;
    if (pick.checked) {
      if (grabSeleccion.size >= GRAB_MAX) {
        pick.checked = false;
        toast(t('gbMax', { n: GRAB_MAX }));
        return;
      }
      grabSeleccion.add(idx);
    } else {
      grabSeleccion.delete(idx);
    }
    refrescarGrabList();
  });

  document.addEventListener('input', e => {
    if (e.target.id === 'globalSearchInput') { const box=$('#globalSearchResults'); if(box) box.innerHTML = renderGlobalSearchResults(e.target.value || ''); return; }
    if (e.target.id === 'diarySearch') { showBiblioteca($('#diaryFilter')?.value || 'all'); return; }
    if (e.target.id === 'diaryFilter') { showBiblioteca(e.target.value || 'all'); return; }
    if (e.target.id === 'grabSearch') {
      /* La seleccion vive en grabSeleccion, no en el DOM: repintar la
         lista al buscar ya no borra lo que hubiera marcado. */
      grabConsulta = e.target.value || '';
      grabVisibleLimit = GRAB_INITIAL_LIMIT;
      refrescarGrabList();
    }
    if (e.target.id === 'grabPdfSearch') {
      const list = grabovoiPdfCandidates(lastReading, e.target.value || '');
      const box = $('#grabPdfList');
      if (box) box.innerHTML = renderGrabovoiPdfList(list);
    }
    if (e.target.id === 'astroPlace') {
      const hidden = $('#astroPlaceData');
      if (hidden) hidden.value = '';
      updateAstroCitySuggestions(e.target.value || '');
    }
  });
  document.addEventListener('change', e => {
    if (e.target?.id === 'voiceLanguage' || e.target?.id === 'voiceFilter') refreshDeviceVoiceSelect();
  });
  document.addEventListener('pointerdown', astroWheelPointerDown, { passive:false });
  document.addEventListener('pointermove', astroWheelPointerMove, { passive:false });
  document.addEventListener('pointerup', astroWheelPointerEnd);
  document.addEventListener('pointercancel', astroWheelPointerEnd);
  document.addEventListener('keydown', e => {
    if (e.target?.id === 'guidedNextBtn') { return guidedNext(Number(e.target.dataset.guidedIndex || 0)); }
    if (e.target?.id === 'chatInput' && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      processChatMessage(e.target.value || '').then(() => { e.target.value = ''; });
    }
  });
  $('#openGuideBtn')?.addEventListener('click', () => showGuide(true));
  $('#gearBtn')?.addEventListener('click', showSettings);
}

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  /* La version iba escrita a mano aqui y se quedo en una antigua: las
     subidas de version de index.html no llegan a esta cadena. Se toma
     del propio <script> que carga la app, que si se versiona. */
  let v = '';
  try { v = new URL(document.currentScript?.src || document.querySelector('script[src*="coreApp"]')?.src || '', location.href).search; } catch {}
  try { await navigator.serviceWorker.register('service-worker.js' + v); } catch (e) { console.warn('SW no registrado:', e); }
}

function boot() {
  try {
    document.body.classList.toggle('native-android', Boolean(window.AndroidTTS));
    migrateData();
    applyAppTranslations(document);
    applyTheme();
    updateHome();
    attachGlobalEvents();
    document.addEventListener('visibilitychange', handleSpeechVisibility);
    registerSW();
  if ('speechSynthesis' in window) {
    const onWebVoicesChanged = () => {
      getAllDeviceVoices();
      refreshDeviceVoiceSelect();
    };
    window.speechSynthesis.addEventListener?.('voiceschanged', onWebVoicesChanged);
    [300, 900, 1800, 3500, 6500, 10000].forEach(delay => setTimeout(onWebVoicesChanged, delay));
    window.addEventListener('pageshow', () => reloadDeviceVoices({ awaken:false }));
    window.addEventListener('focus', () => reloadDeviceVoices({ awaken:false }));
  }
  window.addEventListener('nativevoiceschanged', () => {
    refreshDeviceVoiceSelect();
    toast(t('tsTtsReady'));
  });
    showGuide(false);
    ensureOracleAvatarHost();
    document.documentElement.dataset.oraculoApp = 'ready';
  } catch (error) {
    console.error('No se pudo iniciar Oráculo Místico:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once:true });
} else {
  boot();
}
