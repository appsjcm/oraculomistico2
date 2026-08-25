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

  const $ = (s, r = document) => r.querySelector(s);
  const LS_FAV = 'oraculo.v2.biblioteca.favoritos';

  const esc = (v = '') => String(v)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const leerFav = () => { try { return new Set(JSON.parse(localStorage.getItem(LS_FAV) || '[]')); } catch { return new Set(); } };
  const guardarFav = (s) => { try { localStorage.setItem(LS_FAV, JSON.stringify([...s])); } catch {} };

  let categoria = 'tarot', consulta = '', soloFavoritos = false, abierto = null, grabovoi = null;

  const CATEGORIAS = [
    { id: 'tarot',    nombre: 'Tarot',      icono: '🃏' },
    { id: 'runas',    nombre: 'Runas',      icono: 'ᚱ'  },
    { id: 'luna',     nombre: 'Luna',       icono: '🌙' },
    { id: 'suenos',   nombre: 'Sueños',     icono: '💭' },
    { id: 'grabovoi', nombre: 'Grabovoi',   icono: '📜' }
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
        etiqueta: c.num ? `Arcano ${c.num}` : (c.key || ''),
        subtitulo: [c.key, c.el].filter(Boolean).join(' · '),
        imagen: c.img || '',
        secciones: [
          ['Al derecho', c.up],
          ['Invertida', c.rv]
        ].filter(x => x[1]),
        busca: `${c.name} ${c.num || ''} ${c.key || ''} ${c.el || ''} ${c.up || ''} ${c.rv || ''}`
      }));
    }
    if (cat === 'runas') {
      return (S.runas || []).map((r, i) => ({
        id: `runa-${i}`,
        titulo: r.name,
        etiqueta: r.sym,
        subtitulo: 'Futhark antiguo',
        imagen: r.img || '',
        secciones: [['Significado', r.up], ['Invertida', r.rv]].filter(x => x[1]),
        busca: `${r.name} ${r.sym} ${r.up || ''} ${r.rv || ''}`
      }));
    }
    if (cat === 'luna') {
      return (S.lunas || []).map((m, i) => ({
        id: `luna-${i}`,
        titulo: m.name,
        etiqueta: m.sym,
        subtitulo: 'Fase lunar',
        imagen: '',
        secciones: [['Significado', m.meaning], ['Ritual simbólico', m.ritual], ['Afirmación', m.affirmation]].filter(x => x[1]),
        busca: `${m.name} ${m.meaning || ''} ${m.ritual || ''}`
      }));
    }
    if (cat === 'suenos') {
      return Object.entries(S.suenos || {}).map(([clave, texto], i) => ({
        id: `sueno-${i}`,
        titulo: clave.charAt(0).toUpperCase() + clave.slice(1),
        etiqueta: '💭',
        subtitulo: 'Símbolo onírico',
        imagen: '',
        secciones: [['Qué suele señalar', texto]],
        busca: `${clave} ${texto}`
      }));
    }
    if (cat === 'grabovoi') {
      if (!grabovoi) return null;                  // aún cargando
      return grabovoi.map((g, i) => ({
        id: `grab-${i}`,
        titulo: g.nombre || g.titulo || g.categoria || 'Secuencia',
        etiqueta: g.codigo || (Array.isArray(g.codigos) ? g.codigos[0] : ''),
        subtitulo: g.categoria || 'Secuencia numérica',
        imagen: '',
        secciones: [
          ['Código', g.codigo || (Array.isArray(g.codigos) ? g.codigos.join(' · ') : '')],
          ['Descripción', g.descripcion || '']
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
      cuerpo.innerHTML = `<p class="om-grim-cuenta">Abriendo el volumen de secuencias…</p>`;
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
             <h3>Todavía no has marcado ningún conocimiento como favorito.</h3>
             <p>Toca la estrella de cualquier ficha para tenerla siempre a mano.</p></div>`
        : `<div class="om-vacio"><span aria-hidden="true">🔍</span>
             <h3>Nada coincide con esa búsqueda.</h3>
             <p>Prueba con el nombre de una carta, una runa o un símbolo.</p></div>`;
      return;
    }

    cuerpo.innerHTML = `
      <p class="om-grim-cuenta">${vista.length} ficha${vista.length > 1 ? 's' : ''}${soloFavoritos ? ' favorita' + (vista.length > 1 ? 's' : '') : ''}</p>
      <div class="om-bib-rejilla">
        ${vista.map(e => `
          <button class="om-bib-ficha" data-bib="abrir" data-id="${esc(e.id)}" type="button">
            ${e.imagen
              ? `<img src="${esc(e.imagen.replace('img/deck/', 'img/deck/thumb/').replace('img/runes/', 'img/runes/thumb/'))}" alt="" loading="lazy" decoding="async">`
              : `<span class="om-bib-simbolo" aria-hidden="true">${esc(e.etiqueta || '✦')}</span>`}
            <strong>${esc(e.titulo)}</strong>
            <small>${esc(e.subtitulo || '')}</small>
            ${fav.has(e.id) ? '<i class="om-bib-estrella" aria-label="Favorita">★</i>' : ''}
          </button>`).join('')}
      </div>`;
  }

  function pintarDetalle(e) {
    const fav = leerFav();
    const esFav = fav.has(e.id);
    return `
      <article class="om-bib-detalle">
        <button class="om-bib-volver" data-bib="volver" type="button">‹ Volver</button>
        ${e.imagen ? `<img class="om-bib-lamina" src="${esc(e.imagen)}" alt="${esc(e.titulo)}" loading="lazy">`
                   : `<div class="om-bib-simbolo-grande" aria-hidden="true">${esc(e.etiqueta || '✦')}</div>`}
        ${e.etiqueta && e.imagen ? `<p class="om-bib-etiqueta">${esc(e.etiqueta)}</p>` : ''}
        <h3>${esc(e.titulo)}</h3>
        ${e.subtitulo ? `<p class="om-bib-sub">${esc(e.subtitulo)}</p>` : ''}
        ${e.secciones.map(([t, c]) => `<section class="om-bib-seccion"><h4>${esc(t)}</h4><p>${esc(c)}</p></section>`).join('')}
        <button class="om-btn ${esFav ? 'om-btn-primary' : 'om-btn-quiet'}" data-bib="favorito" data-id="${esc(e.id)}" type="button" aria-pressed="${esFav}">
          ${esFav ? '★ En tus favoritos' : '☆ Guardar en favoritos'}
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
          <h2 id="omBibTitulo">Biblioteca Mística</h2>
          <button class="om-sheet-close" data-bib="cerrar" type="button" aria-label="Cerrar">✕</button>
        </header>
        <div class="om-bib-cats" role="tablist">
          ${CATEGORIAS.map(c => `<button class="om-bib-cat${categoria === c.id ? ' activo' : ''}" data-bib="categoria" data-valor="${c.id}" role="tab" aria-selected="${categoria === c.id}" type="button"><span aria-hidden="true">${c.icono}</span>${c.nombre}</button>`).join('')}
        </div>
        <div class="om-grim-buscar">
          <label class="sr-only" for="omBibBuscar">Buscar en la Biblioteca</label>
          <input id="omBibBuscar" class="om-ritual-input" type="search" placeholder="Buscar carta, runa, símbolo…" value="${esc(consulta)}">
          <button class="om-grim-chip${soloFavoritos ? ' activo' : ''}" data-bib="favoritos" type="button" aria-pressed="${soloFavoritos}">★ Favoritos</button>
        </div>
        <div class="om-sheet-body om-grim-body" id="omBibBody"></div>
      </div>`;
    raiz.hidden = false;
    requestAnimationFrame(() => raiz.classList.add('om-sheet-open'));
    document.body.classList.add('om-sheet-lock');
    if (categoria === 'grabovoi') cargarGrabovoi();
    pintar();
    const b = $('#omBibBuscar');
    if (b) b.addEventListener('input', () => { consulta = b.value.trim(); abierto = null; pintar(); });
  }

  function cerrar() {
    const raiz = $('#omBiblioteca');
    if (!raiz) return;
    raiz.classList.remove('om-sheet-open');
    document.body.classList.remove('om-sheet-lock');
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
