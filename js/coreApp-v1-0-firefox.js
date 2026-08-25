import { ALL_TAROT, MAJOR_ARCANA, MINOR_ARCANA, RUNAS, MOON_PHASES } from './data.js';
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
  privateMode: 'oraculo.privateMode.v1',
  achievements: 'oraculo.achievements.v1',
  dailyJournal: 'oraculo.dailyJournal.v1',
  pdfStyle: 'oraculo.pdfStyle.v1',
  focusMode: 'oraculo.focusMode.v1',
  errorLog: 'oraculo.errorLog.v1',
  migration: 'oraculo.migrationVersion.v1',
  performanceMode: 'oraculo.performanceMode.v1'
};

let lastReading = null;
let grabovoiEntries = [];
let grabovoiGuide = { digitMeanings: {}, methods: [] };
let oracleLipTimer = null;
let oracleLipWordStart = -1;
let voiceWakeLock = null;
let activeSpeech = { text: '', charIndex: 0, active: false, interrupted: false };
let voiceSpeechSession = 0;
let remoteSpeechAudio = null;
let lastGeneratedSpeech = null;
let cachedWebVoices = [];

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
  root.addEventListener('click', modalClickHandler, { once: true });
  document.addEventListener('keydown', escHandler, { once: true });
  setTimeout(() => $('.modal-close')?.focus(), 10);
}
function modalClickHandler(e) {
  if (e.target.closest('[data-close-modal]')) closeModal();
  else $('#modalRoot')?.addEventListener('click', modalClickHandler, { once: true });
}
function escHandler(e) { if (e.key === 'Escape') closeModal(); else document.addEventListener('keydown', escHandler, { once: true }); }
function closeModal() { $('#modalRoot').className = 'modal-root'; $('#modalRoot').innerHTML = ''; }

