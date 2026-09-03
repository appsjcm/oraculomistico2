/* ============================================================
   ORÁCULO MÍSTICO · LA BIBLIOTECA MÍSTICA
   Fase 8. El saber de la app estaba repartido en catálogos
   sueltos dentro de cada módulo: las cartas en Tarot, las runas
   en Runas, las fases en Luna, los símbolos en Sueños y las
   secuencias en Grabovoi.

   Aquí se reúnen en un solo lugar con categorías, buscador,
   favoritos y una lectura cómoda. No se copia ni un dato: se
   leen los que el motor ya tenía.
   ============================================================ */
(() => {
  'use strict';

  /* El mismo sistema i18n del motor, no uno nuevo. Si aun no ha
     cargado, se devuelve la clave para no romper el pintado. */
  const tr = (k, v) => window.OraculoI18n?.t?.(k, v) ?? k;

  const $ = (s, r = document) => r.querySelector(s);
  const LS_FAV = 'oraculo.v2.biblioteca.favoritos';

  const esc = (v = '') => String(v)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const leerFav = () => { try { return new Set(JSON.parse(localStorage.getItem(LS_FAV) || '[]')); } catch { return new Set(); } };
  const guardarFav = (s) => { try { localStorage.setItem(LS_FAV, JSON.stringify([...s])); } catch {} };

  let categoria = 'tarot', consulta = '', soloFavoritos = false, abierto = null, grabovoi = null, filtro = 'all';
  const ZOOM_MIN = 1;
  const ZOOM_MAX = 3;
  const ZOOM_STEP = .35;
  let gestoZoom = { viewport:null, pointers:new Map(), startScale:1, startDistance:0, startMid:null, startX:0, startY:0 };

  const CATEGORIAS = [
    { id: 'tarot',    clave: 'bCatTarot',    icono: '🃏' },
    { id: 'runas',    clave: 'bCatRunes',    icono: 'ᚱ'  },
    { id: 'luna',     clave: 'bCatMoon',     icono: '🌙' },
    { id: 'suenos',   clave: 'bCatDreams',   icono: '💭' },
    { id: 'grabovoi', clave: 'bCatGrabovoi', icono: '📜' }
  ];

  const FILTROS_TAROT = [
    { id: 'all', clave: 'bFilterAll' },
    { id: 'major', clave: 'bTarotMajors' },
    { id: 'wands', clave: 'bTarotWands' },
    { id: 'cups', clave: 'bTarotCups' },
    { id: 'swords', clave: 'bTarotSwords' },
    { id: 'pents', clave: 'bTarotPentacles' }
  ];

  const FILTROS_RUNAS = [
    { id: 'all', clave: 'bFilterAll' },
    { id: 'aett-freyja', clave: 'bRunesAett1' },
    { id: 'aett-heimdall', clave: 'bRunesAett2' },
    { id: 'aett-tyr', clave: 'bRunesAett3' }
  ];

  const PALO_TAROT = {
    wands: 'bTarotWands',
    cups: 'bTarotCups',
    swords: 'bTarotSwords',
    pents: 'bTarotPentacles'
  };

  function filtrosActivos() {
    if (categoria === 'tarot') return FILTROS_TAROT;
    if (categoria === 'runas') return FILTROS_RUNAS;
    return [];
  }

  function grupoRuna(i) {
    if (i < 8) return { id: 'aett-freyja', clave: 'bRunesAett1' };
    if (i < 16) return { id: 'aett-heimdall', clave: 'bRunesAett2' };
    return { id: 'aett-tyr', clave: 'bRunesAett3' };
  }

  function partirConceptos(v) {
    if (Array.isArray(v)) return v.filter(Boolean).slice(0, 3);
    return String(v || '').split(/[,·]/).map(x => x.trim()).filter(Boolean).slice(0, 3);
  }

  function zoomState(viewport) {
    return {
      scale: Number(viewport?.dataset?.zoomScale || 1) || 1,
      x: Number(viewport?.dataset?.zoomX || 0) || 0,
      y: Number(viewport?.dataset?.zoomY || 0) || 0
    };
  }

  function zoomClamp(viewport, x, y, scale) {
    const rect = viewport?.getBoundingClientRect?.();
    const width = rect?.width || viewport?.clientWidth || 260;
    const height = rect?.height || viewport?.clientHeight || 260;
    const maxX = Math.max(0, (scale - 1) * width * .5);
    const maxY = Math.max(0, (scale - 1) * height * .5);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y))
    };
  }

  function setZoom(viewport, next) {
    if (!viewport) return;
    const scale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Number(next.scale) || 1));
    const pan = scale <= 1.01 ? { x:0, y:0 } : zoomClamp(viewport, Number(next.x) || 0, Number(next.y) || 0, scale);
    viewport.dataset.zoomScale = scale.toFixed(2);
    viewport.dataset.zoomX = pan.x.toFixed(1);
    viewport.dataset.zoomY = pan.y.toFixed(1);
    viewport.classList.toggle('om-bib-zoomed', scale > 1.01);
    const target = viewport.querySelector('[data-bib-zoom-target]');
    target?.style.setProperty('--bib-scale', scale.toFixed(2));
    target?.style.setProperty('--bib-pan-x', `${pan.x.toFixed(1)}px`);
    target?.style.setProperty('--bib-pan-y', `${pan.y.toFixed(1)}px`);
    const status = viewport.closest('.om-bib-media')?.querySelector('[data-bib-zoom-status]');
    if (status) status.textContent = `${Math.round(scale * 100)}%`;
  }

  function zoomPoints() {
    return Array.from(gestoZoom.pointers.values());
  }

  function zoomDistance(points) {
    if (points.length < 2) return 0;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  }

  function zoomMid(points) {
    if (points.length < 2) return { x:points[0]?.x || 0, y:points[0]?.y || 0 };
    return { x:(points[0].x + points[1].x) / 2, y:(points[0].y + points[1].y) / 2 };
  }

  function resetZoomGesture(viewport) {
    const state = zoomState(viewport);
    const points = zoomPoints();
    gestoZoom.startScale = state.scale;
    gestoZoom.startX = state.x;
    gestoZoom.startY = state.y;
    gestoZoom.startDistance = zoomDistance(points);
    gestoZoom.startMid = zoomMid(points);
  }

  function clearZoomGesture() {
    gestoZoom.pointers.clear();
    gestoZoom.viewport?.classList?.remove('om-bib-zoom-dragging');
    gestoZoom.viewport = null;
  }

  function mediaHTML(e, enModal) {
    const contenido = e.imagen
      ? `<img class="om-bib-lamina" src="${esc(e.imagen)}" alt="${esc(e.titulo)}" loading="lazy" decoding="async">`
      : `<div class="om-bib-simbolo-grande" aria-hidden="true">${esc(e.simbolo || e.etiqueta || '✦')}</div>`;
    if (!enModal) return contenido;
    return `
      <div class="om-bib-zoom-tools" aria-label="Zoom">
        <button type="button" data-bib="zoom-out" aria-label="${esc(tr('bZoomOut'))}">−</button>
        <span data-bib-zoom-status aria-live="polite">100%</span>
        <button type="button" data-bib="zoom-reset" aria-label="${esc(tr('bZoomReset'))}">⟲</button>
        <button type="button" data-bib="zoom-in" aria-label="${esc(tr('bZoomIn'))}">+</button>
      </div>
      <div class="om-bib-zoom-viewport" data-bib-zoom-viewport tabindex="0" aria-label="${esc(tr('bZoomArea'))}">
        <div class="om-bib-zoom-target" data-bib-zoom-target>${contenido}</div>
      </div>`;
  }

  /* ---------- Fuentes ----------
     Cada entrada se traduce a una forma común: id, título,
     subtítulo, cuerpo y, si la hay, imagen. */
  function entradas(cat) {
    const S = window.OraculoSaber;
    if (!S) return [];

    if (cat === 'tarot') {
      return (S.tarot || []).map((c, i) => ({
        id: `tarot-${i}`,
        titulo: c.name,
        grupo: c.suitId || 'major',
        etiqueta: c.suitId ? tr(PALO_TAROT[c.suitId] || 'bTarotMinor') : `${tr('bMajor')} ${c.num || ''}`.trim(),
        subtitulo: (c.keywords || []).join(' · ') || [c.key, c.el].filter(Boolean).join(' · '),
        imagen: c.img || '',
        tipo: 'tarot',
        simbolo: c.emoji || '🃏',
        conceptos: partirConceptos(c.keywords || c.key),
        /* Lo esencial arriba; el resto se despliega bajo demanda. */
        destacado: c.energy ? [[tr('cEnergy'), c.energy], [tr('cAdvice'), c.advice]] : [],
        secciones: [
          [tr('bUpright'), c.uprightMeaning || c.up],
          [tr('bReversed'), c.reversedMeaning || c.rv],
          [tr('cLight'), (c.light || []).join(' · ')],
          [tr('cShadow'), (c.shadow || []).join(' · ')],
          [tr('cLove'), c.love],
          [tr('cWork'), c.work],
          [tr('cGrowth'), c.personalGrowth],
          [tr('cTrend'), c.yesNo],
          [tr('cCorrespond'), [c.el, c.astrology].filter(Boolean).join(' · ')]
        ].filter(x => x[1]),
        busca: `${c.name} ${c.num || ''} ${(c.keywords || []).join(' ')} ${c.el || ''} ${c.energy || ''} ${c.uprightMeaning || c.up || ''} ${c.reversedMeaning || c.rv || ''} ${c.love || ''} ${c.work || ''}`
      }));
    }
    if (cat === 'runas') {
      return (S.runas || []).map((r, i) => ({
        id: `runa-${i}`,
        titulo: r.name,
        grupo: grupoRuna(i).id,
        etiqueta: r.sym,
        subtitulo: `${tr('bFuthark')} · ${tr(grupoRuna(i).clave)}`,
        imagen: r.img || '',
        tipo: 'runa',
        simbolo: r.sym || 'ᚱ',
        conceptos: partirConceptos((r.up || '').replace(`${r.name}:`, '')),
        secciones: [[tr('bMeaning'), r.up], [tr('bReversed'), r.rv]].filter(x => x[1]),
        busca: `${r.name} ${r.sym} ${r.up || ''} ${r.rv || ''}`
      }));
    }
    if (cat === 'luna') {
      return (S.lunas || []).map((m, i) => ({
        id: `luna-${i}`,
        titulo: m.name,
        etiqueta: m.sym,
        subtitulo: tr('bMoonPhase'),
        imagen: '',
        secciones: [[tr('bMeaning'), m.meaning], [tr('bRitual'), m.ritual], [tr('bAffirm'), m.affirmation]].filter(x => x[1]),
        busca: `${m.name} ${m.meaning || ''} ${m.ritual || ''}`
      }));
    }
    if (cat === 'suenos') {
      return Object.entries(S.suenos || {}).map(([clave, texto], i) => ({
        id: `sueno-${i}`,
        titulo: clave.charAt(0).toUpperCase() + clave.slice(1),
        etiqueta: '💭',
        subtitulo: tr('bDreamSymbol'),
        imagen: '',
        secciones: [[tr('bDreamSign'), texto]],
        busca: `${clave} ${texto}`
      }));
    }
    if (cat === 'grabovoi') {
      if (!grabovoi) return null;                  // aún cargando
      return grabovoi.map((g, i) => ({
        id: `grab-${i}`,
        titulo: g.nombre || g.titulo || g.categoria || tr('bSequence'),
        etiqueta: g.codigo || (Array.isArray(g.codigos) ? g.codigos[0] : ''),
        subtitulo: g.categoria || tr('bSequence'),
        imagen: '',
        secciones: [
          [tr('bCode'), g.codigo || (Array.isArray(g.codigos) ? g.codigos.join(' · ') : '')],
          [tr('bDescription'), g.descripcion || '']
        ].filter(x => x[1]),
        busca: `${g.nombre || ''} ${g.categoria || ''} ${g.codigo || ''} ${g.descripcion || ''}`
      }));
    }
    return [];
  }

  /* Grabovoi vive en un archivo de 150 KB: se carga solo cuando
     alguien abre esa categoría, no al arrancar la app. */
  async function cargarGrabovoi() {
    if (grabovoi) return;
    try {
      const r = await fetch('grabovoi_db.json');
      const d = await r.json();
      const bruto = [];
      const recorrer = (v) => {
        if (Array.isArray(v)) v.forEach(recorrer);
        else if (v && typeof v === 'object') {
          if (v.codigo || v.codigos) bruto.push(v);
          Object.values(v).forEach(recorrer);
        }
      };
      recorrer(d);
      grabovoi = bruto;
    } catch { grabovoi = []; }
    pintar();
  }

  /* ---------- Pintado ---------- */
  function pintar() {
    const cuerpo = $('#omBibBody');
    if (!cuerpo) return;

    const lista = entradas(categoria);
    if (lista === null) {
      cuerpo.innerHTML = `<p class="om-grim-cuenta">${esc(tr('bLoading'))}</p>`;
      return;
    }
    const fav = leerFav();
    let vista = lista;
    if (filtro !== 'all') vista = vista.filter(e => e.grupo === filtro);
    if (soloFavoritos) vista = vista.filter(e => fav.has(e.id));
    if (consulta) {
      const q = consulta.toLowerCase();
      vista = vista.filter(e => e.busca.toLowerCase().includes(q));
    }

    const filtros = filtrosActivos();
    const nombreCategoria = CATEGORIAS.find(c => c.id === categoria);
    cuerpo.innerHTML = `
      <section class="om-bib-resumen" aria-live="polite">
        <div>
          <strong>${esc(vista.length)} ${esc(vista.length > 1 ? tr('bCards') : tr('bCard'))}</strong>
          <span>${esc(nombreCategoria ? tr(nombreCategoria.clave) : tr('bTitle'))}</span>
        </div>
        <p>${esc(soloFavoritos ? tr('bShowingFavs') : tr('bShowingAll'))}</p>
      </section>
      ${filtros.length ? `
        <div class="om-bib-filtros" role="toolbar" aria-label="${esc(tr('bFilters'))}">
          ${filtros.map(f => `<button class="om-bib-filtro${filtro === f.id ? ' activo' : ''}" data-bib="filtro" data-valor="${esc(f.id)}" type="button" aria-pressed="${filtro === f.id}">${esc(tr(f.clave))}</button>`).join('')}
        </div>` : ''}
      ${!vista.length
        ? (soloFavoritos
          ? `<div class="om-vacio"><span aria-hidden="true">✦</span>
               <h3>${esc(tr('bEmptyFavTitle'))}</h3>
               <p>${esc(tr('bEmptyFavText'))}</p></div>`
          : `<div class="om-vacio"><span aria-hidden="true">🔍</span>
               <h3>${esc(tr('bEmptySearchTitle'))}</h3>
               <p>${esc(tr('bEmptySearchText'))}</p></div>`)
        : `
      <div class="om-bib-rejilla">
        ${vista.map(e => `
          <button class="om-bib-ficha" data-bib="abrir" data-id="${esc(e.id)}" type="button">
            ${e.imagen
              ? `<img src="${esc(e.imagen.replace('img/deck/', 'img/deck/thumb/').replace('img/runes/', 'img/runes/thumb/'))}" alt="" loading="lazy" decoding="async">`
              : `<span class="om-bib-simbolo" aria-hidden="true">${esc(e.simbolo || e.etiqueta || '✦')}</span>`}
            <span class="om-bib-chip">${esc(e.etiqueta || '')}</span>
            <strong>${esc(e.titulo)}</strong>
            <small>${esc(e.conceptos?.length ? e.conceptos.join(' · ') : e.subtitulo || '')}</small>
            ${fav.has(e.id) ? `<i class="om-bib-estrella" aria-label="${esc(tr('gFavorite'))}">★</i>` : ''}
          </button>`).join('')}
      </div>`}`;
  }

  function pintarDetalle(e, enModal = false) {
    const fav = leerFav();
    const esFav = fav.has(e.id);
    return `
      <article class="om-bib-detalle">
        ${enModal ? '' : `<button class="om-bib-volver" data-bib="volver" type="button">‹ ${esc(tr('bBack'))}</button>`}
        <div class="om-bib-hero">
          <div class="om-bib-media">
            ${mediaHTML(e, enModal)}
          </div>
          <div class="om-bib-info">
            ${e.etiqueta ? `<p class="om-bib-etiqueta">${esc(e.etiqueta)}</p>` : ''}
            <h3>${esc(e.titulo)}</h3>
            ${e.subtitulo ? `<p class="om-bib-sub">${esc(e.subtitulo)}</p>` : ''}
            ${e.conceptos?.length ? `<div class="om-bib-conceptos">${e.conceptos.map(c => `<span>${esc(c)}</span>`).join('')}</div>` : ''}
            <button class="om-btn ${esFav ? 'om-btn-primary' : 'om-btn-quiet'}" data-bib="favorito" data-id="${esc(e.id)}" type="button" aria-pressed="${esFav}">
              ${esFav ? '★ ' + esc(tr('bInFav')) : '☆ ' + esc(tr('bSaveFav'))}
            </button>
          </div>
        </div>
        ${(e.destacado || []).map(([t, c]) => `<section class="om-bib-clave"><h4>${esc(t)}</h4><p>${esc(c)}</p></section>`).join('')}
        <div class="om-bib-secciones">
          ${e.secciones.map(([t, c], i) => `
            <details class="om-bib-seccion om-bib-plegable"${i < 2 ? ' open' : ''}>
              <summary><h4>${esc(t)}</h4><span aria-hidden="true">+</span></summary>
              <p>${esc(c)}</p>
            </details>`).join('')}
        </div>
      </article>`;
  }

  function abrirDetalle(e) {
    const raiz = $('#omBiblioteca');
    if (!raiz || !e) return;
    abierto = e;
    let modal = $('#omBibDetalleModal', raiz);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'omBibDetalleModal';
      modal.className = 'om-bib-card-modal';
      raiz.appendChild(modal);
    }
    modal.innerHTML = `
      <div class="om-bib-card-backdrop" data-bib="cerrar-detalle"></div>
      <section class="om-bib-card-panel" role="dialog" aria-modal="true" aria-labelledby="omBibDetalleTitulo">
        <header class="om-bib-card-head">
          <div>
            <span>${esc(e.etiqueta || e.subtitulo || '')}</span>
            <h3 id="omBibDetalleTitulo">${esc(e.titulo)}</h3>
          </div>
          <div class="om-bib-card-acciones">
            <button class="om-bib-escuchar" data-bib="escuchar" type="button">🔊 ${esc(tr('raListen'))}</button>
            <button class="om-sheet-close" data-bib="cerrar-detalle" type="button" aria-label="${esc(tr('close'))}">✕</button>
          </div>
        </header>
        <div class="om-bib-card-body">${pintarDetalle(e, true)}</div>
      </section>`;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('abierto'));
    setTimeout(() => $('.om-sheet-close', modal)?.focus?.(), 60);
  }

  function cerrarDetalle(repintar = true) {
    const modal = $('#omBibDetalleModal');
    if (!modal) { abierto = null; return; }
    clearZoomGesture();
    modal.classList.remove('abierto');
    setTimeout(() => { modal.hidden = true; modal.innerHTML = ''; }, 180);
    abierto = null;
    if (repintar) pintar();
  }

  /* ---------- Abrir ---------- */
  function abrir() {
    let raiz = $('#omBiblioteca');
    if (!raiz) {
      raiz = document.createElement('div');
      raiz.id = 'omBiblioteca';
      raiz.className = 'om-sheet om-biblioteca';
      document.body.appendChild(raiz);
    }
    raiz.innerHTML = `
      <div class="om-sheet-backdrop" data-bib="cerrar"></div>
      <div class="om-sheet-panel om-bib-panel" role="dialog" aria-modal="true" aria-labelledby="omBibTitulo">
        <header class="om-sheet-head">
          <h2 id="omBibTitulo">${tr('bTitle')}</h2>
          <button class="om-sheet-close" data-bib="cerrar" type="button" aria-label="${esc(tr('close'))}">✕</button>
        </header>
        <div class="om-bib-cats" role="tablist">
          ${CATEGORIAS.map(c => `<button class="om-bib-cat${categoria === c.id ? ' activo' : ''}" data-bib="categoria" data-valor="${c.id}" role="tab" aria-selected="${categoria === c.id}" type="button"><span aria-hidden="true">${c.icono}</span>${esc(tr(c.clave))}</button>`).join('')}
        </div>
        <div class="om-grim-buscar">
          <label class="sr-only" for="omBibBuscar">${tr('bSearchLabel')}</label>
          <input id="omBibBuscar" class="om-ritual-input" type="search" placeholder="${esc(tr('bSearch'))}" value="${esc(consulta)}">
          <button class="om-grim-chip${soloFavoritos ? ' activo' : ''}" data-bib="favoritos" type="button" aria-pressed="${soloFavoritos}">★ ${esc(tr('bFavOnly'))}</button>
        </div>
        <div class="om-sheet-body om-grim-body" id="omBibBody"></div>
      </div>`;
    raiz.hidden = false;
    requestAnimationFrame(() => raiz.classList.add('om-sheet-open'));
    (window.OraculoSheets?.lock || (() => document.body.classList.add('om-sheet-lock')))();
    if (categoria === 'grabovoi') cargarGrabovoi();
    pintar();
    const b = $('#omBibBuscar');
    if (b) b.addEventListener('input', () => { consulta = b.value.trim(); cerrarDetalle(false); pintar(); });
  }

  function cerrar() {
    const raiz = $('#omBiblioteca');
    if (!raiz) return;
    raiz.classList.remove('om-sheet-open');
    if (window.OraculoSheets?.refreshLock) window.OraculoSheets.refreshLock();
    else document.body.classList.remove('om-sheet-lock');
    setTimeout(() => { raiz.hidden = true; }, 240);
    cerrarDetalle(false);
  }

  /* ---------- Enlazado ---------- */
  document.addEventListener('click', (ev) => {
    const t = ev.target?.closest?.('[data-bib]');
    if (t) {
      const q = t.dataset.bib;
      ev.preventDefault();
      if (q === 'cerrar') return cerrar();
      if (q === 'cerrar-detalle') return cerrarDetalle();
      if (q === 'zoom-in' || q === 'zoom-out' || q === 'zoom-reset') {
        const viewport = t.closest('.om-bib-media')?.querySelector('[data-bib-zoom-viewport]');
        const state = zoomState(viewport);
        if (q === 'zoom-reset') setZoom(viewport, { scale:1, x:0, y:0 });
        else setZoom(viewport, { ...state, scale:state.scale + (q === 'zoom-in' ? ZOOM_STEP : -ZOOM_STEP) });
        return;
      }
      if (q === 'categoria') {
        cerrarDetalle(false);
        categoria = t.dataset.valor; soloFavoritos = false; filtro = 'all';
        if (categoria === 'grabovoi') cargarGrabovoi();
        abrir(); return;
      }
      if (q === 'filtro') { cerrarDetalle(false); filtro = t.dataset.valor || 'all'; pintar(); return; }
      if (q === 'favoritos') { cerrarDetalle(false); soloFavoritos = !soloFavoritos; abrir(); return; }
      if (q === 'abrir') {
        const lista = entradas(categoria) || [];
        abierto = lista.find(e => e.id === t.dataset.id) || null;
        abrirDetalle(abierto); return;
      }
      if (q === 'escuchar') {
        /* Se lee lo mismo que se ve: titulo, etiqueta y el cuerpo de la
           ficha ya sin marcas. El avatar sale solo, lo pone la voz. */
        const e = abierto;
        if (!e) return;
        const cuerpo = document.querySelector('#omBibDetalleModal .om-bib-card-body');
        /* Se lee sobre una copia con los mandos quitados. Sin esto se
           colaba el control de zoom de la lamina y el oraculo recitaba
           "menos cien por cien mas" en medio de la carta. */
        let leible = '';
        if (cuerpo) {
          const copia = cuerpo.cloneNode(true);
          copia.querySelectorAll('button, input, select, .om-bib-zoom-tools, [data-bib-zoom], [data-bib-zoom-status], [aria-hidden="true"]').forEach(x => x.remove());
          leible = copia.innerText || '';
        }
        const texto = [e.titulo, e.etiqueta || e.subtitulo || '', leible]
          .filter(Boolean).join('. ');
        window.OraculoVoz?.hablar?.(texto);
        return;
      }
      if (q === 'volver') { cerrarDetalle(); return; }
      if (q === 'favorito') {
        const f = leerFav();
        f.has(t.dataset.id) ? f.delete(t.dataset.id) : f.add(t.dataset.id);
        guardarFav(f);
        if (abierto) {
          const actual = (entradas(categoria) || []).find(e => e.id === abierto.id) || abierto;
          abrirDetalle(actual);
        }
        pintar(); return;
      }
      return;
    }
    if (ev.target?.closest?.('[data-om-biblioteca]')) { ev.preventDefault(); abrir(); }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape' || $('#omBiblioteca')?.hidden !== false) return;
    if (abierto) cerrarDetalle(); else cerrar();
  });

  document.addEventListener('pointerdown', (ev) => {
    if (ev.target.closest?.('[data-bib]')) return;
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    const viewport = ev.target.closest?.('[data-bib-zoom-viewport]');
    if (!viewport) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (gestoZoom.viewport && gestoZoom.viewport !== viewport) gestoZoom.pointers.clear();
    gestoZoom.viewport = viewport;
    viewport.classList.add('om-bib-zoom-dragging');
    try { viewport.setPointerCapture?.(ev.pointerId); } catch {}
    const now = Date.now();
    const lastTap = Number(viewport.dataset.zoomLastTap || 0);
    if (now - lastTap < 320 && gestoZoom.pointers.size === 0) {
      const state = zoomState(viewport);
      setZoom(viewport, { ...state, scale:state.scale > 1.05 ? 1 : 2 });
      viewport.dataset.zoomLastTap = '0';
      return;
    }
    viewport.dataset.zoomLastTap = String(now);
    gestoZoom.pointers.set(ev.pointerId, { x:ev.clientX, y:ev.clientY });
    resetZoomGesture(viewport);
  }, { passive:false });

  document.addEventListener('pointermove', (ev) => {
    const viewport = gestoZoom.viewport;
    if (!viewport || !document.contains(viewport) || !gestoZoom.pointers.has(ev.pointerId)) {
      if (viewport && !document.contains(viewport)) clearZoomGesture();
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
    gestoZoom.pointers.set(ev.pointerId, { x:ev.clientX, y:ev.clientY });
    const points = zoomPoints();
    if (points.length >= 2 && gestoZoom.startDistance > 0) {
      const mid = zoomMid(points);
      setZoom(viewport, {
        scale:gestoZoom.startScale * (zoomDistance(points) / gestoZoom.startDistance),
        x:gestoZoom.startX + (mid.x - gestoZoom.startMid.x),
        y:gestoZoom.startY + (mid.y - gestoZoom.startMid.y)
      });
      return;
    }
    const state = zoomState(viewport);
    if (state.scale <= 1.01) return;
    const point = points[0];
    setZoom(viewport, {
      scale:state.scale,
      x:gestoZoom.startX + point.x - gestoZoom.startMid.x,
      y:gestoZoom.startY + point.y - gestoZoom.startMid.y
    });
  }, { passive:false });

  const endZoomGesture = (ev) => {
    const viewport = gestoZoom.viewport;
    if (!viewport) return;
    try { viewport.releasePointerCapture?.(ev.pointerId); } catch {}
    gestoZoom.pointers.delete(ev.pointerId);
    if (gestoZoom.pointers.size) resetZoomGesture(viewport);
    else clearZoomGesture();
  };
  document.addEventListener('pointerup', endZoomGesture);
  document.addEventListener('pointercancel', endZoomGesture);
})();

/* La Biblioteca se repinta al cambiar de idioma, sin recargar. */
document.addEventListener('om:idioma', () => {
  const raiz = document.querySelector('#omBiblioteca');
  if (raiz && !raiz.hidden) document.querySelector('[data-om-biblioteca]')?.click();
});
