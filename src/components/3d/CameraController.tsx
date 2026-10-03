import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CAMERA_PRESETS, easeInOutCubic, type CameraTarget } from '@/lib/camera';
import type { CameraPreset, SelectedSeat } from '@/types/stadium';
import type { ModelBounds } from './StadiumScene';

interface Props {
  preset: CameraPreset;
  seat: SelectedSeat | null;
  seatMode: boolean;
  bounds: ModelBounds | null;
  requestId?: string | number;
}

export function CameraController({ preset, seat, seatMode, bounds, requestId }: Props) {
  const { camera, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls: any };
  const startPos = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const endPos = useRef(new THREE.Vector3());
  const endTarget = useRef(new THREE.Vector3());
  const progress = useRef(1);
  const duration = useRef(1.2);
  const currentTarget = useRef(new THREE.Vector3(0, 1, 0));
  const hasFitted = useRef(false);

  useEffect(() => {
    let target: CameraTarget;
    if (seatMode && seat) {
      // Seat metadata has no world transform; keep the stable seat preset
      // rather than inventing coordinates from its label.
      target = getTarget('seat', bounds, camera);
    } else {
      target = getTarget(preset, bounds, camera);
    }

    startPos.current.copy(camera.position);
    startTarget.current.copy(currentTarget.current);
    endPos.current.set(...target.position);
    endTarget.current.set(...target.target);
    const initialFit = !hasFitted.current && bounds !== null;
    if (initialFit) {
      camera.position.set(...target.position);
      currentTarget.current.set(...target.target);
      camera.lookAt(currentTarget.current);
    }
    if (controls?.target) {
      controls.target.set(...(initialFit ? target.target : currentTarget.current.toArray() as [number, number, number]));
      controls.update();
    }
    progress.current = 0;
    duration.current = initialFit ? 0 : target.duration ?? 1.2;
    hasFitted.current = hasFitted.current || initialFit;
  }, [preset, seat, seatMode, bounds, camera, controls, requestId]);

  useEffect(() => {
    if (!controls) return;
    const cancel = () => { progress.current = 1; };
    controls.addEventListener?.('start', cancel);
    return () => controls.removeEventListener?.('start', cancel);
  }, [controls]);

  useFrame((_, delta) => {
    const fullRadius = bounds?.full?.radius ?? bounds?.radius ?? 100;
    camera.near = Math.max(0.1, fullRadius * 0.001);
    camera.far = Math.max(1000, fullRadius * 8);
    camera.updateProjectionMatrix();
    if (progress.current >= 1) return;
    progress.current = Math.min(1, progress.current + delta / duration.current);
    const t = easeInOutCubic(progress.current);
    const pos = new THREE.Vector3().lerpVectors(startPos.current, endPos.current, t);
    const tgt = new THREE.Vector3().lerpVectors(startTarget.current, endTarget.current, t);
    camera.position.copy(pos);
    camera.lookAt(tgt);
    if (controls?.target) {
      controls.target.copy(tgt);
      controls.update();
    }
    currentTarget.current.copy(tgt);
  });

  return null;
}

function getTarget(preset: CameraPreset, bounds: ModelBounds | null, camera: THREE.PerspectiveCamera): CameraTarget {
  if (!bounds) return CAMERA_PRESETS[preset];
  const fit = preset === 'pitch' && bounds.pitch ? bounds.pitch : bounds;
  const { center, radius, height } = fit;
  const r = Math.max(radius, 1);
  const target: [number, number, number] = [center[0], center[1], center[2]];
  const vertical = THREE.MathUtils.degToRad(camera.fov / 2);
  const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
  const fitAngle = Math.max(0.1, Math.min(vertical, horizontal));
  const distance = Math.max(r / Math.tan(fitAngle) * 1.15, height * 1.15, 8);

  switch (preset) {
    case 'top':
      return { position: [center[0], center[1] + distance * 1.45, center[2] + 0.01], target, duration: 1.2 };
    case 'pitch':
      return { position: [center[0] + distance * 0.72, center[1] + distance * 0.42, center[2] + distance * 0.08], target, duration: 1.2 };
    case 'stand':
    case 'north':
      return { position: [center[0], center[1] + height * 0.42, center[2] - distance], target, duration: 1.2 };
    case 'south':
      return { position: [center[0], center[1] + height * 0.42, center[2] + distance], target, duration: 1.2 };
    case 'east':
      return { position: [center[0] + distance, center[1] + height * 0.42, center[2]], target, duration: 1.2 };
    case 'west':
      return { position: [center[0] - distance, center[1] + height * 0.42, center[2]], target, duration: 1.2 };
    case 'seat':
      return CAMERA_PRESETS.seat;
    default:
      return { position: [center[0] + distance * 0.72, center[1] + distance * 0.55, center[2] + distance * 0.72], target, duration: 1.2 };
  }
}
