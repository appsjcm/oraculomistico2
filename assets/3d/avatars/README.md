# Oraculo 3D avatar assets

Estos dos GLB quedan como referencia/reserva visual:

- `oracle-female-portrait.glb` - 5.27 MB
- `oracle-male-portrait.glb` - 5.04 MB

Auditoria GLB:

- 1 escena, 1 nodo, 1 malla y 3 texturas por modelo.
- 120.000 triangulos por modelo.
- Sin esqueletos.
- Sin animaciones.
- Sin morph targets faciales.
- Sin nodos separados de mandibula, labios, ojos o cejas.

Por esa estructura, la boca no puede animarse de forma anatomica dentro del
modelo actual sin que parezca una deformacion artificial. Desde la version 167,
el avatar que habla se genera dentro de Three.js con piezas separadas para
boca, labios, ojos, parpados, cejas, cabeza y cuerpo. Asi hay movimiento de
boca y gesticulacion sin sumar megas ni depender de un GLB preparado.

Si en el futuro se suben GLB con morph targets tipo `jawOpen`, `mouthOpen` o
`viseme_*`, el motor sigue preparado para usarlos automaticamente.

Los avatares no estan en el precache inicial de la PWA. Se cargan solo bajo
demanda en el modo de avatar 3D experimental y se guardan en cache dinamica
tras abrirse una vez con conexion.

## Reduccion de geometria

Los dos GLB llegaron con 1.913.000 triangulos y 54 MB cada uno, de los que
solo 0,8 MB eran texturas: el peso era geometria. Para una cabeza que se ve
en un escenario de unos 200 px eso no aporta nada visible y si cuesta
descarga, memoria y GPU en movil.

Reducidos con Decimate en modo COLLAPSE a 120.000 triangulos, el mismo
procedimiento que ya se aplico a los doce modelos de `assets/3d/tripo`
(que pesan entre 1,8 y 2,9 MB). De 54 MB a 5 MB, diez veces menos.

Comprobado antes de reemplazar:

- Render frontal a 512 px, el doble del tamano real en pantalla,
  comparando original y reducido: sin diferencia apreciable en la cara.
- Caja envolvente: desviacion maxima del 0,03 %, asi que `fitSize` y
  `camera` de `oraculo-3d-assets.js` siguen encuadrando igual.

Los originales estan en el historial de git si hiciera falta volver.
