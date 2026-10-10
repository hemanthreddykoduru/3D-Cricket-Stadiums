'use client';

import { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { StadiumScene, type ModelBounds } from './StadiumScene';
import { CameraController } from './CameraController';
import { ViewerControls } from './ViewerControls';
import { SelectionPanel } from './SelectionPanel';
import { LayerPanel } from './LayerPanel';
import { SeatSelector } from './SeatSelector';
import { getSeatCameraTarget } from '@/lib/camera';
import { Compass } from '../ui/Compass';
import { LoadingScreen } from '../ui/LoadingScreen';
import { ViewerErrorBoundary } from '../ui/ViewerErrorBoundary';
import type { SelectedSeat, SeatMap, LayerKey, CameraPreset, Stadium } from '@/types/stadium';

interface Props {
  stadium: Stadium;
  fallbackLink?: string;
}

const MIN_LOADING_MS = 5000;

const DEFAULT_LAYERS: Record<LayerKey, boolean> = {
  stadium: true,
  stands: true,
  seats: true,
  environment: false,
  roads: false,
  buildings: false,
  trees: false,
  parking: false,
  gates: false,
  food: false,
  restrooms: false,
  accessibility: false,
};

export function StadiumViewer({ stadium, fallbackLink }: Props) {
  return (
    <ViewerErrorBoundary key={stadium.id} fallbackLink={fallbackLink}>
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
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [fallbackFullscreen, setFallbackFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);
  const [fullscreenPending, setFullscreenPending] = useState(false);
  const [seatMode, setSeatMode] = useState(false);
  const [cameraRequestId, setCameraRequestId] = useState(0);
  const [modelBounds, setModelBounds] = useState<ModelBounds | null>(null);
  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [minimumLoadingElapsed, setMinimumLoadingElapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitDirection = useRef(new THREE.Vector3());
  const handleBoundsChange = useCallback((bounds: ModelBounds) => setModelBounds(bounds), []);
  const handleSeatMapChange = useCallback((map: SeatMap) => {
    setSeatMap(map);
    setSelectedSeat(null);
    setSelectedStandId(null);
    setSeatMode(false);
    setCameraPreset('overview');
  }, []);
  const fullscreen = nativeFullscreen || fallbackFullscreen;
  const isLoading = modelBounds === null || !minimumLoadingElapsed;
  const handleMinimumLoadingElapsed = useCallback(() => setMinimumLoadingElapsed(true), []);
  const handleOrbitChange = useCallback((event: { target?: { object?: THREE.Camera } } | undefined) => {
    const camera = event?.target?.object;
    if (!camera) return;
    camera.getWorldDirection(orbitDirection.current);
    const nextAzimuth = Math.atan2(orbitDirection.current.x, orbitDirection.current.z);
    setAzimuth((previous) => previous === nextAzimuth ? previous : nextAzimuth);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container || fullscreenPending) return;
    setFullscreenError(null);

    if (fallbackFullscreen) {
      setFallbackFullscreen(false);
      return;
    }

    if (document.fullscreenElement === container) {
      setFullscreenPending(true);
      try {
        await document.exitFullscreen();
      } catch {
        setFullscreenError('Fullscreen could not be closed. Press Escape or use your browser’s exit control.');
      } finally {
        setFullscreenPending(false);
      }
      return;
    }

    if (!container.requestFullscreen) {
      setFallbackFullscreen(true);
      setFullscreenError('Fullscreen is unavailable in this browser. The viewer has been expanded in this page instead.');
      return;
    }

    setFullscreenPending(true);
    try {
      await container.requestFullscreen();
    } catch {
      setFallbackFullscreen(true);
      setFullscreenError('Fullscreen was blocked. The viewer has been expanded in this page instead.');
    } finally {
      setFullscreenPending(false);
    }
  }, [fallbackFullscreen, fullscreenPending]);

  useEffect(() => {
    const onChange = () => {
      setNativeFullscreen(document.fullscreenElement === containerRef.current);
      if (document.fullscreenElement === containerRef.current) setFallbackFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const container = containerRef.current;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    container?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && fallbackFullscreen) {
        setFallbackFullscreen(false);
        setFullscreenError(null);
      }
      if (event.key !== 'Tab' || !container) return;
      const focusable = Array.from(container.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]'))
        .filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === container)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [fullscreen, fallbackFullscreen]);

  const handlePreset = (p: CameraPreset) => {
    setCameraPreset(p);
    setCameraRequestId((id) => id + 1);
    if (p !== 'seat') {
      setSeatMode(false);
      setSelectedSeat(null);
    }
  };

  const handleStandSelect = (standId: string | null) => {
    setSelectedStandId(standId);
    setSelectedSeat(null);
    if (standId) {
      setCameraPreset(standId as CameraPreset);
      setCameraRequestId((id) => id + 1);
    }
  };

  const handleSeatSelect = (seat: SelectedSeat) => {
    const mapped = seatMap?.pavilions.find((pavilion) => pavilion.id === seat.standId)
      ?.rows.find((row) => row.number === seat.row)?.seats.find((candidate) => candidate.id === seat.id);
    const target = mapped ? getSeatCameraTarget(mapped) : null;
    if (!mapped || !target) return;
    setSelectedSeat(mapped);
    setSelectedStandId(mapped.standId);
    setSeatMode(true);
    setCameraPreset('seat');
    setLayers((current) => ({ ...current, stadium: true, seats: true }));
    setAzimuth(Math.atan2(target.target[0] - target.position[0], target.target[2] - target.position[2]));
    setCameraRequestId((id) => id + 1);
  };

  const toggleLayer = (k: LayerKey) =>
    setLayers((l) => ({ ...l, [k]: !l[k] }));

  const resetView = () => {
    setSelectedSeat(null);
    setSelectedStandId(null);
    setSeatMode(false);
    setCameraPreset('overview');
    setCameraRequestId((id) => id + 1);
  };

  return (
    <div className="h-[min(85vh,820px)] min-h-[min(520px,100dvh)] w-full min-w-0 max-w-full md:min-h-[520px]">
      <div
        ref={containerRef}
        role={fullscreen ? 'dialog' : 'region'}
        aria-label={`${stadium.name} 3D viewer`}
        aria-modal={fullscreen || undefined}
        aria-busy={isLoading}
        tabIndex={-1}
        className={fullscreen
          ? 'fixed inset-0 z-[500] min-w-0 max-w-full overflow-hidden bg-surface-850 outline-none'
          : 'relative h-full w-full min-w-0 max-w-full overflow-hidden bg-surface-850 outline-none'}
      >
        <Canvas
          frameloop="demand"
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
           dpr={[1, 1.35]}
          shadows
          style={{ background: '#edf2f6' }}
        >
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[250, 180, 250]} fov={45} near={0.5} far={2400} />
            <CameraController preset={cameraPreset} seat={selectedSeat} seatMode={seatMode} bounds={modelBounds} requestId={cameraRequestId} onAzimuthChange={setAzimuth} />

            <ambientLight intensity={0.3} color="#ffffff" />
            <hemisphereLight args={['#f4f7ff', '#252b38', 1.1]} />
            <directionalLight
              position={[100, 150, 50]}
              intensity={2.2}
              color="#fffcf0"
              castShadow
               shadow-mapSize={[1024, 1024]}
              shadow-camera-left={-250}
              shadow-camera-right={250}
              shadow-camera-top={250}
              shadow-camera-bottom={-250}
              shadow-camera-near={10}
              shadow-camera-far={600}
              shadow-bias={-0.0005}
            />
            <directionalLight position={[-120, 80, -100]} intensity={0.9} color="#b9d5ff" />

            <StadiumScene
              stadiumId={stadium.id}
              layers={layers}
              selectedStandId={selectedStandId}
              selectedSeat={selectedSeat}
              onStandSelect={handleStandSelect}
              onSeatSelect={handleSeatSelect}
              onAzimuthChange={setAzimuth}
              onBoundsChange={handleBoundsChange}
              onSeatMapChange={handleSeatMapChange}
            />

            <OrbitControls
              makeDefault
              enabled={!isLoading && !seatMode}
              enableDamping
              dampingFactor={0.08}
              minDistance={20}
              maxDistance={1400}
              maxPolarAngle={Math.PI - 0.02}
              minPolarAngle={0.02}
              enablePan
              screenSpacePanning
              onChange={handleOrbitChange}
            />
          </Suspense>
        </Canvas>

        {isLoading && (
          <StadiumLoadingOverlay label={stadium.name} onMinimumElapsed={handleMinimumLoadingElapsed} />
        )}

        <div hidden={isLoading} className="pointer-events-none absolute inset-0 z-10">
          <div data-viewer-rail className="pointer-events-auto absolute left-3 top-3 flex w-[calc(100%_-_6.25rem)] min-h-0 min-w-0 max-w-none flex-col gap-3 md:bottom-24 md:left-6 md:top-6 md:w-64 md:max-w-sm md:overflow-y-auto md:overscroll-contain">
            <div data-viewer-header className="glass w-full min-w-0 max-w-full shrink-0 break-words rounded-md px-3 py-2 md:px-4 md:py-2.5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-ink-muted">{seatMode ? 'Model seat view' : 'Viewing'}</div>
              <div className="font-display text-[13px] font-semibold text-ink-main md:text-[15px]">
                {stadium.name}
              </div>
              <div className="text-[11px] text-ink-muted">
                {seatMode && selectedSeat ? <>
                  <span className="block min-w-0 break-words [overflow-wrap:anywhere]">{selectedSeat.standName}</span>
                  <span>Row {selectedSeat.row} · Seat {selectedSeat.seat}</span>
                </> : <>{stadium.city}, {stadium.state}</>}
              </div>
            </div>

            <div data-viewer-panels className="hidden w-full min-w-0 shrink-0 flex-col gap-3 md:flex">
              <SeatSelector seatMap={seatMap} selectedSeat={selectedSeat} seatMode={seatMode} onSelect={handleSeatSelect} onExit={resetView} />
              <LayerPanel layers={layers} onToggle={toggleLayer} />
            </div>
          </div>

          <div className="pointer-events-auto absolute right-3 top-3 flex items-start gap-2 md:right-6 md:top-6">
            <Compass azimuth={azimuth} />
          </div>

          <SelectionPanel
            layers={layers}
            onToggleLayer={toggleLayer}
            seatMode={seatMode}
            seatRequestId={cameraRequestId}
            seatControls={(
              <SeatSelector seatMap={seatMap} selectedSeat={selectedSeat} seatMode={seatMode} onSelect={handleSeatSelect} onExit={resetView} />
            )}
            cameraControls={(
              <ViewerControls
                onPreset={handlePreset}
                onReset={resetView}
                current={cameraPreset}
                onFullscreen={toggleFullscreen}
                isFullscreen={fullscreen}
                fullscreenPending={fullscreenPending}
              />
            )}
          />

          {fullscreenError && (
            <div className="glass pointer-events-auto absolute left-3 right-3 top-[5.5rem] z-30 flex max-h-[calc(100dvh_-_8rem)] w-auto max-w-none items-start gap-3 overflow-y-auto overscroll-contain rounded-md px-3 py-2.5 text-[11px] leading-relaxed text-ink-main md:left-1/2 md:right-auto md:top-4 md:max-h-none md:w-[min(32rem,calc(100%_-_2rem))] md:-translate-x-1/2" role="status">
              <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{fullscreenError}</span>
              <button
                type="button"
                onClick={() => setFullscreenError(null)}
                className="focus-ring flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded px-1 text-base text-ink-main hover:text-accent"
                aria-label="Dismiss fullscreen message"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StadiumLoadingOverlay({ label, onMinimumElapsed }: { label: string; onMinimumElapsed: () => void }) {
  const { active, progress, loaded, total } = useProgress();
  const phase = total === 0 ? 'opening' : active && loaded < total ? 'loading' : 'preparing';

  useEffect(() => {
    const timeout = window.setTimeout(onMinimumElapsed, MIN_LOADING_MS);
    return () => window.clearTimeout(timeout);
  }, [onMinimumElapsed]);

  return (
    <div className="absolute inset-0 z-20 bg-[#edf2f6]">
      <LoadingScreen label={label} progress={phase === 'loading' ? progress : undefined} phase={phase} />
    </div>
  );
}
