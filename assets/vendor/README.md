# Componentes de terceros

Todo lo que la aplicación empaqueta de fuera, con su licencia y dónde
vive el texto que hay que distribuir con él.

| Componente | Versión | Licencia | Texto de la licencia |
|---|---|---|---|
| [Astronomy Engine](https://github.com/cosinekitty/astronomy) | 2.1.19 | MIT | `astronomy-engine/2.1.19/LICENSE` y dentro del propio `.js` |
| [jsPDF](https://github.com/parallax/jsPDF) | 2.5.1 | MIT | en la cabecera `@license` del propio `.js` |
| [Fraunces](https://github.com/undercasetype/Fraunces) | subconjunto de la variable | SIL OFL 1.1 | `fonts/OFL.txt` |

Las tres son permisivas: se pueden usar, modificar y redistribuir, en
aplicaciones gratuitas o de pago, sin obligación de abrir el código
propio. La única condición es la de arriba: que el aviso viaje con el
software. Por eso los textos están en el precache del service worker,
igual que los archivos que cubren.

## Notas

**Fraunces** se distribuye subdividida en dos archivos, latin y
latin-ext, para no descargar glifos que no se usan. Subdividir es una
Modified Version a efectos de la OFL, pero Fraunces **no declara
Reserved Font Name** —su línea de copyright no lleva esa cláusula—, así
que la condición 3 de la OFL no aplica y el nombre de familia se puede
conservar. Los `woff2` mantienen dentro su aviso de copyright y la URL
de la licencia; se comprobó leyéndolos con fontTools.

Para el manual en PDF se generan además tres cortes estáticos de la
fuente variable, con nombres internos propios. Eso ocurre en
`docs/generar_manual.py`, en tiempo de compilación, y no se publica: la
fuente acaba incrustada en el PDF, que es un uso previsto por la OFL.

**Swiss Ephemeris no se usa.** Se valoró y se descartó: es de licencia
dual, y la opción gratuita es la AGPL, que obligaría a poner *todo* el
proyecto bajo AGPL, incluida cualquier parte que no sea nuestra. La
alternativa es su licencia profesional, de pago único. Astronomy Engine
cubre con MIT lo que la app necesita hoy.

Si algún día hicieran falta Quirón, Lilith o asteroides —que Astronomy
Engine no calcula—, conviene saber que las casas y el nodo lunar medio
son geometría y fórmula clásica, sin problema de licencia, y que para
los asteroides existe la opción de una tabla precalculada a partir de
datos de JPL Horizons, que son de dominio público.
