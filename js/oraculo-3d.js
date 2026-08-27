import { ORACULO_3D_ASSETS } from './oraculo-3d-assets.js';

const SETTINGS_KEY = 'oraculo.3d.preference.v14';
const REPORT_KEY = 'oraculo.3d.report.v14';
const MAX_MODEL_CACHE = 2;
const HEAVY_MODEL_BYTES = 35 * 1024 * 1024;
const moduleState = { ready: null, THREE: null, GLTFLoader: null };
const modelCache = new Map();
const mountedStages = new WeakMap();
const activeStages = new Set();
const prefetchSkips = new Map();

function readPreference() {
  try { return localStorage.getItem(SETTINGS_KEY) || 'auto'; }
  catch { return 'auto'; }
}

function writePreference(value) {
  try { localStorage.setItem(SETTINGS_KEY, value); } catch {}
}

function prefersReducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}

function detectQuality() {
  const preference = readPreference();
  if (preference === 'off') return { enabled: false, level: 'off', reason: 'user' };
  if (!webglAvailable()) return { enabled: false, level: 'off', reason: 'webgl' };
  if (prefersReducedMotion()) return { enabled: true, level: 'low', motion: false, reason: 'reduced-motion' };
  if (preference === 'high') return { enabled: true, level: 'high', motion: true, reason: 'user' };
  if (preference === 'balanced') return { enabled: true, level: 'medium', motion: true, reason: 'user' };
  if (preference === 'reduced') return { enabled: true, level: 'low', motion: false, reason: 'user' };

  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const saveData = navigator.connection?.saveData;
  const performanceMode = localStorage.getItem('oraculo.performanceMode.v1') === 'true';
  if (saveData || performanceMode || memory <= 2 || cores <= 2) return { enabled: true, level: 'low', motion: false, reason: 'device' };
  return { enabled: true, level: 'low', motion: false, reason: 'auto-heavy-assets' };
}

function qualityOptions(level) {
  if (level === 'high') return { dpr: Math.min(devicePixelRatio || 1, 2), shadows: true, antialias: true, lights: 3 };
  if (level === 'medium') return { dpr: Math.min(devicePixelRatio || 1, 1.5), shadows: false, antialias: true, lights: 2 };
  return { dpr: 1, shadows: false, antialias: false, lights: 1 };
}

async function loadThree() {
  if (!moduleState.ready) {
    moduleState.ready = Promise.all([
      import('../assets/vendor/three/0.160.0/three.module.js'),
      import('../assets/vendor/three/0.160.0/GLTFLoader.js')
    ]).then(([THREE, loaderModule]) => {
      moduleState.THREE = THREE;
      moduleState.GLTFLoader = loaderModule.GLTFLoader;
      return moduleState;
    });
  }
  return moduleState.ready;
}

function updateReport(assetId, patch) {
  let report = {};
  try { report = JSON.parse(sessionStorage.getItem(REPORT_KEY) || '{}'); } catch {}
  report[assetId] = { ...(report[assetId] || {}), ...patch, checkedAt: new Date().toISOString() };
  try { sessionStorage.setItem(REPORT_KEY, JSON.stringify(report)); } catch {}
}

function assetById(assetId) {
  return ORACULO_3D_ASSETS[assetId] || ORACULO_3D_ASSETS.orb;
}

async function shouldSkipHeavyModel(asset, quality) {
  if (quality.level === 'high') return false;
  updateReport(asset.id || asset.path, {
    status: 'fallback',
    path: asset.path,
    reason: 'quality-uses-2d-fallback'
  });
  return true;
}

async function shouldSkipPrefetch(assetId) {
  if (prefetchSkips.has(assetId)) return prefetchSkips.get(assetId);
  const asset = assetById(assetId);
  let skip = false;
  try {
    const response = await fetch(asset.path, { method: 'HEAD', cache: 'force-cache' });
    const size = Number(response.headers.get('content-length') || 0);
    if (size > HEAVY_MODEL_BYTES) {
      updateReport(assetId, {
        status: 'fallback',
        path: asset.path,
        bytes: size,
        reason: 'model-too-heavy-for-prefetch'
      });
      skip = true;
    }
  } catch {}
  prefetchSkips.set(assetId, skip);
  return skip;
}

