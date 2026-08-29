/* ============================================================
   ORÁCULO MÍSTICO · LA VOZ DEL ORÁCULO
   Fase 7. Reúne los controles de voz, que estaban repartidos
   entre botones sueltos, y da al chat un Orbe con estados.

   No sustituye al motor de voz: lo pilota. Toda la síntesis
   sigue en coreApp, con sus preferencias y sus voces.
   ============================================================ */
(() => {
  'use strict';

  /* El mismo sistema i18n del motor, no uno nuevo. Si aun no ha
     cargado, se devuelve la clave para no romper el pintado. */
  const tr = (k, v) => window.OraculoI18n?.t?.(k, v) ?? k;

  const $ = (s, r = document) => r.querySelector(s);
  const LS_VELOCIDAD = 'oraculo.v2.voz.velocidad';
  const LS_SILENCIO  = 'oraculo.v2.voz.silencio';
  let cierrePendiente = null;

  const sintesis = () => window.speechSynthesis || null;

  const leerNum = (k, x) => { const v = parseFloat(localStorage.getItem(k)); return Number.isFinite(v) ? v : x; };
  const silenciada = () => { try { return localStorage.getItem(LS_SILENCIO) === '1'; } catch { return false; } };

  /* ---------- Estados del Orbe ----------
     reposo · pensando · hablando */
  function estadoOrbe(estado) {
    document.body.dataset.omOrbe = estado || 'reposo';
    const panel = $('#omVozPanel');
    if (panel) panel.dataset.estado = estado || 'reposo';
  }

  /* La voz se vigila desde fuera: el motor arranca y para la síntesis
     por su cuenta, así que se observa el estado real del navegador. */
  function vigilarVoz() {
    const s = sintesis();
    if (!s) return;
    let ultimo = null;
    setInterval(() => {
      const hablando = s.speaking && !s.paused;
      const pausada = s.paused;
      const ahora = hablando ? 'hablando' : pausada ? 'pausada' : 'reposo';
      if (ahora === ultimo) return;
      ultimo = ahora;
      if (document.body.dataset.omOrbe !== 'pensando') estadoOrbe(ahora === 'pausada' ? 'reposo' : ahora);
      pintarControles();
    }, 400);
  }

  /* El indicador de "pensando" del chat manda sobre el resto. */
  function vigilarPensando() {
    const obs = new MutationObserver(() => {
      const pensando = !!document.getElementById('omPensando');
      if (pensando) estadoOrbe('pensando');
      else if (document.body.dataset.omOrbe === 'pensando') estadoOrbe('reposo');
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  /* ---------- Panel de voz ---------- */
  function pintarControles() {
    const panel = $('#omVozPanel');
    if (!panel) return;
    const s = sintesis();
    const hablando = !!(s && s.speaking && !s.paused);
    const pausada = !!(s && s.paused);
    const bPausa = panel.querySelector('[data-voz="pausa"]');
    if (bPausa) {
      bPausa.textContent = pausada ? '▶ ' + tr('vResume') : '⏸ ' + tr('vPause');
      bPausa.disabled = !hablando && !pausada;
    }
    const bParar = panel.querySelector('[data-voz="parar"]');
    if (bParar) bParar.disabled = !hablando && !pausada;
    const bSil = panel.querySelector('[data-voz="silencio"]');
    if (bSil) {
      const sil = silenciada();
      bSil.setAttribute('aria-pressed', String(sil));
      bSil.textContent = sil ? '🔇 ' + tr('vMuted') : '🔊 ' + tr('vWithVoice');
    }
  }

  function abrirPanel() {
    let panel = $('#omVozPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'omVozPanel';
      panel.className = 'om-voz-panel';
      document.body.appendChild(panel);
    }
    if (cierrePendiente) {
      clearTimeout(cierrePendiente);
      cierrePendiente = null;
    }
    const vel = leerNum(LS_VELOCIDAD, 1);
    panel.innerHTML = `
      <div class="om-sheet-backdrop" data-voz="cerrar"></div>
      <div class="om-sheet-panel om-voz-caja" role="dialog" aria-modal="true" aria-labelledby="omVozTitulo">
        <header class="om-sheet-head">
          <h2 id="omVozTitulo">${tr('vTitle')}</h2>
          <button class="om-sheet-close" data-voz="cerrar" type="button" aria-label="${tr('close')}">✕</button>
        </header>
        <div class="om-sheet-body">
          <div class="om-voz-orbe" aria-hidden="true">
            <span class="om-voz-nucleo"></span>
            <span class="om-voz-onda"></span>
            <span class="om-voz-onda"></span>
            <span class="om-voz-onda"></span>
          </div>
          <p class="om-voz-estado" aria-live="polite">${tr('vSilent')}</p>

          <div class="om-voz-botones">
            <button class="om-btn om-btn-quiet" data-voz="probar" type="button">▶ ${tr('vTest')}</button>
            <button class="om-btn om-btn-quiet" data-voz="pausa" type="button">⏸ ${tr('vPause')}</button>
            <button class="om-btn om-btn-quiet" data-voz="parar" type="button">■ ${tr('vStop')}</button>
            <button class="om-btn om-btn-quiet" data-voz="silencio" type="button" aria-pressed="false">🔊 ${tr('vWithVoice')}</button>
          </div>

          <p class="om-group-label">${tr('vSpeed')}</p>
          <div class="om-voz-velocidad">
            <input id="omVozVel" type="range" min="0.6" max="1.6" step="0.05" value="${vel}"
                   aria-label="${tr('vSpeedLabel')}">
            <output for="omVozVel" id="omVozVelOut">${vel.toFixed(2)}×</output>
          </div>
          <p class="om-grim-pie">${tr('vOptional')}</p>

          <div class="om-rows" style="margin-top:var(--om-s-4)">
            <button class="om-row" data-act="voice-library" type="button"><span>🗣️</span><b>${tr('vPickVoice')}</b><small>${tr('vPickVoiceSub')}</small></button>
            <button class="om-row" data-act="preview-avatar" type="button"><span>🪄</span><b>${tr('vAvatar')}</b><small>${tr('vAvatarSub')}</small></button>
          </div>
        </div>
      </div>`;
    panel.hidden = false;
    panel.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => panel.classList.add('om-sheet-open'));
    (window.OraculoSheets?.lock || (() => document.body.classList.add('om-sheet-lock')))();
    pintarControles();

    const rango = $('#omVozVel');
    if (rango) rango.addEventListener('input', () => {
      const v = parseFloat(rango.value);
      $('#omVozVelOut').textContent = v.toFixed(2) + '×';
      try { localStorage.setItem(LS_VELOCIDAD, String(v)); } catch {}
    });
  }

  function cerrarPanel({ inmediato = false } = {}) {
    const panel = $('#omVozPanel');
    if (!panel) {
      window.OraculoSheets?.refreshLock?.();
      return;
    }
    if (cierrePendiente) {
      clearTimeout(cierrePendiente);
      cierrePendiente = null;
    }
    panel.classList.remove('om-sheet-open');
    panel.setAttribute('aria-hidden', 'true');
    const ocultar = () => {
      if (panel.classList.contains('om-sheet-open')) return;
      panel.hidden = true;
      cierrePendiente = null;
      if (window.OraculoSheets?.refreshLock) window.OraculoSheets.refreshLock();
      else document.body.classList.remove('om-sheet-lock');
    };
    if (inmediato) ocultar();
    else {
      if (window.OraculoSheets?.refreshLock) window.OraculoSheets.refreshLock();
      else document.body.classList.remove('om-sheet-lock');
      cierrePendiente = setTimeout(ocultar, 240);
    }
  }

  window.OraculoSheets = Object.assign({}, window.OraculoSheets, {
    closeVoice: cerrarPanel
  });

  /* ---------- Acciones ---------- */
  function probar() {
    const s = sintesis();
    if (!s) return;
    s.cancel();
    const frase = new SpeechSynthesisUtterance(tr('vGreeting'));
    frase.lang = window.OraculoI18n?.locale?.() || 'es-ES';
    frase.rate = leerNum(LS_VELOCIDAD, 1);
    frase.volume = silenciada() ? 0 : 1;
    s.speak(frase);
  }

  function alternarSilencio() {
    const sil = !silenciada();
    try { localStorage.setItem(LS_SILENCIO, sil ? '1' : '0'); } catch {}
    if (sil) sintesis()?.cancel();
    pintarControles();
    const est = $('.om-voz-estado');
    if (est) est.textContent = sil ? tr('vMutedNote') : tr('vBackNote');
  }

  document.addEventListener('click', (ev) => {
    const accion = ev.target?.closest?.('[data-act]');
    if (accion?.closest?.('#omVozPanel') && ['voice-library', 'preview-avatar'].includes(accion.dataset.act)) {
      cerrarPanel({ inmediato: true });
    }
  }, true);

  document.addEventListener('click', (ev) => {
    const t = ev.target?.closest?.('[data-voz]');
    if (t) {
      const q = t.dataset.voz;
      ev.preventDefault();
      const s = sintesis();
      if (q === 'cerrar') return cerrarPanel();
      if (q === 'probar') return probar();
      if (q === 'pausa') { if (!s) return; s.paused ? s.resume() : s.pause(); return pintarControles(); }
      if (q === 'parar') { s?.cancel(); estadoOrbe('reposo'); return pintarControles(); }
      if (q === 'silencio') return alternarSilencio();
      return;
    }
    if (ev.target?.closest?.('[data-om-voz]')) { ev.preventDefault(); abrirPanel(); }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !$('#omVozPanel')?.hidden) cerrarPanel();
  });

  /* Respeta el silencio también cuando habla el motor. */
  function respetarSilencio() {
    const s = sintesis();
    if (!s || !s.speak) return;
    const original = s.speak.bind(s);
    s.speak = function (frase) {
      if (silenciada()) return;                 // silenciada: no se emite nada
      /* El valor por defecto de rate es exactamente 1, así que ese es el
         indicio de que nadie lo ha tocado y toca aplicar el preferido. */
      try {
        const preferida = leerNum(LS_VELOCIDAD, 1);
        if (frase && frase.rate === 1 && preferida !== 1) frase.rate = preferida;
      } catch {}
      return original(frase);
    };
  }

  function iniciar() {
    estadoOrbe('reposo');
    respetarSilencio();
    vigilarVoz();
    vigilarPensando();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();
