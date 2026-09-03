/* ============================================================
   Auditor de la interfaz de Oráculo Místico
   ============================================================

   Comprueba tres cosas que se rompen sin que nadie se entere,
   porque solo se ven en combinaciones concretas de ajustes:

     1. Contraste del texto en las 24 combinaciones de tema,
        modo claro/oscuro y alto contraste.
     2. Que el ajuste de tamaño de texto agrande de verdad.
     3. Que nada desborde ni se pise al agrandar.

   Se ejecuta sobre la pantalla que tengas delante, así que
   conviene pasarlo por varias: portada, Santuario, una lectura
   abierta y los ajustes.

   Cómo se usa, en la consola del navegador con la app abierta:

       const s = await fetch('tools/auditar.js').then(r => r.text());
       new Function(s)();
       await auditarOraculo();

   Devuelve un objeto con el detalle y además imprime un resumen.
   No deja nada cambiado: guarda el tema, el modo, el alto
   contraste y el tamaño de texto, y los restituye al terminar.

   ------------------------------------------------------------
   POR QUÉ ESTÁ ESCRITO ASÍ

   Tres cosas hacen que un auditor de contraste mienta, y las
   tres me han dado falsos positivos hasta que las trate aparte:

   - Las transiciones de color. Al cambiar de modo, un elemento
     que ya existía conserva su color anterior mientras dura la
     transición. Si mides en ese momento, todo parece ilegible.
     Por eso lo primero que se hace es apagar transiciones y
     animaciones.

   - Los fondos con degradado. getComputedStyle da el color de
     fondo, no la imagen, así que un botón dorado con tinta
     oscura tiene backgroundColor transparente. Al principio los
     apartaba, y así el auditor se callaba justo donde hacía
     falta: la barra inferior tiene fondo degradado, y con ella
     apartada no detectaba que sus etiquetas salían blancas
     sobre blanco. Ahora se estima el color promediando las
     paradas del degradado, y el hallazgo se marca como
     estimado.

   - Las transparencias. Un texto claro al 68 % sobre fondo
     oscuro se lee de sobra, pero si tomas su color sin componer
     el alfa parece que no. Todo se compone antes de medir.
   ============================================================ */

