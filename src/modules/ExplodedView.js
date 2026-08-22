import * as THREE from 'three';

/**
 * Exploded view animation.
 *
 * For each top-level sub-assembly group (Backrest, Seat, Armrests, Legs) we precompute an outward direction from the model's center, then tween
 * each group's local position along that vector. Because everything is driven by a single eased progress value (0 → 1), the whole assembly
 * detaches and reassembles as one coordinated motion rather than parts drifting independently.
 */
export function createExplodedView(chairGroup) {
  const parts = chairGroup.children.filter((c) => c.isGroup);
  const basePositions = parts.map((p) => p.position.clone());

  const directions = parts.map((p) => {
    const dir = new THREE.Vector3(
      p.name === 'ArmrestGroup' ? 0 : (Math.random() - 0.5) * 0.3,
      p.name === 'LegsGroup' ? -1 : p.name === 'BackrestGroup' ? 0.3 : 1,
      p.name === 'BackrestGroup' ? -1 : p.name === 'ArmrestGroup' ? 0 : 0.15
    );
    if (p.name === 'ArmrestGroup') dir.set(0, 0.2, 1.1);
    if (p.name === 'SeatGroup') dir.set(0, 1.1, 0.1);
    if (p.name === 'LegsGroup') dir.set(0, -1.1, 0);
    if (p.name === 'BackrestGroup') dir.set(0, 0.4, -1.2);
    return dir.normalize();
  });

  const EXPLODE_DISTANCE = 0.42;
  let progress = 0; // 0 = assembled, 1 = exploded
  let target = 0;
  let exploded = false;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function toggle() {
    exploded = !exploded;
    target = exploded ? 1 : 0;
    return exploded;
  }

  function update(deltaSeconds) {
    if (Math.abs(progress - target) < 0.0005) {
      progress = target;
      return false;
    }
    const speed = 1.8; // full transition ~0.55s
    progress += Math.sign(target - progress) * speed * deltaSeconds;
    progress = THREE.MathUtils.clamp(progress, 0, 1);
    const eased = easeInOutCubic(progress);

    parts.forEach((p, i) => {
      const offset = directions[i].clone().multiplyScalar(EXPLODE_DISTANCE * eased);
      p.position.copy(basePositions[i]).add(offset);
    });
    return true;
  }

  return { toggle, update, get isExploded() { return exploded; } };
}
