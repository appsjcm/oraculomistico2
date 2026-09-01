# Herramientas

Utilidades de mantenimiento. No forman parte de la aplicación: no se
cargan desde `index.html` ni entran en el precache del service worker.

## `auditar.js`

Comprueba tres cosas que se rompen sin que nadie se entere, porque solo
aparecen en combinaciones concretas de ajustes:

1. **Contraste** del texto en las 24 combinaciones de tema (6), modo
   claro u oscuro (2) y alto contraste (2).
2. **Tamaño de texto**: que el ajuste agrande de verdad. Ya estuvo roto
   una vez, poniendo `font-size` en `body` cuando la app dimensiona con
   `rem`, que se resuelve contra la raíz: cambiaba el valor y no crecía
   ni una letra.
3. **Espacio**: que al agrandar nada desborde a lo ancho, ni se pisen o
   se recorten las etiquetas de la barra inferior.

### Cómo se usa

Con la app abierta en el navegador, en la consola:

```js
const s = await fetch('tools/auditar.js').then(r => r.text());
new Function(s)();
await auditarOraculo();
```

Imprime un resumen y devuelve el detalle. No deja nada cambiado: guarda
tema, modo, alto contraste y tamaño de texto, y los restituye al salir.

Mide **la pantalla que tengas delante**, así que conviene pasarlo por
varias: portada, Santuario, una lectura abierta y los ajustes. Y por
varios anchos de ventana, porque el espacio depende del ancho: 320, 390
y uno de escritorio cubren los casos que dan problemas.

### Qué encontró cuando se escribió

Los tres fallos que motivaron la herramienta, todos de larga data y
ninguno visible sin buscarlo a propósito:

- **Alto contraste dejaba el texto invisible en modo claro.** El ajuste
  se escribió cuando la app era solo oscura y ponía `--muted` en blanco
  sin mirar el modo: 1,1 sobre 1.
- **El tema Claro con modo Noche** dejaba quince textos por debajo de
  3 sobre 1, con el título en 1,14.
- **Las etiquetas de la barra inferior no crecían** con el ajuste de
  tamaño: de 100 % a 140 % el texto de la app subía un 40 % y ellas un
  9 %.

Se comprobó que la herramienta los detecta reintroduciéndolos uno a uno.
Un auditor que solo sabe decir «todo bien» no sirve de nada.

### Límites conocidos

- Los fondos con degradado se **estiman** promediando sus paradas de
  color, porque `getComputedStyle` da el color de fondo pero no la
  imagen. Los hallazgos sobre esos fondos se marcan con
  `fondoEstimado: true`: el número es aproximado y conviene mirarlo con
  los ojos antes de tocar nada.
- **No mide texto sobre imágenes.** Si el fondo es una fotografía —una
  `<img>` detrás, o un `background-image: url(...)`— no hay forma de
  saber su color desde `getComputedStyle`, así que el auditor lo compone
  contra el fondo de la página y da un fallo que no existe.

  Caso conocido: con el panel avanzado desplegado, las etiquetas sobre
  la ilustración de las cartas (`Mayores`, `Arcano Mayor`, …) salen en
  torno a 1,3 en modo claro. **Son correctas**: texto claro sobre una
  ilustración oscura. Hay una regla explícita en
  `visual-performance-polish.css` que las mantiene claras a propósito.

  Se probó a excluirlas automáticamente detectando `url()` en la cadena
  de ancestros y salió peor: excluía 265 elementos de golpe, silenciando
  hallazgos reales. Vale más una excepción documentada que una
  herramienta que se calla.
- El umbral de "ilegible" está en 3 sobre 1 y el de la norma para texto
  normal en 4,5.

## `optimize_glb_blender.py` y `../scripts/reducir_modelos.py`

Reducen la geometría de los modelos 3D conservando texturas. Los dos
avatares llegaron con 1.913.000 triángulos y 54 MB cada uno, de los que
solo 0,8 MB eran texturas.
