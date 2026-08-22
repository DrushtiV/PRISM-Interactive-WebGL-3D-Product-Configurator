import * as THREE from 'three';
import './style.css';

import { createSceneSetup, CAMERA_PRESETS, flyCameraTo } from './modules/SceneSetup.js';
import { buildChair, getConfigurableParts } from './modules/ChairModel.js';
import { createMaterialConfigurator, COLOR_PRESETS } from './modules/MaterialConfigurator.js';
import { createEnvironmentSystem, PRESET_NAMES } from './modules/EnvironmentPresets.js';
import { createAnnotationSystem } from './modules/Annotations.js';
import { createExplodedView } from './modules/ExplodedView.js';
import { createPerformanceMonitor } from './modules/PerformanceMonitor.js';
import { renderSceneGraphTree, createFresnelGUI } from './modules/DebugPanel.js';
import { disposeObject, runDisposeDemo } from './modules/MemoryManager.js';

// DOM references
const viewportEl = document.querySelector('.viewport-wrap');
const canvas = document.getElementById('viewport');
const css2dLayer = document.getElementById('css2d-layer');
const loadingVeil = document.getElementById('loading-veil');

const els = {
  fps: document.getElementById('stat-fps'),
  calls: document.getElementById('stat-calls'),
  tris: document.getElementById('stat-tris'),
  tex: document.getElementById('stat-tex'),
  geo: document.getElementById('stat-geo'),
};

// Scene bootstrap
const { scene, camera, renderer, labelRenderer, controls } = createSceneSetup({
  canvas, css2dLayer, viewportEl,
});

const envSystem = createEnvironmentSystem(renderer, scene);
envSystem.apply('Studio');

let chair = buildChair();
scene.add(chair);

let materialConfig = createMaterialConfigurator(getConfigurableParts(chair));
let explodedView = createExplodedView(chair);

const annotations = createAnnotationSystem({
  camera,
  target: chair,
  css2dLayer,
  onListChange: renderNotesList,
});

const perfMonitor = createPerformanceMonitor(renderer, els);

// Materials panel
const partSelect = document.getElementById('part-select');
const colorInput = document.getElementById('mat-color');
const roughnessInput = document.getElementById('mat-roughness');
const metalnessInput = document.getElementById('mat-metalness');
const fresnelInput = document.getElementById('mat-fresnel');
const valRoughness = document.getElementById('val-roughness');
const valMetalness = document.getElementById('val-metalness');
const valFresnel = document.getElementById('val-fresnel');
const swatchRow = document.getElementById('preset-swatches');

function populatePartSelect() {
  partSelect.innerHTML = '';
  materialConfig.labels.forEach((label) => {
    const opt = document.createElement('option');
    opt.value = label;
    opt.textContent = label;
    partSelect.appendChild(opt);
  });
}

function syncMaterialFieldsToSelection() {
  const state = materialConfig.readState(partSelect.value);
  if (!state) return;
  colorInput.value = state.color;
  roughnessInput.value = state.roughness;
  metalnessInput.value = state.metalness;
  fresnelInput.value = state.fresnel;
  valRoughness.textContent = Number(state.roughness).toFixed(2);
  valMetalness.textContent = Number(state.metalness).toFixed(2);
  valFresnel.textContent = Number(state.fresnel).toFixed(2);
}

function buildSwatches() {
  swatchRow.innerHTML = '';
  COLOR_PRESETS.forEach((hex) => {
    const sw = document.createElement('div');
    sw.className = 'swatch';
    sw.style.background = hex;
    sw.title = hex;
    sw.addEventListener('click', () => {
      colorInput.value = hex;
      materialConfig.applyColor(partSelect.value, hex);
    });
    swatchRow.appendChild(sw);
  });
}

