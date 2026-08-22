import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Three lighting/background presets. Each swaps the scene environment map (used for PBR reflections) and rebuilds a small light rig — a stand-in
 * for swapping real HDRI files, which keeps this project runnable fully offline. Drop in RGBELoader + real .hdr assets under /public/hdri if
 * you want to go further (see README).
 */
export const PRESET_NAMES = ['Studio', 'Office', 'Outdoors'];

export function createEnvironmentSystem(renderer, scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const roomEnvTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const rig = new THREE.Group();
  rig.name = 'LightRig';
  scene.add(rig);

  let keyLight, fillLight, rimLight, hemi, ground;

  function clearRig() {
    while (rig.children.length) {
      const c = rig.children.pop();
      c.dispose?.();
      rig.remove(c);
    }
  }

  function buildLights({ bg, keyColor, fillColor, hemiSky, hemiGround, groundColor }) {
    clearRig();
    scene.background = new THREE.Color(bg);
    scene.environment = roomEnvTexture;
    scene.environmentIntensity = 1.0;

    hemi = new THREE.HemisphereLight(hemiSky, hemiGround, 0.6);
    rig.add(hemi);

    keyLight = new THREE.DirectionalLight(keyColor, 1.4);
    keyLight.position.set(1.6, 2.4, 1.3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 6;
    keyLight.shadow.camera.left = -1.2;
    keyLight.shadow.camera.right = 1.2;
    keyLight.shadow.camera.top = 1.2;
    keyLight.shadow.camera.bottom = -1.2;
    keyLight.shadow.radius = 4;
    keyLight.shadow.bias = -0.0015;
    rig.add(keyLight);

    fillLight = new THREE.DirectionalLight(fillColor, 0.5);
    fillLight.position.set(-1.8, 1.0, -1.2);
    rig.add(fillLight);

    rimLight = new THREE.DirectionalLight(0xffffff, 0.35);
    rimLight.position.set(0, 1.2, -2);
    rig.add(rimLight);

    ground = new THREE.Mesh(
      new THREE.CircleGeometry(3, 48),
      new THREE.ShadowMaterial({ opacity: 0.28, color: groundColor })
    );
    ground.name = 'GroundShadowCatcher';
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    rig.add(ground);

    return { keyLight, fillLight, rimLight, hemi, ground };
  }

  const presets = {
    Studio: () => buildLights({
      bg: '#101215',
      keyColor: 0xffffff,
      fillColor: 0x8fb7ff,
      hemiSky: 0x3a3f47, hemiGround: 0x0a0a0c,
      groundColor: 0x000000,
    }),
    Office: () => buildLights({
      bg: '#1c1a17',
      keyColor: 0xfff1d6,
      fillColor: 0xffe0b0,
      hemiSky: 0x554a3a, hemiGround: 0x14110d,
      groundColor: 0x1a1208,
    }),
    Outdoors: () => buildLights({
      bg: '#8fb8d9',
      keyColor: 0xfff6e0,
      fillColor: 0xbcd6f2,
      hemiSky: 0x9fc6e8, hemiGround: 0x4c5a3a,
      groundColor: 0x1c2a14,
    }),
  };

  function apply(name) {
    (presets[name] || presets.Studio)();
  }

  function setKeyIntensity(v) {
    if (keyLight) keyLight.intensity = v;
  }

  function setShadowsEnabled(enabled) {
    if (keyLight) keyLight.castShadow = enabled;
    if (ground) ground.visible = enabled;
  }

  return { apply, setKeyIntensity, setShadowsEnabled, rig };
}
