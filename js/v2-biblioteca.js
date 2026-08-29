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

  let categoria = 'tarot', consulta = '', soloFavoritos = false, abierto = null, grabovoi = null;

  const CATEGORIAS = [
    { id: 'tarot',    clave: 'bCatTarot',    icono: '🃏' },
    { id: 'runas',    clave: 'bCatRunes',    icono: 'ᚱ'  },
    { id: 'luna',     clave: 'bCatMoon',     icono: '🌙' },
    { id: 'suenos',   clave: 'bCatDreams',   icono: '💭' },
    { id: 'grabovoi', clave: 'bCatGrabovoi', icono: '📜' }
  ];

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
        etiqueta: c.num ? `${tr('bMajor')} ${c.num}` : (c.key || ''),
        subtitulo: (c.keywords || []).join(' · ') || [c.key, c.el].filter(Boolean).join(' · '),
        imagen: c.img || '',
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
        etiqueta: r.sym,
        subtitulo: tr('bFuthark'),
        imagen: r.img || '',
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
      grabovoi = bruto.slice(0, 400);
    } catch { grabovoi = []; }
    pintar();
  }

  /* ---------- Pintado ---------- */
  function pintar() {
    const cuerpo = $('#omBibBody');
    if (!cuerpo) return;

    if (abierto) { cuerpo.innerHTML = pintarDetalle(abierto); cuerpo.scrollTop = 0; return; }

    const lista = entradas(categoria);
    if (lista === null) {
      cuerpo.innerHTML = `<p class="om-grim-cuenta">${esc(tr('bLoading'))}</p>`;
      return;
    }
    const fav = leerFav();
    let vista = lista;
    if (soloFavoritos) vista = vista.filter(e => fav.has(e.id));
    if (consulta) {
      const q = consulta.toLowerCase();
      vista = vista.filter(e => e.busca.toLowerCase().includes(q));
    }

    if (!vista.length) {
      cuerpo.innerHTML = soloFavoritos
        ? `<div class="om-vacio"><span aria-hidden="true">✦</span>
             <h3>${esc(tr('bEmptyFavTitle'))}</h3>
             <p>${esc(tr('bEmptyFavText'))}</p></div>`
        : `<div class="om-vacio"><span aria-hidden="true">🔍</span>
             <h3>${esc(tr('bEmptySearchTitle'))}</h3>
             <p>${esc(tr('bEmptySearchText'))}</p></div>`;
      return;
    }

    cuerpo.innerHTML = `
      <p class="om-grim-cuenta">${vista.length} ${esc(vista.length > 1 ? tr('bCards') : tr('bCard'))}</p>
      <div class="om-bib-rejilla">
        ${vista.map(e => `
          <button class="om-bib-ficha" data-bib="abrir" data-id="${esc(e.id)}" type="button">
            ${e.imagen
              ? `<img src="${esc(e.imagen.replace('img/deck/', 'img/deck/thumb/').replace('img/runes/', 'img/runes/thumb/'))}" alt="" loading="lazy" decoding="async">`
              : `<span class="om-bib-simbolo" aria-hidden="true">${esc(e.etiqueta || '✦')}</span>`}
            <strong>${esc(e.titulo)}</strong>
            <small>${esc(e.subtitulo || '')}</small>
            ${fav.has(e.id) ? `<i class="om-bib-estrella" aria-label="${esc(tr('gFavorite'))}">★</i>` : ''}
          </button>`).join('')}
      </div>`;
  }

  function pintarDetalle(e) {
    const fav = leerFav();
    const esFav = fav.has(e.id);
    return `
      <article class="om-bib-detalle">
        <button class="om-bib-volver" data-bib="volver" type="button">‹ ${esc(tr('bBack'))}</button>
        ${e.imagen ? `<img class="om-bib-lamina" src="${esc(e.imagen)}" alt="${esc(e.titulo)}" loading="lazy">`
                   : `<div class="om-bib-simbolo-grande" aria-hidden="true">${esc(e.etiqueta || '✦')}</div>`}
        ${e.etiqueta && e.imagen ? `<p class="om-bib-etiqueta">${esc(e.etiqueta)}</p>` : ''}
        <h3>${esc(e.titulo)}</h3>
        ${e.subtitulo ? `<p class="om-bib-sub">${esc(e.subtitulo)}</p>` : ''}
        ${(e.destacado || []).map(([t, c]) => `<section class="om-bib-clave"><h4>${esc(t)}</h4><p>${esc(c)}</p></section>`).join('')}
        ${e.secciones.map(([t, c], i) => `
          <details class="om-bib-seccion om-bib-plegable"${i < 2 ? ' open' : ''}>
            <summary><h4>${esc(t)}</h4><span aria-hidden="true">+</span></summary>
            <p>${esc(c)}</p>
          </details>`).join('')}
        <button class="om-btn ${esFav ? 'om-btn-primary' : 'om-btn-quiet'}" data-bib="favorito" data-id="${esc(e.id)}" type="button" aria-pressed="${esFav}">
          ${esFav ? '★ ' + esc(tr('bInFav')) : '☆ ' + esc(tr('bSaveFav'))}
        </button>
      </article>`;
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
        <div class="om-3d-stage om-sheet-3d" data-oraculo-3d-asset="library" aria-label="Biblioteca Arcana"></div>
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
    if (b) b.addEventListener('input', () => { consulta = b.value.trim(); abierto = null; pintar(); });
  }

  function cerrar() {
    const raiz = $('#omBiblioteca');
    if (!raiz) return;
    raiz.classList.remove('om-sheet-open');
    if (window.OraculoSheets?.refreshLock) window.OraculoSheets.refreshLock();
    else document.body.classList.remove('om-sheet-lock');
    setTimeout(() => { raiz.hidden = true; }, 240);
    abierto = null;
  }

  /* ---------- Enlazado ---------- */
  document.addEventListener('click', (ev) => {
    const t = ev.target?.closest?.('[data-bib]');
    if (t) {
      const q = t.dataset.bib;
      ev.preventDefault();
      if (q === 'cerrar') return cerrar();
      if (q === 'categoria') {
        categoria = t.dataset.valor; abierto = null; soloFavoritos = false;
        if (categoria === 'grabovoi') cargarGrabovoi();
        abrir(); return;
      }
      if (q === 'favoritos') { soloFavoritos = !soloFavoritos; abierto = null; abrir(); return; }
      if (q === 'abrir') {
        const lista = entradas(categoria) || [];
        abierto = lista.find(e => e.id === t.dataset.id) || null;
        pintar(); return;
      }
      if (q === 'volver') { abierto = null; pintar(); return; }
      if (q === 'favorito') {
        const f = leerFav();
        f.has(t.dataset.id) ? f.delete(t.dataset.id) : f.add(t.dataset.id);
        guardarFav(f);
        pintar(); return;
      }
      return;
    }
    if (ev.target?.closest?.('[data-om-biblioteca]')) { ev.preventDefault(); abrir(); }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape' || $('#omBiblioteca')?.hidden !== false) return;
    if (abierto) { abierto = null; pintar(); } else cerrar();
  });
})();

/* La Biblioteca se repinta al cambiar de idioma, sin recargar. */
document.addEventListener('om:idioma', () => {
  const raiz = document.querySelector('#omBiblioteca');
  if (raiz && !raiz.hidden) document.querySelector('[data-om-biblioteca]')?.click();
});
