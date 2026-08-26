/* ============================================================
   ORÁCULO MÍSTICO · MÓVIL Y PWA
   Fase 9. Tres cosas que fallaban al usar la app como app:

   1. Al abrir el teclado, la barra fija se quedaba encima del
      campo donde estabas escribiendo.
   2. Al publicar una versión nueva, la app se recargaba sola
      sin avisar y de paso tiraba la caché sin conexión.
   3. Sin conexión, las cartas aún no visitadas salían rotas.
   ============================================================ */
(() => {
  'use strict';

  /* El mismo sistema i18n del motor, no uno nuevo. Si aun no ha
     cargado, se devuelve la clave para no romper el pintado. */
  const tr = (k, v) => window.OraculoI18n?.t?.(k, v) ?? k;

  const $ = (s, r = document) => r.querySelector(s);

  /* ============================================================
     1 · TECLADO MÓVIL
     Cuando el teclado sube, el viewport visual se encoge. Se
     detecta ahí -no con eventos de foco, que mienten en iOS- y
     se aparta la barra inferior.
     ============================================================ */
  function vigilarTeclado() {
    const vv = window.visualViewport;
    if (!vv) return;
    let alturaBase = vv.height;

    const revisar = () => {
      /* Un cambio de más del 18% suele ser el teclado; menos, es
         la barra de direcciones al desplazarse. */
      const encogido = alturaBase - vv.height;
      const abierto = encogido > alturaBase * 0.18;
      document.body.classList.toggle('om-teclado', abierto);
      if (!abierto) alturaBase = Math.max(alturaBase, vv.height);
      /* El alto real disponible, para que los paneles no queden
         por debajo del teclado. */
      document.documentElement.style.setProperty('--om-vv-alto', vv.height + 'px');
    };

    vv.addEventListener('resize', revisar);
    vv.addEventListener('scroll', revisar);
    revisar();

    /* Al enfocar un campo dentro de un panel, se acerca a la vista. */
    document.addEventListener('focusin', (ev) => {
      const campo = ev.target;
      if (!campo?.matches?.('input, textarea, select')) return;
      if (!campo.closest('.om-sheet-panel, .om-ritual-panel, .modal-panel')) return;
      setTimeout(() => {
        campo.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 260);
    });
  }

  /* ============================================================
     2 · ACTUALIZACIONES
     El aviso llega, la persona decide. Antes la app se recargaba
     sola y ademas desregistraba el service worker, con lo que
     perdia el modo sin conexion en cada version.
     ============================================================ */
  function vigilarActualizaciones() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return;
      reg.addEventListener('updatefound', () => {
        const nuevo = reg.installing;
        if (!nuevo) return;
        nuevo.addEventListener('statechange', () => {
          /* Solo avisa si ya habia una version corriendo: en la
             primera instalacion no hay nada que actualizar. */
          if (nuevo.state === 'installed' && navigator.serviceWorker.controller) avisarActualizacion();
        });
      });
      /* Se busca version nueva al volver a la app. */
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) reg.update().catch(() => {});
      });
    }).catch(() => {});
  }

  function avisarActualizacion() {
    if ($('#omActualizacion')) return;
    const aviso = document.createElement('div');
    aviso.id = 'omActualizacion';
    aviso.className = 'om-aviso';
    aviso.setAttribute('role', 'status');
    aviso.innerHTML = `
      <span>${tr('mNewVersion')}</span>
      <button class="om-btn om-btn-primary" data-om-actualizar type="button">${tr('mUpdate')}</button>
      <button class="om-aviso-cerrar" data-om-aviso-cerrar type="button" aria-label="${tr('mNotNow')}">✕</button>`;
    document.body.appendChild(aviso);
    requestAnimationFrame(() => aviso.classList.add('visible'));
  }

  document.addEventListener('click', (ev) => {
    if (ev.target?.closest?.('[data-om-actualizar]')) {
      ev.preventDefault();
      location.reload();
      return;
    }
    if (ev.target?.closest?.('[data-om-aviso-cerrar]')) {
      ev.preventDefault();
      $('#omActualizacion')?.remove();
    }
  });

  /* ============================================================
     3 · SIN CONEXIÓN
     Una carta que nunca se visitó no está en caché. En vez de
     dejar el hueco roto, se pone el dorso del mazo.
     ============================================================ */
  const DORSO = 'assets/premium/card-back-premium.svg';

  function respaldoDeImagenes() {
    document.addEventListener('error', (ev) => {
      const img = ev.target;
      if (!img || img.tagName !== 'IMG') return;
      if (img.dataset.respaldo) return;                 // ya se intentó
      const esCarta = /img\/(deck|runes)\//.test(img.getAttribute('src') || '');
      if (!esCarta) return;
      /* El reintento con el original lo hace coreApp; este es el
         último recurso, solo cuando de verdad no hay nada. */
      if (!navigator.onLine || img.dataset.retried) {
        img.dataset.respaldo = '1';
        img.src = DORSO;
        img.classList.add('om-img-respaldo');
      }
    }, true);
  }

  /* Estado de conexión, discreto. */
  function vigilarConexion() {
    const pintar = () => {
      document.body.classList.toggle('om-sin-conexion', !navigator.onLine);
      if (!navigator.onLine && !$('#omSinConexion')) {
        const b = document.createElement('div');
        b.id = 'omSinConexion';
        b.className = 'om-banda-offline';
        b.setAttribute('role', 'status');
        b.textContent = tr('mOffline');
        document.body.appendChild(b);
      } else if (navigator.onLine) {
        $('#omSinConexion')?.remove();
      }
    };
    window.addEventListener('online', pintar);
    window.addEventListener('offline', pintar);
    pintar();
  }

  function iniciar() {
    vigilarTeclado();
    vigilarActualizaciones();
    respaldoDeImagenes();
    vigilarConexion();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();
