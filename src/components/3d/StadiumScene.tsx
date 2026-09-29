import React, { Suspense, useEffect, useState } from 'react';
import { useGLTF, Html, useProgress } from '@react-three/drei';
import { STADIUM_ASSETS } from '@/data/stadiumAssets';
import type { SelectedSeat, LayerKey } from '@/types/stadium';
import * as THREE from 'three';

interface Props {
  stadiumId: string;
  layers: Record<LayerKey, boolean>;
  selectedStandId: string | null;
  selectedSeat: SelectedSeat | null;
  onStandSelect: (id: string | null) => void;
  onSeatSelect: (seat: SelectedSeat) => void;
  onAzimuthChange?: (angle: number) => void;
}

export function StadiumScene({ stadiumId, layers, selectedStandId, selectedSeat, onStandSelect, onSeatSelect, onAzimuthChange }: Props) {
  return (
    <group>
      <Suspense fallback={<Loader />}>
        {layers.environment && <GLBEnvironment stadiumId={stadiumId} />}
        {layers.stadium && (
          <GLBStadium 
            stadiumId={stadiumId} 
            layers={layers}
            onStandSelect={onStandSelect} 
            onSeatSelect={onSeatSelect} 
          />
        )}
      </Suspense>
    </group>
  );
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-6 bg-ink-base/90 rounded-xl backdrop-blur-md shadow-2xl border border-white/10 text-white min-w-[300px]">
        <div className="text-xl font-bold tracking-[0.2em] mb-6">STADIUM3D INDIA</div>
        
        <div className="w-full text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted mb-2 flex justify-between">
          <span>Loading Architecture</span>
          <span>{Math.round(progress)}%</span>
        </div>
        
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="mt-4 text-[10px] text-ink-dim max-w-xs text-center leading-relaxed">
          Loading professional 3D venue model...
        </div>
      </div>
    </Html>
  );
}

class GLBErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { fallback: React.ReactNode, children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function GLBModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.envMapIntensity = 1.0;
          child.material.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}



function GLBStadium({ stadiumId, layers, onStandSelect, onSeatSelect }: any) {
  const asset = STADIUM_ASSETS[stadiumId];
  if (!asset || asset.status === 'pending') {
    return <MissingModelMessage type="Stadium" />;
  }

  const modelUrl = asset.stadiumModel;
  return (
    <GLBErrorBoundary fallback={<MissingModelMessage type="Stadium" />}>
      <GLBModel url={modelUrl} />
    </GLBErrorBoundary>
  );
}

function GLBEnvironment({ stadiumId }: { stadiumId: string }) {
  const asset = STADIUM_ASSETS[stadiumId];
  if (!asset || asset.status === 'pending') {
    return <MissingModelMessage type="Environment" />;
  }

  const modelUrl = asset.environmentModel;
  return (
    <GLBErrorBoundary fallback={<MissingModelMessage type="Environment" />}>
      <GLBModel url={modelUrl} />
    </GLBErrorBoundary>
  );
}

function MissingModelMessage({ type }: { type: string }) {
  const yOffset = type === 'Stadium' ? 'translateY(-60%)' : 'translateY(60%)';
  
  return (
    <Html center zIndexRange={[100, 0]}>
      <div 
        className="flex flex-col items-center justify-center p-8 bg-ink-base/90 rounded-2xl border border-white/10 text-ink-main min-w-[450px] shadow-2xl backdrop-blur-xl"
        style={{ transform: yOffset }}
      >
        <div className="text-xl font-bold tracking-[0.15em] mb-4 text-center">
          3D MODEL COMING SOON
        </div>
        <div className="text-sm text-ink-muted text-center max-w-sm leading-relaxed">
          The interactive 3D reconstruction for this {type.toLowerCase()} will be available once the model asset is added.
        </div>
      </div>
    </Html>
  );
}
