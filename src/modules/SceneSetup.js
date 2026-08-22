import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export function createSceneSetup({ canvas, css2dLayer, viewportEl }) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    viewportEl.clientWidth / viewportEl.clientHeight,
    0.05,
    50
  );
  camera.position.set(1.1, 0.9, 1.3);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(viewportEl.clientWidth, viewportEl.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // high-quality filtered shadows
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const labelRenderer = new CSS2DRenderer({ element: css2dLayer });
  labelRenderer.setSize(viewportEl.clientWidth, viewportEl.clientHeight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.6;
  controls.maxDistance = 4;
  controls.maxPolarAngle = Math.PI * 0.53;
  controls.target.set(0, 0.42, 0);
  controls.update();

  // Infinite reference grid, faded via fog so it reads as "studio floor"
  const grid = new THREE.GridHelper(6, 60, 0x2a5c66, 0x1a1f26);
  grid.position.y = 0.001;
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  scene.add(grid);

  function onResize() {
    const w = viewportEl.clientWidth;
    const h = viewportEl.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  return { scene, camera, renderer, labelRenderer, controls, grid, onResize };
}

export const CAMERA_PRESETS = {
  'Front': { pos: [0, 0.65, 1.6], target: [0, 0.42, 0] },
  '3/4 View': { pos: [1.1, 0.9, 1.3], target: [0, 0.42, 0] },
  'Side': { pos: [1.6, 0.55, 0], target: [0, 0.42, 0] },
  'Top': { pos: [0.05, 2.0, 0.05], target: [0, 0.42, 0] },
};

export function flyCameraTo(camera, controls, preset, THREE_) {
  const { pos, target } = preset;
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const endPos = { x: pos[0], y: pos[1], z: pos[2] };
  const endTarget = { x: target[0], y: target[1], z: target[2] };
  const duration = 650;
  const t0 = performance.now();

  function step(now) {
    const t = Math.min(1, (now - t0) / duration);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    camera.position.set(
      startPos.x + (endPos.x - startPos.x) * eased,
      startPos.y + (endPos.y - startPos.y) * eased,
      startPos.z + (endPos.z - startPos.z) * eased
    );
    controls.target.set(
      startTarget.x + (endTarget.x - startTarget.x) * eased,
      startTarget.y + (endTarget.y - startTarget.y) * eased,
      startTarget.z + (endTarget.z - startTarget.z) * eased
    );
    controls.update();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
