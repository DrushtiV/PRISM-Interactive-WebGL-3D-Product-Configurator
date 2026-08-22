import * as THREE from 'three';

/**
 * Builds a procedural office-chair model as a clean, shallow scene graph:
 *
 *   ChairGroup
 *     ├─ BackrestGroup   (mesh: backrest, mesh: headrest)
 *     ├─ SeatGroup        (mesh: seat cushion, mesh: seat base)
 *     ├─ ArmrestGroup     (mesh: armrestL, mesh: armrestR)
 *     └─ LegsGroup        (mesh: column, mesh: base, mesh x5: casters)
 *
 * No external assets are fetched — geometry is generated so the project runs fully offline. Swap this module out for a GLTFLoader call if you
 * want to drop in a real CAD export later (see README).
 */

const MAT_DEFAULTS = {
  backrest:  { color: '#3a4048', roughness: 0.65, metalness: 0.05 },
  seat:      { color: '#8a8f98', roughness: 0.55, metalness: 0.10 },
  armrests:  { color: '#1c1f24', roughness: 0.4,  metalness: 0.3  },
  legs:      { color: '#c7cbd1', roughness: 0.25, metalness: 0.85 },
};

function stdMat(name, overrides = {}) {
  const d = { ...MAT_DEFAULTS[name], ...overrides };
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(d.color),
    roughness: d.roughness,
    metalness: d.metalness,
  });
  mat.name = name;
  return mat;
}

