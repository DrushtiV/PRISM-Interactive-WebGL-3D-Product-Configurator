import * as THREE from 'three';
import { attachFresnel, setFresnelScale, getFresnelScale } from './CustomShaders.js';

export const COLOR_PRESETS = [
  '#8a8f98', '#1c1f24', '#c7cbd1', '#49d5e8',
  '#f5a623', '#e14b4b', '#3a4048', '#e7eaef',
];

/**
 * Wraps the chair's configurable parts, ensures every mesh has its own material instance (geometry stays shared where possible; shaders
 * refresh independently), and attaches the custom Fresnel uniform to each so the "Fresnel Rim" slider works on any selected part.
 */
export function createMaterialConfigurator(parts) {
  // Normalize to { label: THREE.Mesh[] }
  const registry = {};
  for (const [label, val] of Object.entries(parts)) {
    registry[label] = Array.isArray(val) ? val.filter(Boolean) : [val].filter(Boolean);
  }

  // Ensure unique material instances + fresnel uniforms per mesh
  for (const meshes of Object.values(registry)) {
    meshes.forEach((mesh) => {
      if (!mesh.material.isMeshStandardMaterial) return;
      mesh.material = mesh.material.clone();
      attachFresnel(mesh.material);
    });
  }

  function getMeshes(label) {
    return registry[label] || [];
  }

  function applyColor(label, hexColor) {
    getMeshes(label).forEach((m) => m.material.color.set(hexColor));
  }

  function applyRoughness(label, value) {
    getMeshes(label).forEach((m) => (m.material.roughness = value));
  }

  function applyMetalness(label, value) {
    getMeshes(label).forEach((m) => (m.material.metalness = value));
  }

  function applyFresnel(label, value) {
    getMeshes(label).forEach((m) => setFresnelScale(m.material, value));
  }

  function readState(label) {
    const mesh = getMeshes(label)[0];
    if (!mesh) return null;
    return {
      color: `#${mesh.material.color.getHexString()}`,
      roughness: mesh.material.roughness,
      metalness: mesh.material.metalness,
      fresnel: getFresnelScale(mesh.material),
    };
  }

  return {
    labels: Object.keys(registry),
    registry,
    applyColor,
    applyRoughness,
    applyMetalness,
    applyFresnel,
    readState,
  };
}
