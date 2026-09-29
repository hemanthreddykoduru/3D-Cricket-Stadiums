'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Environment, Sky, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { StadiumScene } from './StadiumScene';
import { CameraController } from './CameraController';
import { ViewerControls } from './ViewerControls';
import { SelectionPanel } from './SelectionPanel';
import { LayerPanel } from './LayerPanel';
import { Compass } from '../ui/Compass';
import { ViewerErrorBoundary } from '../ui/ViewerErrorBoundary';
import type { SelectedSeat, LayerKey, CameraPreset, Stadium } from '@/types/stadium';

interface Props {
  stadium: Stadium;
  fallbackLink?: string;
}

const DEFAULT_LAYERS: Record<LayerKey, boolean> = {
  stadium: true,
  stands: true,
  seats: true,
  environment: true,
  roads: true,
  buildings: true,
  trees: true,
  parking: true,
  gates: false,
  food: false,
  restrooms: false,
  accessibility: false,
};

export function StadiumViewer({ stadium, fallbackLink }: Props) {
  return (
    <ViewerErrorBoundary fallbackLink={fallbackLink}>
      <StadiumViewerInner stadium={stadium} />
    </ViewerErrorBoundary>
  );
}

function StadiumViewerInner({ stadium }: { stadium: Stadium }) {
  const [selectedSeat, setSelectedSeat] = useState<SelectedSeat | null>(null);
  const [selectedStandId, setSelectedStandId] = useState<string | null>(null);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>(DEFAULT_LAYERS);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [azimuth, setAzimuth] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [seatMode, setSeatMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const handlePreset = (p: CameraPreset) => {
    setCameraPreset(p);
    if (p !== 'seat') setSeatMode(false);
  };

  const handleStandSelect = (standId: string | null) => {
    setSelectedStandId(standId);
    setSelectedSeat(null);
    if (standId) {
      setCameraPreset(standId as CameraPreset);
    }
  };

  const handleSeatSelect = (seat: SelectedSeat) => {
    setSelectedSeat(seat);
    setSeatMode(true);
    setCameraPreset('seat');
  };

  const toggleLayer = (k: LayerKey) =>
    setLayers((l) => ({ ...l, [k]: !l[k] }));

  return (
    <div
      ref={containerRef}
      className={`relative ${
        fullscreen ? 'fixed inset-0 z-[500] bg-surface-950' : 'h-[min(85vh,820px)] w-full'
      }`}
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        dpr={[1, 2]}
        shadows
        style={{ background: 'linear-gradient(180deg, #e9ecef 0%, #f8f9fa 100%)' }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[110, 90, 110]} fov={45} near={0.5} far={800} />

          <CameraController preset={cameraPreset} seat={selectedSeat} seatMode={seatMode} />

          {/* Cinematic Lighting Setup */}
          <ambientLight intensity={0.2} color="#ffffff" />
          <hemisphereLight args={['#ffffff', '#1a1a22', 0.4]} />
          
          <directionalLight
            position={[100, 150, 50]}
            intensity={1.5}
            color="#fffcf0"
            castShadow
            shadow-mapSize={[4096, 4096]}
            shadow-camera-left={-250}
            shadow-camera-right={250}
            shadow-camera-top={250}
            shadow-camera-bottom={-250}
            shadow-camera-near={10}
            shadow-camera-far={600}
            shadow-bias={-0.0005}
          />
          
          {/* Subtle rim light for pop */}
          <directionalLight position={[-100, 50, -100]} intensity={0.5} color="#cce6ff" />
          
          <Sky distance={45000} sunPosition={[100, 150, 50]} inclination={0.1} azimuth={0.25} turbidity={0.5} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
          
          <Environment preset="city" />

          {/* Enhanced Fog for distance fading */}
          <fog attach="fog" args={['#e6eff5', 300, 800]} />

          <StadiumScene
            stadiumId={stadium.id}
            layers={layers}
            selectedStandId={selectedStandId}
            selectedSeat={selectedSeat}
            onStandSelect={handleStandSelect}
            onSeatSelect={handleSeatSelect}
            onAzimuthChange={setAzimuth}
          />

          {layers.stadium && (
            <ContactShadows resolution={1024} scale={350} blur={2} opacity={0.6} far={20} color="#1a2530" />
          )}

          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minDistance={20}
            maxDistance={280}
            maxPolarAngle={Math.PI / 2 - 0.02}
            enablePan
          />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="pointer-events-auto absolute left-4 top-4 md:left-6 md:top-6">
          <div className="glass rounded-md px-3 py-2 md:px-4 md:py-2.5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-ink-muted">Viewing</div>
            <div className="font-display text-[13px] font-semibold text-ink-main md:text-[15px]">
              {stadium.name}
            </div>
            <div className="text-[11px] text-ink-muted">
              {stadium.city}, {stadium.state}
            </div>
          </div>
        </div>

        <div className="pointer-events-auto absolute right-4 top-4 flex items-start gap-2 md:right-6 md:top-6">
          <Compass azimuth={azimuth} />
        </div>

        <div className="pointer-events-auto absolute right-4 bottom-24 md:right-6 md:top-1/2 md:-translate-y-1/2 md:bottom-auto">
          <ViewerControls
            onPreset={handlePreset}
            current={cameraPreset}
            onFullscreen={toggleFullscreen}
            isFullscreen={fullscreen}
          />
        </div>

        <div className="pointer-events-auto absolute left-4 bottom-24 hidden md:left-6 md:top-1/2 md:-translate-y-1/2 md:bottom-auto md:block">
          <LayerPanel layers={layers} onToggle={toggleLayer} />
        </div>

        <div className="pointer-events-auto absolute inset-x-0 bottom-0">
          <SelectionPanel
            stadium={stadium}
            selectedStandId={selectedStandId}
            selectedSeat={selectedSeat}
            layers={layers}
            onToggleLayer={toggleLayer}
            onSeatChange={handleSeatSelect}
            onClearStand={() => handleStandSelect(null)}
            onReset={() => {
              setSelectedSeat(null);
              setSelectedStandId(null);
              setCameraPreset('overview');
              setSeatMode(false);
            }}
          />
        </div>

        <MobileFloatingBar
          onFullscreen={toggleFullscreen}
          isFullscreen={fullscreen}
          onReset={() => {
            setSelectedSeat(null);
            setSelectedStandId(null);
            setCameraPreset('overview');
          }}
        />
      </div>
    </div>
  );
}

function MobileFloatingBar({
  onFullscreen, isFullscreen, onReset,
}: { onFullscreen: () => void; isFullscreen: boolean; onReset: () => void }) {
  return (
    <div className="pointer-events-auto absolute left-4 right-4 top-20 flex items-center justify-between md:hidden">
      <button
        onClick={onReset}
        className="glass flex h-10 w-10 items-center justify-center rounded-full text-ink-main"
        aria-label="Reset"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
        </svg>
      </button>
      <button
        onClick={onFullscreen}
        className="glass flex h-10 w-10 items-center justify-center rounded-full text-ink-main"
        aria-label="Fullscreen"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          {isFullscreen ? (
            <><path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" /><path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" /></>
          ) : (
            <><path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" /></>
          )}
        </svg>
      </button>
    </div>
  );
}
