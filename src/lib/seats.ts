import * as THREE from 'three';
import type { SeatMap, SeatPavilion, SelectedSeat } from '@/types/stadium';

/** Metres above the instance's local seat-base origin, before world transforms. */
export const SEATED_EYE_HEIGHT = 1.15;

const POLYMER_PREFIX = 'WEB34C_SEATS_POLYMER_';
const FULL_TURN = Math.PI * 2;
const SECTOR_ANGLE = FULL_TURN / 8;
const TIER_NAMES = {
  lower: 'Lower tier',
  upper: 'Upper tier',
  single: 'Single tier',
};

interface SeatInstance {
  position: SelectedSeat['position'];
  eyePosition: SelectedSeat['eyePosition'];
  angle: number;
}

function comparePosition(a: SelectedSeat['position'], b: SelectedSeat['position']): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

/** A synthetic MODEL map of the real polymer instances, never official ticket numbers. */
export function buildSeatMap(
  root: THREE.Object3D,
  target: [number, number, number] = [0, 0.1, 0],
): SeatMap {
  if (!Array.isArray(target) || target.length !== 3 || !target.every(Number.isFinite)) {
    return { pavilions: [], seatCount: 0, numbering: 'model' };
  }
  root.parent?.updateWorldMatrix(true, false);
  root.updateMatrixWorld(true);

  const worldMatrix = new THREE.Matrix4();
  const origin = new THREE.Vector3();
  const eye = new THREE.Vector3();
  const uniqueSeats = new Map<string, SeatInstance>();

  root.traverse((object) => {
    const mesh = object as THREE.InstancedMesh;
    if (!mesh.isInstancedMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (!materials.some((material) => material.name.startsWith(POLYMER_PREFIX))) return;

    // A damaged count must not read beyond the instance buffer or loop indefinitely.
    if (!Number.isFinite(mesh.count)) return;
    const count = Math.min(Math.floor(mesh.count), mesh.instanceMatrix.count);
    for (let index = 0; index < count; index++) {
      mesh.getMatrixAt(index, worldMatrix);
      worldMatrix.premultiply(mesh.matrixWorld);
      if (!worldMatrix.elements.every(Number.isFinite) || Math.abs(worldMatrix.determinant()) < 1e-12) continue;

      origin.set(0, 0, 0).applyMatrix4(worldMatrix);
      eye.set(0, SEATED_EYE_HEIGHT, 0).applyMatrix4(worldMatrix);
      const position: SelectedSeat['position'] = [origin.x, origin.y, origin.z];
      const eyePosition: SelectedSeat['eyePosition'] = [eye.x, eye.y, eye.z];
      if (!position.every(Number.isFinite) || !eyePosition.every(Number.isFinite)) continue;

      // Exact coordinates deduplicate primitives without merging nearby real seats.
      const key = position.join(',');
      const existing = uniqueSeats.get(key);
      // Deterministic even if overlapping batches disagree about their orientation.
      if (existing && comparePosition(existing.eyePosition, eyePosition) <= 0) continue;
      let angle = Math.atan2(position[2] - target[2], position[0] - target[0]);
      if (angle < 0) angle += FULL_TURN;
      uniqueSeats.set(key, { position, eyePosition, angle });
    }
  });

  const sectors = Array.from({ length: 8 }, () => new Map<number, SeatInstance[]>());
  const heights = new Set<number>();
  for (const seat of uniqueSeats.values()) {
    // Centimetre buckets group model row elevations; returned coordinates stay untouched.
    const height = Math.round(seat.position[1] * 100) / 100;
    heights.add(height);
    // A starts at +X; letters and seat numbers advance toward +Z around the pitch.
    const sector = Math.min(7, Math.floor(seat.angle / SECTOR_ANGLE));
    const rows = sectors[sector];
    const row = rows.get(height);
    if (row) row.push(seat);
    else rows.set(height, [seat]);
  }

  const elevations = [...heights].sort((a, b) => a - b);
  let largestGap = 0;
  let nextLargestGap = 0;
  let gapIndex = 0;
  for (let index = 1; index < elevations.length; index++) {
    const gap = elevations[index] - elevations[index - 1];
    if (gap > largestGap) {
      nextLargestGap = largestGap;
      largestGap = gap;
      gapIndex = index;
    } else if (gap > nextLargestGap) {
      nextLargestGap = gap;
    }
  }
  // Require an unambiguous gap at least 3x every other row spacing. Two elevations
  // alone cannot distinguish a tier break from ordinary rows, so remain single-tier.
  const splitHeight = nextLargestGap > 0 && largestGap >= nextLargestGap * 3
    ? elevations[gapIndex]
    : null;

  const pavilions: SeatPavilion[] = [];
  for (let sector = 0; sector < sectors.length; sector++) {
    const letter = String.fromCharCode(65 + sector);
    const rows = [...sectors[sector]].sort(([a], [b]) => a - b);
    let pavilion: SeatPavilion | undefined;
    for (const [height, instances] of rows) {
      const tier = splitHeight === null ? 'single' : height < splitHeight ? 'lower' : 'upper';
      if (!pavilion || pavilion.tier !== tier) {
        pavilion = {
          id: `model-pavilion-${letter.toLowerCase()}-${tier}`,
          name: `Pavilion ${letter} · ${TIER_NAMES[tier]}`,
          tier,
          rows: [],
        };
        pavilions.push(pavilion);
      }

      const group = pavilion;
      const rowNumber = group.rows.length + 1;
      instances.sort((a, b) => a.angle - b.angle || comparePosition(a.position, b.position));
      group.rows.push({
        number: rowNumber,
        seats: instances.map((instance, index) => ({
          id: `model-seat-${instance.position.join(',')}`,
          standId: group.id,
          standName: group.name,
          blockId: `model-tier-${tier}`,
          blockName: TIER_NAMES[tier],
          row: rowNumber,
          seat: index + 1,
          isDemo: true,
          position: instance.position,
          eyePosition: instance.eyePosition,
          target: [...target],
        })),
      });
    }
  }

  return { pavilions, seatCount: uniqueSeats.size, numbering: 'model' };
}
