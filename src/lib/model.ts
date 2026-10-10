import * as THREE from 'three';
import type { LayerKey } from '@/types/stadium';

const STADIUM_LAYERS = ['stadium', 'pitch', 'seats', 'environment', 'roads', 'parking'] as const;
export type StadiumLayer = typeof STADIUM_LAYERS[number];

// This checkpoint tags the detached players' pavilion as stadium architecture.
// The export report confirms these six batches contain only that site building.
// Exclude them from the stadium-only viewer without changing the saved asset.
const DETACHED_PAVILION_BATCHES = new Set([
  'WEB34C_STADIUM_055_MAT_D2_Facade_Concrete',
  'WEB34C_STADIUM_056_MAT_D2_Facade_Glass',
  'WEB34C_STADIUM_057_MAT_D2_Facade_Metal',
  'WEB34C_STADIUM_058_MAT_D2_Facade_Plaster',
  'WEB34C_STADIUM_059_MAT_D2_Plaza_Paving',
  'WEB34C_STADIUM_060_MAT_D2_Roof_Membrane',
]);

// Viewer-only replacements in StadiumModel supply turf, rope and wicket detail.
// Keep the saved GLB intact, but never draw its overlapping study surfaces too.
const REPLACED_FIELD_BATCHES = new Set([
  'WEB34C_PITCH_030_HF27_Pitch_Boundary_Approximat',
  'WEB34C_PITCH_031_HF27_Pitch_Central_Strip',
  'WEB34C_PITCH_032_HF27_Pitch_Central_Wicket_Area',
  'WEB34C_PITCH_033_HF27_Pitch_Cricket_Outfield',
  'WEB34C_PITCH_035_NMS_HF_Grass',
  'WEB34C_PITCH_037_Study_field',
  'WEB34C_PITCH_038_Study_site',
]);

export interface BoundsSummary {
  center: [number, number, number];
  radius: number;
  height: number;
}

export interface ModelBounds extends BoundsSummary {
  /** Stadium-only clipping bounds; excluded surroundings never contribute. */
  full?: BoundsSummary;
  /** Bounds of the exported playing surface, used by the pitch preset. */
  pitch?: BoundsSummary;
  /** Prepared wicket square, when runtime cricket detail is present. */
  wicket?: BoundsSummary;
}

function isStadiumLayer(value: unknown): value is StadiumLayer {
  return STADIUM_LAYERS.some((layer) => layer === value);
}

function layerFromName(name: string): StadiumLayer | undefined {
  const exportedLayer = /^WEB34C_(STADIUM|PITCH|SEATS|ENVIRONMENT|ROADS|PARKING)(?:_|$)/i.exec(name);
  if (exportedLayer) return exportedLayer[1].toLowerCase() as StadiumLayer;
  // Match specific site subsets before their shared environment prefix.
  if (/(?:^|_)Parking(?:_|$)/i.test(name)) return 'parking';
  if (/AccessRoad|PedestrianPlaza|Driveway|Access_Ribbon|Forecourt|^Web_Near_Roads|^Near_Road/i.test(name)) return 'roads';
  if (/Seating_Detail|^Seats?_/i.test(name)) return 'seats';
  if (/^(Pitch_|Step20_Pitch_)/i.test(name)) return 'pitch';
  if (/^(Step21_Environment|Web_Environment|Near_|Environment)/i.test(name)) return 'environment';
  return undefined;
}

/** Correct the known detached pavilion, then prefer metadata over name heuristics. */
export function getStadiumLayer(object: THREE.Object3D): StadiumLayer {
  for (let current: THREE.Object3D | null = object; current; current = current.parent) {
    if (DETACHED_PAVILION_BATCHES.has(current.name)) return 'environment';
  }
  for (let current: THREE.Object3D | null = object; current; current = current.parent) {
    if (isStadiumLayer(current.userData.stadiumLayer)) return current.userData.stadiumLayer;
  }
  for (let current: THREE.Object3D | null = object; current; current = current.parent) {
    const layer = layerFromName(current.name);
    if (layer) return layer;
  }
  return 'stadium';
}

export function isStadiumLayerVisible(layer: StadiumLayer, layers: Record<LayerKey, boolean>): boolean {
  if (!layers.stadium) return false;
  switch (layer) {
    // Stadium-only is a viewer policy, not a default that stale layer state can undo.
    case 'environment':
    case 'roads':
    case 'parking': return false;
    case 'seats': return layers.seats;
    default: return true;
  }
}

/** Replaced study surfaces only; perimeter apron and physical side barrier remain. */
export function isModelObjectExcluded(object: THREE.Object3D): boolean {
  for (let current: THREE.Object3D | null = object; current; current = current.parent) {
    if (REPLACED_FIELD_BATCHES.has(current.name)) return true;
  }
  return false;
}

/** Measure stadium geometry only, independent of current stadium/seating toggles. */
export function getModelBounds(root: THREE.Object3D): ModelBounds {
  root.parent?.updateWorldMatrix(true, false);
  root.updateMatrixWorld(true);
  const architecture = new THREE.Box3();
  const pitch = new THREE.Box3();
  const wicket = new THREE.Box3();
  const meshBounds = new THREE.Box3();

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || isModelObjectExcluded(object)) return;
    const layer = getStadiumLayer(object);
    if (layer !== 'stadium' && layer !== 'seats' && layer !== 'pitch') return;
    // InstancedMesh bounds include every instance matrix, not just the source geometry.
    const source = object instanceof THREE.InstancedMesh || object instanceof THREE.SkinnedMesh
      ? object
      : object.geometry;
    if (!source.boundingBox) source.computeBoundingBox();
    if (!source.boundingBox || source.boundingBox.isEmpty()) return;
    meshBounds.copy(source.boundingBox).applyMatrix4(object.matrixWorld);
    architecture.union(meshBounds);
    if (layer === 'pitch') {
      pitch.union(meshBounds);
      for (let current: THREE.Object3D | null = object; current; current = current.parent) {
        if (current.userData.cameraFocus === 'wicket') {
          wicket.union(meshBounds);
          break;
        }
      }
    }
  });

  return {
    ...toSummary(architecture),
    full: toSummary(architecture),
    pitch: pitch.isEmpty() ? undefined : toSummary(pitch),
    wicket: wicket.isEmpty() ? undefined : toSummary(wicket),
  };
}

function toSummary(bounds: THREE.Box3): BoundsSummary {
  if (bounds.isEmpty()) return { center: [0, 1, 0], radius: 1, height: 2 };
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  return {
    center: [center.x, center.y, center.z],
    radius: Math.max(size.x, size.z) * 0.5,
    height: size.y,
  };
}