async function loadModel(assetId, quality = detectQuality()) {
  const asset = assetById(assetId);
  if (await shouldSkipHeavyModel({ ...asset, id: assetId }, quality)) {
    throw new Error('model-too-heavy-for-quality');
  }
  if (modelCache.has(assetId)) {
    const cached = modelCache.get(assetId);
    cached.lastUsed = performance.now();
    return cached.promise;
  }
  const { GLTFLoader } = await loadThree();
  const loader = new GLTFLoader();
  const started = performance.now();
  const entry = { promise: null, lastUsed: performance.now(), assetId, gltf: null };
  const promise = loader.loadAsync(asset.path).then(gltf => {
    entry.gltf = gltf;
    updateReport(assetId, {
      status: 'loaded',
      path: asset.path,
      loadMs: Math.round(performance.now() - started),
      meshes: countMeshes(gltf.scene),
      triangles: countTriangles(gltf.scene)
    });
    trimModelCache();
    return gltf;
  }).catch(error => {
    modelCache.delete(assetId);
    updateReport(assetId, { status: 'fallback', path: asset.path, error: error?.message || 'model-load-failed' });
    throw error;
  });
  entry.promise = promise;
  modelCache.set(assetId, entry);
  return promise;
}

function countMeshes(root) {
  let count = 0;
  root.traverse(node => { if (node.isMesh) count += 1; });
  return count;
}

function countTriangles(root) {
  let triangles = 0;
  root.traverse(node => {
    if (!node.isMesh || !node.geometry) return;
    const geometry = node.geometry;
    triangles += geometry.index ? geometry.index.count / 3 : (geometry.attributes.position?.count || 0) / 3;
  });
  return Math.round(triangles);
}

function trimModelCache() {
  if (modelCache.size <= MAX_MODEL_CACHE) return;
  const entries = [...modelCache.values()].sort((a, b) => a.lastUsed - b.lastUsed);
  entries.slice(0, modelCache.size - MAX_MODEL_CACHE).forEach(entry => {
    if (entry.gltf?.scene && moduleState.THREE) disposeObject(moduleState.THREE, entry.gltf.scene);
    modelCache.delete(entry.assetId);
  });
}

