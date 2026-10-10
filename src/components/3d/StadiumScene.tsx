import { Suspense, useLayoutEffect } from 'react';
import { Html, useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { STADIUM_ASSETS } from '@/data/stadiumAssets';
import { getModelBounds, getStadiumLayer, type ModelBounds } from '@/lib/model';
import { buildSeatMap } from '@/lib/seats';
import { createOutfield } from '@/lib/outfield';
import { createCricketPitch } from '@/lib/cricket-pitch';
import type { LayerKey, SeatMap, SelectedSeat } from '@/types/stadium';
import { SelectionManager } from './SelectionManager';

export type { BoundsSummary, ModelBounds } from '@/lib/model';

interface Props {
  stadiumId: string;
  layers: Record<LayerKey, boolean>;
  selectedStandId: string | null;
  selectedSeat: SelectedSeat | null;
  onStandSelect: (id: string | null) => void;
  onSeatSelect: (seat: SelectedSeat) => void;
  onAzimuthChange?: (angle: number) => void;
  onBoundsChange: (bounds: ModelBounds) => void;
  onSeatMapChange: (seatMap: SeatMap) => void;
}

export function StadiumScene({ stadiumId, layers, onBoundsChange, onSeatMapChange }: Props) {
  const asset = STADIUM_ASSETS[stadiumId];

  return (
    <group>
      <Suspense fallback={null}>
        {asset?.status === 'available' && asset.stadiumModel ? (
          <StadiumModel url={asset.stadiumModel} layers={layers} onBoundsChange={onBoundsChange} onSeatMapChange={onSeatMapChange} />
        ) : (
          <MissingModelMessage />
        )}
      </Suspense>
    </group>
  );
}

export function StadiumModel({ url, layers, onBoundsChange, onSeatMapChange }: {
  url: string;
  layers: Record<LayerKey, boolean>;
  onBoundsChange: (bounds: ModelBounds) => void;
  onSeatMapChange: (seatMap: SeatMap) => void;
}) {
  const { scene } = useGLTF(url);
  const { gl, invalidate } = useThree();

  useLayoutEffect(() => {
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
       // 27,604 seats dominate the shadow-caster list. Their small individual
       // shadows are not readable at stadium scale; keep them as receivers.
       child.castShadow = getStadiumLayer(child) !== 'seats';
      child.receiveShadow = true;
      child.frustumCulled = true;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
          material.envMapIntensity = 0.85;
          material.needsUpdate = true;
        }
      });
    });

    // Match this saved model, not every venue: keep all source assets untouched.
    let field: THREE.Group | undefined;
    if (scene.getObjectByName('WEB34C_PITCH_033_HF27_Pitch_Cricket_Outfield')
      && scene.getObjectByName('WEB34C_PITCH_031_HF27_Pitch_Central_Strip')) {
      field = new THREE.Group();
      field.name = 'WEB_CRICKET_FIELD_PRESENTATION';
      field.userData.stadiumLayer = 'pitch';
      field.add(createOutfield(), createCricketPitch());
      scene.add(field);
    }

    const bounds = getModelBounds(scene);
    onSeatMapChange(buildSeatMap(scene, bounds.pitch?.center));
    onBoundsChange(bounds);
    // The model and any viewer-only field geometry are now part of the
    // scene. Queue exactly one shadow-map rebuild for the static world.
    gl.shadowMap.needsUpdate = true;
    invalidate();

    return () => {
      if (!field) return;
      field.removeFromParent();
      // These resources belong only to this mount, unlike the cached GLTF scene.
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      const textures = new Set<THREE.Texture>();
      field.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        geometries.add(child.geometry);
        for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
          materials.add(material);
          for (const value of Object.values(material)) {
            if (value instanceof THREE.Texture) textures.add(value);
          }
        }
        if (child instanceof THREE.InstancedMesh) child.dispose();
      });
      textures.forEach((texture) => texture.dispose());
      materials.forEach((material) => material.dispose());
      geometries.forEach((geometry) => geometry.dispose());
    };
  }, [scene, onBoundsChange, onSeatMapChange, gl, invalidate]);

  return (
    <>
      <SelectionManager root={scene} layers={layers} />
      <primitive object={scene} dispose={null} />
    </>
  );
}

function MissingModelMessage() {
  return (
    <Html center>
      <div className="glass flex min-w-[280px] flex-col items-center rounded-xl p-8 text-center text-ink-main">
        <div className="text-[15px] font-semibold tracking-[0.12em]">3D VIEW UNAVAILABLE</div>
        <div className="mt-3 max-w-sm text-[12px] leading-relaxed text-ink-muted">
          This venue has profile information only; no interactive model is attached.
        </div>
      </div>
    </Html>
  );
}