export function buildChair() {
  const chair = new THREE.Group();
  chair.name = 'ChairGroup';

  // ---------- Legs / base ----------
  const legsGroup = new THREE.Group();
  legsGroup.name = 'LegsGroup';

  const legsMat = stdMat('legs');

  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 0.42, 20),
    legsMat
  );
  column.name = 'GasColumn';
  column.position.y = 0.21;
  column.castShadow = true;
  legsGroup.add(column);

  const baseHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.05, 20),
    legsMat
  );
  baseHub.name = 'BaseHub';
  baseHub.position.y = 0.025;
  baseHub.castShadow = true;
  legsGroup.add(baseHub);

  const casterCount = 5;
  for (let i = 0; i < casterCount; i++) {
    const angle = (i / casterCount) * Math.PI * 2;
    const legArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.014, 0.22, 4, 8),
      legsMat
    );
    legArm.name = `CasterArm_${i}`;
    legArm.rotation.z = Math.PI / 2;
    legArm.rotation.y = -angle;
    legArm.position.set(Math.cos(angle) * 0.13, 0.035, Math.sin(angle) * 0.13);
    legArm.castShadow = true;
    legsGroup.add(legArm);

    const wheel = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 12, 12),
      legsMat
    );
    wheel.name = `CasterWheel_${i}`;
    wheel.position.set(Math.cos(angle) * 0.235, 0.022, Math.sin(angle) * 0.235);
    wheel.castShadow = true;
    legsGroup.add(wheel);
  }
  chair.add(legsGroup);

  // ---------- Seat ----------
  const seatGroup = new THREE.Group();
  seatGroup.name = 'SeatGroup';
  seatGroup.position.y = 0.44;

  const seatMat = stdMat('seat');

  const seatBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.06, 12),
    legsMat.clone()
  );
  seatBase.name = 'SeatMount';
  seatBase.position.y = -0.03;
  seatGroup.add(seatBase);

  const seatCushion = roundedBox(0.46, 0.09, 0.44, 0.05);
  seatCushion.name = 'SeatCushion';
  seatCushion.material = seatMat;
  seatCushion.position.y = 0.045;
  seatCushion.castShadow = true;
  seatCushion.receiveShadow = true;
  seatGroup.add(seatCushion);

  chair.add(seatGroup);

  // ---------- Backrest ----------
  const backrestGroup = new THREE.Group();
  backrestGroup.name = 'BackrestGroup';
  backrestGroup.position.set(0, 0.5, -0.19);
  backrestGroup.rotation.x = -0.12;

  const backrestMat = stdMat('backrest');

  const backSupport = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.3, 10),
    legsMat.clone()
  );
  backSupport.name = 'BackSupportL';
  backSupport.position.set(-0.16, 0.02, 0.03);
  backrestGroup.add(backSupport);

  const backSupportR = backSupport.clone();
  backSupportR.name = 'BackSupportR';
  backSupportR.position.x = 0.16;
  backrestGroup.add(backSupportR);

  const backPanel = roundedBox(0.42, 0.5, 0.06, 0.08);
  backPanel.name = 'BackrestPanel';
  backPanel.material = backrestMat;
  backPanel.position.y = 0.24;
  backPanel.castShadow = true;
  backrestGroup.add(backPanel);

  const headrest = roundedBox(0.24, 0.13, 0.05, 0.05);
  headrest.name = 'Headrest';
  headrest.material = backrestMat.clone();
  headrest.position.y = 0.55;
  headrest.castShadow = true;
  backrestGroup.add(headrest);

  const lumbar = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.02, 8, 20, Math.PI),
    backrestMat.clone()
  );
  lumbar.name = 'LumbarSupport';
  lumbar.rotation.set(Math.PI / 2, 0, Math.PI);
  lumbar.position.set(0, 0.1, 0.035);
  lumbar.castShadow = true;
  backrestGroup.add(lumbar);

  chair.add(backrestGroup);

  // ---------- Armrests ----------
  const armrestGroup = new THREE.Group();
  armrestGroup.name = 'ArmrestGroup';
  armrestGroup.position.y = 0.44;

  const armMat = stdMat('armrests');

  [-1, 1].forEach((side) => {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.022, 0.18, 10),
      armMat
    );
    post.name = `ArmPost_${side < 0 ? 'L' : 'R'}`;
    post.position.set(side * 0.21, 0.09, 0.02);
    post.castShadow = true;
    armrestGroup.add(post);

    const pad = roundedBox(0.09, 0.03, 0.22, 0.015);
    pad.name = `ArmPad_${side < 0 ? 'L' : 'R'}`;
    pad.material = armMat.clone();
    pad.position.set(side * 0.21, 0.19, 0.0);
    pad.castShadow = true;
    armrestGroup.add(pad);
  });

  chair.add(armrestGroup);

  chair.traverse((o) => {
    if (o.isMesh) {
      o.userData.partGroup = o.parent?.name || 'Chair';
    }
  });

  return chair;
}

function roundedBox(w, h, d, radius) {
  const shape = roundedRectShape(w, h, radius);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: true,
    bevelThickness: radius * 0.4,
    bevelSize: radius * 0.4,
    bevelSegments: 3,
    curveSegments: 8,
  });
  geo.center();
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial());
}

function roundedRectShape(w, h, r) {
  const shape = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  shape.moveTo(x, y + r);
  shape.lineTo(x, y + h - r);
  shape.quadraticCurveTo(x, y + h, x + r, y + h);
  shape.lineTo(x + w - r, y + h);
  shape.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
  shape.lineTo(x + w, y + r);
  shape.quadraticCurveTo(x + w, y, x + w - r, y);
  shape.lineTo(x + r, y);
  shape.quadraticCurveTo(x, y, x, y + r);
  return shape;
}

/** Named, selectable parts exposed to the Materials panel. */
export function getConfigurableParts(chair) {
  return {
    'Seat Cushion': chair.getObjectByName('SeatCushion'),
    'Backrest Panel': chair.getObjectByName('BackrestPanel'),
    'Headrest': chair.getObjectByName('Headrest'),
    'Armrest Pads (L+R)': [
      chair.getObjectByName('ArmPad_L'),
      chair.getObjectByName('ArmPad_R'),
    ],
    'Base & Column': [
      chair.getObjectByName('GasColumn'),
      chair.getObjectByName('BaseHub'),
    ],
  };
}
