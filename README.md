# PRISM — Interactive CAD/3D Product Configurator

A studio-quality WebGL product configurator built with **Three.js** and **Vite**. It renders a fully procedural office chair (no external model files needed — runs 100% offline) and demonstrates the engineering side of real-time 3D: dynamic PBR material swapping, raycast annotations, exploded-view assembly animation, environment/lighting presets, custom GLSL shader effects layered on top of physically based rendering, and explicit WebGL memory management.

![tech](https://img.shields.io/badge/three.js-0.169-49d5e8) ![tech](https://img.shields.io/badge/vite-5.4-646cff) ![tech](https://img.shields.io/badge/license-MIT-8a8f98)

---

## Demo

<!-- Screenshot Preview -->
<img width="1926" height="919" alt="Img_Preview" src="https://github.com/user-attachments/assets/7f9b7e0a-592e-40f2-95c1-09525a0c739b" />

---

<!-- Inline Autoplay Video Preview -->
<img width="1930" height="900" alt="demo (2)" src="https://github.com/user-attachments/assets/d3bb70d1-7615-4517-b990-abc01e23a233" />


## 1. What's inside

| Feature | Where |
|---|---|
| Procedural chair with a clean scene graph (`Chair > Seat / Backrest / Armrests / Legs`) | `src/modules/ChairModel.js` |
| Dynamic material swapping (color / roughness / metalness) per part | `src/modules/MaterialConfigurator.js` |
| Custom Fresnel rim-light GLSL, layered on `MeshStandardMaterial` via `onBeforeCompile` | `src/modules/CustomShaders.js` |
| Raycast-based spatial annotations pinned to the mesh (survive rotation/zoom/explode) | `src/modules/Annotations.js` |
| Exploded-view assembly animation | `src/modules/ExplodedView.js` |
| Studio / Office / Outdoors lighting + environment presets (PMREM) | `src/modules/EnvironmentPresets.js` |
| Live FPS / draw call / triangle / texture / geometry HUD | `src/modules/PerformanceMonitor.js` |
| Debug overlay: live scene-graph tree + shader uniform sliders (lil-gui), toggled with **D** | `src/modules/DebugPanel.js` |
| Explicit dispose pattern for geometries/materials/textures, with a visible VRAM leak demo | `src/modules/MemoryManager.js` |
| Scene/camera/renderer bootstrap, OrbitControls, CSS2D label layer | `src/modules/SceneSetup.js` |

---

## 2. Prerequisites

You need **Node.js 18 or newer** (Node 20 LTS recommended) and **npm** (comes bundled with Node).

Check what you have installed:

```bash
node -v
npm -v
```

If you don't have Node installed:

- **Windows / macOS**: download the LTS installer from [Node.js](https://nodejs.org) and run it.
- **macOS (Homebrew)**: `brew install node`
- **Linux (Debian/Ubuntu)**: `sudo apt update && sudo apt install nodejs npm`
- Or use **nvm** (recommended if you juggle multiple Node versions): https://github.com/nvm-sh/nvm

No GPU-specific drivers are required beyond a browser with WebGL2 support (any current Chrome, Edge, Firefox, or Safari).

---

## 3. Installation

1. Unzip / clone the project, then open a terminal in the project's root folder (the one containing `package.json`).
2. Install dependencies:

```bash
npm install
```

This pulls exactly two runtime packages — `three` (the rendering engine) and `lil-gui` (the debug-panel sliders) — plus `vite` as the dev/build tool.

---

## 4. Running it locally (development mode)

```bash
npm run dev
```

Vite will start a local dev server and print a URL, typically:

```
  VITE v5.4.x  ready in 400 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open that URL in your browser. Changes to any file under `src/` hot-reload instantly — no manual refresh needed.

To stop the server, press `Ctrl + C` in the terminal.

**If port 5173 is already in use**, Vite automatically picks the next free port — check the terminal output for the actual URL, or force one with `npm run dev -- --port 3000`.

---

## 5. Building for production

```bash
npm run build
```

This type-checks nothing (it's plain JS) but bundles, minifies, and tree-shakes everything into a `dist/` folder — typically a single small CSS file and one JS bundle (~150 KB gzipped), plus `index.html`.

Preview the production build locally before deploying:

```bash
npm run preview
```

This serves the contents of `dist/` at another local URL so you can sanity-check the real build (not the dev server) before shipping it.

---

## 6. Deploying to GitHub Pages

`vite.config.js` is already set to `base: './'` (relative asset paths), so the build works from any subpath without extra configuration — including a GitHub Pages **project site** (`https://username.github.io/repo-name/`).

**Option A — gh-pages branch via a helper package (simplest):**

```bash
npm install --save-dev gh-pages
```

Add this to the `"scripts"` section of `package.json`:

```json
"deploy": "vite build && gh-pages -d dist"
```

Then deploy:

```bash
npm run deploy
```

This pushes the contents of `dist/` to a `gh-pages` branch. In your GitHub repo, go to **Settings → Pages** and set the source to the `gh-pages` branch (`/root`).

**Option B — GitHub Actions (auto-deploy on every push to `main`):**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Then in **Settings → Pages**, set the source to **GitHub Actions**. Every push to `main` will rebuild and redeploy automatically.

**Option C — manual upload:** run `npm run build`, then upload the contents of `dist/` to any static host (Netlify, Vercel, Cloudflare Pages, an S3 bucket, etc.) — no server-side code is required anywhere in this project.

---

## 7. Using the app

- **Orbit / zoom** — left-drag to rotate, scroll to zoom, right-drag to pan (standard OrbitControls).
- **Materials panel** (right sidebar) — pick a part from the dropdown, then adjust color, roughness, metalness, and the custom Fresnel rim intensity. Click a swatch for a quick color preset.
- **Environment panel** — switch between Studio / Office / Outdoors lighting rigs, adjust key-light intensity, toggle soft contact shadows.
- **Camera panel** — jump to Front / 3-quarter / Side / Top framing, adjust field of view, or enable auto-rotate.
- **Exploded View** (top bar) — animates the sub-assemblies apart to reveal the internal structure; click again to reassemble.
- **Annotate** (top bar) — click the button, then click anywhere on the model to drop a pinned, numbered note. Notes travel with the mesh through rotation, zoom, and the exploded-view animation. Manage them from the **Annotations** accordion.
- **Debug** (top bar, or hotkey **D**) — opens the scene-graph tree and the live shader-uniform sliders for the currently selected part's Fresnel effect, plus a one-click VRAM dispose demo with console-style output.
- **Reset** — disposes the entire model (geometries, materials, textures) and rebuilds it from scratch, demonstrating the proper cleanup pattern described below.

---

## 8. Notes on the engineering choices

- **No external 3D assets.** The chair is built entirely from primitive geometries grouped into a shallow, named hierarchy (`ChairGroup > SeatGroup / BackrestGroup / ArmrestGroup / LegsGroup`), so the project runs the moment you clone it — nothing to download or host separately. Swap `buildChair()` in `src/modules/ChairModel.js` for a `GLTFLoader` call if you want to drop in a real CAD export; the rest of the app (materials, annotations, exploded view, debug tools) works against any object with a similar named-group structure.
- **Custom shaders on top of PBR, not instead of it.** Rather than writing a full custom `ShaderMaterial` (which would mean re-implementing lighting from scratch), the Fresnel rim effect is injected into `MeshStandardMaterial`'s compiled shader via `onBeforeCompile`. This keeps real PBR lighting, shadows, and environment reflections while adding a bespoke GLSL term — the same technique used for "dissolve" or "hologram" transitions in production configurators.
- **Environment presets** use a generated PMREM environment map (`RoomEnvironment`) for reflections, combined with a rebuilt three-point light rig (key / fill / rim + hemisphere) per preset. This keeps the project dependency-free; if you want real HDRI photography, add `RGBELoader` and drop `.hdr` files under `public/hdri/`.
- **WebGL memory management.** `scene.remove(mesh)` only unlinks a node from the scene graph — it does not free the GPU buffers Three.js uploaded for its geometry, material, and textures. `src/modules/MemoryManager.js` implements the explicit dispose pattern (traverse → dispose geometry → dispose material → dispose each texture on the material → unlink), and the Debug panel's **Run Dispose Demo** button makes the leak (and the fix) visible by reading `renderer.info.memory` before and after each step.

---

## 9. Project structure

```text
prism-configurator/
├── index.html                  # App shell: viewport, control panel, overlays
├── vite.config.js              # base: './' for portable static hosting
├── package.json
├── src/
│   ├── main.js                 # Orchestrates modules + wires up all UI events
│   ├── style.css                # Dark, blueprint-grid CAD theme
│   └── modules/
│       ├── SceneSetup.js        # Renderer, camera, OrbitControls, CSS2D layer
│       ├── ChairModel.js        # Procedural geometry + named scene graph
│       ├── MaterialConfigurator.js
│       ├── CustomShaders.js     # Fresnel onBeforeCompile injection
│       ├── EnvironmentPresets.js
│       ├── Annotations.js       # Raycasting + CSS2DObject notes
│       ├── ExplodedView.js
│       ├── PerformanceMonitor.js
│       └── DebugPanel.js        # Scene graph tree + lil-gui uniforms
└── README.md
```

---

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| `npm install` fails with permission errors | Avoid `sudo npm install`; instead fix npm's default directory permissions or use `nvm` to manage Node locally. |
| Blank page after `npm run dev` | Open the browser console — most often a browser without WebGL2 support, or an ad-blocker/extension interfering with the Google Fonts `<link>` tags (safe to remove those two `<link>` tags in `index.html` if needed). |
| Model looks unlit / black | Check the **Environment** panel — key light intensity may have been dragged to 0. |
| Slow performance on older GPUs | Lower `renderer.setPixelRatio` in `src/modules/SceneSetup.js` (e.g. cap at `1` instead of `Math.min(window.devicePixelRatio, 2)`), or disable shadows via the Environment panel toggle. |
| GitHub Pages shows a blank page with 404s in console | Confirm `base: './'` is still set in `vite.config.js` and that you deployed the contents of `dist/` (not the project root). |

---

Built as a portfolio piece demonstrating real-time WebGL/Three.js engineering: scene graph design, PBR + custom GLSL, raycasting, animation, and explicit GPU memory management.
