# Oraculo Mistico V2 - Tripo GLB assets

La Fase 14 usa los 12 modelos en esta carpeta, con estos nombres exactos:

- `orbe-del-oraculo.glb`
- `mi-grimorio.glb`
- `mesa-de-lectura.glb`
- `carta-arcana.glb`
- `runas-de-obsidiana.glb`
- `luna-celestial.glb`
- `espejo-de-los-suenos.glb`
- `astrolabio-celestial.glb`
- `portal-del-oraculo.glb`
- `pedestal-del-santuario.glb`
- `biblioteca-arcana.glb`
- `reliquia-del-oraculo.glb`

Los modelos no se incluyen en el precache inicial porque pesan mas de 640 MB en conjunto. Cuando un modelo se abre por primera vez en calidad alta, el service worker lo guarda en cache de forma dinamica para uso offline posterior.

Por rendimiento, la app evita descargar estos GLB en calidad media/baja y usa fallback 2D. Conviene generar versiones ligeras antes de publicar en produccion movil.
