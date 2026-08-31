# Oraculo 3D avatar assets

Estos dos GLB se usan como avatares opcionales del Oraculo al hablar:

- `oracle-female-portrait.glb` - 53.90 MB
- `oracle-male-portrait.glb` - 53.35 MB

Auditoria GLB:

- 1 escena, 1 nodo, 1 malla y 3 texturas por modelo.
- Sin esqueletos.
- Sin animaciones.
- Sin morph targets faciales.
- Sin nodos separados de mandibula, labios, ojos o cejas.

Por esa estructura, la boca no puede animarse de forma anatomica dentro del
modelo actual. El motor aplica una expresion procedural ligera al hablar:
respiracion, inclinacion, pulso de luz y seguimiento suave. Si en el futuro se
suben GLB con morph targets tipo `jawOpen`, `mouthOpen` o `viseme_*`, el motor
intentara usarlos automaticamente para una boca real.

Los avatares no estan en el precache inicial de la PWA. Se cargan solo bajo
demanda en el modo de avatar 3D experimental y se guardan en cache dinamica
tras abrirse una vez con conexion.
