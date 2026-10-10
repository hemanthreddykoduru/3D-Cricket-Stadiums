import type { CameraPreset, SelectedSeat } from '@/types/stadium';

export interface CameraTarget {
  position: [number, number, number];
  target: [number, number, number];
  duration?: number;
  fov?: number;
}

/** Camera data comes from the mapped instance, never inferred from its label. */
export function getSeatCameraTarget(seat: SelectedSeat | null): CameraTarget | null {
  if (!seat || ![seat.position, seat.eyePosition, seat.target].every((point) =>
    Array.isArray(point) && point.length === 3 && point.every(Number.isFinite),
  )) return null;
  if (Math.hypot(...seat.eyePosition.map((value, index) => value - seat.target[index])) < 0.1) return null;
  // Cut directly to the seat rather than flying through roof/stand geometry.
  return { position: [...seat.eyePosition], target: [...seat.target], duration: 0, fov: 65 };
}

export const CAMERA_PRESETS: Record<CameraPreset, CameraTarget> = {
  overview: { position: [250, 180, 250], target: [0, 1, 0], duration: 1.2 },
  top: { position: [0, 350, 0.01], target: [0, 1, 0], duration: 1.2 },
  pitch: { position: [22, 6, 2], target: [0, 1, 0], duration: 1.2 },
  stand: { position: [0, 40, -110], target: [0, 4, 0], duration: 1.2 },
  north: { position: [0, 40, -110], target: [0, 4, 0], duration: 1.2 },
  south: { position: [0, 40, 110], target: [0, 4, 0], duration: 1.2 },
  east: { position: [110, 40, 0], target: [0, 4, 0], duration: 1.2 },
  west: { position: [-110, 40, 0], target: [0, 4, 0], duration: 1.2 },
  seat: { position: [0, 12, -75], target: [0, 1, 10], duration: 1.5 },
};

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
