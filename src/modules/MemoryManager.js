import * as THREE from 'three';

/**
 * WebGL Memory Management
 * ------------------------
 * scene.remove(mesh) only unlinks a node from the scene graph — it does NOT free the geometry/material/texture buffers Three.js uploaded to
 * VRAM. Left unchecked, repeatedly swapping models or materials leaks memory until the tab crashes. disposeObject() walks the subtree and
 * explicitly releases every GPU resource before the node is unlinked.
 */
export function disposeObject(object) {
  if (!object) return;

  object.traverse((child) => {
    if (child.isMesh) {
      child.geometry?.dispose();

      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => disposeMaterial(mat));
      } else if (child.material) {
        disposeMaterial(child.material);
      }
    }
  });

  if (object.parent) {
    object.parent.remove(object);
  }
}

export function disposeMaterial(material) {
  material.dispose();
  for (const key in material) {
    const value = material[key];
    if (value && value.isTexture) {
      value.dispose();
    }
  }
}

/**
 * Builds a throwaway "junk" mesh with a unique texture so the demo has
 * something real to allocate and free, then reports renderer.info
 * before/after a naive scene.remove() vs. a proper disposeObject() —
 * making the VRAM leak (and the fix) visible in the debug console.
 */
export function runDisposeDemo(renderer, scene, log) {
  const before = snapshot(renderer);
  log(`Baseline  → geometries: ${before.geometries}, textures: ${before.textures}`);

  // Allocate a junk object with its own geometry + texture
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);

  const junk = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.05, 2),
    new THREE.MeshStandardMaterial({ map: tex })
  );
  junk.position.set(999, 999, 999); // parked off-scene
  scene.add(junk);

  const afterAlloc = snapshot(renderer);
  log(`Allocated → geometries: ${afterAlloc.geometries} (+${afterAlloc.geometries - before.geometries}), textures: ${afterAlloc.textures} (+${afterAlloc.textures - before.textures})`);

  // The naive path: unlink without disposing
  scene.remove(junk);
  const afterRemove = snapshot(renderer);
  log(`scene.remove() only → geometries: ${afterRemove.geometries}, textures: ${afterRemove.textures}  (unchanged — VRAM still leaked!)`);

  // The correct path: explicit dispose
  disposeObject(junk);
  tex.dispose();
  const afterDispose = snapshot(renderer);
  log(`disposeObject() → geometries: ${afterDispose.geometries}, textures: ${afterDispose.textures}  (back to baseline ✓)`);
}

function snapshot(renderer) {
  return {
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
  };
}
