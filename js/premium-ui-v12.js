/* Atajo al i18n del motor. No es un sistema nuevo: delega en el
   mismo diccionario, y si aun no ha cargado devuelve la clave. */
function OI(k, v) { return window.OraculoI18n?.t?.(k, v) ?? k; }
/* Este fichero son varios bloques cerrados y cada uno tiene sus cosas.
   Habia un escapeHTML, pero dentro del ultimo bloque, asi que los de
   arriba no lo alcanzaban y pintaban sin escapar. Este vive fuera de
   todos y lo alcanza cualquiera.

   Hacia falta: la intencion que escribe la persona se metia tal cual en
   el innerHTML del distintivo de la portada. Escribiendo como intencion
   una etiqueta con un manejador de evento, el navegador la ejecutaba.
   Comprobado antes y despues con la misma carga. */
function OEsc(v = '') {
  return String(v).replace(/[&<>'"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[ch]));
}
/* Oráculo Místico · Premium UI v2
   JS ligero y no invasivo: no cambia la lógica del tarot.
*/
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  function vibrate(ms = 12) {
    try { navigator.vibrate?.(ms); } catch {}
  }

  function showLoaded() {
    document.body.classList.add('premium-loaded');
    setTimeout(() => $('#premiumLoader')?.remove(), 900);
  }

  if (document.readyState === 'complete') {
    setTimeout(showLoaded, 450);
  } else {
    window.addEventListener('load', () => setTimeout(showLoaded, 450), { once: true });
  }

  function proxyToExistingButton(btn) {
    const module = btn.dataset.module;
    const action = btn.dataset.action;
    let target = null;

    if (module) {
      target = document.querySelector(`[data-module="${CSS.escape(module)}"]`);
    }

    if (!target && action) {
      target = document.querySelector(`.hero-actions [data-action="${CSS.escape(action)}"], .daily [data-action="${CSS.escape(action)}"], [data-action="${CSS.escape(action)}"]`);
    }

    if (target && target !== btn) {
      target.click();
      return true;
    }
    return false;
  }

  function setActiveNav(btn) {
    const nav = btn.closest('.premium-bottom-nav');
    if (!nav) return;
    $$('.premium-nav-active', nav).forEach(x => x.classList.remove('premium-nav-active'));
    btn.classList.add('premium-nav-active');
  }

  function ripple(e, el) {
    if (prefersReduced || !el) return;
    const rect = el.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'premium-ripple';
    dot.style.left = `${e.clientX - rect.left}px`;
    dot.style.top = `${e.clientY - rect.top}px`;
    el.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove(), { once: true });
  }

  document.addEventListener('click', (e) => {
    const pressable = e.target.closest('.btn, .module-card, .choice, .tab, .premium-feature-card, .premium-bottom-nav button');
    if (!pressable) return;

    ripple(e, pressable);
    vibrate(10);

    pressable.classList.add('premium-press');
    setTimeout(() => pressable.classList.remove('premium-press'), 130);

    const navBtn = e.target.closest('.premium-bottom-nav button');
    if (navBtn) {
      e.preventDefault();
      setActiveNav(navBtn);
      proxyToExistingButton(navBtn);
    }
  }, { passive: false });

  const hero = $('.premium-hero');
  if (hero && !prefersReduced) {
    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty('--premium-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
      hero.style.setProperty('--premium-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
    }, { passive: true });
  }

  function revealSetup() {
    const targets = $$('.module-card, .premium-feature-card, .daily');
    targets.forEach(el => el.classList.add('premium-reveal-ready'));

    if (prefersReduced || !('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('premium-reveal-in'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('premium-reveal-in');
        io.unobserve(entry.target);
      });
    }, { threshold: .12 });

    targets.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 38, 260)}ms`;
      io.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', revealSetup, { once: true });
  } else {
    revealSetup();
  }

  const modalRoot = $('#modalRoot');
  if (modalRoot && 'MutationObserver' in window) {
    const mo = new MutationObserver(() => {
      $$('.tarot-img, .result-card, .ai-reading-panel, .mini-card', modalRoot).forEach((el, i) => {
        el.style.animationDelay = `${Math.min(i * 35, 220)}ms`;
      });

      const firstTarot = $('.tarot-img', modalRoot);
      if (firstTarot) {
        firstTarot.loading = 'eager';
        firstTarot.decoding = 'async';
      }
    });
    mo.observe(modalRoot, { childList: true, subtree: true });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    $$('.premium-press').forEach(el => el.classList.remove('premium-press'));
  });
})();


/* Premium Assets v3 · preload visual */
(() => {
  const assets = [
    'assets/premium/mystic-bg.svg',
    'assets/premium/card-back-premium.svg',
    'assets/premium/premium-sigil.svg',
    'assets/premium/moon-divider.svg'
  ];

  for (const src of assets) {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.dataset.premiumAssets = 'loaded';
  }, { once: true });
})();




/* Premium Ritual v4 · intención, enfoque y caminos rápidos */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const LS_INTENTION = 'oraculo.intention';
  const LS_FOCUS = 'oraculo.premiumFocus.v1';

  function toast(text) {
    const root = $('#toastRoot');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    root.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }

  /* Estos accesos apuntaban a las tarjetas ".module-card" que vivian en
     los paneles avanzados. Al quitar el bloque se quedaron sin destino y
     los botones dejaron de hacer nada, en silencio, porque clickReal
     devuelve false y nadie mira el valor. Ahora apuntan a lo que si
     existe: los altares del Santuario y el boton de Biblioteca de la
     barra de abajo. */
  function clickReal(selector) {
    const el = document.querySelector(selector);
    if (el) {
      el.click();
      return true;
    }
    return false;
  }

  function getIntention() {
    try { return localStorage.getItem(LS_INTENTION) || ''; }
    catch { return ''; }
  }

  function setIntention(value) {
    value = String(value || '').trim().slice(0, 90);
    try {
      if (value) localStorage.setItem(LS_INTENTION, value);
      else localStorage.removeItem(LS_INTENTION);
    } catch {}
    syncIntentionUI();
  }

  function syncIntentionUI() {
    const value = getIntention();
    const input = $('#premiumIntention');
    const hint = $('#premiumIntentionHint');
    const chip = $('#intentionChip');

    if (input && input.value !== value) input.value = value;
    document.body.classList.toggle('premium-has-intention', !!value);

    if (hint) {
      hint.textContent = value
        ? OI('pmIntentionActive', { v: value })
        : OI('ixSeGuardaraSoloEnEsteDispositivo');
    }

    if (chip) {
      /* El valor lo escribe la persona: se escapa. La cadena traducida
         se compone con el valor ya dentro, asi que se escapa el
         resultado entero, no solo el valor. */
      chip.innerHTML = value
        ? `🧭 <span>${OEsc(OI('pmIntentionSet', { v: value }))}</span>`
        : `🧭 <span data-i18n="intentionFree">${OEsc(OI('intentionFree'))}</span>`;
    }
  }

  function setFocusMode(active) {
    document.body.classList.toggle('premium-focus-mode', active);
    try { localStorage.setItem(LS_FOCUS, active ? '1' : '0'); } catch {}
    toast(active ? 'Modo enfoque activado.' : 'Modo enfoque desactivado.');
  }

  function bootFocusMode() {
    let active = false;
    try { active = localStorage.getItem(LS_FOCUS) === '1'; } catch {}
    document.body.classList.toggle('premium-focus-mode', active);
  }

  function handlePremiumAction(action, source) {
    if (action === 'save-intention') {
      const input = $('#premiumIntention');
      setIntention(input?.value || '');
      $('.premium-intention-box')?.classList.add('premium-intention-saved');
      setTimeout(() => $('.premium-intention-box')?.classList.remove('premium-intention-saved'), 750);
      toast(getIntention() ? 'Intención guardada.' : 'Intención vacía.');
      return;
    }

    if (action === 'clear-intention') {
      setIntention('');
      toast(OI('pmIntentionCleared'));
      return;
    }

    if (action === 'focus-mode') {
      setFocusMode(!document.body.classList.contains('premium-focus-mode'));
      return;
    }

    if (action === 'tarot-reading') {
      toast(getIntention() ? 'Abriendo tarot con tu intención.' : 'Abriendo tarot.');
      clickReal('[data-module="tarot"]');
      return;
    }

    if (action === 'daily-reading') {
      toast(getIntention() ? 'Revelando mensaje con tu intención.' : 'Revelando mensaje del día.');
      clickReal('[data-action="daily"]');
      return;
    }

    if (action === 'ritual-chat') {
      toast(getIntention() ? 'Abriendo chat ritual con tu intención.' : 'Abriendo chat ritual.');
      clickReal('[data-module="chat"]');
      return;
    }
  }

  document.addEventListener('click', (e) => {
    const premium = e.target.closest('[data-premium-action]');
    if (premium) {
      e.preventDefault();
      handlePremiumAction(premium.dataset.premiumAction, premium);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target?.id === 'premiumIntention') {
      e.preventDefault();
      handlePremiumAction('save-intention');
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { syncIntentionUI(); bootFocusMode(); }, { once: true });
  } else {
    syncIntentionUI();
    bootFocusMode();
  }
})();




/* Super Premium v5 · dashboard, palette y onboarding */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const LS_VISITS = 'oraculo.superPremium.visits';
  const LS_IMMERSIVE = 'oraculo.superPremium.immersive';

  const actions = [
    { label: 'tarot', desc: 'paTarotD', run: () => document.querySelector('[data-module="tarot"]')?.click() },
    { label: 'runes', desc: 'paRunasD', run: () => document.querySelector('[data-module="runas"]')?.click() },
    { label: 'moon', desc: 'paLunaD', run: () => document.querySelector('[data-module="luna"]')?.click() },
    { label: 'dreams', desc: 'paSuenosD', run: () => document.querySelector('[data-module="suenos"]')?.click() },
    { label: 'numerology', desc: 'paNumerologiaD', run: () => document.querySelector('[data-module="numerologia"]')?.click() },
    { label: 'library', desc: 'paBibliotecaD', run: () => document.querySelector('[data-om-biblioteca]')?.click() },
    { label: 'paChat', desc: 'paChatD', run: () => document.querySelector('[data-module="chat"]')?.click() },
    { label: 'dailyMessage', desc: 'paDailyD', run: () => document.querySelector('[data-action="daily"]')?.click() },
    { label: 'settings', desc: 'paAjustesD', run: () => document.querySelector('[data-action="settings"]')?.click() }
  ];

  function openPalette() {
    const panel = $('#premiumPalette');
    if (!panel) return;
    panel.hidden = false;
    renderPalette($('#premiumPaletteInput')?.value || '');
    setTimeout(() => $('#premiumPaletteInput')?.focus(), 30);
  }

  function closePalette() {
    const panel = $('#premiumPalette');
    if (panel) panel.hidden = true;
  }

  function openOnboarding() {
    const panel = $('#premiumOnboarding');
    if (panel) panel.hidden = false;
  }

  function closeOnboarding() {
    const panel = $('#premiumOnboarding');
    if (panel) panel.hidden = true;
  }

  function renderPalette(query = '') {
    const root = $('#premiumPaletteResults');
    if (!root) return;
    const q = query.trim().toLowerCase();
    const filtered = actions.filter(item =>
      !q || OI(item.label).toLowerCase().includes(q) || OI(item.desc).toLowerCase().includes(q)
    );
    root.innerHTML = '';
    filtered.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.className = 'premium-palette-item';
      btn.type = 'button';
      btn.innerHTML = `<strong>${escapeHTML(OI(item.label))}</strong><br><small>${escapeHTML(OI(item.desc))}</small>`;
      btn.addEventListener('click', () => {
        closePalette();
        item.run();
      });
      root.appendChild(btn);
    });
    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'premium-palette-item';
      empty.innerHTML = `<strong>${OI('pmNoResults')}</strong><br><small>${OI('pmTryAnother')}</small>`;
      root.appendChild(empty);
    }
  }

  function syncDashboard() {
    const now = new Date();
    const days = ['posDomingo','posLunes','posMartes','posMiercoles','posJueves','posViernes','posSabado'].map(k => OI(k));
    const day = days[now.getDay()];
    const visitNode = $('#premiumVisitCount');
    const todayNode = $('#premiumTodayLabel');
    const todayMsg = $('#premiumTodayMessage');
    const intentionStatus = $('#premiumIntentionStatus');

    try {
      const visits = (parseInt(localStorage.getItem(LS_VISITS) || '0', 10) || 0) + 1;
      localStorage.setItem(LS_VISITS, String(visits));
      if (visitNode) visitNode.textContent = String(visits);
    } catch {
      if (visitNode) visitNode.textContent = '1';
    }

    if (todayNode) todayNode.textContent = day;
    if (todayMsg) todayMsg.textContent = OI('pmTodayMessage');
    const hint = $('#premiumIntentionHint')?.textContent || OI('pmFree');
    /* La pista lleva delante la etiqueta traducida; se recorta por ella. */
    const etiqueta = OI('pmIntentionActive', { v: '' }).trim();
    if (intentionStatus) intentionStatus.textContent = hint.startsWith(etiqueta)
      ? hint.slice(etiqueta.length).trim()
      : OI('pmFree');
  }

  function bootTimer() {
    const start = Date.now();
    const node = $('#premiumSessionTimer');
    if (!node) return;
    setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000);
      const mm = String(Math.floor(s / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      node.textContent = `${mm}:${ss}`;
    }, 1000);
  }

  function toggleImmersive(force) {
    const next = typeof force === 'boolean'
      ? force
      : !document.body.classList.contains('premium-immersive');
    document.body.classList.toggle('premium-immersive', next);
    try { localStorage.setItem(LS_IMMERSIVE, next ? '1' : '0'); } catch {}
  }

  function bootImmersive() {
    try {
      document.body.classList.toggle('premium-immersive', localStorage.getItem(LS_IMMERSIVE) === '1');
    } catch {}
  }

  document.addEventListener('click', (e) => {
    const act = e.target.closest('[data-premium-action]');
    if (!act) return;
    const type = act.dataset.premiumAction;
    if (type === 'open-palette') { e.preventDefault(); openPalette(); }
    if (type === 'close-palette') { e.preventDefault(); closePalette(); }
    if (type === 'ritual-onboarding') { e.preventDefault(); openOnboarding(); }
    if (type === 'close-onboarding') { e.preventDefault(); closeOnboarding(); }
    if (type === 'toggle-immersive') { e.preventDefault(); toggleImmersive(); }
    if (['tarot-reading','daily-reading','ritual-chat','focus-mode'].includes(type)) {
      closeOnboarding();
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target?.id === 'premiumPaletteInput') {
      renderPalette(e.target.value);
    }
  });

  document.addEventListener('keydown', (e) => {
    const cmdK = (e.key.toLowerCase() === 'k') && (e.ctrlKey || e.metaKey);
    if (cmdK) {
      e.preventDefault();
      openPalette();
    }
    if (e.key === 'Escape') {
      closePalette();
      closeOnboarding();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bootImmersive();
      syncDashboard();
      bootTimer();
    }, { once: true });
  } else {
    bootImmersive();
    syncDashboard();
    bootTimer();
  }
})();




/* Tarot Studio v6 · mejoras no invasivas en modales */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function clickReal(selector) {
    const el = document.querySelector(selector);
    if (el) {
      el.click();
      return true;
    }
    return false;
  }

  function toast(text) {
    const root = $('#toastRoot');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    root.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function addModalToolbar(root) {
    const body = $('.modal-body', root);
    if (!body || body.querySelector('.premium-modal-toolbar')) return;

    const hasTarot = body.textContent.toLowerCase().includes('tarot') || body.querySelector('.tarot-img, .mini-card img');
    const hasLibrary = body.querySelector('.library-grid, .diary-list');
    if (!hasTarot && !hasLibrary) return;

    /* En una lectura ya hay una fila de acciones al pie con Guardar,
       Copiar, Escuchar y PDF: esta barra repetia los cuatro. Cuando esa
       fila existe, la barra sobra. Se conserva donde es el unico acceso,
       como en la Biblioteca, que no lleva acciones al pie. */
    if (body.querySelector('.reading-actions')) return;

    const bar = document.createElement('div');
    bar.className = 'premium-modal-toolbar';
    bar.innerHTML = `
      <button type="button" data-v6-act="save">${OI('pmSave')}</button>
      <button type="button" data-v6-act="copy">${OI('pmCopy')}</button>
      <button type="button" data-v6-act="speak">${OI('pmListen')}</button>
      <button type="button" data-v6-act="pdf">📄 PDF</button>
      <button type="button" data-v6-act="focus">${OI('pmFocusBtn')}</button>
    `;
    body.prepend(bar);
  }

  function enhanceTarotImages(root = document) {
    $$('.tarot-img', root).forEach(img => {
      if (img.dataset.v6Enhanced) return;
      img.dataset.v6Enhanced = '1';
      img.decoding = 'async';
      img.loading = 'eager';
      const wrapper = document.createElement('div');
      wrapper.className = 'premium-card-glow';
      img.parentNode?.insertBefore(wrapper, img);
      wrapper.appendChild(img);
    });

    $$('.mini-card img', root).forEach(img => {
      img.decoding = 'async';
      img.loading = 'lazy';
    });
  }

  function proxyReadingAction(action) {
    const selectors = {
      save: '[data-act="save-reading"]',
      copy: '[data-act="copy-reading"]',
      speak: '[data-act="speak-reading"]',
      pdf: '[data-act="pdf-options"]'
    };
    if (action === 'focus') {
      document.querySelector('[data-premium-action="focus-mode"]')?.click();
      return;
    }
    if (clickReal(selectors[action])) return;
    toast(OI('pmNeedReading'));
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-v6-act]');
    if (!btn) return;
    e.preventDefault();
    proxyReadingAction(btn.dataset.v6Act);
  });

  document.addEventListener('click', (e) => {
    const act = e.target.closest('[data-premium-action]');
    if (!act) return;
    if (act.dataset.premiumAction === 'open-library') {
      e.preventDefault();
      clickReal('[data-om-biblioteca]');
    }
  });

  const modalRoot = $('#modalRoot');
  if (modalRoot && 'MutationObserver' in window) {
    const mo = new MutationObserver(() => {
      addModalToolbar(modalRoot);
      enhanceTarotImages(modalRoot);
    });
    mo.observe(modalRoot, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => enhanceTarotImages(), { once: true });
  } else {
    enhanceTarotImages();
  }
})();




/* Concierge v7 · temas, notas e historial */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const LS_THEME = 'oraculo.concierge.theme';
  const LS_NOTE = 'oraculo.concierge.quickNote';
  const LS_ACTIVITY = 'oraculo.concierge.activity';

  function toast(text) {
    const root = $('#toastRoot');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    root.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function saveTheme(theme) {
    document.body.dataset.premiumTheme = theme;
    try { localStorage.setItem(LS_THEME, theme); } catch {}
    pushActivity('Tema visual', `Cambio a ${theme}`);
    const NOMBRES = { gold: "Arcano", violet: "Violeta", obsidian: "Obsidiana" };
    toast(`Tema ${NOMBRES[theme] || theme} activado.`);
  }

  function bootTheme() {
    let theme = 'gold'
    try { theme = localStorage.getItem(LS_THEME) || 'gold'; } catch {}
    document.body.dataset.premiumTheme = theme;
  }

  function saveQuickNote() {
    const input = $('#premiumQuickNote');
    const value = (input?.value || '').trim().slice(0, 280);
    try {
      if (value) localStorage.setItem(LS_NOTE, value);
      else localStorage.removeItem(LS_NOTE);
    } catch {}
    pushActivity('Nota rápida', value ? 'Nota guardada' : 'Nota vacía');
    toast(value ? 'Nota guardada.' : 'No había contenido para guardar.');
  }

  function clearQuickNote() {
    const input = $('#premiumQuickNote');
    if (input) input.value = '';
    try { localStorage.removeItem(LS_NOTE); } catch {}
    pushActivity('Nota rápida', 'Nota eliminada');
    toast('Nota eliminada.');
  }

  function bootQuickNote() {
    let note = '';
    try { note = localStorage.getItem(LS_NOTE) || ''; } catch {}
    const input = $('#premiumQuickNote');
    if (input) input.value = note;
  }

  function getActivity() {
    try {
      return JSON.parse(localStorage.getItem(LS_ACTIVITY) || '[]');
    } catch {
      return [];
    }
  }

  function setActivity(items) {
    try { localStorage.setItem(LS_ACTIVITY, JSON.stringify(items.slice(0, 12))); } catch {}
  }

  function pushActivity(title, desc) {
    const items = getActivity();
    const stamp = new Date().toLocaleString();
    items.unshift({ title, desc, stamp });
    setActivity(items);
    renderActivity();
  }

  function renderActivity() {
    const root = $('#premiumActivityList');
    if (!root) return;
    const items = getActivity();
    root.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'premium-activity-item';
      empty.innerHTML = `<strong>${OI('pmNoActivity')}</strong><small>${OI('pmStartReading')}</small>`;
      root.appendChild(empty);
      return;
    }
    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'premium-activity-item';
      /* Hoy estos tres valores los pone la propia app -nombres de tema,
         atributos data- y no hay forma de colar texto ajeno. Se escapan
         igual: pasan por localStorage y basta que alguien pase aqui el
         titulo de una lectura, que lleva el nombre de la persona, para
         que deje de ser cierto. */
      el.innerHTML = `<strong>${OEsc(item.title)}</strong><small>${OEsc(item.desc)}<br>${OEsc(item.stamp)}</small>`;
      root.appendChild(el);
    });
  }

  function trackPremiumActions() {
    document.addEventListener('click', (e) => {
      const premium = e.target.closest('[data-premium-action]');
      if (premium) {
        const action = premium.dataset.premiumAction;
        if (!['save-quick-note','clear-quick-note'].includes(action)) {
          pushActivity(OI('activityAction'), action);
        }
      }

      const module = e.target.closest('[data-module]');
      if (module) {
        pushActivity('Módulo abierto', module.dataset.module);
      }
    });
  }

  document.addEventListener('click', (e) => {
    /* El mismo atributo hace de estado en el <body> y de selector para los
       botones de tema, así que closest() subía hasta el body en cualquier
       clic y anunciaba un cambio de tema que nadie había pedido. Se acota
       a los botones. */
    const themeBtn = e.target.closest('button[data-premium-theme]');
    if (themeBtn) {
      e.preventDefault();
      saveTheme(themeBtn.dataset.premiumTheme);
    }

    const act = e.target.closest('[data-premium-action]');
    if (!act) return;

    if (act.dataset.premiumAction === 'save-quick-note') {
      e.preventDefault();
      saveQuickNote();
    }
    if (act.dataset.premiumAction === 'clear-quick-note') {
      e.preventDefault();
      clearQuickNote();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bootTheme();
      bootQuickNote();
      renderActivity();
      trackPremiumActions();
    }, { once: true });
  } else {
    bootTheme();
    bootQuickNote();
    renderActivity();
    trackPremiumActions();
  }
})();




/* Ultra Premium v8 · splash, drawer y shell */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const LS_SETTINGS = 'oraculo.native.settings.v8';

  const defaultSettings = {
    reduceMotion: false,
    richCards: true,
    showSplash: false
  };

  function readSettings() {
    try {
      return { ...defaultSettings, ...(JSON.parse(localStorage.getItem(LS_SETTINGS) || '{}')) };
    } catch {
      return { ...defaultSettings };
    }
  }

  function writeSettings(next) {
    try { localStorage.setItem(LS_SETTINGS, JSON.stringify(next)); } catch {}
  }

  function applySettings(settings) {
    document.body.classList.add('premium-native-shell');
    document.body.classList.toggle('premium-reduce-motion', !!settings.reduceMotion);
    document.body.classList.toggle('premium-rich-cards', !!settings.richCards);

    const reduce = $('#premiumReduceMotion');
    const rich = $('#premiumRichCards');
    const splash = $('#premiumShowSplash');
    if (reduce) reduce.checked = !!settings.reduceMotion;
    if (rich) rich.checked = !!settings.richCards;
    if (splash) splash.checked = !!settings.showSplash;

    const theme = document.body.dataset.premiumTheme || 'Gold';
    const themeNode = $('#premiumNativeTheme');
    if (themeNode) themeNode.textContent = String(theme).charAt(0).toUpperCase() + String(theme).slice(1);
  }

  function openDrawer() {
    const d = $('#premiumSettingsDrawer');
    if (d) d.hidden = false;
  }

  function closeDrawer() {
    const d = $('#premiumSettingsDrawer');
    if (d) d.hidden = true;
  }

  function showSplash() {
    const s = $('#premiumNativeSplash');
    if (!s) return;
    s.style.display = '';
    s.hidden = false;
    s.setAttribute('aria-hidden', 'false');
    document.body.classList.add('premium-splash-open');
  }

  function hideSplash() {
    const s = $('#premiumNativeSplash');
    if (!s) return;
    s.hidden = true;
    s.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('premium-splash-open');
  }

  function dismissSplash(rememberChoice = false) {
    if (rememberChoice) {
      const settings = readSettings();
      settings.showSplash = false;
      writeSettings(settings);
      applySettings(settings);
    }
    hideSplash();
  }

  function bindSplashControls() {
    const root = $('#premiumNativeSplash');
    if (!root || root.dataset.premiumSplashBound === 'true') return;
    root.dataset.premiumSplashBound = 'true';

    const bindAction = (selector, rememberChoice) => {
      root.querySelectorAll(selector).forEach(control => {
        const close = (event) => {
          event.preventDefault();
          event.stopPropagation();
          dismissSplash(rememberChoice);
        };
        control.addEventListener('click', close);
        control.addEventListener('touchend', close, { passive: false });
      });
    };

    bindAction('[data-premium-action="dismiss-native-splash"]', false);
    bindAction('[data-premium-action="dont-show-native-splash"]', true);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !root.hidden) dismissSplash(false);
    });
  }

  function pulseTransition() {
    const veil = $('#premiumTransitionVeil');
    if (!veil) return;
    veil.classList.add('active');
    setTimeout(() => veil.classList.remove('active'), 220);
  }

  function bootSplash() {
    const settings = readSettings();
    if (settings.showSplash) {
      settings.showSplash = false;
      writeSettings(settings);
      applySettings(settings);
    }
    hideSplash();
  }

  document.addEventListener('click', (e) => {
    const act = e.target.closest('[data-premium-action]');
    if (!act) return;
    const action = act.dataset.premiumAction;

    if (action === 'open-settings-drawer') {
      e.preventDefault();
      openDrawer();
    }
    if (action === 'close-settings-drawer') {
      e.preventDefault();
      closeDrawer();
    }
    if (action === 'dismiss-native-splash') {
      e.preventDefault();
      e.stopPropagation();
      dismissSplash(false);
      return;
    }
    if (action === 'dont-show-native-splash') {
      e.preventDefault();
      e.stopPropagation();
      dismissSplash(true);
      return;
    }

    if ([
      'tarot-reading',
      'daily-reading',
      'open-library',
      'ritual-onboarding',
      'open-palette'
    ].includes(action)) {
      pulseTransition();
    }
  });

  document.addEventListener('change', (e) => {
    const settings = readSettings();
    let touched = false
    if (e.target?.id === 'premiumReduceMotion') {
      settings.reduceMotion = !!e.target.checked;
      touched = true
    }
    if (e.target?.id === 'premiumRichCards') {
      settings.richCards = !!e.target.checked;
      touched = true
    }
    if (e.target?.id === 'premiumShowSplash') {
      settings.showSplash = !!e.target.checked;
      touched = true
    }
    if (touched) {
      writeSettings(settings);
      applySettings(settings);
    }
  });

  function syncThemeLabel() {
    const node = $('#premiumNativeTheme');
    if (!node) return;
    const theme = document.body.dataset.premiumTheme || 'gold';
    node.textContent = String(theme).charAt(0).toUpperCase() + String(theme).slice(1);
  }

  const bodyObserver = 'MutationObserver' in window
    ? new MutationObserver(syncThemeLabel)
    : null;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const settings = readSettings();
      applySettings(settings);
      bindSplashControls();
      bootSplash();
      syncThemeLabel();
      if (bodyObserver) bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['data-premium-theme'] });
      const build = $('#premiumNativeBuild');
      if (build) build.textContent = 'v8';
    }, { once: true });
  } else {
    const settings = readSettings();
    applySettings(settings);
    bindSplashControls();
    bootSplash();
    syncThemeLabel();
    if (bodyObserver) bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['data-premium-theme'] });
    const build = $('#premiumNativeBuild');
    if (build) build.textContent = 'v8';
  }
})();




/* v9 · biblioteca premium, theatre y ajustes extra */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const LS_V9 = 'oraculo.libraryTheatre.settings.v9';
  const defaultV9 = {
    compactMode: false,
    ambientGlow: true
  };

  function readV9() {
    try {
      return { ...defaultV9, ...(JSON.parse(localStorage.getItem(LS_V9) || '{}')) };
    } catch {
      return { ...defaultV9 };
    }
  }

  function writeV9(next) {
    try { localStorage.setItem(LS_V9, JSON.stringify(next)); } catch {}
  }

  function applyV9(settings) {
    document.body.classList.toggle('premium-compact', !!settings.compactMode);
    document.body.classList.toggle('premium-ambient-glow', !!settings.ambientGlow);

    const compact = $('#premiumCompactMode');
    const glow = $('#premiumAmbientGlow');
    if (compact) compact.checked = !!settings.compactMode;
    if (glow) glow.checked = !!settings.ambientGlow;
  }

  function clickReal(selector) {
    const el = document.querySelector(selector);
    if (el) {
      el.click();
      return true;
    }
    return false;
  }

  function ceremonialPulse() {
    const veil = $('#premiumTransitionVeil');
    if (!veil) return;
    veil.classList.add('active');
    setTimeout(() => veil.classList.remove('active'), 520);
  }

  function activateChip(chip) {
    $$('.library-chip').forEach(btn => btn.classList.remove('active'));
    chip.classList.add('active');
  }

  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.library-chip');
    if (chip) {
      e.preventDefault();
      activateChip(chip);
    }

    const act = e.target.closest('[data-premium-action]');
    if (!act) return;
    const action = act.dataset.premiumAction;

    if (action === 'open-card-library') {
      e.preventDefault();
      ceremonialPulse();
      clickReal('[data-om-biblioteca]');
    }

    if (action === 'start-ceremonial-reading') {
      e.preventDefault();
      ceremonialPulse();
      clickReal('[data-module="tarot"]');
      document.body.classList.add('premium-immersive');
    }
  });

  document.addEventListener('change', (e) => {
    const settings = readV9();
    let touched = false;

    if (e.target?.id === 'premiumCompactMode') {
      settings.compactMode = !!e.target.checked;
      touched = true;
    }
    if (e.target?.id === 'premiumAmbientGlow') {
      settings.ambientGlow = !!e.target.checked;
      touched = true;
    }

    if (touched) {
      writeV9(settings);
      applyV9(settings);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyV9(readV9()), { once: true });
  } else {
    applyV9(readV9());
  }
})();




/* v10 · Signature Suite extras */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const LS_V10 = 'oraculo.signatureSuite.settings.v10';
  const defaultV10 = {
    glassMax: true,
    showcaseMode: false
  };

  function readV10() {
    try {
      return { ...defaultV10, ...(JSON.parse(localStorage.getItem(LS_V10) || '{}')) };
    } catch {
      return { ...defaultV10 };
    }
  }

  function writeV10(next) {
    try { localStorage.setItem(LS_V10, JSON.stringify(next)); } catch {}
  }

  function applyV10(settings) {
    document.body.classList.toggle('premium-glass-max', !!settings.glassMax);
    document.body.classList.toggle('premium-showcase', !!settings.showcaseMode);

    const glass = $('#premiumGlassMax');
    const showcase = $('#premiumShowcaseMode');
    if (glass) glass.checked = !!settings.glassMax;
    if (showcase) showcase.checked = !!settings.showcaseMode;
  }

  function clickReal(selector) {
    const el = document.querySelector(selector);
    if (el) {
      el.click();
      return true;
    }
    return false;
  }

  function activatePills(selector, el) {
    $$(selector).forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');
  }

  function pulseVeil() {
    const veil = $('#premiumTransitionVeil');
    if (!veil) return;
    veil.classList.add('active');
    setTimeout(() => {
      veil.classList.remove('active');
    }, 560);
  }

  document.addEventListener('click', (e) => {
    const filter = e.target.closest('.library-filter');
    if (filter) {
      e.preventDefault();
      activatePills('.library-filter', filter);
    }

    const preset = e.target.closest('.spread-preset');
    if (preset) {
      e.preventDefault();
      activatePills('.spread-preset', preset);
    }

    const act = e.target.closest('[data-premium-action]');
    if (!act) return;
    const action = act.dataset.premiumAction;

    if (action === 'open-reading-vault') {
      e.preventDefault();
      pulseVeil();
      clickReal('[data-om-biblioteca]');
    }

    if (action === 'launch-spread-lab') {
      e.preventDefault();
      pulseVeil();
      clickReal('[data-module="tarot"]');
      document.body.classList.add('premium-immersive');
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target?.id === 'premiumLibrarySearch') {
      const value = String(e.target.value || '').trim().toLowerCase();
      const cards = $$('.premium-search-card');
      cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = !value || text.includes(value) ? '' : 'none';
      });
    }
  });

  document.addEventListener('change', (e) => {
    const settings = readV10();
    let touched = false;

    if (e.target?.id === 'premiumGlassMax') {
      settings.glassMax = !!e.target.checked;
      touched = true;
    }
    if (e.target?.id === 'premiumShowcaseMode') {
      settings.showcaseMode = !!e.target.checked;
      touched = true;
    }

    if (touched) {
      writeV10(settings);
      applyV10(settings);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyV10(readV10()), { once: true });
  } else {
    applyV10(readV10());
  }
})();




/* v11 · All-In Ultra Premium */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  const LS_V11 = 'oraculo.allin.settings.v11';
  const defaultV11 = {
    proMode: true,
    cinematicMode: true
  };

  function readV11() {
    try {
      return { ...defaultV11, ...(JSON.parse(localStorage.getItem(LS_V11) || '{}')) };
    } catch {
      return { ...defaultV11 };
    }
  }

  function writeV11(next) {
    try { localStorage.setItem(LS_V11, JSON.stringify(next)); } catch {}
  }

  function applyV11(settings) {
    document.body.classList.toggle('premium-pro-mode', !!settings.proMode);
    document.body.classList.toggle('premium-cinematic', !!settings.cinematicMode);

    const pro = $('#premiumProMode');
    const cinematic = $('#premiumCinematicMode');
    if (pro) pro.checked = !!settings.proMode;
    if (cinematic) cinematic.checked = !!settings.cinematicMode;
  }

  function clickReal(selector) {
    const el = document.querySelector(selector);
    if (el) {
      el.click();
      return true;
    }
    return false;
  }

  function pulseVeil(duration = 620) {
    const veil = $('#premiumTransitionVeil');
    if (!veil) return;
    veil.classList.add('active');
    setTimeout(() => {
      veil.classList.remove('active');
    }, duration);
  }

  document.addEventListener('click', (e) => {
    const act = e.target.closest('[data-premium-action]');
    if (!act) return;
    const action = act.dataset.premiumAction;

    if (action === 'open-onboarding-hub') {
      e.preventDefault();
      pulseVeil();
      clickReal('[data-om-biblioteca]');
    }

    if (action === 'open-reading-vault') {
      e.preventDefault();
      pulseVeil();
      clickReal('[data-om-biblioteca]');
    }

    if (action === 'launch-spread-lab') {
      e.preventDefault();
      pulseVeil();
      clickReal('[data-module="tarot"]');
      document.body.classList.add('premium-immersive');
    }
  });

  document.addEventListener('change', (e) => {
    const settings = readV11();
    let touched = false;

    if (e.target?.id === 'premiumProMode') {
      settings.proMode = !!e.target.checked;
      touched = true;
    }
    if (e.target?.id === 'premiumCinematicMode') {
      settings.cinematicMode = !!e.target.checked;
      touched = true;
    }
    if (touched) {
      writeV11(settings);
      applyV11(settings);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyV11(readV11()), { once: true });
  } else {
    applyV11(readV11());
  }
})();


/* Aqui estaba el motor que pintaba la parrilla de cartas, el laboratorio
   de tiradas y el almacen propio, todo dentro de los paneles avanzados.
   Al quitar aquella pantalla se quedo sin nada a lo que apuntar: de los
   once identificadores que buscaba, ocho ya no existen, y los tres que
   quedaban -los dos interruptores del cajon y el acceso "Arcanos"- no
   controlaban nada, porque las reglas y el destino a los que llevaban
   tambien vivian ahi. Las tiradas guardadas que tenia dentro pasaron al
   Grimorio en migrateData. Traia ademas las 78 cartas escritas otra vez,
   cuando ya estan en js/tarot/. */