function readingActions(text, type = 'Lectura') {
  return `
    <div class="actions mt reading-actions">
      <button class="btn compact" data-act="ai-reading" type="button">🤖 Profundizar IA</button>
      <button class="btn compact" data-act="save-reading" type="button">⭐ Guardar</button>
      <button class="btn compact" data-act="copy-reading" type="button">📋 Copiar</button>
      <button class="btn compact" data-act="share-reading" type="button">📤 Compartir</button>
      <button class="btn compact" data-act="speak-reading" type="button">🔊 Escuchar</button>
      <button class="btn compact" data-act="download-reading-mp3" type="button">🎧 MP3</button>
      <button class="btn compact" data-act="pdf-options" type="button">📄 PDF profesional</button>
      <button class="btn compact" data-act="share-visual" type="button">🖼️ Tarjeta</button>
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
  if (!reading) return toast('No hay lectura para guardar.');
  if (isPrivateMode()) return toast('Modo privado activo: no se ha guardado la lectura.');
  const diary = storeGet(LS.diary, []);
  diary.unshift({ ...reading, id: crypto.randomUUID?.() || String(Date.now()), date: reading.date || new Date().toISOString(), favorite: !!reading.favorite, note: reading.note || '' });
  storeSet(LS.diary, diary.slice(0, 300));
  unlockAchievement('first_save');
  toast('Guardado en Biblioteca Mística.');
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Copiado.'); }
  catch { toast('No se pudo copiar.'); }
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
    .replace(/[•]/g, '-')
    .replace(/[–—]/g, '-')
    .trim();
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
  if (reading?.type === 'Grabovoi' && meta.grabovoiCode) {
    return {
      label:'Código consultado',
      value:meta.grabovoiCode,
      detail:meta.grabovoiPurpose || reading.title || 'Secuencia de concentración simbólica'
    };
  }
  return null;
}

async function exportPDF(title, text, reading = lastReading) {
  const filename = safeFileName(title);
  try {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF) throw new Error('jsPDF no cargado');
    toast('Preparando PDF profesional...');
    const style = getPdfStyle();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const margin = 18;
    const gold = [218, 184, 72];
    const dark = style === 'light' || style === 'summary' ? [252, 248, 239] : [14, 13, 28];
    const violet = [38, 28, 72];
    const soft = style === 'light' || style === 'summary' ? [255, 255, 255] : [239, 234, 255];
    const ink = style === 'light' || style === 'summary' ? [35, 24, 16] : [38, 36, 48];
    const line = [196, 170, 83];
    const assets = resolveReadingAssets(reading);
    let { compact, long } = splitReadingText(text);
    if (style === 'summary') { long = ''; compact = compact.slice(0, 9); }
    const userName = localStorage.getItem(LS.name) || '';
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
      doc.text('Lectura simbolica premium v1.0', margin, 17);
      doc.setTextColor(style === 'light' || style === 'summary' ? 80 : 245, style === 'light' || style === 'summary' ? 58 : 239, style === 'light' || style === 'summary' ? 36 : 218);
      doc.setFontSize(9);
      doc.text(date, W - margin, 11, { align: 'right' });
      if (userName) doc.text(`Para: ${userName}`, W - margin, 17, { align: 'right' });
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
      doc.setTextColor(...gold);
      doc.setFontSize(reading?.type === 'Grabovoi' ? 20 : 16);
      doc.text(cleanPdfText(highlight.value), margin + 7, y + 15);
      doc.setTextColor(...ink);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(detailLines, margin + 7, y + 21);
      y += highlightH + 6;
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
        const label = cleanPdfText(asset.position || asset.name || `Elemento ${i + 1}`);
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
    toast('PDF no disponible. Exporté TXT.');
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
        <h3>Conexión segura</h3>
        <p>Abre la versión web en el navegador del teléfono para conectar Puter IA. La app seguirá funcionando con lecturas simbólicas, voz TTS del sistema, avatar, PDFs y biblioteca local.</p>
        <p class="notice">La sesión web y los datos locales de la app permanecen separados.</p>
      </div>`,
      actions: `<button class="btn primary" data-act="open-web-ai" type="button">Abrir versión web</button>
        <button class="btn" data-close-modal type="button">Ahora no</button>`
    });
    return false;
  }
  try {
    if (!window.puter?.auth) { toast('Puter todavía no está cargado.'); return false; }
    await window.puter.auth.signIn();
    localStorage.setItem(LS.puter, 'true');
    updateHome();
    toast('IA conectada.');
    return true;
  } catch {
    localStorage.setItem(LS.puter, 'false');
    updateHome();
    toast('No se pudo conectar Puter. Puedes usar el modo simbólico.');
    return false;
  }
}
async function askAI(prompt) {
  if (localStorage.getItem(LS.puter) !== 'true') {
    toast('Conecta Puter IA para profundizar esta lectura.');
    return '';
  }
  try {
    if (!window.puter?.ai?.chat) throw new Error('Puter AI no disponible');
    const languageNames = { es:'español', ca:'catalán', en:'inglés', fr:'francés', de:'alemán', zh:'chino simplificado' };
    const responseLanguage = languageNames[getAppLanguage()] || 'español';
    const personalizedPrompt = `${personalPrefix()}Responde en ${responseLanguage}. No incluyas iconos, emojis ni símbolos decorativos en la respuesta textual. ${prompt}`;
    const result = await window.puter.ai.chat(personalizedPrompt);
    if (typeof result === 'string') return cleanInterpretation(result);
    return cleanInterpretation(result?.message?.content || result?.text || String(result || ''));
  } catch (err) {
    toast('La IA falló. Se mantiene la lectura simbólica.');
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
    return { engine:'device', remoteVoice:'coral', voiceFilter:'all', keepScreenAwake:true, avatarStyle:'auto', avatarEnabled:true, avatarPosition:'right', avatarSize:'medium', avatarMood:'auto', avatarSpeechMode:'auto', ...getVoicePreset(saved.preset), ...migrated };
  }
  return { engine:'device', remoteVoice:'coral', preset:'mistica_femenina', language:'auto', localePreferenceVersion:3, voiceFilter:'all', keepScreenAwake:true, avatarStyle:'auto', avatarEnabled:true, avatarPosition:'right', avatarSize:'medium', avatarMood:'auto', avatarSpeechMode:'auto', ...getVoicePreset('mistica_femenina') };
}
function setVoicePrefs(prefs) {
  const preset = prefs.preset || getVoicePrefs().preset || 'mistica_femenina';
  const base = getVoicePreset(preset);
  storeSet(LS.voice, { engine:'device', remoteVoice:'coral', voiceFilter:'all', keepScreenAwake:true, avatarStyle:'auto', avatarEnabled:true, avatarPosition:'right', avatarSize:'medium', avatarMood:'auto', avatarSpeechMode:'auto', ...base, ...getVoicePrefs(), ...prefs, preset, localePreferenceVersion:3 });
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
    `<option value="all" ${selected === 'all' ? 'selected' : ''}>Todos los idiomas visibles</option>`]
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
      ? 'Se ha actualizado el catálogo de voces.'
      : platform === 'android' && !inventory.all.length
        ? 'Chrome no publica los nombres de Google TTS, pero la opción automática utilizará el motor y el idioma configurados en Android.'
        : platform === 'android'
          ? 'Catálogo de Android revisado. La opción automática usa siempre el motor TTS predeterminado.'
          : 'Catálogo revisado. En iPhone, si aún no aparece, cierra completamente la app y vuelve a abrirla.';
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
    <div class="result-card"><h3>iPhone o iPad</h3>
      <p>1. Abre Ajustes → Accesibilidad → Leer y hablar.<br>
      2. Entra en Voces → Español.<br>
      3. Elige el dialecto y descarga una voz mejorada o premium si aparece.<br>
      4. Vuelve a Oráculo Místico y pulsa “Volver a detectar”.</p>
      <p class="subtle">iOS puede mantener el mismo nombre aunque use la versión mejorada descargada. Safari decide qué voces expone a las páginas web.</p>
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
  openModal({ icon:'🎙️', title:'Mejorar voces', subtitle:`${inventory.spanish.length} voces españolas detectadas.`, body:`
    <div class="status-grid">
      <div class="status-card"><strong>Voces totales</strong><span>${inventory.all.length}</span></div>
      <div class="status-card"><strong>Españolas</strong><span>${inventory.spanish.length}</span></div>
      <div class="status-card"><strong>Locales visibles</strong><span>${inventory.local.length}</span></div>
      <div class="status-card"><strong>Dispositivo</strong><span>${platform==='ios'?'iPhone/iPad':platform==='android'?'Android':'Otro'}</span></div>
    </div>
    <p class="notice mt">${statusMessage ? `${escapeHTML(statusMessage)}<br>` : ''}${window.AndroidTTS ? 'Versión Android nativa: el catálogo procede directamente del motor TTS del teléfono.' : 'La app muestra todo el catálogo que este navegador permite consultar. Firefox, Chrome y Safari pueden mostrar listas diferentes aunque estén instaladas las mismas voces.'}</p>
    ${platform === 'ios' ? iosSteps : platform === 'android' ? androidSteps : iosSteps + androidSteps}
    <div class="actions mt"><button class="btn primary" data-act="refresh-voices">Volver a detectar</button><button class="btn" data-act="test-voice">Probar voz elegida</button>${window.AndroidTTS?.openSettings ? '<button class="btn" data-act="open-tts-settings">Ajustes TTS de Android</button>' : ''}</div>` });
}
function testVoiceSettings() {
  const current = getVoicePrefs();
  const value = (id, fallback) => $(id)?.value ?? fallback;
  const preset = value('#voicePreset', current.preset || 'mistica_femenina');
  setVoicePrefs({
    engine:value('#voiceEngine', current.engine || 'device'),
    remoteVoice:value('#remoteVoice', current.remoteVoice || 'coral'),
    voiceFilter:value('#voiceFilter', current.voiceFilter || 'all'),
    keepScreenAwake:value('#keepScreenAwake', String(current.keepScreenAwake !== false)) !== 'false',
    language:value('#voiceLanguage', current.language || 'auto'),
    deviceVoiceURI:value('#deviceVoiceURI', current.deviceVoiceURI || ''),
    preset,
    avatarStyle:value('#oracleAvatarStyle', current.avatarStyle || 'auto'),
    avatarEnabled:value('#oracleAvatarEnabled', String(current.avatarEnabled !== false)) !== 'false',
    avatarPosition:value('#oracleAvatarPosition', current.avatarPosition || 'right'),
    avatarSize:value('#oracleAvatarSize', current.avatarSize || 'medium'),
    avatarMood:value('#oracleAvatarMood', current.avatarMood || 'auto'),
    avatarSpeechMode:value('#oracleAvatarSpeechMode', current.avatarSpeechMode || 'auto'),
    rate:Number(value('#voiceRate', current.rate || getVoicePreset(preset).rate))
  });
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
      <div><small>Predomina</small><strong>${escapeHTML(visual.name)}</strong><p>${escapeHTML(clampText(visual.subtitle, 105))}</p></div>
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
  const isMale = style === 'male';
  const title = isMale ? 'Oráculo guardián' : 'Oráculo guía';
  const speechLabel = speechMode === 'whisper' ? 'Susurrando' : 'Canalizando';
  const portrait = isMale ? 'img/avatars/oracle-male-realistic.png' : 'img/avatars/oracle-female-realistic.png';
  const portraitMedium = isMale ? 'img/avatars/oracle-male-mouth-medium.png' : 'img/avatars/oracle-female-mouth-medium.png';
  const portraitOpen = isMale ? 'img/avatars/oracle-male-mouth-open.png' : 'img/avatars/oracle-female-mouth-open.png';
  const readingVisuals = getOracleReadingVisuals();
  return `
    <div class="oracle-avatar-window ${isMale ? 'male' : 'female'} theme-${theme} mood-${mood} mode-${speechMode} ${readingVisuals.length ? 'has-reading-visuals' : ''}">
      <button class="oracle-avatar-close" type="button" data-act="hide-avatar" aria-label="Cerrar avatar">×</button>
      <div class="oracle-avatar-stage">
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
  host.innerHTML = buildOracleAvatarHTML(resolveOracleAvatarStyle(prefs), cleaned, theme, mood, speechMode);
  applyOracleAvatarPrefs(host, prefs);
  host.classList.add('visible', 'speaking');
}
function updateOracleVoiceAvatarSpeaking(speaking = true) {
  const host = ensureOracleAvatarHost();
  host.classList.toggle('speaking', !!speaking);
  if (!speaking) stopOracleLipSync();
}
function setOracleMouthShape(shape = 'closed') {
  const frames = $$('.oracle-avatar-frame');
  if (!frames.length) return;
  frames.forEach(frame => frame.classList.toggle('active', frame.classList.contains(`frame-${shape}`)));
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
  const vowels = [...String(word)].filter(character => /[aeiouáéíóúü]/i.test(character));
  if (!vowels.length) return ['closed', 'medium', 'closed'];
  const sequence = ['closed'];
  vowels.forEach(character => {
    const shape = mouthShapeForCharacter(character);
    if (sequence[sequence.length - 1] !== shape) sequence.push(shape);
    sequence.push(shape === 'wide' ? 'medium' : 'closed');
  });
  sequence.push('closed');
  return sequence;
}
function syncOracleMouthToText(text = '', charIndex = 0, rate = 0.92) {
  const spoken = getSpokenWordAt(text, charIndex);
  if (!spoken.word) {
    stopOracleLipSync();
    return;
  }
  if (spoken.start === oracleLipWordStart && oracleLipTimer) return;
  stopOracleLipSync(false);
  oracleLipWordStart = spoken.start;
  const sequence = buildWordMouthSequence(spoken.word);
  const stepMs = Math.max(58, Math.min(125, (spoken.word.length * 58) / Math.max(sequence.length, 1) / Math.max(Number(rate) || 0.92, 0.55)));
  let index = 0;
  const advance = () => {
    setOracleMouthShape(sequence[index] || 'closed');
    index += 1;
    if (index < sequence.length) oracleLipTimer = setTimeout(advance, stepMs);
    else oracleLipTimer = setTimeout(() => {
      setOracleMouthShape('closed');
      oracleLipTimer = null;
    }, 45);
  };
  advance();
}
function startOracleLipSync(text = 'oráculo', rate = 0.92) {
  stopOracleLipSync(false);
  const source = String(text || 'oráculo');
  let charIndex = 0;
  const advance = () => {
    const character = source[charIndex % source.length] || ' ';
    const isPause = /[\s.,;:!?]/.test(character);
    setOracleMouthShape(isPause ? 'closed' : mouthShapeForCharacter(character));
    charIndex += 1;
    oracleLipTimer = setTimeout(advance, (isPause ? 145 : 82) / Math.max(Number(rate) || .92, .55));
  };
  advance();
}
function startRemoteAudioLipSync(audio, text = '') {
  stopOracleLipSync(false);
  const source = String(text || '');
  const estimatedDuration = Math.max(1, (source.split(/\s+/).filter(Boolean).length / 2.35));
  const tick = () => {
    if (!audio || audio.ended) {
      stopOracleLipSync();
      return;
    }
    if (audio.paused) {
      setOracleMouthShape('closed');
    } else {
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : estimatedDuration;
      const progress = Math.max(0, Math.min(0.999, (audio.currentTime || 0) / duration));
      const charIndex = Math.min(source.length - 1, Math.floor(progress * source.length));
      const character = source[Math.max(0, charIndex)] || ' ';
      setOracleMouthShape(/[\s.,;:!?]/.test(character) ? 'closed' : mouthShapeForCharacter(character));
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
  host.classList.remove('speaking');
  host.classList.remove('visible');
}
function previewOracleAvatar() {
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
    'Hay una advertencia: actúa con prudencia y cuida tus límites.',
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
  toast('Lectura reanudada al volver a la app.');
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
  if (!clean) return toast('No hay interpretación IA para leer.');
  stopSpeech();
  const prefs = getVoicePrefs();
  const usePuter = prefs.engine === 'puter' || (prefs.engine === 'auto' && localStorage.getItem(LS.puter) === 'true');
  if (usePuter) {
    const remoteOk = await speakWithPuter(clean);
    if (remoteOk) return;
    toast('La voz IA no está disponible. Uso la voz del dispositivo.');
  }
  const ok = speakWithDevice(clean);
  if (!ok) return toast('La voz no está disponible en este navegador.');
  const inventory = voiceInventory();
  if (!hasSpanishDeviceVoice() && inventory.all.length) toast('No detecto una voz española visible. Revisa el idioma TTS del dispositivo.');
  else if (getVoicePlatform() === 'android' && !inventory.all.length) toast('Usando Google TTS automático de Android.');
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
  if (!clean) return toast('Primero crea una lectura.');
  if (localStorage.getItem(LS.puter) !== 'true' && !(await connectPuter())) return;
  try {
    toast('Generando el audio MP3...');
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
    toast('MP3 preparado.');
  } catch (error) {
    pushErrorLog('download-tts-mp3', error?.message || error, lastReading?.title || '');
    toast('No se pudo descargar el MP3. Puedes escucharlo desde la app.');
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
  return `<button class="mic-btn" data-mic-target="${escapeHTML(targetId)}" type="button" aria-label="${escapeHTML(label)}">🎙️</button>`;
}
function speechRecognitionSupport() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}
function startDictation(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return toast('No encuentro el campo de texto.');
  const Recognition = speechRecognitionSupport();
  if (!Recognition) return toast('El micrófono no está disponible en este navegador. Prueba Chrome o revisa permisos.');
  try {
    const recognition = new Recognition();
    recognition.lang = getAppLocale();
    recognition.interimResults = true;
    recognition.continuous = false;
    const original = target.value || '';
    toast('Escuchando… habla ahora.');
    recognition.onresult = event => {
      const transcript = Array.from(event.results).map(r => r[0]?.transcript || '').join('\n\n').trim();
      target.value = `${original}${original && transcript ? ' ' : ''}${transcript}`.trim();
      target.dispatchEvent(new Event('input', { bubbles: true }));
    };
    recognition.onerror = () => toast('No se pudo usar el micrófono. Revisa permisos.');
    recognition.onend = () => target.focus();
    recognition.start();
  } catch {
    toast('El micrófono no se pudo iniciar en este dispositivo.');
  }
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
  $('#iaStatusChip').textContent = localStorage.getItem(LS.puter) === 'true' ? '🤖 IA: conectada' : `🤖 ${t('aiSymbolic')}`;
  const intention = localStorage.getItem(LS.intention) || getProfile().intention || 'libre';
  $('#intentionChip').textContent = `🧭 Intención: ${intention}${isPrivateMode() ? ' · privado' : ''}`;
  const platformChip = $('#platformStatusChip');
  if (platformChip) {
    const nativePlatform = window.AndroidTTS?.platform?.() || (window.AndroidTTS ? 'android' : '');
    platformChip.textContent = nativePlatform === 'ios' ? '📱 App iPhone' : nativePlatform === 'android' ? '📱 App Android' : `📱 ${t('installable')}`;
  }
  const prefs = storeGet(LS.prefs, {});
  document.body.classList.toggle('large-text', !!prefs.largeText);
  document.body.classList.toggle('high-contrast', !!prefs.highContrast);
  document.body.classList.toggle('private-mode', isPrivateMode());
  document.body.classList.toggle('focus-mode', isFocusMode());
  document.body.classList.toggle('performance-mode', isPerformanceMode());
  applyTheme();
}

function showGuide(force = false) {
  if (!force && localStorage.getItem(LS.guide) === 'yes') return;
  const currentName = escapeHTML(localStorage.getItem(LS.name) || '');
  openModal({
    icon: '✨', title: 'Guía inicial', subtitle: 'Solo aparece al entrar por primera vez.',
    body: `
      <div class="panel-grid">
        <div class="result-card"><h3>1. Pon tu nombre si quieres</h3><p>Es opcional y solo se guarda en este dispositivo para personalizar saludos y lecturas.</p></div>
        <div class="result-card"><h3>2. Prueba una primera tirada</h3><p>La app te guía con Tarot o Runas sin obligarte a conectar IA.</p></div>
        <div class="result-card"><h3>3. IA opcional</h3><p>Puedes ampliar algunas respuestas con IA, pero todas las funciones simbólicas están disponibles sin conectarla.</p></div>
        <div class="result-card"><h3>4. Todo bien organizado</h3><p>Usa la pantalla principal para entrar en cada apartado, Ajustes para personalizar y Biblioteca para guardar lecturas.</p></div>
      </div>
      <div class="field mt"><label>Nombre opcional</label>${inputWithMic('guideName', `value="${currentName}" placeholder="Tu nombre"`)}</div>
      <p class="notice mt">Uso simbólico y de entretenimiento. No sustituye consejo profesional.</p>`,
    actions: `<button class="btn primary" data-act="save-guide" type="button">Entrar a la app</button><button class="btn" data-act="first-reading" type="button">Primera tirada</button><button class="btn" data-act="connect-ai" type="button">Conectar IA</button>`
  });
}

function showFirstReading() {
  openModal({ icon: '✨', title: 'Primeras tiradas', subtitle: 'Elige una entrada sencilla.', body: `
    <div class="panel-grid">
      <button class="choice" data-act="tarot-one"><strong>🃏 Carta rápida</strong><small>Una carta para orientar tu pregunta.</small></button>
      <button class="choice" data-act="rune-one"><strong>ᚱ Runa rápida</strong><small>Un símbolo breve para empezar.</small></button>
      <button class="choice" data-act="tarot-three"><strong>🃏 Tirada 3 cartas</strong><small>Pasado, presente y consejo.</small></button>
      <button class="choice" data-module="numerologia"><strong>🔢 Numerología</strong><small>Perfil completo y sinastría entre dos personas.</small></button>
    </div>` });
}

function showMap() {
  const modules = [
    ['tarot','🃏','Tarot'], ['runas','ᚱ','Runas'], ['luna','🌙','Luna'], ['suenos','💭','Sueños'],
    ['numerologia','🔢','Numerología'], ['grabovoi','📜','Grabovoi'], ['biblioteca','📚','Biblioteca'], ['settings','⚙️','Ajustes']
  ];
  openModal({ icon:'🗺️', title:'Mapa de la app', subtitle:'Todos los apartados en un solo lugar.', body:`<div class="panel-grid">${modules.map(([m,i,t])=>`<button class="choice" data-module="${m}"><strong>${i} ${t}</strong><small>Abrir este apartado.</small></button>`).join('\n\n')}</div>` });
}

const TAROT_SPREADS = {
  one: { count: 1, icon:'🃏', title: 'Carta rápida', positions: ['Mensaje principal'] },
  three: { count: 3, icon:'⏳', title: 'Pasado · Presente · Futuro', positions: ['Pasado', 'Presente', 'Futuro'] },
  five: { count: 5, icon:'✨', title: 'Tirada de 5 cartas', positions: ['Situación', 'Reto', 'Apoyo', 'Consejo', 'Resultado probable'] },
  love: { count: 5, icon:'💕', title: 'Tirada del amor', positions: ['Tu energía', 'La otra energía', 'Vínculo', 'Bloqueo', 'Consejo'] },
  yesno: { count: 1, icon:'✅', title: 'Sí o No orientativo', positions: ['Respuesta simbólica'] },
  decision: { count: 4, icon:'⚖️', title: 'Tirada de decisión', positions: ['Opción A', 'Opción B', 'Lo que debes mirar', 'Consejo final'] },
  week: { count: 7, icon:'📅', title: 'Semana', positions: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] },
  chakras: { count: 7, icon:'🌈', title: '7 Chakras', positions: ['Raíz', 'Sacro', 'Plexo solar', 'Corazón', 'Garganta', 'Tercer ojo', 'Corona'] },
  horseshoe: { count: 7, icon:'🧲', title: 'Herradura', positions: ['Pasado', 'Presente', 'Influencias ocultas', 'Obstáculos', 'Entorno', 'Consejo', 'Resultado'] },
  star: { count: 5, icon:'⭐', title: 'Estrella', positions: ['Centro', 'Norte', 'Sur', 'Este', 'Oeste'] },
  pyramid: { count: 6, icon:'🔺', title: 'Pirámide', positions: ['Base 1', 'Base 2', 'Base 3', 'Puente 1', 'Puente 2', 'Cima'] },
  elements: { count: 5, icon:'🌍', title: '5 Elementos', positions: ['Fuego', 'Agua', 'Aire', 'Tierra', 'Espíritu'] },
  karma: { count: 5, icon:'🌀', title: 'Karma', positions: ['Origen', 'Patrón', 'Aprendizaje', 'Liberación', 'Consejo'] },
  work: { count: 5, icon:'💼', title: 'Trabajo / estudios', positions: ['Situación', 'Talento', 'Reto', 'Oportunidad', 'Consejo'] },
  blockage: { count: 4, icon:'🔓', title: 'Bloqueo y consejo', positions: ['Bloqueo', 'Origen', 'Llave', 'Paso práctico'] },
  relation: { count: 6, icon:'💞', title: 'Relación', positions: ['Tú', 'La otra persona', 'Lo que une', 'Lo que separa', 'Potencial', 'Consejo'] },
  month: { count: 12, icon:'🗓️', title: 'Mes completo', positions: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Amor', 'Trabajo', 'Energía', 'Sombra', 'Apoyo', 'Consejo', 'Resultado', 'Clave'] },
  celtic: { count: 10, icon:'✝️', title: 'Cruz Celta', positions: ['Situación actual', 'Cruce o reto', 'Base', 'Pasado reciente', 'Posible futuro', 'Próximo paso', 'Tu actitud', 'Entorno', 'Esperanzas o miedos', 'Resultado probable'] },
  astrologic: { count: 12, icon:'🌟', premium:true, title: 'Astrológica', positions: ['Casa 1 · Yo', 'Casa 2 · Recursos', 'Casa 3 · Comunicación', 'Casa 4 · Hogar', 'Casa 5 · Creatividad', 'Casa 6 · Rutina', 'Casa 7 · Vínculos', 'Casa 8 · Transformación', 'Casa 9 · Visión', 'Casa 10 · Propósito', 'Casa 11 · Comunidad', 'Casa 12 · Alma'] },
  karmicRelations: { count: 9, icon:'🌀', premium:true, title: 'Relaciones kármicas', positions: ['Origen', 'Vínculo', 'Lección', 'Herida', 'Don', 'Bloqueo', 'Liberación', 'Potencial', 'Consejo'] },
  treeLife: { count: 10, icon:'🌳', premium:true, title: 'Árbol de la Vida', positions: ['Kéter', 'Jokmá', 'Biná', 'Jésed', 'Guevurá', 'Tiféret', 'Nétsaj', 'Hod', 'Yesod', 'Maljut'] }
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
  return { birth:'', sign:'', intention:'Claridad', favoriteSpread:'three', favoriteModule:'Tarot', ...(storeGet(LS.profile, {}) || {}) };
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
  if (!item) return toast('No se encontró la lectura.');
  lastReading = { ...item };
  openModal({ icon:'📚', title:item.title || 'Lectura guardada', subtitle:item.type || 'Biblioteca', body:`<div class="result-card"><p>${escapeHTML(item.text || '').replace(/\n/g,'<br>')}</p>${readingActions(item.text || '', item.type || 'Lectura')}</div>` });
}

function showControlCenter() {
  openModal({ icon:'🧭', title:'Centro de control', subtitle:getAppVersionLabel(), body:`<div class="status-grid"><div class="status-card"><strong>Lecturas</strong><span>${storeGet(LS.diary, []).length}</span></div><div class="status-card"><strong>Modo privado</strong><span>${isPrivateMode()?'Activo':'Inactivo'}</span></div><div class="status-card"><strong>IA</strong><span>${localStorage.getItem(LS.puter)==='true'?'Conectada':'Simbólica'}</span></div><div class="status-card"><strong>Instalación</strong><span>${'serviceWorker' in navigator?'Disponible':'Solo navegador'}</span></div></div><div class="panel-grid mt"><button class="choice" data-act="global-search"><strong>🔎 Buscar</strong></button><button class="choice" data-act="privacy-center"><strong>🔒 Privacidad</strong></button><button class="choice" data-act="backup-data"><strong>🧳 Backup</strong></button><button class="choice" data-act="install-help"><strong>📲 Instalar</strong></button></div>` });
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
  openModal({ icon:'🧾', title:'Registro de errores', subtitle:`${errors.length} entradas locales.`, body:`<div class="diary-list">${errors.map(error=>`<article class="diary-item"><strong>${escapeHTML(error.source)}</strong><small>${escapeHTML(error.date || '')}</small><p>${escapeHTML(error.message)}</p></article>`).join('') || '<p class="subtle">No hay errores registrados.</p>'}</div><div class="actions mt"><button class="btn" data-act="download-error-log">Descargar</button><button class="btn danger" data-act="clear-error-log">Vaciar</button></div>` });
}
function clearErrorLog() { storeSet(LS.errorLog, []); showErrorLog(); }
function downloadErrorLog() { downloadTextFile('oraculo-errores.json', JSON.stringify(storeGet(LS.errorLog, []), null, 2)); }

function showPdfOptions() {
  if (!lastReading) return toast('Primero crea una lectura.');
  openModal({ icon:'📄', title:'Estilo del PDF', subtitle:'Elige el formato de exportación.', body:`<div class="panel-grid"><button class="choice" data-act="pdf-style-premium"><strong>Premium místico</strong></button><button class="choice" data-act="pdf-style-light"><strong>Claro elegante</strong></button><button class="choice" data-act="pdf-style-summary"><strong>Resumen</strong></button></div>` });
}
function exportDiaryPDF() {
  const diary = storeGet(LS.diary, []);
  const text = diary.map(item=>`${item.title}\n${item.text}`).join('\n\n---\n\n');
  exportPDF('Biblioteca Mística', text || 'Sin lecturas guardadas.', null);
}
function showPublicLaunch() {
  openModal({ icon:'📣', title:'Publicación', subtitle:'Recursos para presentar la app.', body:`<div class="result-card"><h3>Texto breve</h3><p>Oráculo Místico reúne tarot, runas, luna, sueños, numerología y diario en una PWA simbólica.</p></div><div class="actions mt"><button class="btn" data-act="copy-short-public-text">Copiar texto breve</button><button class="btn" data-act="share-app">Compartir app</button><button class="btn" data-act="public-package">Paquete público</button></div>` });
}
function showPublicPackage() {
  openModal({ icon:'📦', title:'Paquete público', subtitle:'Elementos mínimos para publicar.', body:`<div class="result-card"><p>Incluye la app completa, manual, política de privacidad y notas de versión. Completa los datos legales antes de difundirla.</p></div><div class="actions"><button class="btn" data-act="download-readme">Descargar README</button><button class="btn" data-act="copy-public-text">Copiar presentación</button></div>` });
}
function publicText(short = false) {
  return short ? 'Descubre Oráculo Místico: tarot, runas, luna, sueños y diario en una PWA simbólica.'
    : 'Oráculo Místico es una experiencia simbólica y de entretenimiento con tarot, runas, luna, sueños, numerología, diario local, voz y exportación PDF.';
}
function copyShortPublicText() { copyText(publicText(true)); }
function copyPublicText() { copyText(publicText(false)); }
function shareApp() { shareText(`${publicText(true)}\n${location.href}`, 'Oráculo Místico'); }
function downloadReadme() { downloadTextFile('README-Oraculo-Mistico.txt', `${publicText(false)}\n\n${location.href}`); }
function showShareVisual() { openModal({ icon:'🖼️', title:'Tarjeta para compartir', body:`<div class="result-card center"><h3>${escapeHTML(lastReading?.title || 'Oráculo Místico')}</h3><p>${escapeHTML(clampText(getReadingText() || publicText(true), 320))}</p></div><div class="actions"><button class="btn" data-act="download-share-card">Descargar texto</button></div>` }); }
function downloadShareCard() { downloadTextFile('tarjeta-oraculo.txt', getReadingText() || publicText(true)); }

function showInstallHelp() {
  openModal({ icon:'📲', title:'Instalar la app', subtitle:'Añádela a tu pantalla de inicio.', body:`<div class="result-card"><h3>Chrome y Edge</h3><p>Usa el botón Instalar de la barra de direcciones.</p><h3>Safari en iPhone o iPad</h3><p>Compartir → Añadir a pantalla de inicio.</p><h3>Firefox</h3><p>La instalación depende del sistema; también puedes guardar un acceso directo.</p></div><div class="actions"><button class="btn primary" data-act="try-install-pwa">Intentar instalar</button></div>` });
}
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredInstallPrompt = event; });
async function tryInstallPWA() {
  if (!deferredInstallPrompt) return toast('Usa la opción Instalar del navegador.');
  deferredInstallPrompt.prompt();
  try { await deferredInstallPrompt.userChoice; } catch {}
  deferredInstallPrompt = null;
}
function showAppTutorial() {
  openModal({ icon:'🎓', title:'Tutorial', subtitle:'Empieza en menos de un minuto.', body:`<div class="panel-grid"><div class="result-card"><h3>1. Elige un módulo</h3><p>Prueba Tarot, Runas o el mensaje diario.</p></div><div class="result-card"><h3>2. Guarda</h3><p>Conserva tus lecturas en la Biblioteca local.</p></div><div class="result-card"><h3>3. Personaliza</h3><p>Ajusta voz, tema y privacidad.</p></div><div class="result-card"><h3>4. IA opcional</h3><p>Conecta Puter solo si quieres ampliar una lectura.</p></div></div>` });
}
function showSuggestedQuestions() { openModal({ icon:'💡', title:'Preguntas sugeridas', body:`<div class="diary-list">${['¿Qué necesito observar hoy?','¿Qué bloquea mi siguiente paso?','¿Qué energía acompaña mi relación?','¿Qué puedo aprender de este sueño?'].map(q=>`<button class="choice" data-copy-question="${escapeHTML(q)}">${escapeHTML(q)}</button>`).join('')}</div>` }); }
function showHelpCenter() { showAppTutorial(); }
function showWhatsNew() { openModal({ icon:'✨', title:'Novedades', subtitle:getAppVersionLabel(), body:'<div class="result-card"><p>Correcciones de Firefox, arranque, migración, estabilidad y centros internos restaurados.</p></div>' }); }
function showReportTemplate() { openModal({ icon:'🐞', title:'Informar de un problema', body:`<div class="result-card"><p>Navegador y versión:<br>Dispositivo:<br>Acción realizada:<br>Resultado esperado:<br>Error visible:</p></div><button class="btn" data-act="copy-bug-template">Copiar plantilla</button>` }); }
function copyBugTemplate() { copyText('Navegador y versión:\\nDispositivo:\\nAcción realizada:\\nResultado esperado:\\nError visible:'); }
function diagnosticsText() { return JSON.stringify({ ...appSummary(), url:location.href, userAgent:navigator.userAgent, errors:storeGet(LS.errorLog, []) }, null, 2); }
function showDiagnostics() { openModal({ icon:'🩺', title:'Diagnóstico', body:`<pre class="result-card">${escapeHTML(diagnosticsText())}</pre><div class="actions"><button class="btn" data-act="copy-diagnostics">Copiar</button><button class="btn" data-act="download-diagnostics">Descargar</button></div>` }); }
function copyDiagnostics() { copyText(diagnosticsText()); }
function downloadDiagnostics() { downloadTextFile('oraculo-diagnostico.json', diagnosticsText()); }

const SEARCH_ITEMS = [
  ['Tarot','tarot'], ['Runas','runas'], ['Luna','luna'], ['Sueños','suenos'],
  ['Numerología','numerologia'], ['Grabovoi','grabovoi'], ['Biblioteca','biblioteca'], ['Chat Ritual','chat']
];
function renderGlobalSearchResults(query = '') {
  const q = query.toLowerCase().trim();
  const items = SEARCH_ITEMS.filter(([label]) => !q || label.toLowerCase().includes(q));
  return items.map(([label,module])=>`<button class="choice" data-module="${module}"><strong>${escapeHTML(label)}</strong><small>Abrir módulo</small></button>`).join('') || '<p class="subtle">Sin resultados.</p>';
}
function showGlobalSearch() { openModal({ icon:'🔎', title:'Buscar', body:`<div class="field"><label>Buscar módulo</label><input id="globalSearchInput" class="input" placeholder="Tarot, luna, biblioteca..."></div><div id="globalSearchResults" class="diary-list mt">${renderGlobalSearchResults()}</div>` }); }
function showPrivacyCenter() {
  openModal({ icon:'🔒', title:'Privacidad y datos', subtitle:'Tus datos se guardan localmente.', body:`<div class="result-card"><p>Las lecturas, el perfil y el chat permanecen en este navegador. Al usar Puter IA, el texto enviado se procesa mediante ese servicio.</p><p><a href="privacy.html" target="_blank" rel="noopener">Leer política de privacidad</a></p></div><div class="actions"><button class="btn" data-act="backup-data">Crear backup</button><button class="btn" data-act="clear-chat">Borrar chat</button><button class="btn" data-act="clear-profile">Borrar perfil</button><button class="btn danger" data-act="factory-reset">Restablecer app</button></div>` });
}
function clearChatData() { if (confirm('¿Borrar el chat local?')) { storeSet(LS.chat, []); toast('Chat borrado.'); } }
function clearProfileData() { if (confirm('¿Borrar el perfil local?')) { localStorage.removeItem(LS.name); localStorage.removeItem(LS.profile); localStorage.removeItem(LS.intention); updateHome(); toast('Perfil borrado.'); } }
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
  openModal({ icon:'🏆', title:'Logros', body:`<div class="diary-list">${Object.entries(ACHIEVEMENT_LABELS).map(([id,label])=>`<div class="result-card"><strong>${unlocked[id]?'🏆':'🔒'} ${label}</strong></div>`).join('')}</div>` });
}
function showGuidedReveal() { openModal({ icon:'🕯️', title:'Tirada guiada', subtitle:'Respira y revela tres cartas.', body:'<div class="result-card"><p>Formula tu pregunta y pulsa comenzar. Las cartas se mostrarán con la ceremonia configurada.</p></div><button class="btn primary" data-act="start-guided-three">Comenzar</button>' }); }
function startGuidedThree() { drawTarotSpread('three'); }
function guidedNext() { return; }
function saveDailyReflection() {
  const entries = storeGet(LS.dailyJournal, []);
  entries.unshift({ date:new Date().toISOString(), mood:$('#dailyMood')?.value || '', intention:$('#dailyIntention')?.value || '', reflection:$('#dailyReflection')?.value || '' });
  storeSet(LS.dailyJournal, entries.slice(0, 365));
  toast('Ritual diario guardado.');
}
function showDailyHistory() {
  const entries = storeGet(LS.dailyJournal, []);
  openModal({ icon:'📅', title:'Historial diario', subtitle:`${entries.length} entradas.`, body:`<div class="diary-list">${entries.map(entry=>`<article class="diary-item"><strong>${new Date(entry.date).toLocaleDateString()}</strong><p>${escapeHTML(entry.mood)} · ${escapeHTML(entry.intention)}</p><p>${escapeHTML(entry.reflection)}</p></article>`).join('') || '<p class="subtle">Todavía no hay reflexiones.</p>'}</div>` });
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
  const diary = storeGet(LS.diary, []);
  const favs = diary.filter(d => d.favorite).slice(0, 3);
  const last = diary.slice(0, 3);
  const name = escapeHTML(getUserName() || 'Sin nombre');
  openModal({ icon:'🪬', title:'Mi Oráculo', subtitle:'Tu espacio personal dentro de la app.', body:`
    <div class="profile-hero">
      <div class="profile-orb">🪬</div>
      <div><h3>${name}</h3><p>Intención: <strong>${escapeHTML(profile.intention || 'Claridad')}</strong> · Signo: <strong>${escapeHTML(profile.sign || 'No indicado')}</strong></p><p>Modo privado: <strong>${isPrivateMode()?'Activado':'Desactivado'}</strong></p></div>
    </div>
    <div class="form-grid mt">
      <div class="field"><label>Fecha de nacimiento</label><input class="input" id="profileBirth" type="date" value="${escapeHTML(profile.birth || '')}"></div>
      <div class="field"><label>Signo / energía</label><input class="input" id="profileSign" value="${escapeHTML(profile.sign || '')}" placeholder="Aries, Luna, Agua..."></div>
      <div class="field"><label>Intención principal</label><input class="input" id="profileIntention" value="${escapeHTML(profile.intention || '')}" placeholder="Claridad, amor, calma..."></div>
      <div class="field"><label>Tirada favorita</label><select id="profileSpread"><option value="one" ${profile.favoriteSpread==='one'?'selected':''}>Carta rápida</option><option value="three" ${(profile.favoriteSpread||'three')==='three'?'selected':''}>Pasado · Presente · Futuro</option><option value="love" ${profile.favoriteSpread==='love'?'selected':''}>Amor</option><option value="decision" ${profile.favoriteSpread==='decision'?'selected':''}>Decisión</option><option value="celtic" ${profile.favoriteSpread==='celtic'?'selected':''}>Cruz Celta</option></select></div>
    </div>
    <div class="actions mt"><button class="btn primary" data-act="save-profile">Guardar Mi Oráculo</button><button class="btn" data-act="profile-favorite-spread">Tirada favorita</button><button class="btn" data-act="toggle-private">Modo privado ${isPrivateMode()?'OFF':'ON'}</button></div>
    <h3 class="section-title">Favoritas</h3>
    <div class="mini-history">${favs.map(d=>`<article><strong>${escapeHTML(d.title)}</strong><small>${new Date(d.date || Date.now()).toLocaleDateString()}</small><p>${escapeHTML(clampText(d.text,120))}</p></article>`).join('') || '<p class="subtle">Marca lecturas como favoritas desde Biblioteca.</p>'}</div>
    <h3 class="section-title">Últimas lecturas</h3>
    <div class="mini-history">${last.map(d=>`<article><strong>${escapeHTML(d.title)}</strong><small>${new Date(d.date || Date.now()).toLocaleDateString()}</small><p>${escapeHTML(clampText(d.text,120))}</p></article>`).join('') || '<p class="subtle">Todavía no hay lecturas guardadas.</p>'}</div>` });
}
function importBackupFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || '{}'));
      const preview = showBackupPreview(data);
      if (!validateBackupData(data).valid) return toast('Backup no válido.');
      if (!confirm(`${preview}\n\n¿Restaurar este backup? Se reemplazarán diario, ajustes compatibles, perfil y chat.`)) return;
      if (data.name !== undefined) localStorage.setItem(LS.name, data.name || '');
      if (data.prefs) storeSet(LS.prefs, data.prefs);
      if (data.voice) storeSet(LS.voice, data.voice);
      if (data.ceremony) storeSet('oraculo.ceremony.v1', data.ceremony);
      if (data.profile) storeSet(LS.profile, data.profile);
      if (data.theme) localStorage.setItem(LS.theme, data.theme);
      if (data.pdfStyle) localStorage.setItem(LS.pdfStyle, data.pdfStyle);
      if (Array.isArray(data.diary)) storeSet(LS.diary, data.diary);
      if (Array.isArray(data.chat)) storeSet(LS.chat, data.chat);
      migrateData();
      applyTheme();
      updateHome();
      toast('Backup restaurado.');
      showMiOraculo();
    } catch (err) {
      pushErrorLog('import-backup', err?.message || err, 'importBackupFromFile');
      toast('Backup no válido.');
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
function ceremonyTone(kind = 'reveal') {
  const prefs = getCeremonyPrefs();
  if (!prefs.sounds) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = window.__oraculoAudioCtx || (window.__oraculoAudioCtx = new AudioContext());
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const freq = kind === 'shuffle' ? 196 : kind === 'rune' ? 174 : 432;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.45, now + .16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + .03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + .38);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + .42);
  } catch {}
}
function openCeremonyIntro(kind = 'tarot') {
  const isTarot = kind === 'tarot';
  openModal({ icon:isTarot?'🃏':'ᚱ', title:isTarot?'Ritual de Tarot':'Ritual de Runas', subtitle:'Antes de empezar, respira y formula tu intención.', body:`
    <div class="ceremony-intro">
      <div class="ceremony-orb">${isTarot?'🔮':'ᚱ'}</div>
      <h3>${isTarot?'El mazo está preparado':'El saquito está preparado'}</h3>
      <p>Elige una pregunta clara, respira tres veces y deja que la lectura se revele con calma. Puedes activar sonidos y vibración desde Ajustes.</p>
      <div class="actions mt"><button class="btn primary" data-module="${isTarot?'tarot':'runas'}">${isTarot?'Elegir tirada':'Elegir runas'}</button><button class="btn" data-act="settings">Ajustes</button></div>
    </div>` });
}
function getAppVersionLabel() { return 'v1.0'; }
function appHealthCheck() {
  const voices = ('speechSynthesis' in window) ? speechSynthesis.getVoices().length : 0;
  openModal({ icon:'🧪', title:'Estado de la app', subtitle:getAppVersionLabel(), body:`
    <div class="status-grid">
      <div class="status-card"><strong>Versión</strong><span>${getAppVersionLabel()}</span></div>
      <div class="status-card"><strong>Voces detectadas</strong><span>${voices}</span></div>
      <div class="status-card"><strong>IA</strong><span>${localStorage.getItem(LS.puter)==='true'?'Conectada':'Modo simbólico'}</span></div>
      <div class="status-card"><strong>PWA</strong><span>${navigator.serviceWorker?'Compatible':'No disponible'}</span></div>
    </div>
    <p class="notice mt">Si después de subir una versión ves algo raro, pulsa “Limpiar caché y recargar” en Ajustes.</p>` });
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
  const linesOnly = cards.map((c, i) => `${i + 1}. ${c.position ? c.position + ' — ' : ''}${c.card.name}${c.rev ? ' invertida' : ''}: ${c.rev ? c.card.rv : c.card.up}`).join('\n\n');
  const lines = question ? `Pregunta: ${question}

${linesOnly}` : linesOnly;
  setLastReading({ type: 'Tarot', title, text: lines, items: cards.map(c => ({ kind:'tarot', name:c.card.name, subtitle:c.card.key || c.card.el || '', image:c.card.img || '', symbol:'🃏', position:c.position || '', reversed:!!c.rev })) });
  const content = cards.length === 1 ? `
    <div class="reading-layout">
      <div>${cardImage(cards[0].card)}</div>
      <div class="result-card"><h3>${escapeHTML(cards[0].card.name)} ${cards[0].rev ? 'invertida' : ''}</h3>${question ? `<p><strong>Pregunta:</strong> ${escapeHTML(question)}</p>` : ''}<p>${escapeHTML(cards[0].rev ? cards[0].card.rv : cards[0].card.up)}</p><p><strong>Clave:</strong> ${escapeHTML(cards[0].card.key || '')}</p>${readingActions(lines,'Tarot')}</div>
    </div>` : `
    <div class="library-grid">${cards.map(c=>`<button class="mini-card" data-card-name="${escapeHTML(c.card.name)}">${c.card.img ? `<img src="${escapeHTML(c.card.img)}" alt="${escapeHTML(c.card.name)}">` : ''}<strong>${escapeHTML(c.card.name)}</strong><small>${escapeHTML(c.position || (c.rev ? 'Invertida' : 'Normal'))}</small></button>`).join('\n\n')}</div>
    <div class="result-card"><h3>${escapeHTML(title)}</h3>${question ? `<p><strong>Pregunta:</strong> ${escapeHTML(question)}</p>` : ''}<p>${escapeHTML(linesOnly).replace(/\n/g,'<br>')}</p>${readingActions(lines,'Tarot')}</div>`;
  openModal({ icon:'🃏', title, subtitle:'Lectura completa.', body: content });
}
function animateTarotReading(cards, title = 'Lectura de Tarot', reversedRate = 0.3) {
  const question = $('#tarotPrompt')?.value?.trim() || '';
  const linesOnly = cards.map((c, i) => `${i + 1}. ${c.position ? c.position + ' — ' : ''}${c.card.name}${c.rev ? ' invertida' : ''}: ${c.rev ? c.card.rv : c.card.up}`).join('\\n\\n');
  const lines = question ? `Pregunta: ${question}\\n\\n${linesOnly}` : linesOnly;
  setLastReading({ type: 'Tarot', title, text: lines, items: cards.map(c => ({ kind:'tarot', name:c.card.name, subtitle:c.card.key || c.card.el || '', image:c.card.img || '', symbol:'🃏', position:c.position || '', reversed:!!c.rev })), meta:{ reversedRate } });
  ceremonyTone('shuffle');
  ceremonyVibrate([18, 40, 18]);
  openModal({ icon:'🃏', title, subtitle:'Experiencia ritual con revelación espectacular carta a carta.', body:`
    <div class="draw-experience spectacular-stage tarot-stage">
      <div class="ritual-particles">${Array.from({length:12}, (_,i)=>`<span style="--i:${i}"></span>`).join('')}</div>
      <div class="channeling card-glow ritual-banner"><span class="orb-pulse">🔮</span><div><h3>El oráculo invoca tu tirada...</h3><p>Respira hondo y siente cómo el mazo se abre ante ti. Cada carta aparecerá como un portal simbólico.</p></div></div>
      <div id="tarotShuffleBoard" class="shuffle-board tarot-board deluxe-board"><div class="altar-ring"></div><img src="img/tarot-shuffle-hero.svg" alt="Mezcla de cartas del oráculo" class="shuffle-hero tarot-hero">${cards.map((c, i) => `<div class="card-back shuffle-card deluxe-card" style="--i:${i}"><div class="card-back-inner"><span class="back-logo">🔮</span><strong>Oráculo</strong><small>${c.rev ? 'Invertida' : 'Directa'}</small></div></div>`).join('')}</div>
      <div id="tarotRevealGrid" class="draw-reveal-grid tarot-reveal-grid tarot-count-${cards.length}">${cards.map((c, i) => `<div class="reveal-slot tarot-slot waiting cinematic-slot" id="tarot-slot-${i}"><div class="slot-aura"></div><div class="slot-label">${escapeHTML(c.position || `Carta ${i + 1}`)}</div><div class="slot-wait">El velo se está abriendo...</div></div>`).join('')}</div>
      <div id="tarotResultWrap" class="hidden"></div>
    </div>` });
  cards.forEach((item, index) => {
    setTimeout(() => {
      const slot = $(`#tarot-slot-${index}`);
      if (!slot) return;
      slot.className = 'reveal-slot tarot-slot revealed cinematic-slot';
      ceremonyTone('reveal'); ceremonyVibrate(28);
      slot.innerHTML = `<div class="slot-aura reveal-burst"></div><div class="slot-label">${escapeHTML(item.position || `Carta ${index + 1}`)}</div><div class="card-frame ${item.rev ? 'reversed' : ''}">${cardImage(item.card)}${item.card.num ? `<span class="card-roman">${escapeHTML(item.card.num)}</span>` : ''}<strong>${escapeHTML(item.card.name)}</strong>${item.card.key ? `<span class="card-keys">${escapeHTML(item.card.key)}${item.card.el ? ' · ' + escapeHTML(item.card.el) : ''}</span>` : ''}<small>${item.rev ? 'Invertida · carta girada 180°' : 'Al derecho'}</small></div>`;
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
    wrap.innerHTML = `<div class="result-card ritual-result"><h3>${escapeHTML(title)}</h3>${question ? `<p><strong>Pregunta:</strong> ${escapeHTML(question)}</p>` : ''}<p>${escapeHTML(linesOnly).replace(/\\n/g,'<br>')}</p>${reversalRateNotice(reversedRate)}${readingActions(lines,'Tarot')}</div>`;
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
  drawTarot(spread.count, spread.title, spread.positions);
}

