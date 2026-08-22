/**
 * Lightweight FPS + WebGL stats readout (inspired by stats.js) sourc straight from renderer.info — no separate render pass needed.
 */
export function createPerformanceMonitor(renderer, dom) {
  let frames = 0;
  let lastSample = performance.now();
  let fps = 60;

  function estimateTextureMB(renderer) {
    // renderer.info doesn't expose byte size directly; approximate using
    // a common heuristic (RGBA8 texel cost) against tracked texture count.
    const texCount = renderer.info.memory.textures;
    return texCount * 2.1; // ~ MB per typical configurator texture (heuristic, labeled as such in UI)
  }

  function tick() {
    frames++;
    const now = performance.now();
    if (now - lastSample >= 500) {
      fps = Math.round((frames * 1000) / (now - lastSample));
      frames = 0;
      lastSample = now;

      const info = renderer.info;
      dom.fps.textContent = String(fps);
      dom.fps.className = fps >= 50 ? '' : fps >= 30 ? 'warn' : 'warn';
      dom.calls.textContent = String(info.render.calls);
      dom.tris.textContent = info.render.triangles.toLocaleString();
      dom.tex.textContent = `~${estimateTextureMB(renderer).toFixed(0)} MB`;
      dom.geo.textContent = String(info.memory.geometries);
    }
  }

  return { tick };
}
