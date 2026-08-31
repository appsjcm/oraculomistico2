export const ORACULO_3D_ASSETS = {
  orb: {
    label: 'Orbe del Oráculo', i18n: 'a3dOrb',
    path: 'assets/3d/tripo/orbe-del-oraculo.glb',
    fallback: '◉',
    section: 'Inicio',
    scale: 1.15,
    camera: [0, 0.35, 4.2],
    rotation: [0, -0.35, 0],
    prefetch: ['portal', 'tarotTable']
  },
  grimoire: {
    label: 'Mi Grimorio', i18n: 'a3dGrimoire',
    path: 'assets/3d/tripo/mi-grimorio.glb',
    fallback: '❖',
    section: 'Grimorio',
    scale: 1,
    camera: [0, 0.45, 4.4],
    rotation: [-0.12, -0.42, 0],
    prefetch: ['library']
  },
  tarotTable: {
    label: 'Mesa de Lectura', i18n: 'a3dTable',
    path: 'assets/3d/tripo/mesa-de-lectura.glb',
    fallback: '◈',
    section: 'Tarot',
    scale: 1,
    camera: [0, 0.65, 4.8],
    rotation: [-0.18, 0.35, 0],
    prefetch: ['tarotCard']
  },
  tarotCard: {
    label: 'Carta Arcana', i18n: 'a3dCard',
    path: 'assets/3d/tripo/carta-arcana.glb',
    fallback: '✶',
    section: 'Tarot',
    scale: 1.05,
    camera: [0, 0.2, 4],
    rotation: [0, -0.18, 0],
    prefetch: []
  },
  runes: {
    label: 'Runas de Obsidiana', i18n: 'a3dRunes',
    path: 'assets/3d/tripo/runas-de-obsidiana.glb',
    fallback: 'ᚱ',
    section: 'Runas',
    scale: 1.05,
    camera: [0, 0.45, 4.3],
    rotation: [-0.08, 0.45, 0],
    prefetch: []
  },
  moon: {
    label: 'Luna Celestial', i18n: 'a3dMoon',
    path: 'assets/3d/tripo/luna-celestial.glb',
    fallback: '☾',
    section: 'Luna',
    scale: 1,
    camera: [0, 0.25, 4.1],
    rotation: [0.08, 0.25, 0],
    prefetch: []
  },
  dreamMirror: {
    label: 'Espejo de los Sueños', i18n: 'a3dMirror',
    path: 'assets/3d/tripo/espejo-de-los-suenos.glb',
    fallback: '❂',
    section: 'Suenos',
    scale: 1,
    camera: [0, 0.4, 4.5],
    rotation: [0, -0.28, 0],
    prefetch: []
  },
  astrolabe: {
    label: 'Astrolabio Celestial', i18n: 'a3dAstrolabe',
    path: 'assets/3d/tripo/astrolabio-celestial.glb',
    fallback: '☍',
    section: 'Numerologia y Sinastria',
    scale: 1,
    camera: [0, 0.35, 4.5],
    rotation: [0.05, -0.35, 0],
    prefetch: []
  },
  portal: {
    label: 'Portal del Oráculo', i18n: 'a3dPortal',
    path: 'assets/3d/tripo/portal-del-oraculo.glb',
    fallback: '◎',
    section: 'Transiciones',
    scale: 1,
    camera: [0, 0.25, 4.8],
    rotation: [0, -0.08, 0],
    prefetch: []
  },
  pedestal: {
    label: 'Pedestal del Santuario', i18n: 'a3dPedestal',
    path: 'assets/3d/tripo/pedestal-del-santuario.glb',
    fallback: '✧',
    section: 'Santuario',
    scale: 1,
    camera: [0, 0.45, 4.4],
    rotation: [0, 0.35, 0],
    prefetch: ['orb']
  },
  library: {
    label: 'Biblioteca Arcana', i18n: 'a3dLibrary',
    path: 'assets/3d/tripo/biblioteca-arcana.glb',
    fallback: '✦',
    section: 'Biblioteca Arcana',
    scale: 1,
    camera: [0, 0.45, 4.6],
    rotation: [0, -0.4, 0],
    prefetch: ['grimoire']
  },
  dailyRelic: {
    label: 'Reliquia del Oráculo', i18n: 'a3dRelic',
    path: 'assets/3d/tripo/reliquia-del-oraculo.glb',
    fallback: '✹',
    section: 'Mensaje del Dia',
    scale: 1.08,
    camera: [0, 0.3, 4.2],
    rotation: [0.02, -0.25, 0],
    prefetch: ['tarotCard']
  },
  avatarFemale: {
    label: 'Oráculo guía 3D', i18n: 'a3dAvatarFemale',
    path: 'assets/3d/avatars/oracle-female-portrait.glb',
    fallback: '✦',
    section: 'Avatar del Oráculo',
    scale: 1,
    fitSize: 1.82,
    camera: [0, 0.18, 4.25],
    rotation: [0, 0, 0],
    avatar: true,
    prefetch: []
  },
  avatarMale: {
    label: 'Oráculo guardián 3D', i18n: 'a3dAvatarMale',
    path: 'assets/3d/avatars/oracle-male-portrait.glb',
    fallback: '◎',
    section: 'Avatar del Oráculo',
    scale: 1,
    fitSize: 1.82,
    camera: [0, 0.18, 4.25],
    rotation: [0, 0, 0],
    avatar: true,
    prefetch: []
  }
};

export const ORACULO_3D_PATHS = Object.values(ORACULO_3D_ASSETS).map(asset => asset.path);
