/* ============================================================
   ORÁCULO MÍSTICO · CARCASA V2
   Fase 3: portada, Santuario, navegación y Perfil.

   No sustituye al motor: se limita a gobernar qué se ve. Todas
   las acciones siguen siendo las del motor (data-module,
   data-act, data-premium-action), así que nada cambia de
   comportamiento por pasar por aquí.
   ============================================================ */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const LS_THEME = 'oraculo.v2.theme';
  const LS_APPEARANCE = 'oraculo.appearanceMode.v1';
  let cierrePerfilPendiente = null;
  let focoAntesPerfil = null;

  /* ---------- Tema ---------- */
  const TEMAS = ['arcano', 'lunar', 'cosmico', 'bosque', 'eclipse'];
  const MODOS_LUZ = ['dark', 'light'];

  function refrescarThemeColor() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const fondo = getComputedStyle(document.documentElement).getPropertyValue('--om-void').trim();
      if (fondo) meta.setAttribute('content', fondo);
    }
  }

  function aplicarTema(tema) {
    if (!TEMAS.includes(tema)) tema = 'arcano';
    // Arcano es el estado base: no necesita atributo.
    if (tema === 'arcano') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', tema);
    try { localStorage.setItem(LS_THEME, tema); } catch {}
    $$('[data-om-theme]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.omTheme === tema)));
    // El color de la barra del navegador acompaña al tema y al modo Dia/Noche.
    refrescarThemeColor();
  }

  function temaGuardado() {
    try { return localStorage.getItem(LS_THEME) || 'arcano'; } catch { return 'arcano'; }
  }

  function modoLuzGuardado() {
    try {
      const modo = localStorage.getItem(LS_APPEARANCE);
      return MODOS_LUZ.includes(modo) ? modo : 'dark';
    } catch {
      return 'dark';
    }
  }

  function etiquetaModo(modo) {
    const idioma = window.OraculoI18n?.idioma?.() || document.documentElement.lang || 'es';
    const esDia = modo === 'light';
    const textos = {
      es: esDia ? 'Día' : 'Noche',
      ca: esDia ? 'Dia' : 'Nit',
      en: esDia ? 'Day' : 'Night',
      fr: esDia ? 'Jour' : 'Nuit',
      de: esDia ? 'Tag' : 'Nacht',
      zh: esDia ? '日间' : '夜间'
    };
    return textos[idioma.slice(0, 2)] || textos.es;
  }

  function pintarControlesModo(modo) {
    $$('[data-om-appearance]').forEach(b => {
      const valor = b.dataset.omAppearance;
      b.setAttribute('aria-pressed', String(valor === modo));
      b.innerHTML = `<span aria-hidden="true">${valor === 'light' ? '☼' : '☾'}</span> ${etiquetaModo(valor)}`;
    });
    $$('[data-om-appearance-select]').forEach(select => { select.value = modo; });
    $$('[data-om-appearance-toggle]').forEach(b => {
      b.setAttribute('aria-pressed', String(modo === 'light'));
      b.setAttribute('aria-label', modo === 'light' ? 'Cambiar a Noche' : 'Cambiar a Día');
      const icon = b.querySelector('[data-om-appearance-icon]');
      const label = b.querySelector('[data-om-appearance-label]');
      if (icon) icon.textContent = modo === 'light' ? '☼' : '☾';
      if (label) label.textContent = etiquetaModo(modo);
    });
  }

  function aplicarModoLuz(modo) {
    if (!MODOS_LUZ.includes(modo)) modo = 'dark';
    document.documentElement.dataset.appearanceMode = modo;
    document.body?.setAttribute('data-appearance-mode', modo);
    try { localStorage.setItem(LS_APPEARANCE, modo); } catch {}
    pintarControlesModo(modo);
    refrescarThemeColor();
    document.dispatchEvent(new CustomEvent('om:appearance-changed', { detail: { modo } }));
  }

  function alternarModoLuz() {
    aplicarModoLuz(modoLuzGuardado() === 'light' ? 'dark' : 'light');
  }

  /* ---------- Vistas ---------- */
  /* La portada y el Santuario conviven en la misma página: navegar
     entre ellas es desplazarse, no recargar. Así no se pierde
     ningún estado del motor. */
  function irA(vista) {
    const destino = vista === 'santuario' ? $('#omSanctuary') : null;
    if (destino) {
      destino.scrollIntoView({ behavior: movimientoReducido() ? 'auto' : 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: movimientoReducido() ? 'auto' : 'smooth' });
    }
    marcarNav(vista);
  }

  function movimientoReducido() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function marcarNav(vista) {
    $$('.om-nav [data-om-nav]').forEach(b => {
      const activo = b.dataset.omNav === vista;
      b.classList.toggle('om-nav-active', activo);
      if (activo) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  }

  function hayPanelBloqueanteAbierto() {
    return Boolean($([
      '#omProfile.om-sheet-open:not([hidden])',
      '#omVozPanel.om-sheet-open:not([hidden])',
      '#omGrimorio.om-sheet-open:not([hidden])',
      '#omBiblioteca.om-sheet-open:not([hidden])',
      '#omRitual.om-ritual-abierto:not([hidden])'
    ].join(',')));
  }

  function bloquearPantalla() {
    document.body.classList.add('om-sheet-lock');
  }

  function refrescarBloqueoPantalla() {
    document.body.classList.toggle('om-sheet-lock', hayPanelBloqueanteAbierto());
  }

  function liberarPantallaSiProcede() {
    requestAnimationFrame(() => setTimeout(refrescarBloqueoPantalla, 0));
  }

  /* ---------- Perfil ---------- */
  function abrirPerfil() {
    const hoja = $('#omProfile');
    if (!hoja) return;
    if (cierrePerfilPendiente) {
      clearTimeout(cierrePerfilPendiente);
      cierrePerfilPendiente = null;
    }
    focoAntesPerfil = document.activeElement;
    hoja.hidden = false;
    hoja.setAttribute('aria-hidden', 'false');
    bloquearPantalla();
    requestAnimationFrame(() => {
      if (hoja.hidden) return;
      hoja.classList.add('om-sheet-open');
      bloquearPantalla();
    });
    const primero = hoja.querySelector('.om-sheet-close');
    if (primero) primero.focus();
  }

  function cerrarPerfil({ inmediato = false } = {}) {
    const hoja = $('#omProfile');
    if (!hoja) {
      liberarPantallaSiProcede();
      return;
    }
    if (cierrePerfilPendiente) {
      clearTimeout(cierrePerfilPendiente);
      cierrePerfilPendiente = null;
    }
    hoja.classList.remove('om-sheet-open');
    hoja.setAttribute('aria-hidden', 'true');
    liberarPantallaSiProcede();
    const ocultar = () => {
      if (hoja.classList.contains('om-sheet-open')) return;
      hoja.hidden = true;
      cierrePerfilPendiente = null;
      liberarPantallaSiProcede();
    };
    if (inmediato || movimientoReducido()) ocultar();
    else cierrePerfilPendiente = setTimeout(ocultar, 260);
    if (focoAntesPerfil && document.contains(focoAntesPerfil)) {
      try { focoAntesPerfil.focus(); } catch {}
    }
    focoAntesPerfil = null;
    marcarNav('inicio');
  }

  window.OraculoSheets = Object.assign({}, window.OraculoSheets, {
    lock: bloquearPantalla,
    refreshLock: liberarPantallaSiProcede,
    syncLock: refrescarBloqueoPantalla,
    closeProfile: cerrarPerfil
  });

  /* ---------- Paneles avanzados ----------
     Siguen en el documento con todas sus acciones vivas. Si algo
     apunta a un panel oculto, se despliega solo antes de actuar:
     así ninguna acción se queda sin efecto. */
  function mostrarPaneles(desplazar = true) {
    const cont = $('#omAdvanced');
    if (!cont) return false;
    const estaba = cont.hidden;
    cont.hidden = false;
    // El dock de accesos rápidos acompaña a los paneles.
    const dock = $('#omQuickActions');
    if (dock) dock.hidden = false;
    if (estaba) cont.classList.add('om-advanced-visible');
    if (desplazar) {
      requestAnimationFrame(() => {
        cont.scrollIntoView({ behavior: movimientoReducido() ? 'auto' : 'smooth', block: 'start' });
      });
    }
    return estaba;
  }

  /* ¿El objetivo de este clic vive dentro de los paneles ocultos? */
  function apuntaAPanelOculto(el) {
    const cont = $('#omAdvanced');
    return !!(cont && !cont.hidden === false && cont.contains(el));
  }

  /* ---------- Enlazado ---------- */
  function enlazar() {
    document.addEventListener('click', (ev) => {
      const t = ev.target;
      if (!t || !t.closest) return;

      // Navegación propia de la V2
      const nav = t.closest('[data-om-nav]');
      if (nav) {
        const destino = nav.dataset.omNav;
        if (destino === 'perfil') {
          ev.preventDefault();
          const perfil = $('#omProfile');
          if (perfil && !perfil.hidden && perfil.classList.contains('om-sheet-open')) cerrarPerfil();
          else abrirPerfil();
          return;
        }
        if (destino === 'cerrar-perfil') { ev.preventDefault(); cerrarPerfil(); return; }
        if (destino === 'paneles') { ev.preventDefault(); cerrarPerfil(); mostrarPaneles(); return; }
        ev.preventDefault();
        irA(destino);
        return;
      }

      // Tema
      const tema = t.closest('[data-om-theme]');
      if (tema) { ev.preventDefault(); aplicarTema(tema.dataset.omTheme); return; }

      const selectorModo = t.closest('[data-om-appearance]');
      if (selectorModo) { ev.preventDefault(); aplicarModoLuz(selectorModo.dataset.omAppearance); return; }

      const alternadorModo = t.closest('[data-om-appearance-toggle]');
      if (alternadorModo) { ev.preventDefault(); alternarModoLuz(); return; }

      // El Orbe abre el Santuario
      if (t.closest('#omOrb')) { ev.preventDefault(); irA('santuario'); return; }

      // Los subpaneles lanzados desde Perfil cierran primero la hoja para
      // no dejar dos velos táctiles compitiendo en iOS.
      const subpanel = t.closest('[data-om-voz], [data-om-grimorio], [data-om-biblioteca]');
      if (subpanel && subpanel.closest('#omProfile')) cerrarPerfil();

      // Cualquier acción del motor que viva en los paneles ocultos
      // los despliega antes de ejecutarse.
      const accion = t.closest('[data-premium-action], [data-act], [data-module], [data-action]');
      if (accion) {
        if (accion.closest('#omProfile')) cerrarPerfil();
        const cont = $('#omAdvanced');
        if (cont && cont.hidden && cont.contains(accion)) mostrarPaneles(false);
        // Al elegir un altar del Santuario se cierra el Perfil si estaba abierto.
        if (accion.closest('.om-altar') && !$('#omProfile')?.hidden) cerrarPerfil();

        /* Se marca el modal con el oráculo activo para que cada uno tenga
           su atmósfera. El motor no necesita enterarse. */
        const modulo = accion.getAttribute('data-module');
        if (modulo) {
          const raiz = $('#modalRoot');
          if (raiz) raiz.setAttribute('data-om-oracle', modulo);
        }
      }
    });

    document.addEventListener('change', (ev) => {
      const select = ev.target?.closest?.('[data-om-appearance-select]');
      if (select) aplicarModoLuz(select.value);
    });

    document.addEventListener('om:idioma-cambiado', () => pintarControlesModo(modoLuzGuardado()));
    document.addEventListener('om:appearance-changed', (ev) => {
      const modo = ev.detail?.modo;
      if (MODOS_LUZ.includes(modo)) pintarControlesModo(modo);
    });

    // Escape cierra el Perfil.
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && !$('#omProfile')?.hidden) cerrarPerfil();
      if ((ev.key === 'Enter' || ev.key === ' ') && ev.target?.matches?.('[role="button"][data-om-nav]')) {
        ev.preventDefault();
        ev.target.click();
      }
    });

    /* Algunas acciones del motor hacen scrollIntoView sobre paneles
       que ahora empiezan ocultos. Se despliegan antes. */
    ['open-native-engine', 'open-card-library', 'open-reading-vault', 'launch-spread-lab', 'open-onboarding-hub']
      .forEach(nombre => {
        document.addEventListener('click', (ev) => {
          const b = ev.target?.closest?.(`[data-premium-action="${nombre}"]`);
          if (b) mostrarPaneles(false);
        }, true); // en captura, para llegar antes que el motor
      });

    // La barra marca dónde estás al desplazarte.
    const santuario = $('#omSanctuary');
    if (santuario && 'IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entradas) => {
        entradas.forEach(e => marcarNav(e.isIntersecting ? 'santuario' : 'inicio'));
      }, { rootMargin: '-45% 0px -45% 0px' });
      obs.observe(santuario);
    }
  }

  /* Los accesos directos del instalador abren con ?ir=… */
  function atenderAtajo() {
    let destino = null;
    try { destino = new URL(location.href).searchParams.get('ir'); } catch {}
    if (!destino) return;
    const ir = {
      santuario: () => irA('santuario'),
      dia:       () => document.querySelector('[data-action="daily"]')?.click(),
      grimorio:  () => document.querySelector('[data-om-grimorio]')?.click(),
      biblioteca:() => document.querySelector('[data-om-biblioteca]')?.click()
    }[destino];
    if (ir) setTimeout(ir, 420);
    /* Se limpia la dirección para que al recargar no repita el atajo. */
    try {
      const u = new URL(location.href);
      u.searchParams.delete('ir');
      history.replaceState(null, '', u.toString());
    } catch {}
  }

  function iniciar() {
    aplicarModoLuz(modoLuzGuardado());
    aplicarTema(temaGuardado());
    enlazar();
    refrescarBloqueoPantalla();
    marcarNav('inicio');
    atenderAtajo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  } else {
    iniciar();
  }
})();

/* ============================================================
   Fase 13A · El Tarot sigue al idioma de la app
   Al cambiar de idioma se recarga el contenido de las cartas y
   se repinta lo que esté abierto, sin recargar la aplicación.
   ============================================================ */
(() => {
  'use strict';
  let ultimo = null;

  async function sincronizar() {
    const idioma = window.OraculoI18n?.idioma?.();
    if (!idioma || idioma === ultimo) return;
    ultimo = idioma;
    try { await window.OraculoArcanos?.usarIdioma?.(idioma); } catch {}
    /* Si la Biblioteca o el Grimorio están abiertos, se repintan. */
    document.dispatchEvent(new CustomEvent('om:idioma', { detail: { idioma } }));
  }

  document.addEventListener('om:idioma-cambiado', sincronizar);
  /* El selector de idioma vive en Ajustes, dentro del motor: se
     observa el atributo lang del documento, que i18n actualiza. */
  new MutationObserver(sincronizar).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sincronizar, { once: true });
  else setTimeout(sincronizar, 300);
})();
