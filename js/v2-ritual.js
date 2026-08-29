/* ============================================================
   ORÁCULO MÍSTICO · EL RITUAL
   Fase 4. Sacar cartas deja de ser pulsar un botón.

   Pasos 1 a 3 -intención, conexión, elección- viven aquí.
   Los pasos 4 y 5 -revelación e interpretación- se entregan a
   la ceremonia que el motor ya tenía, con las cartas que la
   persona ha elegido. Nada se duplica.
   ============================================================ */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  /* El mismo sistema i18n del motor, no uno nuevo. */
  const tr = (k, v) => window.OraculoI18n?.t?.(k, v) ?? k;

  const LS_RITUAL = 'oraculo.v2.ritual';       // 'on' | 'off'
  const LS_INTENCION = 'oraculo.intention';    // ya existía: se respeta

  const esc = (v = '') => String(v)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const menosMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ritualActivo = () => { try { return localStorage.getItem(LS_RITUAL) !== 'off'; } catch { return true; } };

  /* Cuántas cartas boca abajo se ofrecen para elegir entre ellas. */
  function tamanoAbanico(n) {
    if (n <= 3) return 12;
    if (n <= 6) return 16;
    if (n <= 10) return 20;
    return 24;
  }

  let estado = null;

  /* ---------- Armazón ---------- */
  function abrir(html, paso) {
    let raiz = $('#omRitual');
    if (!raiz) {
      raiz = document.createElement('div');
      raiz.id = 'omRitual';
      raiz.className = 'om-ritual';
      document.body.appendChild(raiz);
    }
    raiz.innerHTML = `
      <div class="om-ritual-backdrop" data-ritual="cancelar"></div>
      <div class="om-ritual-panel" role="dialog" aria-modal="true" aria-labelledby="omRitualTitulo">
        <div class="om-ritual-steps" aria-hidden="true">
          ${[1, 2, 3].map(i => `<i class="${i < paso ? 'hecho' : i === paso ? 'activo' : ''}"></i>`).join('')}
        </div>
        <button class="om-ritual-cerrar" data-ritual="cancelar" type="button" aria-label="${esc(tr('rExit'))}">✕</button>
        ${html}
      </div>`;
    raiz.hidden = false;
    (window.OraculoSheets?.lock || (() => document.body.classList.add('om-sheet-lock')))();
    requestAnimationFrame(() => raiz.classList.add('om-ritual-abierto'));
    const foco = raiz.querySelector('textarea, .om-ritual-cta');
    if (foco) setTimeout(() => foco.focus(), 60);
  }

  function cerrar() {
    const raiz = $('#omRitual');
    if (!raiz) return;
    raiz.classList.remove('om-ritual-abierto');
    if (window.OraculoSheets?.refreshLock) window.OraculoSheets.refreshLock();
    else document.body.classList.remove('om-sheet-lock');
    const ocultar = () => { raiz.hidden = true; raiz.innerHTML = ''; };
    menosMovimiento() ? ocultar() : setTimeout(ocultar, 240);
    estado = null;
  }

  /* ---------- Paso 1 · Intención ---------- */
  function paso1(clave) {
    const spread = window.OraculoTarot?.getSpread?.(clave);
    if (!spread) return false;
    let previa = '';
    try { previa = localStorage.getItem(LS_INTENCION) || ''; } catch {}

    estado = { clave, spread, intencion: previa, elegidas: [] };

    abrir(`
      <p class="om-ritual-eyebrow">${esc(tr('rStep', { n: 1 }))}</p>
      <h2 id="omRitualTitulo">${esc(tr('rIntentTitle'))}</h2>
      <p class="om-ritual-sub">${esc(tr('rIntentText'))}</p>
      <label class="sr-only" for="omRitualPregunta">${esc(tr('rIntentTitle'))}</label>
      <textarea id="omRitualPregunta" class="om-ritual-input" rows="3"
        placeholder="${esc(tr('rIntentPlaceholder'))}">${esc(previa)}</textarea>
      <p class="om-ritual-nota">${esc(tr('rIntentNote'))}</p>
      <div class="om-ritual-acciones">
        <button class="om-btn om-btn-primary om-ritual-cta" data-ritual="a-paso-2" type="button">${esc(tr('rContinue'))}</button>
        <button class="om-btn om-btn-quiet" data-ritual="sin-pregunta" type="button">${esc(tr('rSilent'))}</button>
      </div>
      <p class="om-ritual-pie">${esc(spread.title)} · ${spread.count} carta${spread.count > 1 ? 's' : ''}</p>
    `, 1);
    return true;
  }

  /* ---------- Paso 2 · Conexión ---------- */
  function paso2() {
    if (!estado) return;
    abrir(`
      <p class="om-ritual-eyebrow">${esc(tr('rStep', { n: 2 }))}</p>
      <h2 id="omRitualTitulo">${esc(tr('rConnectTitle'))}</h2>
      <div class="om-breath" aria-hidden="true"><span></span><span></span><span></span></div>
      <p class="om-ritual-sub om-breath-text">${esc(tr('rBreathe'))}</p>
      ${estado.intencion ? `<p class="om-ritual-eco">“${esc(estado.intencion)}”</p>` : ''}
      <div class="om-ritual-acciones">
        <button class="om-btn om-btn-primary om-ritual-cta" data-ritual="a-paso-3" type="button">${esc(tr('rReady'))}</button>
      </div>
      <p class="om-ritual-pie">${esc(tr('rNoRush'))}</p>
    `, 2);
  }

  /* ---------- Paso 3 · Elección ---------- */
  function paso3() {
    if (!estado) return;
    const total = tamanoAbanico(estado.spread.count);
    const cartas = Array.from({ length: total }, (_, i) => {
      const giro = (i - (total - 1) / 2) * 1.6;
      return `<button class="om-carta" data-ritual="elegir" data-i="${i}" type="button"
                style="--giro:${giro.toFixed(2)}deg; --retardo:${(i * 26)}ms"
                aria-label="${esc(tr('rCardOf', { i: i + 1, n: total }))}">
                <span class="om-carta-dorso" aria-hidden="true"></span>
              </button>`;
    }).join('');

    abrir(`
      <p class="om-ritual-eyebrow">${esc(tr('rStep', { n: 3 }))}</p>
      <h2 id="omRitualTitulo">${esc(tr('rChooseTitle'))}</h2>
      <p class="om-ritual-sub">${esc(estado.spread.count === 1 ? tr('rChooseOne') : tr('rChooseMany', { n: estado.spread.count }))}</p>
      <p class="om-ritual-contador" id="omRitualContador" aria-live="polite">0 ${tr('rOf')} ${estado.spread.count}</p>
      <div class="om-mesa" id="omMesa">${cartas}</div>
      <div class="om-ritual-acciones">
        <button class="om-btn om-btn-quiet" data-ritual="al-azar" type="button">${esc(tr('rOracleChooses'))}</button>
      </div>
    `, 3);
  }

  function elegir(boton) {
    if (!estado || boton.classList.contains('om-carta-tomada')) return;
    const objetivo = estado.spread.count;
    if (estado.elegidas.length >= objetivo) return;

    boton.classList.add('om-carta-tomada');
    boton.disabled = true;
    /* El ritual V2 era mudo: el sonido solo vivia en el motor viejo.
       Usa la misma preferencia, asi que sigue apagado por defecto. */
    window.OraculoSonido?.tono('pick');
    window.OraculoSonido?.vibrar(12);
    boton.setAttribute('aria-label', tr('rChosen'));
    estado.elegidas.push(Number(boton.dataset.i));

    const cont = $('#omRitualContador');
    if (cont) cont.textContent = `${estado.elegidas.length} ${tr('rOf')} ${objetivo}`;

    if (estado.elegidas.length >= objetivo) {
      const mesa = $('#omMesa');
      if (mesa) mesa.classList.add('om-mesa-completa');
      window.OraculoSonido?.tono('close');
      setTimeout(revelar, menosMovimiento() ? 0 : 520);
    }
  }

  /* ---------- Pasos 4 y 5 · se los entrega al motor ---------- */
  function revelar() {
    const api = window.OraculoTarot;
    if (!api || !estado) { cerrar(); return; }
    const { spread, intencion } = estado;

    /* La ceremonia del motor lee la pregunta de #tarotPrompt. Se le
       deja donde la espera, para que aparezca en la lectura y en el PDF. */
    let campo = $('#tarotPrompt');
    if (!campo) {
      campo = document.createElement('input');
      campo.type = 'hidden';
      campo.id = 'tarotPrompt';
      document.body.appendChild(campo);
    }
    campo.value = intencion || '';

    const tasa = api.tasaInvertidas();
    const barajado = [...api.deck].sort(() => Math.random() - .5).slice(0, spread.count);
    const elegidas = barajado.map((card, i) => ({
      card,
      rev: api.esInvertida(tasa),
      position: spread.positions[i] || ''
    }));

    cerrar();
    setTimeout(() => api.revelar(elegidas, spread.title, tasa), 120);
  }

  function alAzar() {
    if (!estado) return;
    estado.elegidas = Array.from({ length: estado.spread.count }, (_, i) => i);
    revelar();
  }

  /* ---------- Enlazado ---------- */
  document.addEventListener('click', (ev) => {
    const t = ev.target;
    if (!t || !t.closest) return;

    const paso = t.closest('[data-ritual]');
    if (paso) {
      const q = paso.dataset.ritual;
      ev.preventDefault();
      if (q === 'cancelar') return cerrar();
      if (q === 'a-paso-2') {
        const val = $('#omRitualPregunta')?.value?.trim() || '';
        estado.intencion = val;
        try { val ? localStorage.setItem(LS_INTENCION, val) : localStorage.removeItem(LS_INTENCION); } catch {}
        return paso2();
      }
      if (q === 'sin-pregunta') { estado.intencion = ''; return paso2(); }
      if (q === 'a-paso-3') return paso3();
      if (q === 'elegir') return elegir(paso);
      if (q === 'al-azar') return alAzar();
      return;
    }

    /* Se intercepta la tirada antes de que el motor la lance. */
    const disparo = t.closest('[data-act^="spread-"]');
    if (!disparo || !ritualActivo()) return;
    const clave = disparo.dataset.act.replace('spread-', '');
    if (!window.OraculoTarot?.getSpread?.(clave)) return;   // no es una tirada conocida
    ev.preventDefault();
    ev.stopPropagation();
    // Se cierra el modal del módulo para que el ritual quede limpio.
    document.querySelector('#modalRoot [data-close-modal]')?.click();
    setTimeout(() => paso1(clave), 160);
  }, true); // captura: llegar antes que el delegado del motor

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !$('#omRitual')?.hidden) cerrar();
  });

  /* Interruptor del ritual en Perfil. Quien lo desactive vuelve a la
     tirada directa de siempre, sin perder nada. */
  function pintarInterruptor() {
    const b = $('#omRitualToggle');
    if (!b) return;
    const activo = ritualActivo();
    b.setAttribute('aria-pressed', String(activo));
    const desc = b.querySelector('small');
    if (desc) desc.textContent = activo ? tr('ritOn') : tr('ritOff');
  }

  document.addEventListener('click', (ev) => {
    if (!ev.target?.closest?.('[data-om-ritual-toggle]')) return;
    ev.preventDefault();
    try { localStorage.setItem(LS_RITUAL, ritualActivo() ? 'off' : 'on'); } catch {}
    pintarInterruptor();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pintarInterruptor, { once: true });
  } else {
    pintarInterruptor();
  }
})();