partSelect.addEventListener('change', syncMaterialFieldsToSelection);
colorInput.addEventListener('input', () => materialConfig.applyColor(partSelect.value, colorInput.value));
roughnessInput.addEventListener('input', () => {
  valRoughness.textContent = Number(roughnessInput.value).toFixed(2);
  materialConfig.applyRoughness(partSelect.value, parseFloat(roughnessInput.value));
});
metalnessInput.addEventListener('input', () => {
  valMetalness.textContent = Number(metalnessInput.value).toFixed(2);
  materialConfig.applyMetalness(partSelect.value, parseFloat(metalnessInput.value));
});
fresnelInput.addEventListener('input', () => {
  valFresnel.textContent = Number(fresnelInput.value).toFixed(2);
  materialConfig.applyFresnel(partSelect.value, parseFloat(fresnelInput.value));
});

populatePartSelect();
buildSwatches();
syncMaterialFieldsToSelection();

// Environment panel
const envChips = document.getElementById('env-chips');
const lightKeyInput = document.getElementById('light-key');
const valKey = document.getElementById('val-key');
const shadowToggle = document.getElementById('shadow-toggle');

PRESET_NAMES.forEach((name, i) => {
  const chip = document.createElement('div');
  chip.className = 'chip' + (i === 0 ? ' active' : '');
  chip.textContent = name;
  chip.addEventListener('click', () => {
    envSystem.apply(name);
    envSystem.setKeyIntensity(parseFloat(lightKeyInput.value));
    envSystem.setShadowsEnabled(shadowToggle.checked);
    [...envChips.children].forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    refreshSceneGraph();
  });
  envChips.appendChild(chip);
});

lightKeyInput.addEventListener('input', () => {
  valKey.textContent = Number(lightKeyInput.value).toFixed(2);
  envSystem.setKeyIntensity(parseFloat(lightKeyInput.value));
});
shadowToggle.addEventListener('change', () => envSystem.setShadowsEnabled(shadowToggle.checked));

// Camera panel
const cameraChips = document.getElementById('camera-chips');
const fovInput = document.getElementById('cam-fov');
const valFov = document.getElementById('val-fov');
const autorotateToggle = document.getElementById('autorotate-toggle');

Object.entries(CAMERA_PRESETS).forEach(([name, preset], i) => {
  const chip = document.createElement('div');
  chip.className = 'chip' + (i === 1 ? ' active' : '');
  chip.textContent = name;
  chip.addEventListener('click', () => {
    flyCameraTo(camera, controls, preset);
    [...cameraChips.children].forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
  });
  cameraChips.appendChild(chip);
});

fovInput.addEventListener('input', () => {
  valFov.textContent = fovInput.value;
  camera.fov = parseFloat(fovInput.value);
  camera.updateProjectionMatrix();
});
autorotateToggle.addEventListener('change', () => {
  controls.autoRotate = autorotateToggle.checked;
  controls.autoRotateSpeed = 1.4;
});

// Accordion behaviour
document.querySelectorAll('.accordion-head').forEach((head) => {
  head.addEventListener('click', () => {
    head.parentElement.classList.toggle('open');
  });
});

// Exploded view
const btnExplode = document.getElementById('btn-explode');
btnExplode.addEventListener('click', () => {
  const now = explodedView.toggle();
  btnExplode.classList.toggle('is-active', now);
});

// Annotations UI
const btnAnnotate = document.getElementById('btn-annotate');
const annotateHint = document.getElementById('annotate-hint');
const noteModal = document.getElementById('note-modal');
const noteText = document.getElementById('note-text');
const noteSave = document.getElementById('note-save');
const noteCancel = document.getElementById('note-cancel');
const notesList = document.getElementById('notes-list');
const noteCount = document.getElementById('note-count');

let annotateMode = false;
let pendingIntersection = null;

btnAnnotate.addEventListener('click', () => {
  annotateMode = !annotateMode;
  annotations.setActive(annotateMode);
  btnAnnotate.classList.toggle('is-active', annotateMode);
  annotateHint.classList.toggle('hidden', !annotateMode);
});

