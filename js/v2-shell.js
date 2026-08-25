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

  /* ---------- Tema ---------- */
  const TEMAS = ['arcano', 'lunar', 'cosmico', 'bosque', 'eclipse'];

  function aplicarTema(tema) {
    if (!TEMAS.includes(tema)) tema = 'arcano';
    // Arcano es el estado base: no necesita atributo.
    if (tema === 'arcano') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', tema);
    try { localStorage.setItem(LS_THEME, tema); } catch {}
    $$('[data-om-theme]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.omTheme === tema)));
    // El color de la barra del navegador acompaña al tema.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const fondo = getComputedStyle(document.documentElement).getPropertyValue('--om-void').trim();
      if (fondo) meta.setAttribute('content', fondo);
    }
  }

  function temaGuardado() {
    try { return localStorage.getItem(LS_THEME) || 'arcano'; } catch { return 'arcano'; }
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

  /* ---------- Perfil ---------- */
  function abrirPerfil() {
    const hoja = $('#omProfile');
    if (!hoja) return;
    hoja.hidden = false;
    requestAnimationFrame(() => hoja.classList.add('om-sheet-open'));
    document.body.classList.add('om-sheet-lock');
    const primero = hoja.querySelector('.om-sheet-close');
    if (primero) primero.focus();
  }

  function cerrarPerfil() {
    const hoja = $('#omProfile');
    if (!hoja) return;
    hoja.classList.remove('om-sheet-open');
    document.body.classList.remove('om-sheet-lock');
    const ocultar = () => { hoja.hidden = true; };
    if (movimientoReducido()) ocultar();
    else setTimeout(ocultar, 260);
    marcarNav('inicio');
  }

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
        if (destino === 'perfil') { ev.preventDefault(); abrirPerfil(); return; }
        if (destino === 'cerrar-perfil') { ev.preventDefault(); cerrarPerfil(); return; }
        if (destino === 'paneles') { ev.preventDefault(); cerrarPerfil(); mostrarPaneles(); return; }
        ev.preventDefault();
        irA(destino);
        return;
      }

      // Tema
      const tema = t.closest('[data-om-theme]');
      if (tema) { ev.preventDefault(); aplicarTema(tema.dataset.omTheme); return; }

      // El Orbe abre el Santuario
      if (t.closest('#omOrb')) { ev.preventDefault(); irA('santuario'); return; }

      // Cualquier acción del motor que viva en los paneles ocultos
      // los despliega antes de ejecutarse.
      const accion = t.closest('[data-premium-action], [data-act], [data-module], [data-action]');
      if (accion) {
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

    // Escape cierra el Perfil.
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && !$('#omProfile')?.hidden) cerrarPerfil();
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

  function iniciar() {
    aplicarTema(temaGuardado());
    enlazar();
    marcarNav('inicio');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  } else {
    iniciar();
  }
})();
