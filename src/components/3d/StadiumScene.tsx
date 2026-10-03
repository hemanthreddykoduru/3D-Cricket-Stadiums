import React, { Suspense, useLayoutEffect } from 'react';
import { Html, useGLTF, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { STADIUM_ASSETS } from '@/data/stadiumAssets';
import type { LayerKey, SelectedSeat } from '@/types/stadium';
import { SelectionManager } from './SelectionManager';

export interface ModelBounds {
  center: [number, number, number];
  radius: number;
  height: number;
  /** Bounds used for clipping, including the intentionally distant environment. */
  full?: BoundsSummary;
  /** Bounds of the playing surface, used by the pitch preset. */
  pitch?: BoundsSummary;
}

export interface BoundsSummary {
  center: [number, number, number];
  radius: number;
  height: number;
}

interface Props {
  stadiumId: string;
  layers: Record<LayerKey, boolean>;
  selectedStandId: string | null;
  selectedSeat: SelectedSeat | null;
  onStandSelect: (id: string | null) => void;
  onSeatSelect: (seat: SelectedSeat) => void;
  onAzimuthChange?: (angle: number) => void;
  onBoundsChange: (bounds: ModelBounds) => void;
}

export function StadiumScene({ stadiumId, layers, onBoundsChange }: Props) {
  const asset = STADIUM_ASSETS[stadiumId];

  return (
    <group>
      <Suspense fallback={<Loader />}>
        {asset?.stadiumModel ? (
          <GLBStadium url={asset.stadiumModel} layers={layers} onBoundsChange={onBoundsChange} />
        ) : (
          <MissingModelMessage />
        )}
      </Suspense>
    </group>
  );
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex min-w-[280px] flex-col items-center rounded-xl border border-white/10 bg-ink-base/90 p-6 text-white shadow-2xl backdrop-blur-md">
        <div className="mb-6 text-xl font-bold tracking-[0.2em]">STADIUM3D INDIA</div>
        <div className="mb-2 flex w-full justify-between text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">
          <span>Loading architecture</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-4 text-center text-[10px] leading-relaxed text-ink-dim">Loading the validated stadium model…</div>
      </div>
    </Html>
  );
}

class GLBErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? <MissingModelMessage error /> : this.props.children;
  }
}

function GLBStadium({ url, layers, onBoundsChange }: { url: string; layers: Record<LayerKey, boolean>; onBoundsChange: (bounds: ModelBounds) => void }) {
  return (
    <GLBErrorBoundary>
      <StadiumModel url={url} layers={layers} onBoundsChange={onBoundsChange} />
    </GLBErrorBoundary>
  );
}

export function StadiumModel({ url, layers, onBoundsChange }: { url: string; layers: Record<LayerKey, boolean>; onBoundsChange: (bounds: ModelBounds) => void }) {
  const { scene } = useGLTF(url);

  useLayoutEffect(() => {
    // The GLB contains a large site/environment layer. It is useful for
    // rendering, but must not determine the camera's architecture fit.
    const full = getNamedBounds(scene, () => true);
    const architecture = getNamedBounds(scene, (name) => !isEnvironmentName(name));
    const pitch = getNamedBounds(scene, isPitchName);
    const summary = toSummary(architecture);
    const fullSummary = toSummary(full);
    const pitchSummary = pitch ? toSummary(pitch) : undefined;
    onBoundsChange({
      ...summary,
      full: fullSummary,
      pitch: pitchSummary,
    });
  }, [scene, onBoundsChange]);

  useLayoutEffect(() => {
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
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
  }, [scene]);

  return (
    <>
      <SelectionManager root={scene} layers={layers} />
      <primitive object={scene} dispose={null} />
    </>
  );
}

function isEnvironmentName(name: string) {
  return /^(Step21_Environment|Web_Environment|Web_Near_Roads|Near_|Environment)/i.test(name);
}

function isPitchName(name: string) {
  return /^(Pitch_|Step20_Pitch_)/i.test(name);
}

function getNamedBounds(root: THREE.Object3D, include: (name: string) => boolean) {
  const bounds = new THREE.Box3();
  let found = false;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !include(object.name)) return;
    bounds.expandByObject(object);
    found = true;
  });
  return found ? bounds : null;
}

function toSummary(bounds: THREE.Box3 | null): BoundsSummary {
  const safeBounds = bounds ?? new THREE.Box3(new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 2, 1));
  const size = safeBounds.getSize(new THREE.Vector3());
  const center = safeBounds.getCenter(new THREE.Vector3());
  return {
    center: [center.x, center.y, center.z],
    radius: Math.max(size.x, size.z) * 0.5,
    height: size.y,
  };
}

function MissingModelMessage({ error = false }: { error?: boolean }) {
  return (
    <Html center>
      <div className="flex min-w-[280px] flex-col items-center rounded-xl border border-white/10 bg-ink-base/90 p-8 text-center text-white shadow-2xl backdrop-blur-xl">
        <div className="text-xl font-bold tracking-[0.15em]">3D MODEL UNAVAILABLE</div>
        <div className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
          {error ? 'The stadium GLB could not be loaded.' : 'No stadium model is configured for this venue.'}
        </div>
      </div>
    </Html>
  );
}

useGLTF.preload('/models/narendra-modi-stadium/stadium.glb');