function cloneScene(scene) {
  const clone = scene.clone(true);
  clone.traverse(node => {
    if (node.isMesh) {
      if (node.geometry) node.geometry = node.geometry.clone();
      if (Array.isArray(node.material)) node.material = node.material.map(material => material?.clone?.() || material);
      else if (node.material) node.material = node.material.clone?.() || node.material;
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
  return clone;
}

function disposeObject(THREE, root) {
  root?.traverse?.(node => {
    if (!node.isMesh) return;
    node.geometry?.dispose?.();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach(material => {
      material.dispose?.();
    });
  });
}

/* La etiqueta estaba fija en espanol y sin acentos, y es justo lo que
   lee un lector de pantalla. Ahora sale del i18n del motor. */
function etiquetaAsset(asset) {
  const tr = window.OraculoI18n?.t;
  if (asset.i18n && tr) {
    const v = tr(asset.i18n);
    if (v && v !== asset.i18n) return v;
  }
  return asset.label || '';
}

function makeFallback(stage, assetId, reason = '') {
  const asset = assetById(assetId);
  const tr = window.OraculoI18n?.t;
  const nombre = etiquetaAsset(asset);
  const matiz = tr ? tr('a3dLight') : '';
  stage.classList.add('om-3d-fallback-active');
  /* El aro se dibuja aqui y no con un SVG externo: son cuatro trazos y
     asi no anade ni una peticion mas ni depende de la cache. */
  stage.innerHTML = `<div class="om-3d-fallback" role="img" aria-label="${escaparAttr(nombre)}${matiz ? ' · ' + escaparAttr(matiz) : ''}">
      <svg class="om-3d-aro" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <defs><linearGradient id="om3dOro-${assetId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fff4c9"/><stop offset="48%" stop-color="#f4cf75"/><stop offset="100%" stop-color="#9a6825"/>
        </linearGradient></defs>
        <circle cx="60" cy="60" r="55" fill="none" stroke="url(#om3dOro-${assetId})" stroke-width="1.6" opacity=".85"/>
        <circle cx="60" cy="60" r="47" fill="none" stroke="#fff8dd" stroke-opacity=".22" stroke-width=".8"/>
        <g stroke="url(#om3dOro-${assetId})" stroke-width="1.2" opacity=".55" stroke-linecap="round">
          <path d="M60 3 v7"/><path d="M60 110 v7"/><path d="M3 60 h7"/><path d="M110 60 h7"/>
        </g>
      </svg>
      <span aria-hidden="true">${asset.fallback}</span>
    </div>`;
  updateReport(assetId, { status: 'fallback', path: asset.path, reason });
}

function escaparAttr(v = '') {
  return String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

class OracleScene {
  constructor(stage, assetId, quality) {
    this.stage = stage;
    this.assetId = assetId;
    this.asset = assetById(assetId);
    this.quality = quality;
    this.pointer = { x: 0, y: 0 };
    this.running = false;
    this.frame = 0;
    this.baseModelY = 0;
    this.lastRender = 0;
    this.targetFrameMs = quality.level === 'high' ? 16 : quality.level === 'medium' ? 33 : 80;
    this.onResize = this.resize.bind(this);
    this.onPointerMove = this.pointerMove.bind(this);
    this.onVisibilityChange = this.visibilityChange.bind(this);
  }

  async mount() {
    const { THREE } = await loadThree();
    this.THREE = THREE;
    this.options = qualityOptions(this.quality.level);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    this.camera.position.set(...this.asset.camera);
    this.camera.lookAt(0, 0, 0);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: this.options.antialias, powerPreference: this.quality.level === 'high' ? 'high-performance' : 'low-power' });
    this.renderer.setPixelRatio(this.options.dpr);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = this.options.shadows;
    this.stage.textContent = '';
    this.stage.classList.remove('om-3d-fallback-active');
    this.stage.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-hidden', 'true');

    const ambient = new THREE.HemisphereLight(0xf8edcf, 0x14101f, this.options.lights === 1 ? 1.8 : 1.3);
    this.scene.add(ambient);
    const key = new THREE.DirectionalLight(0xf5cc74, this.options.lights === 3 ? 2.2 : 1.45);
    key.position.set(3, 4, 5);
    key.castShadow = this.options.shadows;
    this.scene.add(key);
    if (this.options.lights > 1) {
      const violet = new THREE.PointLight(0x9c74ff, this.options.lights === 3 ? 1.4 : 0.8, 6);
      violet.position.set(-2, 1.4, 2);
      this.scene.add(violet);
    }

    const gltf = await loadModel(this.assetId, this.quality);
    this.model = cloneScene(gltf.scene);
    this.model.rotation.set(...this.asset.rotation);
    this.model.scale.setScalar(this.asset.scale);
    this.centerModel();
    this.scene.add(this.model);

    this.resize();
    window.addEventListener('resize', this.onResize, { passive: true });
    this.stage.addEventListener('pointermove', this.onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibilityChange, { passive: true });
    this.running = true;
    if (this.quality.motion) this.animate();
    else this.renderer.render(this.scene, this.camera);
    schedulePrefetch(this.asset.prefetch || []);
  }

  centerModel() {
    const { Box3, Vector3 } = this.THREE;
    const box = new Box3().setFromObject(this.model);
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    const largest = Math.max(size.x, size.y, size.z) || 1;
    const fitSize = this.asset.fitSize || 1.68;
    const targetScale = this.asset.scale * (fitSize / largest);
    this.model.scale.setScalar(targetScale);
    this.model.position.set(
      -center.x * targetScale,
      -center.y * targetScale - size.y * targetScale * 0.02,
      -center.z * targetScale
    );
    this.baseModelY = this.model.position.y;
  }

  pointerMove(event) {
    const rect = this.stage.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    this.pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  }

  resize() {
    const rect = this.stage.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(0, 0, 0);
    this.renderer.setSize(width, height, false);
    if (!this.quality.motion) this.renderer.render(this.scene, this.camera);
  }

  visibilityChange() {
    if (document.hidden) this.lastRender = 0;
  }

  animate(now = performance.now()) {
    if (!this.running) return;
    if (document.hidden || now - this.lastRender < this.targetFrameMs) {
      this.frame = requestAnimationFrame(next => this.animate(next));
      return;
    }
    this.lastRender = now;
    const motion = this.quality.motion;
    if (this.model && motion) {
      const t = performance.now() * 0.00035;
      this.model.rotation.y += this.quality.level === 'high' ? 0.0022 : 0.0012;
      this.model.rotation.x += (this.asset.rotation[0] + this.pointer.y * 0.04 + Math.sin(t) * 0.025 - this.model.rotation.x) * 0.04;
      this.model.rotation.z += (this.pointer.x * -0.035 - this.model.rotation.z) * 0.04;
      this.model.position.y = this.baseModelY + Math.sin(t * 1.2) * 0.026;
    }
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.onResize);
    this.stage.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    if (this.model) {
      this.scene?.remove(this.model);
      disposeObject(this.THREE, this.model);
    }
    /* dispose() libera programas y render targets, pero NO el contexto
       WebGL: para eso hace falta forceContextLoss(). El navegador solo
       admite unos 16 contextos vivos y, al pasarse, mata los primeros
       en silencio y esos lienzos se quedan en negro. */
    this.renderer?.dispose?.();
    try { this.renderer?.forceContextLoss?.(); } catch {}
    this.renderer?.domElement?.remove?.();
    this.renderer = null;
    this.scene = null;
    this.model = null;
  }
}

function mountStage(stage) {
  /* dataset NO camelliza un guion seguido de digito: la clave real de
     data-oraculo-3d-asset es dataset['oraculo-3dAsset'], asi que
     .oraculo3dAsset era siempre undefined y TODA escena caia al orbe.
     Se lee el atributo directamente, que no tiene ambiguedad. */
  const assetId = stage.getAttribute('data-oraculo-3d-asset') || 'orb';
  const quality = detectQuality();
  if (!quality.enabled) {
    makeFallback(stage, assetId, quality.reason);
    return;
  }
  if (mountedStages.has(stage)) return;
  stage.classList.add('om-3d-loading');
  const asset = assetById(assetId);
  shouldSkipHeavyModel({ ...asset, id: assetId }, quality)
    .then(skip => {
      if (skip) {
        makeFallback(stage, assetId, 'quality-uses-2d-fallback');
        return null;
      }
      const scene = new OracleScene(stage, assetId, quality);
      mountedStages.set(stage, scene);
      activeStages.add(stage);
      return scene.mount().then(() => scene).catch(error => {
        scene.destroy();
        mountedStages.delete(stage);
        activeStages.delete(stage);
        makeFallback(stage, assetId, error?.message || 'mount-failed');
        return null;
      });
    })
    .catch(error => {
      makeFallback(stage, assetId, error?.message || 'mount-failed');
    })
    .finally(() => stage.classList.remove('om-3d-loading'));
}

function unmountStage(stage) {
  const scene = mountedStages.get(stage);
  if (!scene) return;
  scene.destroy();
  mountedStages.delete(stage);
  activeStages.delete(stage);
}

function schedulePrefetch(assetIds = []) {
  const unique = assetIds.filter(id => ORACULO_3D_ASSETS[id]);
  if (!unique.length || readPreference() === 'off' || prefersReducedMotion()) return;
  const quality = detectQuality();
  if (quality.level !== 'high') return;
  const run = () => unique.slice(0, 1).forEach(async id => {
    if (await shouldSkipPrefetch(id)) return;
    loadModel(id, quality).catch(() => {});
  });
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 2500 });
  else setTimeout(run, 900);
}

