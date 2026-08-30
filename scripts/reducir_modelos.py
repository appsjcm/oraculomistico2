# -*- coding: utf-8 -*-
"""Reduce la geometria de un GLB conservando las texturas.

Se guarda en el repositorio para poder repetirlo si entran modelos
nuevos. Necesita Blender (no Node): probado con la 5.2.

Para los doce del Santuario, desde la raiz del proyecto:

  for f in assets/3d/tripo/*.glb; do \
    blender -b -P scripts/reducir_modelos.py -- "$PWD/$f" "$PWD/$f.tmp" 45000 \
    && mv "$f.tmp" "$f"; done


  blender -b -P reducir.py -- <entrada.glb> <salida.glb> <objetivo_triangulos>

Los modelos vienen con ~350.000 triangulos cada uno. En la app se ven en
escenas pequenas, asi que esa densidad no aporta nada visible y si cuesta
memoria y tiempo de carga en movil. Se reduce con Decimate en modo
COLLAPSE, que conserva la forma y las coordenadas de textura.
"""
import bpy, sys, os

argv = sys.argv[sys.argv.index('--') + 1:]
entrada, salida = argv[0], argv[1]
objetivo = int(argv[2]) if len(argv) > 2 else 45000

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=entrada)

mallas = [o for o in bpy.context.scene.objects if o.type == 'MESH']
antes = sum(len(o.data.polygons) for o in mallas)
if antes == 0:
    print('SIN GEOMETRIA'); sys.exit(1)

ratio = min(1.0, objetivo / float(antes))
for o in mallas:
    bpy.context.view_layer.objects.active = o
    d = o.modifiers.new('reducir', 'DECIMATE')
    d.decimate_type = 'COLLAPSE'
    d.ratio = ratio
    d.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier='reducir')

despues = sum(len(o.data.polygons) for o in mallas)

bpy.ops.export_scene.gltf(
    filepath=salida,
    export_format='GLB',
    export_materials='EXPORT',
    export_image_format='AUTO',      # conserva los JPEG tal cual
    export_yup=True,
    export_apply=False,
)
print('TRIS %d -> %d  (ratio %.4f)' % (antes, despues, ratio))
print('BYTES %d -> %d' % (os.path.getsize(entrada), os.path.getsize(salida)))