/* Puente para la capa V2: el ritual necesita las tiradas y el mazo, y
   entregar las cartas que la persona ha elegido a la misma revelación
   de siempre. Se expone lo mínimo; la lógica sigue viviendo aquí. */
/* Todo el saber que la app ya contenía, disponible para la Biblioteca.
   Estaba repartido en catálogos de cada módulo; aquí solo se expone. */
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
  return `<button class="spread-card" data-act="spread-${escapeHTML(key)}" type="button"><span>${spread.icon || '🃏'}</span><strong>${escapeHTML(spread.title)}</strong><small>${spread.count} carta${spread.count > 1 ? 's' : ''}</small></button>`;
}
function showTarot() {
  const normalKeys = Object.keys(TAROT_SPREADS).filter(k => !TAROT_SPREADS[k].premium);
  const premiumKeys = Object.keys(TAROT_SPREADS).filter(k => TAROT_SPREADS[k].premium);
  openModal({ icon:'🃏', title:'Tarot', subtitle:'Elige la tirada y deja que las cartas se mezclen y se revelen una a una.', body:`
    <div class="field"><label>Pregunta opcional</label>${inputWithMic('tarotPrompt', 'placeholder="¿Qué necesito saber hoy?"')}</div>
    <div class="actions mt"><button class="btn primary" data-act="ceremony-tarot" type="button">✨ Ritual guiado</button><button class="btn" data-module="runas" type="button">ᚱ Tiradas de Runas</button><button class="btn" data-act="tarot-library" type="button">📚 Biblioteca 78 cartas</button></div>
    <div class="spread-grid mt">${normalKeys.map(k => renderSpreadButton(k, TAROT_SPREADS[k])).join('\n\n')}</div>
    <hr class="soft-line"><h3 class="section-title">✨ Tiradas Premium ✨</h3>
    <div class="spread-grid premium-spreads">${premiumKeys.map(k => renderSpreadButton(k, TAROT_SPREADS[k])).join('\n\n')}</div>
    <p class="notice mt">Todas las tiradas incluyen interpretación, voz, guardado, opciones para compartir y exportación en PDF.</p>` });
}
function showTarotLibrary(filter = 'all') {
  const tabs = `<div class="tabs"><button class="tab ${filter==='all'?'active':''}" data-act="tarot-lib-all">Todas</button><button class="tab ${filter==='major'?'active':''}" data-act="tarot-lib-major">Mayores</button><button class="tab ${filter==='minor'?'active':''}" data-act="tarot-lib-minor">Menores</button></div>`;
  const cards = filter === 'major' ? MAJOR_ARCANA : filter === 'minor' ? MINOR_ARCANA : ALL_TAROT;
  openModal({ icon:'🃏', title:'Biblioteca de Tarot', subtitle:`${cards.length} cartas visibles en galería.`, body:`${tabs}<div class="library-grid">${cards.map(c=>`<button class="mini-card" data-open-card="${escapeHTML(c.name)}">${c.img ? `<img src="${escapeHTML(thumbFor(c.img))}" alt="${escapeHTML(c.name)}" loading="lazy" decoding="async">` : ''}<strong>${escapeHTML(c.name)}</strong><small>${escapeHTML(c.key || c.el || '')}</small></button>`).join('\n\n')}</div>` });
}
function showCardDetail(card) {
  setLastReading({ type: 'Tarot', title: card.name, text: `${card.up}\n\nInvertida: ${card.rv}`, items: [card.name] });
  openModal({ icon:'🃏', title:card.name, subtitle:card.key || card.el || 'Carta de Tarot', body:`<div class="reading-layout"><div>${cardImage(card)}</div><div class="result-card"><h3>Al derecho</h3><p>${escapeHTML(card.up)}</p><h3>Invertida</h3><p>${escapeHTML(card.rv || 'Sin lectura invertida específica.')}</p>${readingActions(`${card.name}\n${card.up}`,'Tarot')}</div></div>` });
}

