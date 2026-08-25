/* ============================================================
   ORÁCULO MÍSTICO · MI GRIMORIO
   Fase 6. Reúne en un solo sitio lo que estaba repartido entre
   varios almacenes de versiones anteriores.

   REGLA DE ORO: aquí no se borra nada.
   Se lee de todos los almacenes; se escribe solo en el diario
   canónico (oraculo.diary.v2), que es el que el motor ya usaba.
   Los almacenes antiguos se leen tal cual y se dejan intactos,
   porque contienen lecturas reales de quien ya usa la app.
   ============================================================ */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);

  /* Almacenes conocidos. Solo DIARIO se escribe. */
  const DIARIO = 'oraculo.diary.v2';
  const FUENTES = [
    { clave: 'oraculo.diary.v2',                    origen: 'diario' },
    { clave: 'oraculo.diary',                       origen: 'diario antiguo' },
    { clave: 'oraculo.nativeTarotEngine.v12.vault', origen: 'motor' },
    { clave: 'oraculo.dailyJournal.v1',             origen: 'mensaje del día' }
  ];

  const leer = (k, x = []) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : x; } catch { return x; } };
  const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const esc = (v = '') => String(v)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const FECHA = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const HORA  = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });

  /* ---------- Normalización ----------
     Cada almacén guarda con su propia forma. Se traducen todas a
     una entrada común sin tocar el original. */
  function normalizar(item, origen, indice) {
    if (!item || typeof item !== 'object') return null;
    const fecha = item.date || item.createdAt || item.fecha || null;
    const cartas = Array.isArray(item.cards) ? item.cards.map(c => c?.name).filter(Boolean)
                 : Array.isArray(item.items) ? item.items.map(c => (typeof c === 'string' ? c : c?.name)).filter(Boolean)
                 : [];
    return {
      id: item.id || `${origen}-${indice}`,
      origen,
      editable: origen === 'diario',
      tipo: item.type || item.tipo || 'Lectura',
      titulo: item.title || item.type || 'Lectura guardada',
      texto: item.text || item.texto || (cartas.length ? cartas.join(' · ') : ''),
      nota: item.note || '',
      favorito: !!item.favorite,
      fecha,
      marca: fecha ? new Date(fecha).getTime() : 0,
      cartas
    };
  }

  function todasLasEntradas() {
    const salida = [];
    FUENTES.forEach(({ clave, origen }) => {
      const bruto = leer(clave, []);
      if (!Array.isArray(bruto)) return;
      bruto.forEach((it, i) => { const n = normalizar(it, origen, i); if (n) salida.push(n); });
    });
    /* El diario antiguo pudo migrarse al nuevo: se descartan repetidos
       por id, quedándose con la entrada del diario canónico. */
    const vistos = new Map();
    salida.forEach(e => { if (!vistos.has(e.id) || e.origen === 'diario') vistos.set(e.id, e); });
    return [...vistos.values()].sort((a, b) => b.marca - a.marca);
  }

  /* ---------- Mi Viaje ---------- */
  function estadisticas(entradas) {
    const cuenta = (lista) => {
      const m = new Map();
      lista.forEach(v => m.set(v, (m.get(v) || 0) + 1));
      return [...m.entries()].sort((a, b) => b[1] - a[1])[0] || null;
    };
    const cartas = entradas.flatMap(e => e.cartas);
    const tipos  = entradas.map(e => e.tipo).filter(Boolean);
    const mayores = cartas.filter(c => !/ de /.test(c));
    return {
      total: entradas.length,
      favoritas: entradas.filter(e => e.favorito).length,
      cartaMasRepetida: cuenta(cartas),
      arcanoDominante: cuenta(mayores),
      tipoMasFrecuente: cuenta(tipos)
    };
  }

  function calendario(entradas, base = new Date()) {
    const ano = base.getFullYear(), mes = base.getMonth();
    const primero = new Date(ano, mes, 1);
    const dias = new Date(ano, mes + 1, 0).getDate();
    const hueco = (primero.getDay() + 6) % 7;         // semana que empieza en lunes
    const porDia = new Map();
    entradas.forEach(e => {
      if (!e.marca) return;
      const d = new Date(e.marca);
      if (d.getFullYear() === ano && d.getMonth() === mes) {
        const k = d.getDate();
        porDia.set(k, (porDia.get(k) || 0) + 1);
      }
    });
    const hoy = new Date();
    const esteMes = hoy.getFullYear() === ano && hoy.getMonth() === mes;
    return { ano, mes, dias, hueco, porDia, hoy: esteMes ? hoy.getDate() : -1 };
  }

  /* ---------- Pintado ---------- */
  let filtro = 'todas', consulta = '', pestana = 'lecturas';

  function pintar() {
    const raiz = $('#omGrimorio');
    if (!raiz) return;
    const todas = todasLasEntradas();

    let lista = todas;
    if (filtro === 'favoritas') lista = lista.filter(e => e.favorito);
    else if (filtro !== 'todas') lista = lista.filter(e => e.tipo.toLowerCase().includes(filtro.toLowerCase()));
    if (consulta) {
      const q = consulta.toLowerCase();
      lista = lista.filter(e => `${e.titulo} ${e.tipo} ${e.texto} ${e.nota} ${e.cartas.join(' ')}`.toLowerCase().includes(q));
    }

    const tipos = ['todas', 'favoritas', ...new Set(todas.map(e => e.tipo))].slice(0, 9);
    const cuerpo = raiz.querySelector('.om-grim-body');
    if (!cuerpo) return;

    cuerpo.innerHTML = pestana === 'viaje'
      ? pintarViaje(todas)
      : pintarLecturas(lista, todas.length, tipos);
  }

  function pintarLecturas(lista, total, tipos) {
    if (!total) {
      return `<div class="om-vacio">
          <span aria-hidden="true">📖</span>
          <h3>Tu Grimorio todavía está esperando su primera historia.</h3>
          <p>Cada lectura que guardes quedará aquí, con su fecha y lo que preguntaste.</p>
          <button class="om-btn om-btn-primary" data-grim="primera-lectura" type="button">Hacer mi primera lectura</button>
        </div>`;
    }
    const chips = tipos.map(t => `<button class="om-grim-chip${filtro === t ? ' activo' : ''}" data-grim="filtro" data-valor="${esc(t)}" type="button">${esc(t[0].toUpperCase() + t.slice(1))}</button>`).join('');
    const items = lista.map(e => {
      const f = e.marca ? `${FECHA.format(new Date(e.marca))} · ${HORA.format(new Date(e.marca))}` : 'Sin fecha';
      return `<article class="om-grim-item${e.favorito ? ' favorita' : ''}">
        <header>
          <span class="om-grim-tipo">${esc(e.tipo)}</span>
          <time>${esc(f)}</time>
        </header>
        <h3>${esc(e.titulo)}</h3>
        ${e.cartas.length ? `<p class="om-grim-cartas">${e.cartas.slice(0, 6).map(c => `<em>${esc(c)}</em>`).join('')}</p>` : ''}
        <p class="om-grim-texto">${esc(String(e.texto).replace(/\s+/g, ' ').slice(0, 190))}${String(e.texto).length > 190 ? '…' : ''}</p>
        ${e.nota ? `<p class="om-grim-nota">${esc(e.nota)}</p>` : ''}
        <footer>
          ${e.editable
            ? `<button class="om-grim-accion" data-grim="favorito" data-id="${esc(e.id)}" type="button" aria-pressed="${e.favorito}">${e.favorito ? '★ Favorita' : '☆ Favorita'}</button>
               <button class="om-grim-accion om-grim-borrar" data-grim="borrar" data-id="${esc(e.id)}" type="button">Eliminar</button>`
            : `<span class="om-grim-origen">de ${esc(e.origen)}</span>`}
        </footer>
      </article>`;
    }).join('');

    return `<div class="om-grim-filtros">${chips}</div>
      <p class="om-grim-cuenta">${lista.length} de ${total} entrada${total > 1 ? 's' : ''}</p>
      <div class="om-grim-lista">${items || '<p class="om-grim-cuenta">Nada coincide con esa búsqueda.</p>'}</div>`;
  }

  function pintarViaje(todas) {
    const s = estadisticas(todas);
    if (!s.total) {
      return `<div class="om-vacio"><span aria-hidden="true">🗺️</span>
        <h3>Tu viaje empieza con la primera lectura.</h3>
        <p>Aquí verás en qué días consultaste y qué símbolos vuelven.</p></div>`;
    }
    const c = calendario(todas);
    const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(c.ano, c.mes, 1));
    const celdas = [
      ...Array.from({ length: c.hueco }, () => '<i class="om-cal-hueco"></i>'),
      ...Array.from({ length: c.dias }, (_, i) => {
        const d = i + 1, n = c.porDia.get(d) || 0;
        return `<i class="om-cal-dia${n ? ' con' : ''}${d === c.hoy ? ' hoy' : ''}"${n ? ` title="${n} lectura${n > 1 ? 's' : ''}"` : ''}>
                  <b>${d}</b>${n ? `<u aria-label="${n} lecturas"></u>` : ''}</i>`;
      })
    ].join('');

    const tarjeta = (etiqueta, dato) => dato
      ? `<div class="om-viaje-dato"><span>${esc(etiqueta)}</span><b>${esc(dato[0])}</b><small>${dato[1]} ${dato[1] > 1 ? 'veces' : 'vez'}</small></div>`
      : '';

    return `<div class="om-viaje">
        <p class="om-grim-cuenta">${nombreMes[0].toUpperCase() + nombreMes.slice(1)}</p>
        <div class="om-cal-semana" aria-hidden="true"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
        <div class="om-cal">${celdas}</div>
        <div class="om-viaje-datos">
          <div class="om-viaje-dato"><span>Lecturas guardadas</span><b>${s.total}</b><small>${s.favoritas} favorita${s.favoritas === 1 ? '' : 's'}</small></div>
          ${tarjeta('Carta más repetida', s.cartaMasRepetida)}
          ${tarjeta('Arcano dominante', s.arcanoDominante)}
          ${tarjeta('Consulta más frecuente', s.tipoMasFrecuente)}
        </div>
        <p class="om-grim-pie">Son patrones de tu propio uso, no predicciones.</p>
      </div>`;
  }

  /* ---------- Abrir ---------- */
  function abrir() {
    let raiz = $('#omGrimorio');
    if (!raiz) {
      raiz = document.createElement('div');
      raiz.id = 'omGrimorio';
      raiz.className = 'om-sheet om-grimorio';
      document.body.appendChild(raiz);
    }
    raiz.innerHTML = `
      <div class="om-sheet-backdrop" data-grim="cerrar"></div>
      <div class="om-sheet-panel om-grim-panel" role="dialog" aria-modal="true" aria-labelledby="omGrimTitulo">
        <header class="om-sheet-head">
          <h2 id="omGrimTitulo">Mi Grimorio</h2>
          <button class="om-sheet-close" data-grim="cerrar" type="button" aria-label="Cerrar">✕</button>
        </header>
        <div class="om-grim-tabs" role="tablist">
          <button class="om-grim-tab${pestana === 'lecturas' ? ' activo' : ''}" data-grim="pestana" data-valor="lecturas" role="tab" aria-selected="${pestana === 'lecturas'}" type="button">Mis lecturas</button>
          <button class="om-grim-tab${pestana === 'viaje' ? ' activo' : ''}" data-grim="pestana" data-valor="viaje" role="tab" aria-selected="${pestana === 'viaje'}" type="button">Mi Viaje</button>
        </div>
        <div class="om-grim-buscar">
          <label class="sr-only" for="omGrimBuscar">Buscar en el Grimorio</label>
          <input id="omGrimBuscar" class="om-ritual-input" type="search" placeholder="Buscar por carta, tipo o palabra…" value="${esc(consulta)}">
        </div>
        <div class="om-sheet-body om-grim-body"></div>
        <footer class="om-grim-pie-acciones">
          <button class="om-btn om-btn-quiet" data-grim="exportar" type="button">Exportar copia</button>
          <button class="om-btn om-btn-quiet" data-grim="importar" type="button">Importar copia</button>
          <input id="omGrimArchivo" type="file" accept="application/json" hidden>
        </footer>
      </div>`;
    raiz.hidden = false;
    requestAnimationFrame(() => raiz.classList.add('om-sheet-open'));
    document.body.classList.add('om-sheet-lock');
    pintar();
    const buscar = $('#omGrimBuscar');
    if (buscar) buscar.addEventListener('input', () => { consulta = buscar.value.trim(); pintar(); });
  }

  function cerrar() {
    const raiz = $('#omGrimorio');
    if (!raiz) return;
    raiz.classList.remove('om-sheet-open');
    document.body.classList.remove('om-sheet-lock');
    setTimeout(() => { raiz.hidden = true; }, 240);
  }

  /* ---------- Acciones sobre el diario canónico ---------- */
  function alternarFavorito(id) {
    const diario = leer(DIARIO, []);
    const i = diario.findIndex(d => d.id === id);
    if (i < 0) return;
    diario[i].favorite = !diario[i].favorite;
    escribir(DIARIO, diario);
    pintar();
  }

  function borrar(id) {
    const diario = leer(DIARIO, []);
    const entrada = diario.find(d => d.id === id);
    if (!entrada) return;
    if (!confirm(`¿Eliminar «${entrada.title || 'esta lectura'}» del Grimorio?\n\nNo se puede deshacer.`)) return;
    escribir(DIARIO, diario.filter(d => d.id !== id));
    pintar();
  }

  /* ---------- Copia de seguridad ----------
     Exporta todos los almacenes tal cual. La importación es
     ADITIVA: fusiona por id y nunca sustituye lo que ya hay. */
  function exportar() {
    const copia = { app: 'Oraculo Mistico', version: 2, exportado: new Date().toISOString(), almacenes: {} };
    FUENTES.forEach(({ clave }) => { const v = leer(clave, null); if (v) copia.almacenes[clave] = v; });
    const blob = new Blob([JSON.stringify(copia, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grimorio-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function importar(archivo) {
    const lector = new FileReader();
    lector.onload = () => {
      let datos;
      try { datos = JSON.parse(lector.result); }
      catch { return alert('Ese archivo no parece una copia del Grimorio.'); }
      const almacenes = datos?.almacenes;
      if (!almacenes || typeof almacenes !== 'object') return alert('La copia no contiene datos reconocibles.');

      let anadidas = 0;
      Object.entries(almacenes).forEach(([clave, entrante]) => {
        if (!Array.isArray(entrante)) return;
        const actual = leer(clave, []);
        if (!Array.isArray(actual)) return;
        const ids = new Set(actual.map(d => d?.id).filter(Boolean));
        const nuevas = entrante.filter(d => d?.id && !ids.has(d.id));
        if (nuevas.length) { escribir(clave, [...nuevas, ...actual]); anadidas += nuevas.length; }
      });
      pintar();
      alert(anadidas
        ? `Se han añadido ${anadidas} entrada${anadidas > 1 ? 's' : ''}. No se ha sustituido nada de lo que ya tenías.`
        : 'La copia no traía entradas nuevas: tu Grimorio ya las tenía todas.');
    };
    lector.readAsText(archivo);
  }

  /* ---------- Enlazado ---------- */
  document.addEventListener('click', (ev) => {
    const t = ev.target?.closest?.('[data-grim]');
    if (t) {
      const q = t.dataset.grim;
      ev.preventDefault();
      if (q === 'cerrar') return cerrar();
      if (q === 'pestana') { pestana = t.dataset.valor; abrir(); return; }
      if (q === 'filtro') { filtro = t.dataset.valor; pintar(); return; }
      if (q === 'favorito') return alternarFavorito(t.dataset.id);
      if (q === 'borrar') return borrar(t.dataset.id);
      if (q === 'exportar') return exportar();
      if (q === 'importar') { $('#omGrimArchivo')?.click(); return; }
      if (q === 'primera-lectura') { cerrar(); setTimeout(() => document.querySelector('.om-altar[data-module="tarot"]')?.click(), 260); return; }
      return;
    }
    /* La barra inferior y el altar abren el Grimorio nuevo. */
    const puerta = ev.target?.closest?.('[data-om-grimorio]');
    if (puerta) { ev.preventDefault(); abrir(); }
  });

  document.addEventListener('change', (ev) => {
    if (ev.target?.id !== 'omGrimArchivo') return;
    const f = ev.target.files?.[0];
    if (f) importar(f);
    ev.target.value = '';
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !$('#omGrimorio')?.hidden) cerrar();
  });
})();
