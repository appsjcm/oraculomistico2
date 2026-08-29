/* Atajo al i18n del motor. No es un sistema nuevo: delega en el
   mismo diccionario, y si aun no ha cargado devuelve la clave. */
function OI(k, v) { return window.OraculoI18n?.t?.(k, v) ?? k; }
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
      target = document.querySelector(`.module-card[data-module="${CSS.escape(module)}"]`);
    }

    if (!target && action) {
      target = document.querySelector(`.hero-actions [data-action="${CSS.escape(action)}"], .daily [data-action="${CSS.escape(action)}"], .module-card[data-action="${CSS.escape(action)}"]`);
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
      chip.innerHTML = value
        ? `🧭 <span>${OI('pmIntentionSet', { v: value })}</span>`
        : `🧭 <span data-i18n="intentionFree">${OI('intentionFree')}</span>`;
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
      clickReal('.module-card[data-module="tarot"]');
      return;
    }

    if (action === 'daily-reading') {
      toast(getIntention() ? 'Revelando mensaje con tu intención.' : 'Revelando mensaje del día.');
      clickReal('[data-action="daily"]');
      return;
    }

    if (action === 'ritual-chat') {
      toast(getIntention() ? 'Abriendo chat ritual con tu intención.' : 'Abriendo chat ritual.');
      clickReal('.module-card[data-module="chat"]');
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
    { label: 'tarot', desc: 'paTarotD', run: () => document.querySelector('.module-card[data-module="tarot"]')?.click() },
    { label: 'runes', desc: 'paRunasD', run: () => document.querySelector('.module-card[data-module="runas"]')?.click() },
    { label: 'moon', desc: 'paLunaD', run: () => document.querySelector('.module-card[data-module="luna"]')?.click() },
    { label: 'dreams', desc: 'paSuenosD', run: () => document.querySelector('.module-card[data-module="suenos"]')?.click() },
    { label: 'numerology', desc: 'paNumerologiaD', run: () => document.querySelector('.module-card[data-module="numerologia"]')?.click() },
    { label: 'library', desc: 'paBibliotecaD', run: () => document.querySelector('.module-card[data-module="biblioteca"]')?.click() },
    { label: 'paChat', desc: 'paChatD', run: () => document.querySelector('.module-card[data-module="chat"]')?.click() },
    { label: 'dailyMessage', desc: 'paDailyD', run: () => document.querySelector('[data-action="daily"]')?.click() },
    { label: 'settings', desc: 'paAjustesD', run: () => document.querySelector('.module-card[data-action="settings"]')?.click() }
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
      clickReal('.module-card[data-module="biblioteca"]');
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
      el.innerHTML = `<strong>${item.title}</strong><small>${item.desc}<br>${item.stamp}</small>`;
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

      const module = e.target.closest('.module-card[data-module]');
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
    showSplash: true
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
    if (s) s.hidden = false;
  }

  function hideSplash() {
    const s = $('#premiumNativeSplash');
    if (s) s.hidden = true;
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
      setTimeout(showSplash, 180);
    }
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
      hideSplash();
    }
    if (action === 'dont-show-native-splash') {
      e.preventDefault();
      const settings = readSettings();
      settings.showSplash = false;
      writeSettings(settings);
      applySettings(settings);
      hideSplash();
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
      bootSplash();
      syncThemeLabel();
      if (bodyObserver) bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['data-premium-theme'] });
      const build = $('#premiumNativeBuild');
      if (build) build.textContent = 'v8';
    }, { once: true });
  } else {
    const settings = readSettings();
    applySettings(settings);
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
      clickReal('.module-card[data-module="biblioteca"]');
    }

    if (action === 'start-ceremonial-reading') {
      e.preventDefault();
      ceremonialPulse();
      clickReal('.module-card[data-module="tarot"]');
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
    if (!veil.querySelector('[data-oraculo-3d-asset="portal"]')) {
      veil.insertAdjacentHTML('beforeend', '<div class="om-3d-stage om-transition-3d" data-oraculo-3d-asset="portal" aria-label="Portal del Oráculo"></div>');
    }
    veil.classList.add('active');
    setTimeout(() => {
      veil.classList.remove('active');
      veil.querySelector('.om-transition-3d')?.remove();
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
      clickReal('.module-card[data-module="biblioteca"]');
    }

    if (action === 'launch-spread-lab') {
      e.preventDefault();
      pulseVeil();
      clickReal('.module-card[data-module="tarot"]');
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
    const effects3d = $('#premium3dPreference');
    if (pro) pro.checked = !!settings.proMode;
    if (cinematic) cinematic.checked = !!settings.cinematicMode;
    if (effects3d) effects3d.value = window.Oraculo3D?.getPreference?.() || localStorage.getItem('oraculo.3d.preference.v14') || 'auto';
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
    if (!veil.querySelector('[data-oraculo-3d-asset="portal"]')) {
      veil.insertAdjacentHTML('beforeend', '<div class="om-3d-stage om-transition-3d" data-oraculo-3d-asset="portal" aria-label="Portal del Oráculo"></div>');
    }
    veil.classList.add('active');
    setTimeout(() => {
      veil.classList.remove('active');
      veil.querySelector('.om-transition-3d')?.remove();
    }, duration);
  }

  document.addEventListener('click', (e) => {
    const act = e.target.closest('[data-premium-action]');
    if (!act) return;
    const action = act.dataset.premiumAction;

    if (action === 'open-onboarding-hub') {
      e.preventDefault();
      pulseVeil();
      clickReal('.module-card[data-module="biblioteca"]');
    }

    if (action === 'open-reading-vault') {
      e.preventDefault();
      pulseVeil();
      clickReal('.module-card[data-module="biblioteca"]');
    }

    if (action === 'launch-spread-lab') {
      e.preventDefault();
      pulseVeil();
      clickReal('.module-card[data-module="tarot"]');
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
    if (e.target?.id === 'premium3dPreference') {
      window.Oraculo3D?.setPreference?.(e.target.value || 'auto');
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


/* v12 · Native Tarot Engine */
(()=>{
const CARDS=[{"id":"M00","name":"El Loco","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"libertad, inicio, riesgo, aventura"},{"id":"M01","name":"El Mago","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"voluntad, recursos, acción, enfoque"},{"id":"M02","name":"La Sacerdotisa","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"intuición, misterio, silencio, sabiduría"},{"id":"M03","name":"La Emperatriz","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"creación, abundancia, cuidado, belleza"},{"id":"M04","name":"El Emperador","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"estructura, autoridad, estabilidad, orden"},{"id":"M05","name":"El Hierofante","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"tradición, aprendizaje, guía, comunidad"},{"id":"M06","name":"Los Enamorados","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"elección, unión, valores, armonía"},{"id":"M07","name":"El Carro","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"avance, control, victoria, dirección"},{"id":"M08","name":"La Fuerza","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"coraje, calma, dominio, confianza"},{"id":"M09","name":"El Ermitaño","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"búsqueda, introspección, verdad, pausa"},{"id":"M10","name":"La Rueda de la Fortuna","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"cambio, ciclo, oportunidad, destino"},{"id":"M11","name":"La Justicia","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"equilibrio, decisión, verdad, consecuencia"},{"id":"M12","name":"El Colgado","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"pausa, perspectiva, entrega, aprendizaje"},{"id":"M13","name":"La Muerte","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"cierre, transformación, renacer, cambio"},{"id":"M14","name":"La Templanza","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"equilibrio, sanación, paciencia, mezcla"},{"id":"M15","name":"El Diablo","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"apego, deseo, sombra, liberación"},{"id":"M16","name":"La Torre","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"ruptura, revelación, sacudida, reconstrucción"},{"id":"M17","name":"La Estrella","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"esperanza, inspiración, calma, fe"},{"id":"M18","name":"La Luna","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"sueños, intuición, confusión, subconsciente"},{"id":"M19","name":"El Sol","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"claridad, alegría, éxito, energía"},{"id":"M20","name":"El Juicio","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"despertar, llamada, revisión, perdón"},{"id":"M21","name":"El Mundo","type":"mayor","suit":"Arcanos Mayores","symbol":"✦","keywords":"culminación, logro, integración, plenitud"},{"id":"B01","name":"As de Bastos","type":"bastos","suit":"Bastos","symbol":"🔥","keywords":"fuego, impulso, creatividad, acción"},{"id":"B02","name":"Dos de Bastos","type":"bastos","suit":"Bastos","symbol":"🔥","keywords":"fuego, impulso, creatividad, acción"},{"id":"B03","name":"Tres de Bastos","type":"bastos","suit":"Bastos","symbol":"🔥","keywords":"fuego, impulso, creatividad, acción"},{"id":"B04","name":"Cuatro de Bastos","type":"bastos","suit":"Bastos","symbol":"🔥","keywords":"fuego, impulso, creatividad, acción"},{"id":"B05","name":"Cinco de Bastos","type":"bastos","suit":"Bastos","symbol":"🔥","keywords":"fuego, impulso, creatividad, acción"},{"id":"B06","name":"Seis de Bastos","type":"bastos","suit":"Bastos","symbol":"🔥","keywords":"fuego, impulso, creatividad, acción"},{"id":"B07","name":"Siete de Bastos","type":"bastos","suit":"Bastos","symbol":"🔥","keywords":"fuego, impulso, creatividad, acción"},{"id":"B08","name":"Ocho de Bastos","type":"bastos","suit":"Bastos","symbol":"🔥","keywords":"fuego, impulso, creatividad, acción"},{"id":"B09","name":"Nueve de Bastos","type":"bastos","suit":"Bastos","symbol":"🔥","keywords":"fuego, impulso, creatividad, acción"},{"id":"B10","name":"Diez de Bastos","type":"bastos","suit":"Bastos","symbol":"🔥","keywords":"fuego, impulso, creatividad, acción"},{"id":"B11","name":"Sota de Bastos","type":"bastos","suit":"Bastos","symbol":"🔥","keywords":"fuego, impulso, creatividad, acción"},{"id":"B12","name":"Caballero de Bastos","type":"bastos","suit":"Bastos","symbol":"🔥","keywords":"fuego, impulso, creatividad, acción"},{"id":"B13","name":"Reina de Bastos","type":"bastos","suit":"Bastos","symbol":"🔥","keywords":"fuego, impulso, creatividad, acción"},{"id":"B14","name":"Rey de Bastos","type":"bastos","suit":"Bastos","symbol":"🔥","keywords":"fuego, impulso, creatividad, acción"},{"id":"C01","name":"As de Copas","type":"copas","suit":"Copas","symbol":"💧","keywords":"agua, emoción, vínculo, intuición"},{"id":"C02","name":"Dos de Copas","type":"copas","suit":"Copas","symbol":"💧","keywords":"agua, emoción, vínculo, intuición"},{"id":"C03","name":"Tres de Copas","type":"copas","suit":"Copas","symbol":"💧","keywords":"agua, emoción, vínculo, intuición"},{"id":"C04","name":"Cuatro de Copas","type":"copas","suit":"Copas","symbol":"💧","keywords":"agua, emoción, vínculo, intuición"},{"id":"C05","name":"Cinco de Copas","type":"copas","suit":"Copas","symbol":"💧","keywords":"agua, emoción, vínculo, intuición"},{"id":"C06","name":"Seis de Copas","type":"copas","suit":"Copas","symbol":"💧","keywords":"agua, emoción, vínculo, intuición"},{"id":"C07","name":"Siete de Copas","type":"copas","suit":"Copas","symbol":"💧","keywords":"agua, emoción, vínculo, intuición"},{"id":"C08","name":"Ocho de Copas","type":"copas","suit":"Copas","symbol":"💧","keywords":"agua, emoción, vínculo, intuición"},{"id":"C09","name":"Nueve de Copas","type":"copas","suit":"Copas","symbol":"💧","keywords":"agua, emoción, vínculo, intuición"},{"id":"C10","name":"Diez de Copas","type":"copas","suit":"Copas","symbol":"💧","keywords":"agua, emoción, vínculo, intuición"},{"id":"C11","name":"Sota de Copas","type":"copas","suit":"Copas","symbol":"💧","keywords":"agua, emoción, vínculo, intuición"},{"id":"C12","name":"Caballero de Copas","type":"copas","suit":"Copas","symbol":"💧","keywords":"agua, emoción, vínculo, intuición"},{"id":"C13","name":"Reina de Copas","type":"copas","suit":"Copas","symbol":"💧","keywords":"agua, emoción, vínculo, intuición"},{"id":"C14","name":"Rey de Copas","type":"copas","suit":"Copas","symbol":"💧","keywords":"agua, emoción, vínculo, intuición"},{"id":"E01","name":"As de Espadas","type":"espadas","suit":"Espadas","symbol":"🗡️","keywords":"aire, mente, verdad, decisión"},{"id":"E02","name":"Dos de Espadas","type":"espadas","suit":"Espadas","symbol":"🗡️","keywords":"aire, mente, verdad, decisión"},{"id":"E03","name":"Tres de Espadas","type":"espadas","suit":"Espadas","symbol":"🗡️","keywords":"aire, mente, verdad, decisión"},{"id":"E04","name":"Cuatro de Espadas","type":"espadas","suit":"Espadas","symbol":"🗡️","keywords":"aire, mente, verdad, decisión"},{"id":"E05","name":"Cinco de Espadas","type":"espadas","suit":"Espadas","symbol":"🗡️","keywords":"aire, mente, verdad, decisión"},{"id":"E06","name":"Seis de Espadas","type":"espadas","suit":"Espadas","symbol":"🗡️","keywords":"aire, mente, verdad, decisión"},{"id":"E07","name":"Siete de Espadas","type":"espadas","suit":"Espadas","symbol":"🗡️","keywords":"aire, mente, verdad, decisión"},{"id":"E08","name":"Ocho de Espadas","type":"espadas","suit":"Espadas","symbol":"🗡️","keywords":"aire, mente, verdad, decisión"},{"id":"E09","name":"Nueve de Espadas","type":"espadas","suit":"Espadas","symbol":"🗡️","keywords":"aire, mente, verdad, decisión"},{"id":"E10","name":"Diez de Espadas","type":"espadas","suit":"Espadas","symbol":"🗡️","keywords":"aire, mente, verdad, decisión"},{"id":"E11","name":"Sota de Espadas","type":"espadas","suit":"Espadas","symbol":"🗡️","keywords":"aire, mente, verdad, decisión"},{"id":"E12","name":"Caballero de Espadas","type":"espadas","suit":"Espadas","symbol":"🗡️","keywords":"aire, mente, verdad, decisión"},{"id":"E13","name":"Reina de Espadas","type":"espadas","suit":"Espadas","symbol":"🗡️","keywords":"aire, mente, verdad, decisión"},{"id":"E14","name":"Rey de Espadas","type":"espadas","suit":"Espadas","symbol":"🗡️","keywords":"aire, mente, verdad, decisión"},{"id":"O01","name":"As de Oros","type":"oros","suit":"Oros","symbol":"◆","keywords":"tierra, cuerpo, recursos, estabilidad"},{"id":"O02","name":"Dos de Oros","type":"oros","suit":"Oros","symbol":"◆","keywords":"tierra, cuerpo, recursos, estabilidad"},{"id":"O03","name":"Tres de Oros","type":"oros","suit":"Oros","symbol":"◆","keywords":"tierra, cuerpo, recursos, estabilidad"},{"id":"O04","name":"Cuatro de Oros","type":"oros","suit":"Oros","symbol":"◆","keywords":"tierra, cuerpo, recursos, estabilidad"},{"id":"O05","name":"Cinco de Oros","type":"oros","suit":"Oros","symbol":"◆","keywords":"tierra, cuerpo, recursos, estabilidad"},{"id":"O06","name":"Seis de Oros","type":"oros","suit":"Oros","symbol":"◆","keywords":"tierra, cuerpo, recursos, estabilidad"},{"id":"O07","name":"Siete de Oros","type":"oros","suit":"Oros","symbol":"◆","keywords":"tierra, cuerpo, recursos, estabilidad"},{"id":"O08","name":"Ocho de Oros","type":"oros","suit":"Oros","symbol":"◆","keywords":"tierra, cuerpo, recursos, estabilidad"},{"id":"O09","name":"Nueve de Oros","type":"oros","suit":"Oros","symbol":"◆","keywords":"tierra, cuerpo, recursos, estabilidad"},{"id":"O10","name":"Diez de Oros","type":"oros","suit":"Oros","symbol":"◆","keywords":"tierra, cuerpo, recursos, estabilidad"},{"id":"O11","name":"Sota de Oros","type":"oros","suit":"Oros","symbol":"◆","keywords":"tierra, cuerpo, recursos, estabilidad"},{"id":"O12","name":"Caballero de Oros","type":"oros","suit":"Oros","symbol":"◆","keywords":"tierra, cuerpo, recursos, estabilidad"},{"id":"O13","name":"Reina de Oros","type":"oros","suit":"Oros","symbol":"◆","keywords":"tierra, cuerpo, recursos, estabilidad"},{"id":"O14","name":"Rey de Oros","type":"oros","suit":"Oros","symbol":"◆","keywords":"tierra, cuerpo, recursos, estabilidad"}];

const LS_SETTINGS="oraculo.nativeTarotEngine.settings.v12",LS_VAULT="oraculo.nativeTarotEngine.v12.vault";
const DEFAULT_SETTINGS={nativeEngine:true,compactCards:false};let activeFilter="all",activeQuery="",lastSpread=null;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const readJSON=(k,f)=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch(e){return f}};
const writeJSON=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const escapeHTML=(v="")=>String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const toast=(m)=>{const root=$("#toastRoot");if(!root){console.log("[Oráculo v12]",m);return}const t=document.createElement("div");t.className="toast premium-toast";t.textContent=m;root.appendChild(t);requestAnimationFrame(()=>t.classList.add("show"));setTimeout(()=>{t.classList.remove("show");setTimeout(()=>t.remove(),280)},2400)};
const getSettings=()=>({...DEFAULT_SETTINGS,...readJSON(LS_SETTINGS,{})});const saveSettings=(patch)=>{const next={...getSettings(),...patch};writeJSON(LS_SETTINGS,next);applySettings(next)};
const getVault=()=>readJSON(LS_VAULT,[]);const setVault=(items)=>{writeJSON(LS_VAULT,items);updateStats()};
/* El filtro se guarda por su clave interna (all, mayor, bastos...) y
   solo la etiqueta visible cambia de idioma. */
const FILTER_KEY={all:"ixTodas",mayor:"ixMayores",bastos:"ixBastos",copas:"ixCopas",espadas:"ixEspadas",oros:"ixOros"};
const label=(f)=>FILTER_KEY[f]?OI(FILTER_KEY[f]):f.charAt(0).toUpperCase()+f.slice(1);
/* El motor arranca con datos propios y, en cuanto puede, se enriquece con el mazo
   real de la app (imágenes y significados por carta) mediante un mapeo posicional. */
const DECK_BASE={M:0,B:22,C:36,E:50,O:64};
const SUIT_KEY={M:"ixMayores",B:"ixBastos",C:"ixCopas",E:"ixEspadas",O:"ixOros"};
const tidy=(v="")=>String(v).replace(/\s+/g," ").trim();
const clampText=(t,n)=>{t=String(t||"");return t.length>n?t.slice(0,n-1).trimEnd()+"…":t};
const cardArt=(c,cls,src)=>{const url=src||c.img;return url?`<div class="${cls}"><img src="${escapeHTML(url)}" alt="${escapeHTML(cardName(c))}" loading="lazy" decoding="async"></div>`:""};
const cardText=(c)=>c.meaning||c.keywords;
/* El nombre sale del catalogo del motor, que ya esta traducido. Se
   consulta al pintar y no al cargar: la traduccion del mazo es
   asincrona y antes llegaba tarde, dejando la biblioteca en castellano.
   El id (M00, B01...) sigue siendo la clave y no cambia. */
const cardName=(c)=>{
  const mazo=window.OraculoArcanos?.mazo;
  const base=DECK_BASE[c.id[0]];
  if(!Array.isArray(mazo)||mazo.length!==78||base===undefined)return c.name;
  const num=Number(c.id.slice(1));
  return mazo[base+(c.id[0]==="M"?num:num-1)]?.name||c.name;
};
async function enrichWithDeck(){
  try{
    const [mod,cfg]=await Promise.all([
      import(new URL("js/data.js",document.baseURI).href),
      import(new URL("js/config.js",document.baseURI).href).catch(()=>null)
    ]);
    const deck=mod&&mod.ALL_TAROT;
    if(!Array.isArray(deck)||deck.length!==CARDS.length)return false;
    const thumb=cfg&&cfg.thumbFor?cfg.thumbFor:(u=>u);
    CARDS.forEach(c=>{
      const base=DECK_BASE[c.id[0]],num=Number(c.id.slice(1));
      const real=deck[base+(c.id[0]==="M"?num:num-1)];
      if(!real)return;
      c.img=real.img||"";
      c.thumb=thumb(c.img);
      c.meaning=tidy(real.up)||c.keywords;
      c.suit=OI(SUIT_KEY[c.id[0]]||"ixMayores");
    });
    return true;
  }catch(e){return false}
}
const filteredCards=()=>{const q=activeQuery.trim().toLowerCase();return CARDS.filter(c=>{const mf=activeFilter==="all"||c.type===activeFilter;const hay=`${cardName(c)} ${c.name} ${c.type} ${c.suit} ${c.keywords} ${c.meaning||""}`.toLowerCase();return mf&&(!q||hay.includes(q))})};
/* La biblioteca se pagina: con las 78 ilustraciones de golpe la portada medía
   más de 30.000 px de scroll en móvil. */
const PAGE_SIZE=12;let shownCards=PAGE_SIZE;
const resetPaging=()=>{shownCards=PAGE_SIZE};
const renderCards=()=>{const grid=$("#premiumRealCardGrid");if(!grid)return;const list=filteredCards();const count=$("#premiumCardCount"),current=$("#premiumCurrentFilter");if(count)count.textContent=String(list.length);if(current)current.textContent=label(activeFilter);if(!list.length){grid.innerHTML=`<div class="premium-empty-state"><strong>${OI('pmNoCards')}</strong><span>${OI('pmTryOtherFilter')}</span></div>`;return}const page=list.slice(0,shownCards);grid.innerHTML=page.map(c=>`<article class="premium-real-card${c.img?" has-art":""}" data-card-id="${escapeHTML(c.id)}" data-card-type="${escapeHTML(c.type)}">${c.img?cardArt(c,"card-art",c.thumb):`<div class="card-sigil">${escapeHTML(c.symbol)}</div>`}<h3>${escapeHTML(cardName(c))}</h3><p>${escapeHTML(clampText(cardText(c),120))}</p><div class="card-meta"><span>${escapeHTML(c.suit)}</span><span>${escapeHTML(c.type==="mayor"?OI("pmMajor"):OI("pmMinor"))}</span></div></article>`).join("");if(list.length>page.length){const rest=list.length-page.length;grid.insertAdjacentHTML("beforeend",`<button type="button" class="premium-load-more" data-premium-action="load-more-cards">${OI("pmShowMore",{n:Math.min(PAGE_SIZE,rest)})}<small>${OI("pmOfTotal",{a:page.length,b:list.length})}</small></button>`)}};
const updateStats=()=>{const v=$("#premiumVaultCount");if(v)v.textContent=String(getVault().length)};
const shuffle=(a)=>{const n=[...a];for(let i=n.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[n[i],n[j]]=[n[j],n[i]]}return n};
const spreadLabel=(c)=>c===1?OI("pmSpread1"):c===3?OI("pmSpread3"):c===5?OI("pmSpread5"):OI("pmSpreadN",{n:c});
/* Misma clave interna que el motor: la cadena castellana. */
const posOI=(p)=>{const k="pos"+String(p).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Za-z0-9]+/g," ").replace(/\b\w/g,c=>c.toUpperCase()).replace(/ /g,"");const v=OI(k);return v&&v!==k?v:p;};
const pos=(c,i)=>{const p=({1:["Mensaje"],3:["Pasado","Presente","Consejo"],5:["Raíz","Reto","Energía","Consejo","Resultado"]}[c]||[])[i];return p?posOI(p):OI("lblCardN",{n:i+1});};
const drawSpread=(count)=>{const r=$("#premiumSpreadResult");if(!r)return;const drawn=shuffle(CARDS).slice(0,count);lastSpread={id:`spread-${Date.now()}`,createdAt:new Date().toISOString(),type:spreadLabel(count),cards:drawn};r.innerHTML=drawn.map((c,i)=>`<article class="premium-drawn-card${c.img?" has-art":""}"><span class="draw-position">${escapeHTML(pos(count,i))}</span>${cardArt(c,"draw-art")}<h3>${escapeHTML(cardName(c))}</h3><p>${escapeHTML(cardText(c))}</p></article>`).join("");toast(OI("pmSpreadDone",{x:spreadLabel(count)}))};
const saveSpread=()=>{if(!lastSpread){toast(OI("pmDrawFirst"));return}const v=getVault();if(!v.some(i=>i.id===lastSpread.id)){v.unshift(lastSpread);setVault(v.slice(0,30))}renderVault();toast(OI("savedSpread"))};
const formatDate=(iso)=>{try{return new Intl.DateTimeFormat("es-ES",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(iso))}catch(e){return iso}};
const renderVault=()=>{const root=$("#premiumVaultRealList");if(!root)return;const v=getVault();updateStats();if(!v.length){root.innerHTML=`<div class="premium-empty-state"><strong>${OI('ixAunNoHayTiradasGuardadas')}</strong><span>${OI('ixGeneraUnaLecturaYPulsaGuardar')}</span></div>`;return}root.innerHTML=v.map(item=>`<article class="premium-vault-entry"><strong>${escapeHTML(item.type)}</strong><span>${escapeHTML(formatDate(item.createdAt))}</span><div class="premium-vault-cards">${item.cards.map(c=>`<em>${escapeHTML(c.name)}</em>`).join("")}</div></article>`).join("")};
const clearVault=()=>{setVault([]);renderVault();toast(OI("savedCleared"))};
const scrollEngine=()=>{const e=$("#premiumNativeEngine");if(e){e.scrollIntoView({behavior:"smooth",block:"start"});e.animate?.([{boxShadow:"0 0 0 rgba(247,217,139,0)"},{boxShadow:"0 0 80px rgba(247,217,139,.22)"},{boxShadow:"0 24px 90px rgba(0,0,0,.42)"}],{duration:900,easing:"ease-out"})}};
const applySettings=(s=getSettings())=>{document.body.classList.toggle("premium-native-engine-off",!s.nativeEngine);document.body.classList.toggle("premium-compact-cards",!!s.compactCards);const n=$("#premiumNativeEngineToggle"),c=$("#premiumCompactCards");if(n)n.checked=!!s.nativeEngine;if(c)c.checked=!!s.compactCards};
const bind=()=>{const search=$("#premiumRealCardSearch");if(search)search.addEventListener("input",()=>{activeQuery=search.value;resetPaging();renderCards()});$$(".engine-filter").forEach(b=>b.addEventListener("click",()=>{activeFilter=b.dataset.cardFilter||"all";$$('.engine-filter').forEach(x=>x.classList.toggle('active',x===b));resetPaging();renderCards()}));$$('[data-native-spread]').forEach(b=>b.addEventListener('click',()=>{if(!getSettings().nativeEngine){toast(OI('pmEnableArcana'));return}drawSpread(Number(b.dataset.nativeSpread||'1'))}));document.addEventListener('click',ev=>{const action=ev.target?.closest?.('[data-premium-action]')?.dataset?.premiumAction;if(action==='save-native-spread')saveSpread();if(action==='render-native-vault'){renderVault();toast(OI('pmVaultUpdated'))}if(action==='clear-native-vault')clearVault();if(action==='open-native-engine')scrollEngine();if(action==='load-more-cards'){shownCards+=PAGE_SIZE;renderCards()}});const n=$('#premiumNativeEngineToggle'),c=$('#premiumCompactCards');if(n)n.addEventListener('change',()=>saveSettings({nativeEngine:n.checked}));if(c)c.addEventListener('change',()=>saveSettings({compactCards:c.checked}))};
/* Si una ilustración no carga (sin conexión, host caído) la carta vuelve a su forma de texto. */
const handleArtError=(e)=>{const img=e.target;if(!img||img.tagName!=="IMG")return;const art=img.closest(".card-art,.draw-art");if(!art)return;const host=art.closest(".premium-real-card,.premium-drawn-card");art.remove();if(host)host.classList.remove("has-art")};
const init=()=>{applySettings();bind();renderCards();renderVault();updateStats();document.addEventListener("error",handleArtError,true);enrichWithDeck().then(ok=>{if(ok)renderCards()});/* El mazo se traduce despues de este arranque; al avisar el motor se repinta. */document.addEventListener("oraculo:idioma-tarot",()=>{renderCards();renderVault()})};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