function observeStages(root = document) {
  const stages = Array.from(root.querySelectorAll('[data-oraculo-3d-asset]'));
  if (root.matches?.('[data-oraculo-3d-asset]')) stages.unshift(root);
  if (!stages.length) return;
  if (!('IntersectionObserver' in window)) {
    stages.slice(0, 1).forEach(mountStage);
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) mountStage(entry.target);
      else unmountStage(entry.target);
    });
  }, { rootMargin: '180px 0px', threshold: 0.05 });
  stages.forEach(stage => observer.observe(stage));
}

function refreshAllStages() {
  document.querySelectorAll('[data-oraculo-3d-asset]').forEach(stage => {
    unmountStage(stage);
    stage.textContent = '';
    mountStage(stage);
  });
}

function init() {
  document.documentElement.dataset.oraculo3d = detectQuality().level;
  observeStages();
  const mo = new MutationObserver(records => {
    records.forEach(record => {
      record.addedNodes.forEach(node => {
        if (node.nodeType === 1) observeStages(node);
      });
      record.removedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches?.('[data-oraculo-3d-asset]')) unmountStage(node);
        node.querySelectorAll?.('[data-oraculo-3d-asset]').forEach(unmountStage);
      });
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('pagehide', () => {
    activeStages.forEach(stage => unmountStage(stage));
    [...modelCache.values()].forEach(entry => {
      if (entry.gltf?.scene && moduleState.THREE) disposeObject(moduleState.THREE, entry.gltf.scene);
    });
    modelCache.clear();
  });
}

window.Oraculo3D = {
  assets: ORACULO_3D_ASSETS,
  getPreference: readPreference,
  setPreference(value) {
    writePreference(value);
    document.documentElement.dataset.oraculo3d = detectQuality().level;
    refreshAllStages();
  },
  getQuality: detectQuality,
  getReport() {
    try { return JSON.parse(sessionStorage.getItem(REPORT_KEY) || '{}'); }
    catch { return {}; }
  },
  refresh: refreshAllStages,
  prefetch: schedulePrefetch
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