canvas.addEventListener('click', (e) => {
  if (!annotateMode) return;
  const hit = annotations.pick(e.clientX, e.clientY, canvas);
  if (!hit) return;
  pendingIntersection = hit;
  noteText.value = '';
  noteModal.classList.remove('hidden');
  noteText.focus();
});

noteCancel.addEventListener('click', () => {
  noteModal.classList.add('hidden');
  pendingIntersection = null;
});
noteSave.addEventListener('click', () => {
  const text = noteText.value.trim();
  if (text && pendingIntersection) {
    annotations.addNote(pendingIntersection, text);
  }
  noteModal.classList.add('hidden');
  pendingIntersection = null;
});

function renderNotesList(notes) {
  noteCount.textContent = String(notes.length);
  if (!notes.length) {
    notesList.innerHTML = '<p class="empty-hint">No notes yet. Use “Annotate” above and click the model.</p>';
    return;
  }
  notesList.innerHTML = '';
  notes.forEach((n) => {
    const item = document.createElement('div');
    item.className = 'note-item';
    item.innerHTML = `
      <button class="note-item-del" title="Remove">✕</button>
      <div class="note-item-text">${escapeHtml(n.text)}</div>
      <div>on ${escapeHtml(n.partName)}</div>
    `;
    item.querySelector('.note-item-del').addEventListener('click', () => annotations.removeNote(n.id));
    notesList.appendChild(item);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Debug overlay (hotkey 'D')
const btnDebug = document.getElementById('btn-debug');
const debugOverlay = document.getElementById('debug-overlay');
const sceneGraphTree = document.getElementById('scene-graph-tree');
const shaderGuiMount = document.getElementById('shader-gui-mount');
const btnDisposeDemo = document.getElementById('btn-dispose-demo');
const disposeLog = document.getElementById('dispose-log');

const fresnelGUI = createFresnelGUI(shaderGuiMount);

function refreshSceneGraph() {
  renderSceneGraphTree(scene, sceneGraphTree);
}

function toggleDebug(forceState) {
  const willShow = forceState ?? debugOverlay.classList.contains('hidden');
  debugOverlay.classList.toggle('hidden', !willShow);
  btnDebug.classList.toggle('is-active', willShow);
  if (willShow) {
    refreshSceneGraph();
    const firstMesh = chair.getObjectByName('SeatCushion');
    if (firstMesh) fresnelGUI.bind(firstMesh.material.userData.fresnelUniforms);
  }
}

btnDebug.addEventListener('click', () => toggleDebug());
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'd' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    toggleDebug();
  }
});

partSelect.addEventListener('change', () => {
  if (!debugOverlay.classList.contains('hidden')) {
    const meshes = materialConfig.registry[partSelect.value];
    if (meshes?.[0]) fresnelGUI.bind(meshes[0].material.userData.fresnelUniforms);
  }
});

btnDisposeDemo.addEventListener('click', () => {
  disposeLog.textContent = '';
  const log = (msg) => { disposeLog.textContent += msg + '\n'; disposeLog.scrollTop = disposeLog.scrollHeight; };
  runDisposeDemo(renderer, scene, log);
});

// Reset — demonstrates the full dispose pattern on the entire model
document.getElementById('btn-reset').addEventListener('click', () => {
  annotations.clearAll();
  disposeObject(chair);

  chair = buildChair();
  scene.add(chair);
  materialConfig = createMaterialConfigurator(getConfigurableParts(chair));
  explodedView = createExplodedView(chair);
  annotations.setTarget(chair);
  annotations.setActive(annotateMode);

  populatePartSelect();
  syncMaterialFieldsToSelection();
  if (!debugOverlay.classList.contains('hidden')) refreshSceneGraph();
});

// Render loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  explodedView.update(dt);
  controls.update();

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  perfMonitor.tick();
}

// Reveal the scene once the first frame is ready
requestAnimationFrame(() => {
  refreshSceneGraph();
  setTimeout(() => loadingVeil.classList.add('hidden'), 350);
});

animate();
