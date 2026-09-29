import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CAMERA_PRESETS, easeInOutCubic, type CameraTarget } from '@/lib/camera';
import type { CameraPreset, SelectedSeat } from '@/types/stadium';

interface Props {
  preset: CameraPreset;
  seat: SelectedSeat | null;
  seatMode: boolean;
}

export function CameraController({ preset, seat, seatMode }: Props) {
  const { camera } = useThree();
  const startPos = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const endPos = useRef(new THREE.Vector3());
  const endTarget = useRef(new THREE.Vector3());
  const progress = useRef(1);
  const duration = useRef(1.2);
  const currentTarget = useRef(new THREE.Vector3(0, 1, 0));

  useEffect(() => {
    let target: CameraTarget;
    if (seatMode && seat) {
      const angle = (seat.blockName.charCodeAt(seat.blockName.length - 1) * 37) % 360;
      const radius = 58;
      const r = (angle * Math.PI) / 180;
      const seatPos = new THREE.Vector3(
        Math.sin(r) * radius,
        8 + seat.row * 0.25,
        Math.cos(r) * radius,
      );
      const behind = seatPos.clone().multiplyScalar(1.08);
      behind.y += 1.5;
      target = {
        position: [behind.x, behind.y, behind.z],
        target: [0, 1, 4],
        duration: 1.5,
      };
    } else {
      target = CAMERA_PRESETS[preset];
    }

    startPos.current.copy(camera.position);
    startTarget.current.copy(currentTarget.current);
    endPos.current.set(...target.position);
    endTarget.current.set(...target.target);
    progress.current = 0;
    duration.current = target.duration ?? 1.2;
  }, [preset, seat, seatMode, camera]);

  useFrame((_, delta) => {
    if (progress.current >= 1) return;
    progress.current = Math.min(1, progress.current + delta / duration.current);
    const t = easeInOutCubic(progress.current);
    const pos = new THREE.Vector3().lerpVectors(startPos.current, endPos.current, t);
    const tgt = new THREE.Vector3().lerpVectors(startTarget.current, endTarget.current, t);
    camera.position.copy(pos);
    camera.lookAt(tgt);
    currentTarget.current.copy(tgt);
  });

  return null;
}
