import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

/**
 * Real-time interactive annotations.
 * A ray is cast from the camera through the mouse's normalized device coordinates (NDC). On hit, we read the intersection's local point and
 * face normal, then parent a CSS2DObject directly onto the intersected mesh — because the marker is a child of the mesh (not the scene), it
 * inherits the mesh's transform automatically and stays pinned to that exact spot through orbit, zoom, and the exploded-view animation.
 */
export function createAnnotationSystem({ camera, target, css2dLayer, onListChange }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const notes = []; // { id, marker(CSS2DObject), text, partName }
  let idCounter = 1;
  let active = false;
  let currentTarget = target;

  function setActive(v) {
    active = v;
  }

  function setTarget(newTarget) {
    currentTarget = newTarget;
  }

  function toNDC(clientX, clientY, domElement) {
    const rect = domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  /** Returns the intersection (or null) for a click — used to open the note modal. */
  function pick(clientX, clientY, domElement) {
    if (!active) return null;
    toNDC(clientX, clientY, domElement);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(currentTarget, true);
    if (!hits.length) return null;
    return hits[0];
  }

  function addNote(intersection, text) {
    const mesh = intersection.object;
    const localPoint = mesh.worldToLocal(intersection.point.clone());

    const wrapper = document.createElement('div');
    const dot = document.createElement('div');
    dot.className = 'note-marker';
    const id = idCounter++;
    dot.textContent = String(id);
    dot.title = text;
    wrapper.appendChild(dot);

    const label = document.createElement('div');
    label.className = 'note-label';
    label.textContent = text;
    label.style.display = 'none';
    wrapper.appendChild(label);

    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      label.style.display = label.style.display === 'none' ? 'block' : 'none';
    });

    const cssObj = new CSS2DObject(wrapper);
    cssObj.position.copy(localPoint);
    mesh.add(cssObj); // parented -> travels with the mesh (explode, rotate, etc.)

    const note = { id, marker: cssObj, text, partName: mesh.name, mesh };
    notes.push(note);
    onListChange?.(notes);
    return note;
  }

  function removeNote(id) {
    const idx = notes.findIndex((n) => n.id === id);
    if (idx === -1) return;
    const note = notes[idx];
    note.mesh.remove(note.marker);
    notes.splice(idx, 1);
    onListChange?.(notes);
  }

  function clearAll() {
    [...notes].forEach((n) => removeNote(n.id));
  }

  return { setActive, setTarget, pick, addNote, removeNote, clearAll, get notes() { return notes; } };
}