function runeReading(runes, title = 'Lectura de Runas') {
  const lines = runes.map((r, i) => `${i + 1}. ${r.rune.name} ${r.rev ? 'invertida' : ''}: ${r.rev ? (r.rune.rv || r.rune.up) : r.rune.up}`).join('\n\n');
  setLastReading({ type: 'Runas', title, text: lines, items: runes.map(r => ({ kind:'runa', name:r.rune.name, subtitle:r.rune.up || '', image:r.rune.img || '', symbol:r.rune.sym || 'ᚱ', reversed:!!r.rev })) });
  const body = runes.length === 1 ? `<div class="reading-layout"><div class="rune-big${runes[0].rune.img ? ' has-art' : ''}">${runes[0].rune.img ? `<img src="${escapeHTML(runes[0].rune.img)}" alt="${escapeHTML(runes[0].rune.name)}"><span class="rune-glyph">${runes[0].rune.sym}</span>` : runes[0].rune.sym}</div><div class="result-card"><h3>${escapeHTML(runes[0].rune.name)} ${runes[0].rev ? 'invertida' : ''}</h3><p>${escapeHTML(runes[0].rev ? (runes[0].rune.rv || runes[0].rune.up) : runes[0].rune.up)}</p>${readingActions(lines,'Runas')}</div></div>` : `<div class="library-grid">${runes.map(r=>`<div class="mini-card rune-mini">${r.rune.img ? `<img src="${escapeHTML(thumbFor(r.rune.img))}" alt="${escapeHTML(r.rune.name)}" loading="lazy" decoding="async">` : `<span class="symbol">${r.rune.sym}</span>`}<strong>${r.rune.sym} ${escapeHTML(r.rune.name)}</strong><small>${r.rev ? 'Invertida' : 'Normal'}</small></div>`).join('\n\n')}</div><div class="result-card"><h3>${escapeHTML(title)}</h3><p>${escapeHTML(lines).replace(/\n/g,'<br>')}</p>${readingActions(lines,'Runas')}</div>`;
  openModal({ icon:'ᚱ', title, subtitle:'Lectura completa.', body });
}
function animateRuneReading(runes, title = 'Lectura de Runas', reversedRate = 0.3) {
  const lines = runes.map((r, i) => `${i + 1}. ${r.rune.name} ${r.rev ? 'invertida' : ''}: ${r.rev ? (r.rune.rv || r.rune.up) : r.rune.up}`).join('\n\n');
  setLastReading({ type: 'Runas', title, text: lines, items: runes.map(r => ({ kind:'runa', name:r.rune.name, subtitle:r.rune.up || '', image:r.rune.img || '', symbol:r.rune.sym || 'ᚱ', reversed:!!r.rev })), meta:{ reversedRate } });
  ceremonyTone('shuffle');
  ceremonyVibrate([14, 35, 14]);
  openModal({ icon:'ᚱ', title, subtitle:'Ritual rúnico inmersivo con aparición una a una.', body:`
    <div class="draw-experience spectacular-stage rune-stage">
      <div class="ritual-particles rune-particles">${Array.from({length:10}, (_,i)=>`<span style="--i:${i}"></span>`).join('')}</div>
      <div class="channeling card-glow ritual-banner"><span class="orb-pulse">✨</span><div><h3>El saquito rúnico despierta...</h3><p>Las piedras sagradas se agitan y emergen con una presencia más intensa y ceremonial.</p></div></div>
      <div class="rune-bag-stage deluxe-rune-stage"><div class="rune-vortex"></div><img src="img/rune-pouch.svg" id="runeBag" class="rune-bag-image deluxe-pouch" alt="Saquito místico de runas"><p class="notice">Concéntrate: cada runa aparecerá desde el saquito como si emergiera de un altar.</p></div>
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
    wrap.innerHTML = `<div class="result-card ritual-result"><h3>${escapeHTML(title)}</h3><p>${escapeHTML(lines).replace(/\\n/g,'<br>')}</p>${reversalRateNotice(reversedRate)}${readingActions(lines,'Runas')}</div>`;
  }, ceremonyDelay(1450 + runes.length * 1100));
}
function drawRunes(count = 1, title = 'Runa rápida') {
  const reversedRate = chooseReversedRate();
  const runes = [...RUNAS].sort(() => Math.random() - .5).slice(0, count).map(rune => ({ rune, rev: Boolean(rune.rv) && isReversed(reversedRate) }));
  animateRuneReading(runes, title, reversedRate);
}
function showRunas() {
  openModal({ icon:'ᚱ', title:'Runas', subtitle:'Runa rápida, tiradas y saquito místico con revelación progresiva.', body:`<div class="actions mb"><button class="btn primary" data-act="ceremony-runes" type="button">✨ Ritual guiado</button></div><div class="panel-grid"><button class="choice" data-act="rune-one"><strong>ᚱ Runa rápida</strong><small>Un mensaje simbólico breve.</small></button><button class="choice" data-act="runes-three"><strong>ᚠᚢᚦ Tres runas</strong><small>Pasado, presente y consejo.</small></button><button class="choice" data-act="runes-five"><strong>ᚠᚢᚦᚨᚱ Cinco runas</strong><small>Lectura más completa.</small></button><button class="choice" data-act="runes-library"><strong>📚 Biblioteca</strong><small>24 runas en 5 columnas.</small></button></div>` });
}
function showRunesLibrary() {
  openModal({ icon:'ᚱ', title:'Biblioteca de Runas', subtitle:'24 runas del Futhark Antiguo.', body:`<div class="library-grid">${RUNAS.map(r=>`<button class="mini-card rune-mini" data-open-rune="${escapeHTML(r.name)}">${r.img ? `<img src="${escapeHTML(thumbFor(r.img))}" alt="${escapeHTML(r.name)}" loading="lazy" decoding="async">` : `<span class="symbol">${r.sym}</span>`}<strong>${r.sym} ${escapeHTML(r.name)}</strong><small>${escapeHTML(clampText(r.up,70))}</small></button>`).join('\n\n')}</div>` });
}
function showRuneDetail(r) {
  setLastReading({ type:'Runas', title:r.name, text:`${r.up}\n\nInvertida: ${r.rv || 'Sin posición invertida específica.'}`, items:[{ kind:'runa', name:r.name, subtitle:r.up || '', image:r.img || '', symbol:r.sym || 'ᚱ' }] });
  openModal({ icon:'ᚱ', title:r.name, subtitle:'Runa del Futhark', body:`<div class="reading-layout"><div class="rune-big">${r.sym}</div><div class="result-card"><h3>Mensaje</h3><p>${escapeHTML(r.up)}</p><h3>Invertida</h3><p>${escapeHTML(r.rv || 'Sin lectura invertida específica.')}</p>${readingActions(`${r.name}\n${r.up}`,'Runas')}</div></div>` });
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
  const { fase: phase, iluminacion, edad, creciente } = faseLunar();
  const proxima = proximaFasePrincipal();
  const dias = semanaLunar();
  const body = `<div class="om-luna">
      <div class="om-luna-astro" role="img" aria-label="${escapeHTML(phase.name)}, ${iluminacion}% iluminada">
        <div class="om-luna-disco" style="--ilum:${iluminacion}%; --lado:${creciente ? 'right' : 'left'}"></div>
      </div>
      <p class="om-luna-fase">${phase.sym} ${escapeHTML(phase.name)}</p>
      <div class="om-luna-datos">
        <span><b>${iluminacion}%</b> iluminada</span>
        <span><b>Día ${Math.floor(edad) + 1}</b> del ciclo</span>
        <span><b>${escapeHTML(proxima.nombre)}</b> en ${proxima.dias} día${proxima.dias > 1 ? 's' : ''}</span>
      </div>
      <div class="om-luna-semana" aria-label="Próximos siete días">
        ${dias.map(d => `<div class="om-luna-dia${d.hoy ? ' hoy' : ''}"><small>${d.inicial}</small><span>${d.sym}</span><b>${d.dia}</b><i>${d.iluminacion}%</i></div>`).join('')}
      </div>
    </div>
    <div class="result-card"><p>${escapeHTML(phase.meaning)}</p><p><strong>Ritual simbólico:</strong> ${escapeHTML(phase.ritual)}</p><p><strong>Afirmación:</strong> ${escapeHTML(phase.affirmation)}</p></div><div class="form-grid mt"><div class="field"><label>Enfoque</label><select id="moonFocus"><option>Claridad</option><option>Amor</option><option>Trabajo / estudios</option><option>Descanso</option><option>Soltar</option></select></div><div class="field"><label>Pregunta opcional</label>${inputWithMic('moonQuestion', 'placeholder="¿Qué necesito observar?"')}</div></div><div class="actions mt"><button class="btn primary" data-act="moon-reading">Crear lectura lunar</button></div>`;
  openModal({ icon:'🌙', title:'Luna', subtitle:'Lectura lunar guiada.', body });
}
function moonReading() {
  const phase = faseLunar().fase;
  const focus = $('#moonFocus')?.value || 'Claridad';
  const q = $('#moonQuestion')?.value || 'Sin pregunta';
  const text = `${phase.name}\nEnfoque: ${focus}\nPregunta: ${q}\n${phase.meaning}\nRitual simbólico: ${phase.ritual}\nAfirmación: ${phase.affirmation}`;
  setLastReading({ type:'Luna', title:`Lectura lunar: ${phase.name}`, text, items:[phase.name] });
  openModal({ icon:'🌙', title:`Lectura lunar: ${phase.name}`, subtitle:focus, body:`<div class="result-card"><h3>${phase.sym} ${escapeHTML(phase.name)}</h3><p>${escapeHTML(phase.meaning)}</p><p><strong>Consejo:</strong> escucha tu energía antes de actuar. No fuerces respuestas; ordena tu intención.</p><p><strong>Ritual simbólico:</strong> ${escapeHTML(phase.ritual)}</p><p><strong>Afirmación:</strong> ${escapeHTML(phase.affirmation)}</p>${readingActions(text,'Luna')}</div>` });
}

const dreamSymbols = {
  agua:'Emociones, intuición y limpieza interior.', volar:'Deseo de libertad, perspectiva y expansión.', casa:'Tu mundo interno, seguridad y memoria.', persecución:'Algo pide atención; puede ser estrés o evitación.', dientes:'Cambios, comunicación o preocupación por la imagen.', animal:'Instinto, guía y energía natural.', escuela:'Aprendizaje, evaluación o crecimiento.', noche:'Misterio, descanso y partes ocultas de ti.'
};
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
  openModal({ icon:'💭', title:'Sueños', subtitle:'Interpretación simbólica y suave.', body:`<div class="field"><label>Describe tu sueño</label>${textareaWithMic('dreamText', 'placeholder="Escribe o dicta lo que recuerdes..."')}</div><div class="form-grid mt"><div class="field"><label>Emoción principal</label><select id="dreamMood"><option>Curiosidad</option><option>Tranquilidad</option><option>Miedo</option><option>Alegría</option><option>Confusión</option></select></div><div class="field"><label>Tipo de lectura</label><select id="dreamType"><option>Simbólica</option><option>Emocional</option><option>Práctica</option><option>Espiritual suave</option></select></div></div><div class="tabs mt">${Object.keys(dreamSymbols).map(s=>`<button class="tab" data-add-symbol="${s}">${s}</button>`).join('\n\n')}</div><div class="actions"><button class="btn primary" data-act="dream-reading">Interpretar sueño</button></div>` });
}
function dreamReading() {
  const dream = $('#dreamText')?.value || '';
  const mood = $('#dreamMood')?.value || 'Curiosidad';
  const type = $('#dreamType')?.value || 'Simbólica';
  const found = Object.keys(dreamSymbols).filter(k => dream.toLowerCase().includes(k));
  const element = analyzeDreamElement(dream, found);
  const symbols = found.length ? found.map(k => `${k}: ${dreamSymbols[k]}`).join('\n') : 'No detecté símbolos rápidos; puedes añadir más detalles o guardarlo como reflexión.';
  const text = `Sueño: ${dream || 'Sin descripción'}\nEmoción: ${mood}\nLectura: ${type}\nElemento predominante: ${element.name}\n${element.explanation}\n\nSímbolos:\n${symbols}\n\nConsejo: observa qué emoción se repite y qué parte del sueño pide orden, descanso o claridad.`;
  setLastReading({ type:'Sueños', title:'Interpretación de sueño', text, items:[], meta:{ dreamElement:element, dreamSymbols:found, mood, readingType:type } });
  openModal({ icon:'💭', title:'Interpretación de sueño', subtitle:`${mood} · ${type}`, body:`<div class="result-card"><h3>Elemento predominante: ${escapeHTML(element.name)}</h3><p>${escapeHTML(element.explanation)}</p></div><div class="result-card mt"><h3>Lectura simbólica</h3><p>${escapeHTML(text).replace(/\n/g,'<br>')}</p>${readingActions(text,'Sueños')}</div>` });
}

function letterValue(ch) {
  const clean = ch.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  return clean >= 'A' && clean <= 'Z' ? ((clean.charCodeAt(0) - 65) % 9) + 1 : 0;
}
function reduceNum(n) { while (n > 9 && ![11,22,33].includes(n)) n = String(n).split('').reduce((a,b)=>a+Number(b),0); return n || 0; }
const NUMEROLOGY_MEANINGS = {
  1:{ title:'Iniciativa', gift:'independencia, decisión y capacidad para abrir camino', challenge:'impaciencia, aislamiento o exceso de control', advice:'lidera con claridad y deja espacio para escuchar' },
  2:{ title:'Cooperación', gift:'sensibilidad, diplomacia y atención a los vínculos', challenge:'indecisión, dependencia o evitar el conflicto', advice:'cuida tus límites sin perder la empatía' },
  3:{ title:'Expresión', gift:'creatividad, comunicación y alegría compartida', challenge:'dispersión, superficialidad o dificultad para terminar', advice:'da forma concreta a una idea antes de empezar otra' },
  4:{ title:'Estructura', gift:'constancia, orden y capacidad para construir', challenge:'rigidez, exceso de carga o miedo al cambio', advice:'crea una base estable que también permita flexibilidad' },
  5:{ title:'Movimiento', gift:'adaptación, curiosidad y deseo de experimentar', challenge:'inquietud, impulsividad o rechazo de los compromisos', advice:'elige cambios con propósito y no solo por escapar de la rutina' },
  6:{ title:'Cuidado', gift:'responsabilidad, armonía y sentido de comunidad', challenge:'perfeccionismo, sobreprotección o cargar con todo', advice:'acompaña sin asumir lo que corresponde a otras personas' },
  7:{ title:'Profundidad', gift:'análisis, intuición y búsqueda de significado', challenge:'distancia emocional, duda o exceso de pensamiento', advice:'combina reflexión con una acción sencilla y comprobable' },
  8:{ title:'Realización', gift:'organización, ambición equilibrada y manejo de recursos', challenge:'dureza, obsesión por el resultado o luchas de poder', advice:'mide el éxito también por su impacto y sostenibilidad' },
  9:{ title:'Integración', gift:'compasión, visión amplia y capacidad para cerrar ciclos', challenge:'idealización, nostalgia o dificultad para soltar', advice:'transforma la experiencia en servicio sin olvidarte de ti' },
  11:{ title:'Inspiración', gift:'intuición intensa, sensibilidad y capacidad de inspirar', challenge:'nerviosismo, sobrecarga emocional o expectativas elevadas', advice:'aterriza la intuición en hábitos y límites saludables' },
  22:{ title:'Construcción maestra', gift:'visión grande y capacidad para materializarla paso a paso', challenge:'presión, miedo a la magnitud o control excesivo', advice:'divide la visión en etapas realistas y compartidas' },
  33:{ title:'Servicio consciente', gift:'compasión, enseñanza y cuidado transformador', challenge:'sacrificio personal, culpa o exigencia imposible', advice:'ayuda desde el equilibrio, no desde el agotamiento' }
};
function numerologyMeaning(number) {
  return NUMEROLOGY_MEANINGS[number] || { title:'Potencial abierto', gift:'aprendizaje y observación', challenge:'falta de información suficiente', advice:'usa el resultado como punto de reflexión' };
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
function numerologyCard(label, number, description) {
  const meaning = numerologyMeaning(number);
  return `<article class="result-card numerology-card">
    <div class="numerology-number">${number}</div>
    <div><h3>${escapeHTML(label)} · ${escapeHTML(meaning.title)}</h3><p>${escapeHTML(description)}</p><p><strong>Fortaleza:</strong> ${escapeHTML(meaning.gift)}.</p><p><strong>Reto:</strong> ${escapeHTML(meaning.challenge)}.</p></div>
  </article>`;
}
function showNumerologia() {
  const n = escapeHTML(localStorage.getItem(LS.name) || '');
  openModal({ icon:'🔢', title:'Numerología', subtitle:'Perfil personal y sinastría numerológica.', body:`
    <div class="numerology-intro result-card"><h3>Lectura personal</h3><p>Explora ocho números principales calculados a partir del nombre completo y la fecha de nacimiento.</p></div>
    <div class="form-grid mt"><div class="field"><label>Nombre completo</label>${inputWithMic('numName', `value="${n}" placeholder="Nombre y apellidos"`)}</div><div class="field"><label>Fecha de nacimiento</label><input id="numDate" class="input" type="date"></div></div>
    <div class="actions mt"><button class="btn primary" data-act="calc-num">Crear lectura personal</button></div>
    <hr class="soft-line">
    <div class="numerology-intro result-card"><h3>Sinastría entre dos personas</h3><p>Compara tendencias de identidad, necesidades internas y forma de relacionarse. No determina el futuro ni mide el valor de una relación.</p></div>
    <div class="synastry-grid mt">
      <div class="result-card"><h3>Persona A</h3><div class="field"><label>Nombre completo</label><input id="synNameA" class="input" value="${n}" placeholder="Nombre y apellidos"></div><div class="field mt"><label>Fecha de nacimiento</label><input id="synDateA" class="input" type="date"></div></div>
      <div class="result-card"><h3>Persona B</h3><div class="field"><label>Nombre completo</label><input id="synNameB" class="input" placeholder="Nombre y apellidos"></div><div class="field mt"><label>Fecha de nacimiento</label><input id="synDateB" class="input" type="date"></div></div>
    </div>
    <div class="actions mt"><button class="btn primary" data-act="calc-synastry">Crear sinastría</button></div>
    <p class="notice mt">La numerología se presenta como herramienta simbólica y reflexiva. No es un método científico ni sustituye decisiones personales o profesionales.</p>` });
}
function calcNumerologia() {
  const name = $('#numName')?.value?.trim() || '';
  const date = $('#numDate')?.value || '';
  if (!name || !date) return toast('Escribe el nombre completo y la fecha de nacimiento.');
  const profile = calculateNumerologyProfile(name, date);
  if (!profile) return toast('Revisa la fecha de nacimiento.');
  const fields = [
    ['Camino de vida', profile.life, 'Aprendizaje principal y dirección general de la experiencia.'],
    ['Expresión', profile.expression, 'Talentos, capacidades y forma natural de actuar.'],
    ['Alma', profile.soul, 'Necesidades internas, motivaciones y deseos profundos.'],
    ['Personalidad', profile.personality, 'Primera impresión y forma de presentarse ante el entorno.'],
    ['Día natal', profile.birthday, 'Recurso concreto que tiende a aparecer de manera espontánea.'],
    ['Actitud', profile.attitude, 'Respuesta inicial ante situaciones, cambios y relaciones.'],
    ['Madurez', profile.maturity, 'Cualidad que gana importancia con la experiencia.'],
    ['Año personal', profile.personalYear, `Tema simbólico predominante durante ${new Date().getFullYear()}.`]
  ];
  const text = `LECTURA NUMEROLÓGICA DE ${name}\nFecha: ${date}\n\n${fields.map(([label, number, description]) => {
    const meaning = numerologyMeaning(number);
    return `${label}: ${number} · ${meaning.title}\n${description}\nFortaleza: ${meaning.gift}.\nReto: ${meaning.challenge}.\nConsejo: ${meaning.advice}.`;
  }).join('\n\n')}\n\nSíntesis: combina estos números como tendencias complementarias. Ninguno define por sí solo la personalidad ni el destino.`;
  setLastReading({ type:'Numerología', title:`Numerología de ${name}`, text, items:[], meta:{ numbers:profile, name, birthDate:date } });
  openModal({ icon:'🔢', title:'Lectura numerológica', subtitle:`${name} · ${date}`, body:`
    <div class="numerology-results">${fields.map(([label, number, description]) => numerologyCard(label, number, description)).join('')}</div>
    <div class="result-card mt"><h3>Síntesis práctica</h3><p>Observa qué fortalezas se repiten y qué retos necesitan equilibrio. Los números maestros 11, 22 y 33 se conservan como matices de mayor intensidad, no como categorías superiores.</p>${readingActions(text,'Numerología')}</div>` });
}
function synastryTheme(a, b) {
  if (a === b) return 'Existe una fuerte sensación de reconocimiento: ambos pueden comprender el ritmo del otro, aunque también amplificar el mismo reto.';
  const distance = Math.abs(reduceNum(a) - reduceNum(b));
  if (distance <= 2) return 'Los ritmos son cercanos y favorecen acuerdos naturales; conviene evitar asumir que ambos necesitan exactamente lo mismo.';
  if (distance <= 5) return 'Las diferencias pueden complementarse bien cuando se expresan con claridad y se reparten responsabilidades.';
  return 'Los ritmos son contrastantes: la relación puede ampliar perspectivas, pero necesita paciencia, traducción emocional y acuerdos explícitos.';
}
function calculateSynastry() {
  const nameA = $('#synNameA')?.value?.trim() || '';
  const dateA = $('#synDateA')?.value || '';
  const nameB = $('#synNameB')?.value?.trim() || '';
  const dateB = $('#synDateB')?.value || '';
  if (!nameA || !dateA || !nameB || !dateB) return toast('Completa los nombres y fechas de las dos personas.');
  const a = calculateNumerologyProfile(nameA, dateA);
  const b = calculateNumerologyProfile(nameB, dateB);
  if (!a || !b) return toast('Revisa las fechas de nacimiento.');
  const relationship = reduceNum(a.life + b.life);
  const relationMeaning = numerologyMeaning(relationship);
  const sections = [
    ['Dirección compartida', a.life, b.life, synastryTheme(a.life, b.life)],
    ['Comunicación y acción', a.expression, b.expression, synastryTheme(a.expression, b.expression)],
    ['Necesidades emocionales', a.soul, b.soul, synastryTheme(a.soul, b.soul)],
    ['Convivencia e imagen externa', a.personality, b.personality, synastryTheme(a.personality, b.personality)]
  ];
  const advice = `La vibración conjunta ${relationship} (${relationMeaning.title}) favorece ${relationMeaning.gift}. El cuidado principal está en ${relationMeaning.challenge}. Consejo: ${relationMeaning.advice}.`;
  const text = `SINASTRÍA NUMEROLÓGICA\n${nameA}: camino ${a.life}, expresión ${a.expression}, alma ${a.soul}, personalidad ${a.personality}.\n${nameB}: camino ${b.life}, expresión ${b.expression}, alma ${b.soul}, personalidad ${b.personality}.\n\n${sections.map(([label, nA, nB, interpretation]) => `${label}: ${nA} y ${nB}\n${interpretation}`).join('\n\n')}\n\nNúmero de la relación: ${relationship} · ${relationMeaning.title}\n${advice}\n\nEsta lectura describe tendencias simbólicas; no determina compatibilidad real ni sustituye la comunicación entre las personas.`;
  setLastReading({ type:'Numerología · Sinastría', title:`Sinastría: ${nameA} y ${nameB}`, text, items:[], meta:{ synastry:{ a, b, relationship }, numbers:{ life:relationship, expression:reduceNum(a.expression + b.expression), personalYear:reduceNum(a.personalYear + b.personalYear) } } });
  openModal({ icon:'💞', title:'Sinastría numerológica', subtitle:`${nameA} y ${nameB}`, body:`
    <div class="synastry-summary">
      <div class="result-card center"><small>${escapeHTML(nameA)}</small><div class="numerology-number">${a.life}</div><strong>${escapeHTML(numerologyMeaning(a.life).title)}</strong></div>
      <div class="synastry-link"><span>∞</span><small>Relación ${relationship}</small></div>
      <div class="result-card center"><small>${escapeHTML(nameB)}</small><div class="numerology-number">${b.life}</div><strong>${escapeHTML(numerologyMeaning(b.life).title)}</strong></div>
    </div>
    <div class="numerology-results mt">${sections.map(([label, nA, nB, interpretation]) => `<article class="result-card numerology-card"><div class="numerology-pair">${nA}<span>·</span>${nB}</div><div><h3>${escapeHTML(label)}</h3><p>${escapeHTML(interpretation)}</p></div></article>`).join('')}</div>
    <div class="result-card mt"><h3>Número de la relación: ${relationship} · ${escapeHTML(relationMeaning.title)}</h3><p>${escapeHTML(advice)}</p><p class="notice">La sinastría es una lectura simbólica. Una relación saludable depende de comunicación, respeto, consentimiento y acciones reales.</p>${readingActions(text,'Numerología · Sinastría')}</div>` });
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
    for (const key of ['enfermedades','situaciones_personales','codigos_adicionales']) {
      (data[key] || []).forEach(item => entries.push({
        nombre: item.nombre || item.name || 'Código', codigo: item.codigo || item.code || '', categoria: item.categoria || item.sistema || key, uso: item.uso || item.descripcion || item.subcategoria || 'Uso simbólico de concentración.'
      }));
    }
    grabovoiEntries = entries.filter(e => e.codigo).slice(0, 1200);
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
    const result = await window.puter.ai.chat(`Busca en la web una secuencia atribuida a Grabovoi relacionada con esta consulta: "${query}".

El manual local de la aplicación NO contiene una coincidencia. No inventes ninguna secuencia.
Solo responde ENCONTRADO si una o más páginas públicas muestran explícitamente el mismo número asociado al tema.
Usa exactamente este formato:
ESTADO: ENCONTRADO o NO_ENCONTRADO
TEMA: texto breve
CÓDIGO: secuencia o vacío
DESCRIPCIÓN: qué afirman las fuentes, sin presentarlo como hecho médico ni promesa
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
async function showGrabovoi() {
  const entries = await loadGrabovoi();
  openModal({ icon:'📜', title:'Grabovoi simbólico', subtitle:'Consulta cada secuencia con explicación y forma de uso.', body:`<p class="notice">Contenido simbólico y de entretenimiento. No es consejo médico ni promete resultados.</p><div class="field mt"><label>Buscar código o tema</label>${inputWithMic('grabSearch', 'placeholder="amor, calma, 147..."')}</div><div id="grabList" class="diary-list mt">${renderGrabList(entries.slice(0,40))}</div>` });
}
function renderGrabList(list) { return list.map((e,i)=>`<button class="choice" data-grab-index="${grabovoiEntries.indexOf(e)}"><strong>${escapeHTML(e.codigo)} · ${escapeHTML(e.nombre)}</strong><small>${escapeHTML(e.categoria || '')}</small></button>`).join('\n\n') || '<p class="subtle">Sin resultados.</p>'; }
function buildGrabovoiInterpretation(entry) {
  const code = String(entry.codigo || '').trim();
  const digits = code.match(/\d/g) || [];
  const groups = code.split(/[_+\s]+/).filter(Boolean);
  const counts = digits.reduce((map, digit) => ({ ...map, [digit]:(map[digit] || 0) + 1 }), {});
  const digitAnalysis = Object.keys(counts).sort().map(digit => ({
    digit,
    count:counts[digit],
    meaning:grabovoiGuide.digitMeanings[digit] || 'Elemento numérico de la secuencia.'
  }));
  const category = String(entry.categoria || '').toLowerCase();
  const isHealth = /salud|cardio|músculo|musculo|autoinmune|oncol|metab|psicol|enfermedad|físic|fisic/.test(category);
  const method = /tiempo|pasado|futuro/.test(category)
    ? { name:'Columna de luz', description:'Visualiza la secuencia dentro de una columna luminosa y sitúa al final una escena concreta, realista y ordenada.' }
    : /amor|pareja|relaci/.test(`${category} ${entry.nombre}`)
      ? { name:'Esfera de armonía', description:'Imagina la secuencia dentro de una esfera clara junto a una representación respetuosa y no controladora de la situación deseada.' }
      : { name:'Esfera numérica', description:'Imagina una esfera blanca o plateada, coloca la secuencia en su interior y mantenla estable mientras respiras con calma.' };
  const groupText = groups.length > 1 ? groups.join(' · ') : 'Secuencia continua';
  const digitText = digitAnalysis.map(item => `${item.digit} (${item.count}): ${item.meaning}`).join('\n');
  const steps = [
    `Define el foco: ${entry.nombre}.`,
    `Lee la secuencia por bloques: ${groupText}.`,
    `Escríbela o mírala sin alterar el orden: ${code}.`,
    `${method.description}`,
    'Mantén la concentración entre 3 y 5 minutos, sin forzar la respiración.',
    'Cierra la práctica y anota observaciones concretas; evita interpretar coincidencias como garantías.'
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
      <p><strong>Finalidad:</strong> ${escapeHTML(e.uso)}</p>
    </div>
    <div class="panel-grid mt">
      <div class="result-card"><h3>Estructura del código</h3><p>${guide.groups.length} bloque${guide.groups.length === 1 ? '' : 's'}: <strong>${escapeHTML(guide.groups.join(' · '))}</strong></p><p>${guide.code.match(/\d/g)?.length || 0} dígitos numéricos.</p></div>
      <div class="result-card"><h3>${escapeHTML(guide.method.name)}</h3><p>${escapeHTML(guide.method.description)}</p></div>
    </div>
    <div class="result-card mt"><h3>Significado numérico simbólico</h3>
      <div class="grabovoi-digit-grid">${guide.digitAnalysis.map(item => `<div><strong>${item.digit}${item.count > 1 ? ` ×${item.count}` : ''}</strong><span>${escapeHTML(item.meaning)}</span></div>`).join('') || '<p>Conserva las letras y símbolos exactamente como aparecen.</p>'}</div>
    </div>
    <div class="result-card mt"><h3>Cómo aplicarlo</h3><ol class="grabovoi-steps">${guide.steps.map(step => `<li>${escapeHTML(step)}</li>`).join('')}</ol></div>
    <p class="notice mt">${guide.isHealth ? 'Este código se presenta únicamente como práctica simbólica de concentración. No diagnostica, trata ni cura y no sustituye atención médica.' : 'Práctica simbólica de concentración: no es una predicción ni garantiza resultados.'}</p>
    ${grabovoiActions()}` });
  setTimeout(refreshDeviceVoiceSelect, 100);
}

function showBiblioteca(filter = 'all') {
  const diary = storeGet(LS.diary, []);
  const q = ($('#diarySearch')?.value || '').toLowerCase().trim();
  const types = ['all','favorites','Tarot','Runas','Sueños','Luna','Numerología','Grabovoi','Mensaje del día'];
  let list = diary;
  if (filter === 'favorites') list = list.filter(d => d.favorite);
  else if (filter !== 'all') list = list.filter(d => String(d.type || '').toLowerCase().includes(filter.toLowerCase()));
  if (q) list = list.filter(d => `${d.title} ${d.type} ${d.text} ${d.note || ''}`.toLowerCase().includes(q));
  openModal({ icon:'📚', title:'Biblioteca Mística', subtitle:`${list.length} de ${diary.length} lecturas guardadas.`, body:`
    <div class="form-grid"><div class="field"><label>Buscar en el diario</label><input class="input" id="diarySearch" value="${escapeHTML(q)}" placeholder="Buscar por carta, runa, tema o nota..."></div><div class="field"><label>Filtrar tipo</label><select id="diaryFilter">${types.map(t=>`<option value="${escapeHTML(t)}" ${t===filter?'selected':''}>${t==='all'?'Todo':t==='favorites'?'Favoritas':escapeHTML(t)}</option>`).join('')}</select></div></div>
    <div class="actions mt"><button class="btn" data-act="refresh-diary">Aplicar filtro</button><button class="btn" data-act="export-diary">Exportar texto</button><button class="btn" data-act="export-diary-pdf">Crear PDF</button><button class="btn" data-act="backup-data">Copia de seguridad</button><button class="btn danger" data-act="clear-diary">Vaciar biblioteca</button></div>
    <div class="diary-list mt">${list.map(item=>`<article class="diary-item ${item.favorite?'favorite':''}"><div class="split"><h3>${item.favorite?'⭐ ':''}${escapeHTML(item.title)}</h3><small>${new Date(item.date || Date.now()).toLocaleDateString()}</small></div><small class="pill">${escapeHTML(item.type || 'Lectura')}</small>${item.note ? `<p class="diary-note"><strong>Nota:</strong> ${escapeHTML(item.note)}</p>` : ''}<p>${escapeHTML(clampText(item.text,260))}</p><div class="actions mt"><button class="btn compact" data-fav-diary="${item.id}">${item.favorite?'Quitar ⭐':'Favorita ⭐'}</button><button class="btn compact" data-note-diary="${item.id}">Nota</button><button class="btn compact" data-copy-diary="${item.id}">Copiar</button><button class="btn compact" data-delete-diary="${item.id}">Borrar</button></div></article>`).join('\n\n') || '<p class="subtle">Todavía no hay lecturas guardadas con ese filtro.</p>'}</div>` });
}

function showSettings() {
  const name = escapeHTML(localStorage.getItem(LS.name) || '');
  const prefs = storeGet(LS.prefs, {});
  const voice = getVoicePrefs();
  const ceremony = getCeremonyPrefs();
  openModal({ icon:'⚙️', title:'Ajustes', subtitle:'Personaliza la experiencia por apartados.', body:`
    <div class="settings-stack">
    <details class="settings-section" open>
    <summary>👤 Perfil e IA</summary>
    <div class="settings-section-content">
    <div class="form-grid">
      <div class="field"><label>${escapeHTML(t('appLanguage'))}</label><select id="appLanguage">${languageOptionsHTML()}</select><small>${escapeHTML(t('languageHelp'))}</small></div>
      <div class="field"><label>Nombre opcional</label>${inputWithMic('settingsName', `value="${name}" placeholder="Tu nombre"`)}</div>
      <div class="field"><label>Estado IA</label><input class="input" value="${localStorage.getItem(LS.puter)==='true'?'Conectada':'Modo simbólico'}" readonly></div>
      <div class="field"><label>Tipo de lectura IA</label><select id="aiStyle"><option value="mistica" ${getAIStyle() === 'mistica' ? 'selected' : ''}>Mística</option><option value="razonable" ${getAIStyle() === 'razonable' ? 'selected' : ''}>Razonable</option><option value="corta" ${getAIStyle() === 'corta' ? 'selected' : ''}>Corta</option><option value="profunda" ${getAIStyle() === 'profunda' ? 'selected' : ''}>Profunda</option><option value="directa" ${getAIStyle() === 'directa' ? 'selected' : ''}>Directa</option><option value="amorosa" ${getAIStyle() === 'amorosa' ? 'selected' : ''}>Amorosa</option></select></div>
    </div><p class="notice mt">${escapeHTML(t('internationalNote'))}</p></div></details>

    <details class="settings-section">
    <summary>🔊 Voz y lectura</summary>
    <div class="settings-section-content">
    <div class="form-grid">
      <div class="field"><label>Motor de voz</label><select id="voiceEngine"><option value="device" ${voice.engine === 'device' ? 'selected' : ''}>TTS del sistema · sin Puter</option><option value="auto" ${voice.engine === 'auto' ? 'selected' : ''}>Automático · IA si está conectada</option><option value="puter" ${voice.engine === 'puter' ? 'selected' : ''}>Voz IA natural mediante Puter</option></select></div>
      <div class="field"><label>Voz IA remota</label><select id="remoteVoice"><option value="coral" ${voice.remoteVoice === 'coral' ? 'selected' : ''}>Coral · femenina cálida</option><option value="sage" ${voice.remoteVoice === 'sage' ? 'selected' : ''}>Sage · femenina serena</option><option value="onyx" ${voice.remoteVoice === 'onyx' ? 'selected' : ''}>Onyx · masculina profunda</option><option value="ash" ${voice.remoteVoice === 'ash' ? 'selected' : ''}>Ash · masculina natural</option></select></div>
      <div class="field"><label>Catálogo del sistema</label><select id="voiceFilter"><option value="all" ${(voice.voiceFilter || 'all') === 'all' ? 'selected' : ''}>Todas las voces visibles</option><option value="spanish" ${voice.voiceFilter === 'spanish' ? 'selected' : ''}>Solo voces españolas</option></select></div>
      <div class="field"><label>Idioma de voz</label><select id="voiceLanguage">${getVoiceLanguageOptionsHTML(voice.language || 'auto')}</select></div>
      <div class="field"><label>Voz concreta del dispositivo</label><select id="deviceVoiceURI">${getDeviceVoiceOptionsHTML(voice.deviceVoiceURI || '')}</select></div>
      <div class="field"><label>Voz mística</label><select id="voicePreset"><option value="mistica_femenina" ${voice.preset === 'mistica_femenina' ? 'selected' : ''}>Mística femenina</option><option value="guia_suave" ${voice.preset === 'guia_suave' ? 'selected' : ''}>Guía suave</option><option value="oraculo_neutro" ${voice.preset === 'oraculo_neutro' ? 'selected' : ''}>Oráculo neutro</option><option value="sabio_masculino" ${voice.preset === 'sabio_masculino' ? 'selected' : ''}>Sabio masculino</option><option value="guardian_profundo" ${voice.preset === 'guardian_profundo' ? 'selected' : ''}>Guardián profundo</option><option value="lectura_rapida" ${voice.preset === 'lectura_rapida' ? 'selected' : ''}>Lectura rápida</option></select></div>
      <div class="field"><label>Velocidad de voz</label><select id="voiceRate"><option value="0.78" ${String(voice.rate) === '0.78' ? 'selected' : ''}>Ceremonial</option><option value="0.88" ${String(voice.rate) === '0.88' ? 'selected' : ''}>Humana suave</option><option value="0.92" ${String(voice.rate) === '0.92' ? 'selected' : ''}>Natural</option><option value="1.04" ${String(voice.rate) === '1.04' ? 'selected' : ''}>Ágil</option></select></div>
      <div class="field"><label>Pantalla durante la voz</label><select id="keepScreenAwake"><option value="true" ${voice.keepScreenAwake !== false ? 'selected' : ''}>Mantener encendida</option><option value="false" ${voice.keepScreenAwake === false ? 'selected' : ''}>Permitir apagado automático</option></select></div>
    </div>
    <p class="notice mt">“TTS del sistema” no necesita Puter ni conexión. La app mostrará todas las voces que Firefox, Chrome o Safari permitan consultar; el navegador puede ocultar algunas voces instaladas. El modo IA y el MP3 quedan como opciones adicionales.</p>
    </div></details>

    <details class="settings-section">
    <summary>✨ Ceremonia</summary>
    <div class="settings-section-content">
    <div class="form-grid">
      <div class="field"><label>Velocidad de revelación</label><select id="ceremonySpeed"><option value="slow" ${ceremony.speed==='slow'?'selected':''}>Lenta ceremonial</option><option value="normal" ${(ceremony.speed||'normal')==='normal'?'selected':''}>Normal</option><option value="fast" ${ceremony.speed==='fast'?'selected':''}>Rápida</option></select></div>
      <div class="field"><label>Sonidos rituales</label><select id="ceremonySounds"><option value="false" ${!ceremony.sounds?'selected':''}>Desactivados</option><option value="true" ${ceremony.sounds?'selected':''}>Activados</option></select></div>
      <div class="field"><label>Vibración móvil</label><select id="ceremonyVibration"><option value="false" ${!ceremony.vibration?'selected':''}>Desactivada</option><option value="true" ${ceremony.vibration?'selected':''}>Activada</option></select></div>
    </div></div></details>


    <details class="settings-section">
    <summary>🪄 Avatar del oráculo</summary>
    <div class="settings-section-content">
    <div class="form-grid">
      <div class="field"><label>Estilo de avatar</label><select id="oracleAvatarStyle"><option value="auto" ${getVoicePrefs().avatarStyle==='auto'?'selected':''}>Automático según voz</option><option value="female" ${getVoicePrefs().avatarStyle==='female'?'selected':''}>Chica oráculo</option><option value="male" ${getVoicePrefs().avatarStyle==='male'?'selected':''}>Chico oráculo</option></select></div>
      <div class="field"><label>Mostrar avatar</label><select id="oracleAvatarEnabled"><option value="true" ${getVoicePrefs().avatarEnabled!==false?'selected':''}>Sí, mostrar al hablar</option><option value="false" ${getVoicePrefs().avatarEnabled===false?'selected':''}>No mostrar</option></select></div>
      <div class="field"><label>Posición del avatar</label><select id="oracleAvatarPosition"><option value="right" ${getVoicePrefs().avatarPosition!=='left'?'selected':''}>Derecha</option><option value="left" ${getVoicePrefs().avatarPosition==='left'?'selected':''}>Izquierda</option></select></div>
      <div class="field"><label>Tamaño del avatar</label><select id="oracleAvatarSize"><option value="small" ${getVoicePrefs().avatarSize==='small'?'selected':''}>Pequeño</option><option value="medium" ${getVoicePrefs().avatarSize!=='small' && getVoicePrefs().avatarSize!=='large'?'selected':''}>Mediano</option><option value="large" ${getVoicePrefs().avatarSize==='large'?'selected':''}>Grande</option></select></div>
      <div class="field"><label>Expresión del avatar</label><select id="oracleAvatarMood"><option value="auto" ${getVoicePrefs().avatarMood==='auto'?'selected':''}>Automática emocional</option><option value="calm" ${getVoicePrefs().avatarMood==='calm'?'selected':''}>Serena</option><option value="smile" ${getVoicePrefs().avatarMood==='smile'?'selected':''}>Sonriente</option><option value="love" ${getVoicePrefs().avatarMood==='love'?'selected':''}>Amor</option><option value="warning" ${getVoicePrefs().avatarMood==='warning'?'selected':''}>Advertencia</option><option value="blocked" ${getVoicePrefs().avatarMood==='blocked'?'selected':''}>Bloqueo</option><option value="dream" ${getVoicePrefs().avatarMood==='dream'?'selected':''}>Intuición</option><option value="power" ${getVoicePrefs().avatarMood==='power'?'selected':''}>Fuerza</option><option value="serious" ${getVoicePrefs().avatarMood==='serious'?'selected':''}>Seria</option></select></div>
      <div class="field"><label>Modo al hablar</label><select id="oracleAvatarSpeechMode"><option value="auto" ${getVoicePrefs().avatarSpeechMode==='auto'?'selected':''}>Automático</option><option value="channeling" ${getVoicePrefs().avatarSpeechMode==='channeling'?'selected':''}>Canalizando</option><option value="whisper" ${getVoicePrefs().avatarSpeechMode==='whisper'?'selected':''}>Susurrando</option></select></div>
    </div></div></details>

    <details class="settings-section">
    <summary>🎨 Apariencia y privacidad</summary>
    <div class="settings-section-content">
    <div class="form-grid">
      <div class="field"><label>Tema visual</label><select id="themeSelect"><option value="gold" ${getTheme()==='gold'?'selected':''}>Dorado místico</option><option value="violet" ${getTheme()==='violet'?'selected':''}>Noche violeta</option><option value="forest" ${getTheme()==='forest'?'selected':''}>Bosque rúnico</option><option value="blue" ${getTheme()==='blue'?'selected':''}>Luna azul</option><option value="classic" ${getTheme()==='classic'?'selected':''}>Tarot clásico</option><option value="light" ${getTheme()==='light'?'selected':''}>Claro elegante</option></select></div>
      <div class="field"><label>Modo privado</label><select id="privateModeSelect"><option value="false" ${!isPrivateMode()?'selected':''}>Guardar historial normalmente</option><option value="true" ${isPrivateMode()?'selected':''}>No guardar nuevas lecturas</option></select></div>
      <div class="field"><label>Estilo PDF por defecto</label><select id="pdfStyleSelect"><option value="premium" ${getPdfStyle()==='premium'?'selected':''}>Premium místico</option><option value="light" ${getPdfStyle()==='light'?'selected':''}>Claro elegante</option><option value="summary" ${getPdfStyle()==='summary'?'selected':''}>Resumen 1 página</option></select></div>
      <div class="field"><label>Modo foco / menos animaciones</label><select id="focusModeSelect"><option value="false" ${!isFocusMode()?'selected':''}>Animaciones completas</option><option value="true" ${isFocusMode()?'selected':''}>Reducir animaciones</option></select></div>
      <div class="field"><label>Modo rendimiento real</label><select id="performanceModeSelect"><option value="false" ${!isPerformanceMode()?'selected':''}>Normal</option><option value="true" ${isPerformanceMode()?'selected':''}>Rendimiento móvil</option></select></div>
    </div></div></details>
    </div>

    <h3 class="section-title">Acciones rápidas</h3>
    <div class="panel-grid settings-actions">
      <button class="choice" data-act="save-settings"><strong>💾 Guardar ajustes</strong><small>Guarda perfil, voz y ceremonia.</small></button>
      <button class="choice" data-act="connect-ai"><strong>🤖 Conectar Puter IA</strong><small>Amplía lecturas y habilita búsquedas externas.</small></button>
      <button class="choice" data-act="test-voice"><strong>🔊 Escuchar ejemplo</strong><small>Comprueba la voz seleccionada.</small></button>
      <button class="choice" data-act="voice-library"><strong>🎙️ Añadir voces</strong><small>Guía para iPhone y Android.</small></button>
      <button class="choice" data-act="preview-avatar"><strong>🪄 Vista previa del avatar</strong><small>Ver el oráculo animado.</small></button>
      <button class="choice" data-act="stop-voice"><strong>⏹️ Parar voz</strong><small>Detiene la lectura hablada.</small></button>
      <button class="choice" data-act="toggle-contrast"><strong>🌗 Alto contraste</strong><small>${prefs.highContrast?'Activado':'Desactivado'}</small></button>
      <button class="choice" data-act="toggle-large-text"><strong>🔎 Texto grande</strong><small>${prefs.largeText?'Activado':'Desactivado'}</small></button>
    </div>
    <h3 class="section-title">Datos y ayuda</h3>
    <div class="panel-grid settings-actions">
      <button class="choice" data-act="backup-data"><strong>🧳 Crear copia de seguridad</strong><small>Exporta tus datos en un archivo.</small></button>
      <button class="choice" data-act="import-backup"><strong>📥 Restaurar copia</strong><small>Recupera una copia guardada anteriormente.</small></button>
      <button class="choice" data-act="privacy-center"><strong>🔐 Privacidad y datos</strong><small>Controla el historial local.</small></button>
      <button class="choice" data-act="install-help"><strong>📲 Instalar aplicación</strong><small>Añádela a iPhone o Android.</small></button>
      <button class="choice" data-act="open-manual"><strong>📘 Manual de usuario</strong><small>Abrir la guía completa en PDF.</small></button>
    </div>
    <p class="notice mt">Las lecturas y preferencias se guardan en este dispositivo, salvo que actives servicios de IA externos.</p>` });
}


function daily() {
  unlockAchievement('first_daily');
  const key = 'oraculo.daily.' + todayKey();
  let saved = storeGet(key);
  if (!saved) {
    const card = sample(ALL_TAROT), rune = sample(RUNAS), phase = faseLunar().fase;
    saved = { card: card.name, rune: rune.name, phase: phase.name };
    storeSet(key, saved);
  }
  const card = ALL_TAROT.find(c => c.name === saved.card) || sample(ALL_TAROT);
  const rune = RUNAS.find(r => r.name === saved.rune) || sample(RUNAS);
  const phase = MOON_PHASES.find(m => m.name === saved.phase) || faseLunar().fase;
  const text = `Fecha: ${new Date().toLocaleDateString()}

Carta del día: ${card.name}
${card.up}

Runa del día: ${rune.name}
${rune.up}

Luna del día: ${phase.name}
${phase.meaning}

Consejo: une la claridad de la carta, la fuerza de la runa y el ritmo lunar para elegir tu siguiente paso con calma.`;
  setLastReading({ type:'Mensaje del día', title:'Mensaje del día', text, items:[{ kind:'tarot', name:card.name, subtitle:card.key || card.el || '', image:card.img || '', symbol:'🃏', position:'Carta del día' }, { kind:'runa', name:rune.name, subtitle:rune.up || '', image:rune.img || '', symbol:rune.sym || 'ᚱ', position:'Runa del día' }, { kind:'luna', name:phase.name, subtitle:phase.meaning || '', image:'', symbol:phase.sym || '🌙', position:'Luna del día' }] });
  $('#dailyText').textContent = `${card.name} · ${rune.name} · ${phase.name}`;
  openModal({ icon:'🌟', title:'Mensaje del día', subtitle:'Tarot, runa y luna en una lectura diaria.', body:`
    <div class="daily-oracle-grid">
      <div class="daily-oracle-card">${cardImage(card)}<strong>🃏 ${escapeHTML(card.name)}</strong><small>${escapeHTML(card.key || card.el || '')}</small></div>
      <div class="daily-oracle-card"><div class="rune-big compact-rune">${rune.sym}</div><strong>ᚱ ${escapeHTML(rune.name)}</strong><small>${escapeHTML(clampText(rune.up, 70))}</small></div>
      <div class="daily-oracle-card"><div class="moon-big">${phase.sym}</div><strong>🌙 ${escapeHTML(phase.name)}</strong><small>${escapeHTML(clampText(phase.meaning, 70))}</small></div>
    </div>
    <div class="result-card"><h3>Interpretación simbólica</h3><p>${escapeHTML(text).replace(/\n/g,'<br>')}</p>${readingActions(text,'Mensaje del día')}</div>
    <div class="result-card mt daily-journal-card"><h3>Diario del día</h3><div class="form-grid"><div class="field"><label>Estado de ánimo</label><select id="dailyMood"><option>Calma</option><option>Ilusión</option><option>Duda</option><option>Fuerza</option><option>Cansancio</option><option>Gratitud</option></select></div><div class="field"><label>Intención de hoy</label><input class="input" id="dailyIntention" placeholder="¿Qué quieres cuidar hoy?"></div></div><div class="field mt"><label>Reflexión personal</label><textarea id="dailyReflection" placeholder="Escribe una nota breve sobre lo que te llevas de esta lectura..."></textarea></div><div class="actions mt"><button class="btn primary" data-act="save-daily-reflection">Guardar ritual diario</button><button class="btn" data-act="daily-history">Ver historial diario</button></div></div>` });
}


function getChatLog() { return storeGet(LS.chat, []); }
function setChatLog(log) { storeSet(LS.chat, log.slice(-80)); }
function getChatMemoryContext(limit = 12) {
  const log = getChatLog().slice(-limit);
  return log.map(m => `${m.role === 'user' ? 'Usuario' : 'Oráculo'}: ${cleanInterpretation(m.text).slice(0, 700)}`).join('\n');
}
function chatBubbleHTML(msg) {
  const who = msg.role === 'user' ? 'Tú' : 'Oráculo';
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
  return `<div class="chat-ritual-card ${item.rev ? 'reversed' : ''}"><div class="mini-label">${escapeHTML(item.position || 'Carta')}</div>${cardImage(item.card)}<strong>${escapeHTML(item.card.name)}</strong><small>${item.rev ? 'Invertida · 180°' : 'Al derecho'}</small></div>`;
}
function chatRuneHTML(item, index) {
  return `<div class="chat-rune-card ${item.rev ? 'reversed' : ''}"><div class="mini-label">${index === 0 ? 'Primera runa' : index === 1 ? 'Segunda runa' : index === 2 ? 'Tercera runa' : `Runa ${index + 1}`}</div><div class="rune-big">${item.rune.sym}</div><strong>${escapeHTML(item.rune.name)}</strong><small>${item.rev ? 'Invertida' : 'Al derecho'}</small></div>`;
}
function showChatRitual() {
  openModal({ icon:'🕯️', title:'Chat Ritual Privado', subtitle:'Habla con el Oráculo y haz tiradas sin salir del chat.', body:`
    <div class="private-chat-wrap">
      <div class="privacy-note">🔒 Espacio privado local. Si usas Puter IA, tu pregunta se envía a Puter para generar la respuesta.</div>
      <div id="chatMessages" class="chat-messages" aria-live="polite"></div>
      <div class="chat-quick-actions">
        <button class="btn compact" data-chat-quick="tirada de tarot de 3 cartas">🃏 3 cartas</button>
        <button class="btn compact" data-chat-quick="tirada del amor">❤️ Amor</button>
        <button class="btn compact" data-chat-quick="sácame una runa">ᚱ Runa</button>
        <button class="btn compact" data-chat-quick="mensaje del día">🌟 Día</button>
      </div>
      <div class="chat-input-row">
        ${textareaWithMic('chatInput', 'rows="3" placeholder="Escribe: hazme una tirada de amor, sácame una runa, interpreta mi sueño..."')}
        <button class="btn primary" data-chat-send type="button">Enviar</button>
      </div>
      <div class="actions mt"><button class="btn compact" data-chat-clear type="button">Borrar chat</button><button class="btn compact" data-act="save-reading" type="button">⭐ Guardar última lectura</button><button class="btn compact" data-act="pdf-reading" type="button">📄 PDF última lectura</button></div>
    </div>` });
  renderChatMessages();
}
function detectChatIntent(text) {
  const t = text.toLowerCase();
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
function chatDrawTarot(spreadKey = 'one') {
  const spread = getTarotSpread(spreadKey);
  const reversedRate = chooseReversedRate();
  const cards = [...ALL_TAROT].sort(() => Math.random() - .5).slice(0, spread.count).map((card, index) => ({ card, rev: isReversed(reversedRate), position: spread.positions[index] || '' }));
  const linesOnly = cards.map((c, i) => `${i + 1}. ${c.position ? c.position + ' — ' : ''}${c.card.name}${c.rev ? ' invertida' : ''}: ${c.rev ? c.card.rv : c.card.up}`).join('\n\n');
  setLastReading({ type:'Tarot privado', title:spread.title, text:linesOnly, items:cards.map(c=>({ kind:'tarot', name:c.card.name, subtitle:c.card.key || c.card.el || '', image:c.card.img || '', symbol:'🃏', position:c.position || '', reversed:!!c.rev })), ritual:{ module:'chat', action:'tarot', spread:spreadKey }, meta:{ reversedRate } });
  ceremonyTone('shuffle'); ceremonyVibrate([14,35,14]);
  addChat('oracle', `El oráculo está mezclando las cartas para tu ${spread.title}...`);
  cards.forEach((c, i) => setTimeout(() => { ceremonyTone('reveal'); ceremonyVibrate(22); addChat('oracle', `${c.position || `Carta ${i+1}`}: ${c.card.name}${c.rev ? ' invertida' : ''}
${c.rev ? c.card.rv : c.card.up}`, `<div class="chat-ritual-grid single">${chatTarotCardHTML(c)}</div>`); }, ceremonyDelay(650 + i * 950)));
  setTimeout(() => addChat('oracle', `Lectura completada. Puedes guardarla, crear PDF, escuchar la voz o pedirme que profundice con IA.`, `<div class="chat-ritual-grid summary tarot-count-${cards.length}">${cards.map(chatTarotCardHTML).join('')}</div><div class="actions mt"><button class="btn compact" data-act="ai-reading">🤖 Profundizar IA</button><button class="btn compact" data-act="speak-ai">🔊 Leer IA</button><button class="btn compact" data-act="save-reading">⭐ Guardar</button><button class="btn compact" data-act="pdf-options">📄 PDF</button><button class="btn compact" data-chat-quick="otra ${spread.title}">🔄 Otra similar</button></div>`), ceremonyDelay(900 + cards.length * 950));
}
function chatDrawRunes(count = 1) {
  const reversedRate = chooseReversedRate();
  const runes = [...RUNAS].sort(() => Math.random() - .5).slice(0, count).map(rune => ({ rune, rev: Boolean(rune.rv) && isReversed(reversedRate) }));
  const title = count === 1 ? 'Runa privada' : `Tirada privada de ${count} runas`;
  const lines = runes.map((r, i) => `${i + 1}. ${r.rune.name} ${r.rev ? 'invertida' : ''}: ${r.rev ? (r.rune.rv || r.rune.up) : r.rune.up}`).join('\n\n');
  setLastReading({ type:'Runas privadas', title, text:lines, items:runes.map(r=>({ kind:'runa', name:r.rune.name, subtitle:r.rune.up || '', image:r.rune.img || '', symbol:r.rune.sym || 'ᚱ', reversed:!!r.rev })), ritual:{ module:'chat', action:'runes', count }, meta:{ reversedRate } });
  ceremonyTone('shuffle'); ceremonyVibrate([14,35,14]);
  addChat('oracle', 'El oráculo agita el saquito de runas...');
  runes.forEach((r, i) => setTimeout(() => { ceremonyTone('rune'); ceremonyVibrate(22); addChat('oracle', `Runa ${i+1}: ${r.rune.sym} ${r.rune.name}${r.rev ? ' invertida' : ''}
${r.rev ? (r.rune.rv || r.rune.up) : r.rune.up}`, `<div class="chat-ritual-grid runes single">${chatRuneHTML(r, i)}</div>`); }, ceremonyDelay(650 + i * 900)));
  setTimeout(() => addChat('oracle', 'Tirada de runas completada. Puedes guardarla o crear su PDF.', `<div class="chat-ritual-grid runes summary rune-count-${runes.length}">${runes.map((r,i)=>chatRuneHTML(r,i)).join('')}</div><div class="actions mt"><button class="btn compact" data-act="ai-reading">🤖 Profundizar IA</button><button class="btn compact" data-act="save-reading">⭐ Guardar</button><button class="btn compact" data-act="pdf-options">📄 PDF</button><button class="btn compact" data-chat-quick="otra runa">🔄 Otra similar</button></div>`), ceremonyDelay(900 + runes.length * 900));
}
async function processChatMessage(text) {
  const clean = cleanInterpretation(text);
  if (!clean) return;
  addChat('user', clean);
  const intent = detectChatIntent(clean);
  if (intent.kind === 'tarot') return chatDrawTarot(intent.spread);
  if (intent.kind === 'runes') return chatDrawRunes(intent.count);
  if (intent.kind === 'tutorial') { showAppTutorial(); addChat('oracle','He abierto el tutorial guiado.'); return; }
  if (intent.kind === 'install') { showInstallHelp(); addChat('oracle','He abierto la guía de instalación PWA.'); return; }
  if (intent.kind === 'public') { showPublicLaunch(); addChat('oracle','He abierto Publicación y difusión.'); return; }
  if (intent.kind === 'avatar') { previewOracleAvatarEmotions(); addChat('oracle','He activado una vista previa del avatar emocional del oráculo.'); return; }
  if (intent.kind === 'control') { showControlCenter(); addChat('oracle','He abierto el Centro de control.'); return; }
  if (intent.kind === 'privacy') { showPrivacyCenter(); addChat('oracle','He abierto Privacidad y datos.'); return; }
  if (intent.kind === 'search') { showGlobalSearch(); addChat('oracle','He abierto el buscador global.'); return; }
  if (intent.kind === 'guided') { showGuidedReveal(); addChat('oracle','He abierto una tirada guiada paso a paso.'); return; }
  if (intent.kind === 'daily') { daily(); addChat('oracle','He abierto tu mensaje del día en una lectura visual. También puedes pedirme: “hazlo aquí en el chat”.'); return; }
  if (intent.kind === 'moon') { showLuna(); addChat('oracle','He abierto la lectura lunar. Si prefieres, escribe “hazlo aquí en el chat” y lo mantenemos privado.'); return; }
  if (intent.kind === 'dream') return addChat('oracle','Cuéntame el sueño con todos los detalles que recuerdes. También puedes abrir el módulo Sueños si quieres guardar la interpretación.', `<div class="actions mt"><button class="btn compact" data-module="suenos">💭 Abrir Sueños</button></div>`);
  if (intent.kind === 'grabovoi') return handleChatGrabovoi(clean);
  if (/última|ultima|lectura anterior|tirada anterior|presente|futuro|pasado|invertida|profundiza|explica|comparar|compara/.test(clean.toLowerCase()) && lastReading && localStorage.getItem(LS.puter) !== 'true') {
    return addChat('oracle', `Puedo seguir el hilo de tu última lectura: ${lastReading.title}. En modo simbólico veo esto:\n\n${clampText(lastReading.text, 700)}\n\nPara una interpretación conversacional completa, conecta Puter IA; mientras tanto puedo hacer otra tirada, guardar, leer en voz o crear PDF.`, `<div class="actions mt"><button class="btn compact" data-act="connect-ai">🤖 Conectar IA</button><button class="btn compact" data-act="speak-ai">🔊 Voz</button><button class="btn compact" data-act="pdf-options">📄 PDF</button></div>`);
  }
  if (localStorage.getItem(LS.puter) === 'true') {
    mostrarPensando();
    const memory = getChatMemoryContext(14);
    const userName = getUserName();
    const answer = await askAI(`Responde como Oráculo Místico en español. Sé cálido, útil y simbólico. No des consejos médicos, legales ni financieros. ${userName ? `La persona se llama ${userName}; úsalo de forma natural, sin repetirlo demasiado.` : ''} Recuerda el hilo reciente de la conversación y responde con continuidad. Ten en cuenta el perfil personal si existe: intención ${getProfile().intention || 'no indicada'}, signo/energía ${getProfile().sign || 'no indicado'}. Si conviene, recomienda o realiza una tirada de tarot, runa, luna, sueños, numerología o Grabovoi.

Historial reciente:
${memory}

Última lectura activa, si existe:
${lastReading ? `${lastReading.title}\n${lastReading.text}${lastReading.ai ? '\nInterpretación IA previa:\n' + lastReading.ai : ''}` : 'No hay lectura activa.'}

Último mensaje del usuario:
${clean}`);
    ocultarPensando();
    const finalAnswer = answer || 'No he podido conectar con el Oráculo en este momento. Puedes pedirme una tirada directa: “hazme una tirada de tarot”.';
    addChat('oracle', finalAnswer, `<div class="actions mt"><button class="btn compact" data-act="speak-ai">🔊 Voz</button><button class="btn compact" data-chat-quick="hazme una tirada de tarot">🃏 Tarot</button><button class="btn compact" data-chat-quick="sácame una runa">ᚱ Runa</button></div>`);
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
    'save-guide': () => { const v=$('#guideName')?.value?.trim(); if(v) localStorage.setItem(LS.name,v); localStorage.setItem(LS.guide,'yes'); closeModal(); updateHome(); toast('Guía completada.'); },
    'save-settings': () => { const v=$('#settingsName')?.value?.trim(); if(v) localStorage.setItem(LS.name,v); setAppLanguage($('#appLanguage')?.value || 'auto'); localStorage.setItem(LS.aiStyle, $('#aiStyle')?.value || 'mistica'); setVoicePrefs({ engine: $('#voiceEngine')?.value || 'device', remoteVoice: $('#remoteVoice')?.value || 'coral', voiceFilter: $('#voiceFilter')?.value || 'all', keepScreenAwake: $('#keepScreenAwake')?.value !== 'false', language: $('#voiceLanguage')?.value || 'auto', deviceVoiceURI: $('#deviceVoiceURI')?.value || '', preset: $('#voicePreset')?.value || 'mistica_femenina', avatarStyle: $('#oracleAvatarStyle')?.value || 'auto', avatarEnabled: $('#oracleAvatarEnabled')?.value !== 'false', avatarPosition: $('#oracleAvatarPosition')?.value || 'right', avatarSize: $('#oracleAvatarSize')?.value || 'medium', avatarMood: $('#oracleAvatarMood')?.value || 'auto', avatarSpeechMode: $('#oracleAvatarSpeechMode')?.value || 'auto', rate: Number($('#voiceRate')?.value || getVoicePreset($('#voicePreset')?.value || 'mistica_femenina').rate) }); setCeremonyPrefs({ speed: $('#ceremonySpeed')?.value || 'normal', sounds: $('#ceremonySounds')?.value === 'true', vibration: $('#ceremonyVibration')?.value === 'true' }); setTheme($('#themeSelect')?.value || getTheme()); setPrivateMode($('#privateModeSelect')?.value === 'true'); setPdfStyle($('#pdfStyleSelect')?.value || getPdfStyle()); setFocusMode($('#focusModeSelect')?.value === 'true'); setPerformanceMode($('#performanceModeSelect')?.value === 'true'); closeModal(); updateHome(); toast(t('settingsSaved')); },
    'toggle-contrast': () => { const p=storeGet(LS.prefs,{}); p.highContrast=!p.highContrast; storeSet(LS.prefs,p); updateHome(); showSettings(); },
    'toggle-large-text': () => { const p=storeGet(LS.prefs,{}); p.largeText=!p.largeText; storeSet(LS.prefs,p); updateHome(); showSettings(); },
    'update-pwa': async () => { try { const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); } catch {} location.reload(); },
    'open-manual': () => window.open('docs/manual_usuario_oraculo_mistico_v1_0.pdf', '_blank'),
    'mi-oraculo': showMiOraculo,
    'save-profile': () => { setProfile({ birth: $('#profileBirth')?.value || '', sign: $('#profileSign')?.value || '', intention: $('#profileIntention')?.value || '', favoriteSpread: $('#profileSpread')?.value || 'three' }); localStorage.setItem(LS.intention, $('#profileIntention')?.value || 'libre'); updateHome(); toast('Mi Oráculo guardado.'); showMiOraculo(); },
    'profile-favorite-spread': () => drawTarotSpread(getProfile().favoriteSpread || 'three'),
    'toggle-private': () => { setPrivateMode(!isPrivateMode()); updateHome(); showMiOraculo(); },
    'import-backup': () => { const input=document.createElement('input'); input.type='file'; input.accept='application/json,.json'; input.onchange=()=>importBackupFromFile(input.files?.[0]); input.click(); },
    'test-ceremony': () => { setCeremonyPrefs({ speed: $('#ceremonySpeed')?.value || 'normal', sounds: $('#ceremonySounds')?.value === 'true', vibration: $('#ceremonyVibration')?.value === 'true' }); ceremonyTone('reveal'); ceremonyVibrate([25,40,25]); toast('Ceremonia probada.'); },
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
      if (!lastReading) return toast('Primero crea una lectura.');
      if (localStorage.getItem(LS.puter) !== 'true') {
        setAIReadingPanel(`<h3>🤖 IA no conectada</h3><p>Conecta Puter IA para profundizar esta lectura sin salir de la tirada.</p><div class="actions mt"><button class="btn primary compact" data-act="connect-ai" type="button">Conectar IA</button></div>`, 'warning');
        return;
      }
      const isGrabovoi = lastReading.type === 'Grabovoi';
      setAIReadingPanel(`<div class="channeling"><span class="orb-pulse">🔮</span><div><h3>${isGrabovoi ? 'Analizando el código Grabovoi...' : `${getUserName() ? getUserName() + ', e' : 'E'}l oráculo está canalizando...`}</h3><p>${isGrabovoi ? 'La ampliación se centrará únicamente en la secuencia, su práctica y sus límites.' : 'Estoy profundizando la lectura con IA. Puedes dejar esta pantalla abierta.'}</p></div></div>`, 'loading');
      const prompt = isGrabovoi
        ? `Analiza exclusivamente esta ficha de un código Grabovoi. No hables del usuario, su personalidad, energía ni destino. Explica: finalidad declarada, estructura y bloques de la secuencia, lectura simbólica de los dígitos sin inventar propiedades, una práctica de concentración paso a paso, duración prudente, formas de escribir o visualizar el número y consejos para registrar la práctica. No prometas resultados. Si trata salud, deja claro que no diagnostica, trata ni cura y que no sustituye atención médica. Esta pantalla no es un chat: entrega una interpretación completa y cerrada, sin formular preguntas, sin pedir datos y sin invitar al usuario a responder. Responde de forma clara y organizada:\n\n${base}`
        : `Amplía esta lectura de forma simbólica, clara, positiva y segura. Esta pantalla no es un chat: entrega una interpretación completa, autónoma y cerrada. No formules ninguna pregunta al usuario, no pidas aclaraciones o datos adicionales, no ofrezcas continuar conversando y no termines con una interrogación. Interpreta únicamente la información disponible. Si es una tirada de una carta, explica el mensaje central, cómo se relaciona con la pregunta si existe, la advertencia o matiz y un paso práctico concreto. En tiradas de varias cartas, integra sus posiciones y concluye con un consejo final. No hagas promesas absolutas. No des consejos médicos, legales ni financieros. Usa un tono místico, claro y útil:

${base}`;
      const rawAI = await askAI(prompt);
      const ai = cleanClosedReading(rawAI);
      if (ai) {
        lastReading.ai = ai;
        setAIReadingPanel(`<h3>🤖 Interpretación IA</h3><p>${escapeHTML(ai).replace(/\n/g,'<br>')}</p><div class="actions mt"><button class="btn compact" data-act="speak-ai" type="button">🔊 Leer IA</button><button class="btn compact" data-act="stop-voice" type="button">⏹️ Parar</button><button class="btn compact" data-act="copy-reading" type="button">📋 Copiar todo</button><button class="btn compact" data-act="pdf-reading" type="button">📄 Incluir IA en PDF</button></div>`, 'success');
      } else {
        setAIReadingPanel(`<h3>IA no disponible ahora</h3><p>La lectura simbólica sigue activa. Puedes reintentar en unos segundos o conectar Puter IA desde ajustes.</p>`, 'warning');
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
    'refresh-voices': () => { toast('Revisando las voces instaladas...'); reloadDeviceVoices({ reopenLibrary:true }); },
    'export-diary': () => { const diary=storeGet(LS.diary,[]); downloadTextFile('biblioteca-mistica.txt', diary.map(d=>`${d.title}\n${new Date(d.date).toLocaleString()}\n${d.text}`).join('\n\n---\n\n')); },
    'clear-diary': () => { if(confirm('¿Vaciar la Biblioteca Mística?')){ storeSet(LS.diary,[]); showBiblioteca(); } },
    'open-chat': showChatRitual
  };
  actionMap[action]?.();
}
function openModule(module) {
  const map = { map: showMap, tarot: showTarot, runas: showRunas, luna: showLuna, suenos: showSuenos, numerologia: showNumerologia, grabovoi: showGrabovoi, biblioteca: showBiblioteca, chat: showChatRitual, settings: showSettings };
  map[module]?.();
}

function attachGlobalEvents() {
  document.addEventListener('click', async e => {
    const micTarget = e.target.closest('[data-mic-target]')?.dataset.micTarget;
    if (micTarget) return startDictation(micTarget);
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
    const grabIndex = e.target.closest('[data-grab-index]')?.dataset.grabIndex;
    if (grabIndex !== undefined) return showGrabDetail(grabovoiEntries[Number(grabIndex)]);
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
  document.addEventListener('input', e => {
    if (e.target.id === 'globalSearchInput') { const box=$('#globalSearchResults'); if(box) box.innerHTML = renderGlobalSearchResults(e.target.value || ''); return; }
    if (e.target.id === 'diarySearch') { showBiblioteca($('#diaryFilter')?.value || 'all'); return; }
    if (e.target.id === 'diaryFilter') { showBiblioteca(e.target.value || 'all'); return; }
    if (e.target.id === 'grabSearch') {
      const q = e.target.value.toLowerCase().trim();
      const list = grabovoiEntries.filter(x => `${x.codigo} ${x.nombre} ${x.categoria} ${x.uso}`.toLowerCase().includes(q)).slice(0, 60);
      $('#grabList').innerHTML = renderGrabList(list);
    }
  });
  document.addEventListener('change', e => {
    if (e.target?.id === 'voiceLanguage' || e.target?.id === 'voiceFilter') refreshDeviceVoiceSelect();
  });
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
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('service-worker.js'); } catch {}
  }
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
    toast('Catálogo TTS de Android preparado.');
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
