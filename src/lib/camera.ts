import type { CameraPreset } from '@/types/stadium';

export interface CameraTarget {
  position: [number, number, number];
  target: [number, number, number];
  duration?: number;
}

export const CAMERA_PRESETS: Record<CameraPreset, CameraTarget> = {
  overview: { position: [250, 180, 250], target: [0, 1, 0], duration: 1.2 },
  top: { position: [0, 350, 0.01], target: [0, 1, 0], duration: 1.2 },
  pitch: { position: [22, 6, 2], target: [0, 1, 0], duration: 1.2 },
  north: { position: [0, 40, -110], target: [0, 4, 0], duration: 1.2 },
  south: { position: [0, 40, 110], target: [0, 4, 0], duration: 1.2 },
  east: { position: [110, 40, 0], target: [0, 4, 0], duration: 1.2 },
  west: { position: [-110, 40, 0], target: [0, 4, 0], duration: 1.2 },
  seat: { position: [0, 12, -75], target: [0, 1, 10], duration: 1.5 },
};

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