(function () {
  'use strict';

  const TEMAS = ['theme-gold', 'theme-violet', 'theme-forest', 'theme-blue', 'theme-classic', 'theme-light'];
  const MODOS = ['light', 'dark'];
  const ESCALAS = ['100', '112', '125', '140'];

  /* Fondo de la página en cada modo, para cerrar la composición
     cuando ningún ancestro tiene un color opaco. */
  const BASE = {
    light: { r: 247, g: 242, b: 234, a: 1 },
    dark: { r: 12, g: 10, b: 24, a: 1 },
  };

  const ILEGIBLE = 3.0;      // por debajo de esto no se ve
  const AA = 4.5;            // el mínimo de la norma para texto normal

  function color(txt) {
    if (!txt) return null;
    /* Los navegadores modernos devuelven algunos colores como
       color(srgb 0.55 0.4 1 / 0.14), con los canales de 0 a 1 en vez
       de 0 a 255. Si no se distingue, un color claro se lee como casi
       negro y el informe sale al reves. */
    const esSrgb = /^color\(\s*srgb/i.test(txt);
    const m = txt.match(/[\d.]+/g);
    if (!m || m.length < 3) return null;
    const k = esSrgb ? 255 : 1;
    return { r: +m[0] * k, g: +m[1] * k, b: +m[2] * k, a: m.length > 3 ? +m[3] : 1 };
  }

  /* Un degradado no tiene color de fondo: getComputedStyle devuelve la
     imagen. Saltarselo era peor que estimarlo, porque las superficies
     mas importantes de la app llevan degradado y el auditor se callaba
     justo donde hacia falta que hablara. Aqui se promedian sus paradas
     de color, que para superficies planas como estas se acerca bastante
     a lo que se ve. */
  /* Antes esto promediaba todas las paradas de color de la imagen de
     fondo, viniera de donde viniera. Sale mal en dos casos muy comunes
     en esta app:

       - Un degradado lineal grande: el texto esta en un punto concreto,
         no en la media. En un panel de arriba claro a abajo crema, un
         rotulo de arriba se comparaba contra el punto medio.
       - Un degradado radial con parada "transparent": el promedio cuenta
         esa parada como un color mas y ensombrece el resultado, cuando
         en realidad a esa distancia del centro no aporta nada.

     Medido: en el chat en modo claro daba 3,94 y 4,4 donde la
     composicion hecha punto por punto da 5,34 y 6,29. Seis avisos de
     nada, y cada aviso falso resta credito a los verdaderos.

     Ahora los degradados lineales se evaluan en la posicion del texto y
     los radiales se ignoran, que es quedarse corto a proposito: un
     radial de esta app siempre es un tinte suave sobre el color solido
     que ya esta contado debajo. */
  function colorDeImagen(imagen, caja, px, py) {
    if (!imagen || imagen === 'none') return null;
    const i = imagen.indexOf('linear-gradient');
    if (i < 0) return null;
    const trozo = imagen.slice(i);
    const paradas = (trozo.match(/rgba?\([^)]*\)|color\(\s*srgb[^)]*\)/gi) || [])
      .map(color).filter(Boolean);
    if (!paradas.length) return null;
    if (paradas.length === 1) return paradas[0];

    /* Donde cae el texto sobre el eje del degradado, entre 0 y 1. Sin
       angulo, CSS reparte de arriba abajo. */
    let t = 0.5;
    if (caja && caja.width > 0 && caja.height > 0) {
      const grados = (trozo.match(/(-?[\d.]+)deg/) || [])[1];
      const rad = ((grados === undefined ? 180 : Number(grados)) - 90) * Math.PI / 180;
      const ux = Math.cos(rad), uy = Math.sin(rad);
      const largo = Math.abs(caja.width * ux) + Math.abs(caja.height * uy);
      const dx = px - (caja.x + caja.width / 2);
      const dy = py - (caja.y + caja.height / 2);
      t = Math.max(0, Math.min(1, 0.5 + (dx * ux + dy * uy) / (largo || 1)));
    }
    const k = Math.min(paradas.length - 2, Math.floor(t * (paradas.length - 1)));
    const f = t * (paradas.length - 1) - k;
    const A = paradas[k], B = paradas[k + 1];
    return {
      r: A.r + (B.r - A.r) * f,
      g: A.g + (B.g - A.g) * f,
      b: A.b + (B.b - A.b) * f,
      a: A.a + (B.a - A.a) * f,
    };
  }

  function componer(frente, fondo) {
    const a = frente.a;
    return {
      r: frente.r * a + fondo.r * (1 - a),
      g: frente.g * a + fondo.g * (1 - a),
      b: frente.b * a + fondo.b * (1 - a),
      a: 1,
    };
  }

  function luminancia(c) {
    const s = [c.r, c.g, c.b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
  }

  function razon(a, b) {
    const la = luminancia(a), lb = luminancia(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  function textoPropio(el) {
    return [...el.childNodes]
      .filter(n => n.nodeType === 3)
      .map(n => n.textContent.trim())
      .join(' ')
      .trim();
  }

  /* Recorrer el DOM entero en cada una de las 24 combinaciones cuesta
     mas de lo que parece: son 24 pasadas midiendo cajas y estilos de
     cada elemento. Como el arbol no cambia entre combinaciones, se
     recogen una sola vez los elementos con texto propio y visibles,
     junto con su cadena de ancestros, y despues cada pasada solo lee
     colores. */
  function recogerCandidatos() {
    const lista = [];
    document.querySelectorAll('body *').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') return;
      if (Number(cs.opacity) < 0.05) return;
      const txt = textoPropio(el);
      if (txt.length < 2) return;
      const caja = el.getBoundingClientRect();
      if (caja.width < 3 || caja.height < 3) return;
      const cadena = [];
      let n = el;
      while (n && n !== document.documentElement) { cadena.push(n); n = n.parentElement; }
      lista.push({ el, texto: txt.slice(0, 40), cadena });
    });
    return lista;
  }

  /* Sube por los ancestros componiendo colores de fondo hasta dar con
     uno opaco. Si por el camino hay un degradado, lo dice: ese elemento
     no se puede medir con este metodo. */
  function fondoDeCadena(cadena, base, punto) {
    const pila = [];
    let estimado = false;
    for (const n of cadena) {
      const cs = getComputedStyle(n);
      let opaco = false;
      const solido = color(cs.backgroundColor);
      if (solido && solido.a > 0.001) {
        pila.push(solido);
        if (solido.a >= 0.999) opaco = true;
      }
      /* La imagen se pinta por encima del color de fondo del mismo
         elemento, asi que entra despues en la pila. */
      const caja = n.getBoundingClientRect();
      const imagen = colorDeImagen(cs.backgroundImage, caja, punto.x, punto.y);
      if (imagen) {
        pila.push(imagen);
        estimado = true;
        if (imagen.a >= 0.999) opaco = true;
      }
      if (opaco) break;
    }
    let acc = base;
    for (let i = pila.length - 1; i >= 0; i--) acc = componer(pila[i], acc);
    return { fondo: acc, estimado };
  }

  function medirContraste(base, candidatos) {
    const fallos = [];
    const flojos = [];
    for (const c of candidatos) {
      const cs = getComputedStyle(c.el);
      const tinta = color(cs.color);
      /* Color transparente: es un emoji, que se pinta con su propio
         glifo de color y no con el color CSS. */
      if (!tinta || tinta.a < 0.05) continue;
      /* El degradado se evalua donde esta el texto, no en el centro
         del elemento que lo pinta ni en la media de sus paradas. */
      const caja = c.el.getBoundingClientRect();
      const punto = { x: caja.x + caja.width / 2, y: caja.y + caja.height / 2 };
      const { fondo, estimado } = fondoDeCadena(c.cadena, base, punto);
      const r = razon(componer(tinta, fondo), fondo);
      const ficha = { texto: c.texto, color: cs.color, razon: +r.toFixed(2), tam: cs.fontSize };
      /* Si el fondo se ha estimado a partir de un degradado, el numero
         es aproximado: se dice, para que quien lo lea sepa que ahi
         conviene mirarlo con los ojos antes de tocar nada. */
      if (estimado) ficha.fondoEstimado = true;
      /* Si por encima hay una ilustracion, el numero no vale: el fondo
         real es la lamina, y de eso getComputedStyle no sabe nada. Se
         marca para que quien lea el informe no salga a arreglar algo que
         no esta roto. */
      if (c.el.closest('.om-bib-ficha, .premium-real-card, .card-art, .draw-art')
          || c.el.parentElement?.querySelector?.('img')) ficha.sobreIlustracion = true;
      if (r < ILEGIBLE) fallos.push(ficha);
      else if (r < AA) flojos.push(ficha);
    }
    return { fallos, flojos };
  }

  /* Comparar scrollHeight con clientHeight no vale para saber si algo
     se recorta: da positivo por el redondeo de la altura de linea aunque
     el elemento tenga overflow visible, que por definicion no recorta
     nada. Lo que hay que mirar es el primer ancestro que si recorta, y si
     la caja del elemento se sale de la suya. */
  function seRecorta(el) {
    let n = el;
    while (n && n !== document.documentElement) {
      const ov = getComputedStyle(n).overflow;
      if (ov && ov !== 'visible') {
        const a = el.getBoundingClientRect();
        const b = n.getBoundingClientRect();
        return a.right > b.right + 1 || a.left < b.left - 1
            || a.bottom > b.bottom + 1 || a.top < b.top - 1;
      }
      n = n.parentElement;
    }
    return false;
  }

  /* El ajuste de tamaño de texto ya estuvo roto una vez: ponía
     font-size en body cuando la app dimensiona con rem, que se
     resuelve contra la raíz. Cambiaba el valor y no crecía ni una
     letra. Esto lo detecta comparando tamaños reales. */
  function medirEscala() {
    const muestra = ['main p', '.chip', '.om-altar-desc', '.premium-bottom-nav small', '.btn'];
    const previo = document.documentElement.getAttribute('data-text-scale');
    const tabla = {};
    ESCALAS.forEach(e => {
      if (e === '100') document.documentElement.removeAttribute('data-text-scale');
      else document.documentElement.setAttribute('data-text-scale', e);
      document.documentElement.getBoundingClientRect();
      const fila = {};
      muestra.forEach(sel => {
        const el = document.querySelector(sel);
        fila[sel] = el ? parseFloat(getComputedStyle(el).fontSize) : null;
      });
      fila.raiz = parseFloat(getComputedStyle(document.documentElement).fontSize);
      tabla[e] = fila;
    });
    if (previo) document.documentElement.setAttribute('data-text-scale', previo);
    else document.documentElement.removeAttribute('data-text-scale');

    /* Cada selector debería crecer de 100 a 140. Si alguno se queda
       igual, el ajuste no le llega. */
    const quietos = [];
    muestra.forEach(sel => {
      const a = tabla['100'][sel], b = tabla['140'][sel];
      if (a && b && b <= a + 0.4) quietos.push({ selector: sel, de: a, a: b });
    });
    return { tabla, quietos };
  }

  /* Un elemento flex se puede quedar por debajo de su contenido sin que
     nada avise. Pasa cuando lleva overflow: en cuanto un elemento flex
     tiene overflow, su min-height deja de valer "auto" y pasa a valer
     cero, así que el navegador lo encoge todo lo que haga falta para que
     entren sus hermanos.

     Esto lo escribo porque me pasó: en la Biblioteca la fila de
     categorías se quedó en 10 px de alto con botones de 40, y de ellos
     solo asomaba el borde de arriba. El auditor no lo vio, porque
     miraba desbordes hacia fuera y este era un encogimiento hacia
     dentro. Lo encontré a mano. Que no vuelva a hacer falta.

     Se deja fuera el recorte por número de líneas, que es una decisión
     de diseño y no un accidente, y lo que ya está oculto. */
  function medirAplastados() {
    const fuera = [];
    for (const el of document.querySelectorAll('body *')) {
      const padre = el.parentElement;
      if (!padre) continue;
      const cp = getComputedStyle(padre);
      if (!/flex/.test(cp.display) || !/column/.test(cp.flexDirection)) continue;

      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
      if (cs.webkitLineClamp && cs.webkitLineClamp !== 'none') continue;
      if (cs.flexShrink === '0') continue;

      const r = el.getBoundingClientRect();
      if (r.height <= 0) continue;
      /* Una lista larga con su propio scroll está encogida a propósito:
         para eso tiene scroll. Lo que delata al fallo es que el hueco se
         quede por debajo de lo que ocupa una sola fila de su contenido. */
      /* Cuanto se ve del contenido. Buscar "la altura de una fila" era
         fragil: en un contenedor cuyo contenido cuelga de un envoltorio,
         o cuyos hijos son dos bloques grandes, esa medida no significa
         nada y salian avisos de contenedores que funcionan bien.

         La proporcion separa los casos limpiamente. El fallo real de la
         Biblioteca dejaba 9,8 px de 48, un 20 %. Un cuerpo de modal con
         scroll normal enseña la mitad, y la ficha algo mas de un tercio.
         El corte en la cuarta parte deja fuera a los dos y sigue
         cogiendo el fallo. */
      /* El texto que solo leen los lectores de pantalla se colapsa a un
         pixel a proposito, con clip o clip-path. No esta aplastado: esta
         escondido, que es su trabajo. */
      if (cs.clipPath !== 'none' || (cs.clip && cs.clip !== 'auto')) continue;
      if (/sr-only|visually-hidden|screen-reader/.test(el.className || '')) continue;

      /* Una hoja cerrada detras de otra abierta declara alturas que no
         se ven, y salian avisos de paneles que ni estaban delante. Se
         miran los atributos que dicen si algo esta apagado, no la
         posicion en pantalla: las hojas se abren con una transicion y
         mientras dura -o si el navegador no la ejecuta- una hoja abierta
         todavia figura debajo del borde. */
      if (el.closest('[hidden], [aria-hidden="true"]')) continue;
      /* Una lista larga con scroll enseña una fracción pequeña de su
         contenido y eso es lo normal: la de las 78 cartas enseña el 5 %.
         Lo que delata al fallo es que lo aplastado sea algo *corto*, una
         barra de herramientas o una cabecera, que deberia caber entera.
         El caso real: una fila de 48 px reducida a 10.

         Asi que se pide contenido corto y ademas que se vea menos de la
         mitad. Con eso el cuerpo de un modal (948 px), la ficha (1.847) y
         la rejilla de cartas (11.000) quedan fuera, y la barra de
         categorias dentro. */
      const proporcionVisible = r.height / (el.scrollHeight || 1);
      if (el.scrollHeight >= 400) continue;
      if (proporcionVisible >= 0.6) continue;


      fuera.push({
        elemento: el.tagName + '.' + [...el.classList].slice(0, 2).join('.'),
        alto: Number(r.height.toFixed(1)),
        contenido: el.scrollHeight,
        seVe: Math.round(proporcionVisible * 100) + '%',
        dentroDe: padre.tagName + '.' + [...padre.classList].slice(0, 2).join('.'),
      });
    }
    return fuera.slice(0, 8);
  }

  /* Al agrandar, lo que se rompe es el espacio: la página desborda a
     lo ancho, o las etiquetas de la barra inferior se pisan, o se
     recortan. Se mide al ancho que tenga la ventana ahora. */
  function medirEspacio() {
    /* Sin un ancho de ventana real no hay nada que medir: todo parece
       desbordar. Pasa cuando la pagina corre en un panel oculto o en una
       pestana de fondo. Mas vale decir que no se puede que dar un informe
       falso, que es justo lo que hace inutil a una herramienta asi. */
    if (!(innerWidth > 200)) {
      return { noMedido: 'la ventana no tiene ancho util (' + innerWidth + ' px): ejecutalo con la pagina a la vista' };
    }
    const previo = document.documentElement.getAttribute('data-text-scale');
    const filas = {};
    ESCALAS.forEach(e => {
      if (e === '100') document.documentElement.removeAttribute('data-text-scale');
      else document.documentElement.setAttribute('data-text-scale', e);
      document.documentElement.getBoundingClientRect();

      const botones = [...document.querySelectorAll('.premium-bottom-nav button')];
      let choques = 0;
      for (let i = 0; i < botones.length - 1; i++) {
        const a = botones[i].querySelector('small');
        const b = botones[i + 1].querySelector('small');
        if (!a || !b) continue;
        if (a.getBoundingClientRect().right > b.getBoundingClientRect().left + 0.5) choques++;
      }
      const recortadas = botones
        .map(b => b.querySelector('small'))
        .filter(s => s && seRecorta(s))
        .map(s => s.textContent.trim());

      /* Pasar del borde derecho solo es un problema si no hay forma de
         llegar hasta ahí. Dentro de un carrusel horizontal es lo normal:
         en la Biblioteca las categorías no caben en 375 px y las últimas
         quedan fuera a propósito, se alcanzan pasando el dedo. Antes
         salían en el informe en las cuatro escalas, siempre, sin que
         pasara nada; y un aviso que sale siempre acaba ignorándose. */
      const dentroDeUnCarrusel = x => {
        let n = x.parentElement;
        while (n && n !== document.documentElement) {
          const ov = getComputedStyle(n).overflowX;
          if (ov === 'auto' || ov === 'scroll') return true;
          n = n.parentElement;
        }
        return false;
      };

      const desbordan = [...document.querySelectorAll('body *')].filter(x => {
        const cs = getComputedStyle(x);
        if (cs.visibility === 'hidden') return false;
        if (x.offsetParent === null && cs.position !== 'fixed') return false;
        /* Los decorados de fondo se salen a propósito. */
        if (/om-nebula|om-aura|om-glow|om-sky/.test(x.className || '')) return false;
        const r = x.getBoundingClientRect();
        if (!(r.width > 0 && r.right > innerWidth + 1)) return false;
        return !dentroDeUnCarrusel(x);
      }).map(x => x.tagName + '.' + [...x.classList].slice(0, 2).join('.'));

      filas[e] = {
        anchoPagina: document.documentElement.scrollWidth,
        desbordaPagina: document.documentElement.scrollWidth > innerWidth + 1,
        choquesEnLaBarra: choques,
        etiquetasRecortadas: recortadas,
        elementosQueSeSalen: [...new Set(desbordan)].slice(0, 6),
      };
    });
    if (previo) document.documentElement.setAttribute('data-text-scale', previo);
    else document.documentElement.removeAttribute('data-text-scale');
    return filas;
  }

  async function auditarOraculo() {
    /* Estado de partida, para devolverlo tal cual al terminar. */
    const guardado = {
      clases: document.body.className,
      modo: document.documentElement.getAttribute('data-appearance-mode'),
      escala: document.documentElement.getAttribute('data-text-scale'),
    };

    /* Sin transiciones no hay colores a medio camino. Es la
       diferencia entre un informe util y uno lleno de ruido. */
    const congelar = document.createElement('style');
    congelar.textContent = '*{transition:none!important;animation:none!important}';
    document.head.appendChild(congelar);
    await new Promise(r => setTimeout(r, 120));

    const candidatos = recogerCandidatos();

    const contraste = {};
    for (const modo of MODOS) {
      document.documentElement.setAttribute('data-appearance-mode', modo);
      for (const alto of [false, true]) {
        for (const tema of TEMAS) {
          document.body.className = document.body.className.replace(/theme-\w+/g, '').trim() + ' ' + tema;
          document.body.classList.toggle('high-contrast', alto);
          document.body.getBoundingClientRect();
          const r = medirContraste(BASE[modo], candidatos);
          if (r.fallos.length || r.flojos.length) {
            contraste[`${modo}${alto ? ' + alto contraste' : ''} · ${tema}`] = {
              ilegibles: r.fallos.length,
              flojos: r.flojos.length,
              /* Se enseñan ejemplos de los dos, porque si solo se
                 enseñaran los ilegibles una combinacion con solo flojos
                 aparecia en la lista sin nada que mirar. */
              ejemplos: r.fallos.slice(0, 4),
              ejemplosFlojos: r.flojos.slice(0, 3),
            };
          }
        }
      }
    }

    /* Se vuelve al estado inicial antes de medir tamaños, porque el
       espacio depende del tema. */
    document.body.className = guardado.clases;
    if (guardado.modo) document.documentElement.setAttribute('data-appearance-mode', guardado.modo);
    else document.documentElement.removeAttribute('data-appearance-mode');
    await new Promise(r => setTimeout(r, 80));

    const escala = medirEscala();
    const espacio = medirEspacio();
    const aplastados = medirAplastados();

    congelar.remove();
    if (guardado.escala) document.documentElement.setAttribute('data-text-scale', guardado.escala);
    else document.documentElement.removeAttribute('data-text-scale');

    const informe = {
      anchoVentana: innerWidth,
      contraste: {
        /* Ilegible y flojo no son lo mismo y no deben contarse juntos:
           uno es texto que no se ve y el otro texto que se lee pero no
           llega al minimo de la norma. Mezclarlos hace que un informe
           con doce avisos parezca una emergencia cuando no lo es. */
        combinacionesConTextoIlegible: Object.values(contraste).filter(v => v.ilegibles > 0).length,
        combinacionesPorDebajoDeLaNorma: Object.values(contraste).filter(v => !v.ilegibles && v.flojos > 0).length,
        deUnTotalDe: MODOS.length * 2 * TEMAS.length,
        detalle: contraste,
      },
      tamanoDeTexto: escala,
      espacio,
      aplastados,
    };

    /* Resumen legible, que es lo que se mira primero. */
    const lineas = [];
    lineas.push('Auditoría a ' + innerWidth + ' px de ancho');
    lineas.push('  ilegible  : ' + informe.contraste.combinacionesConTextoIlegible + ' de ' +
      informe.contraste.deUnTotalDe + ' combinaciones con texto que no se ve');
    lineas.push('  flojo     : ' + informe.contraste.combinacionesPorDebajoDeLaNorma +
      ' combinaciones con texto legible pero por debajo de 4,5');
    lineas.push('  aplastado : ' + (aplastados.length
      ? aplastados.length + ' elementos encogidos por debajo de su contenido'
      : 'ninguno'));
    lineas.push('  tamaño    : ' + (escala.quietos.length
      ? escala.quietos.length + ' selectores no crecen con el ajuste'
      : 'todos los selectores de muestra crecen'));
    if (espacio.noMedido) {
      lineas.push('  espacio   : sin medir, ' + espacio.noMedido);
    } else {
      const conEspacio = Object.entries(espacio).filter(([, v]) =>
        v.desbordaPagina || v.choquesEnLaBarra || v.etiquetasRecortadas.length);
      lineas.push('  espacio   : ' + (conEspacio.length
        ? conEspacio.map(([k]) => k + '%').join(', ') + ' con desbordes o solapes'
        : 'sin desbordes ni solapes en los cuatro pasos'));
    }
    console.log(lineas.join('\n'));

    return informe;
  }

  window.auditarOraculo = auditarOraculo;
  console.log('Auditor cargado. Ejecuta: await auditarOraculo()');
})();
