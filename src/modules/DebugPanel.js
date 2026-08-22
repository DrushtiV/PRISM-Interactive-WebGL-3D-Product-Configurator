import GUI from 'lil-gui';

/**
 * Debug / advanced tools overlay — toggled with the 'D' hotkey. Two pieces: a live scene-graph text tree, and a lil-gui panel bound to
 * the currently-selected mesh's custom Fresnel uniforms.
 */
export function renderSceneGraphTree(root, mountEl) {
  const lines = [];

  function walk(obj, depth) {
    const indent = '  '.repeat(depth);
    const type = obj.isMesh ? 'Mesh' : obj.isGroup ? 'Group' : obj.type;
    const cls = obj.isMesh ? 'sg-mesh' : obj.isGroup ? 'sg-group' : '';
    lines.push(
      `<div class="sg-node ${cls}">${indent}${depth ? '└─ ' : ''}${obj.name || '(unnamed)'} <span class="sg-type">[${type}]</span></div>`
    );
    obj.children.forEach((c) => walk(c, depth + 1));
  }

  walk(root, 0);
  mountEl.innerHTML = lines.join('');
}

export function createFresnelGUI(mountEl) {
  const gui = new GUI({ container: mountEl, title: 'Uniforms' });
  let currentUniforms = null;
  const state = { fresnelBias: 0.05, fresnelScale: 0, fresnelPower: 2.2 };

  const controllers = {
    bias: gui.add(state, 'fresnelBias', 0, 0.5, 0.01).name('fresnelBias').onChange((v) => {
      if (currentUniforms) currentUniforms.fresnelBias.value = v;
    }),
    scale: gui.add(state, 'fresnelScale', 0, 1, 0.01).name('fresnelScale').onChange((v) => {
      if (currentUniforms) currentUniforms.fresnelScale.value = v;
    }),
    power: gui.add(state, 'fresnelPower', 0.5, 6, 0.1).name('fresnelPower').onChange((v) => {
      if (currentUniforms) currentUniforms.fresnelPower.value = v;
    }),
  };

  function bind(uniforms) {
    currentUniforms = uniforms;
    if (!uniforms) return;
    state.fresnelBias = uniforms.fresnelBias.value;
    state.fresnelScale = uniforms.fresnelScale.value;
    state.fresnelPower = uniforms.fresnelPower.value;
    Object.values(controllers).forEach((c) => c.updateDisplay());
  }

  return { bind };
}
