import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CAMERA_PRESETS, easeInOutCubic, getSeatCameraTarget, type CameraTarget } from '@/lib/camera';
import type { ModelBounds } from '@/lib/model';
import type { CameraPreset, SelectedSeat } from '@/types/stadium';

interface Props {
  preset: CameraPreset;
  seat: SelectedSeat | null;
  seatMode: boolean;
  bounds: ModelBounds | null;
  requestId?: string | number;
  onAzimuthChange?: (azimuth: number) => void;
}

export function CameraController({ preset, seat, seatMode, bounds, requestId, onAzimuthChange }: Props) {
  const { camera, controls, gl, invalidate } = useThree() as unknown as {
    camera: THREE.PerspectiveCamera;
    controls: any;
    gl: { domElement: HTMLCanvasElement };
    invalidate: () => void;
  };
  const startPos = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const endPos = useRef(new THREE.Vector3());
  const endTarget = useRef(new THREE.Vector3());
  const progress = useRef(1);
  const duration = useRef(1.2);
  const currentTarget = useRef(new THREE.Vector3(0, 1, 0));
  const animatedPosition = useRef(new THREE.Vector3());
  const animatedTarget = useRef(new THREE.Vector3());
  const hasFitted = useRef(false);
  const azimuthCallback = useRef(onAzimuthChange);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    azimuthCallback.current = onAzimuthChange;
  }, [onAzimuthChange]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener?.('change', update);
    return () => mediaQuery.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    const seatTarget = seatMode ? getSeatCameraTarget(seat) : null;
    const nextFov = seatTarget?.fov ?? 45;
    if (camera.fov !== nextFov) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }
    let target: CameraTarget;
    if (seatTarget) {
      target = seatTarget;
    } else {
      target = getTarget(preset === 'seat' ? 'overview' : preset, bounds, camera);
    }

    // OrbitControls owns the target while the user pans. Read it before a
    // preset transition so a previous programmatic target cannot cause a jump.
    if (controls?.target) currentTarget.current.copy(controls.target);
    startPos.current.copy(camera.position);
    startTarget.current.copy(currentTarget.current);
    endPos.current.set(...target.position);
    endTarget.current.set(...target.target);
    const initialFit = !hasFitted.current && bounds !== null;
    const snapToTarget = initialFit || reducedMotion || target.duration === 0;
    if (snapToTarget) {
      camera.position.copy(endPos.current);
      currentTarget.current.copy(endTarget.current);
      camera.lookAt(currentTarget.current);
      if (controls?.target) {
        controls.target.copy(currentTarget.current);
        // Orbit damping must not shift the eye away from the chosen seat.
        if (!seatMode) controls.update();
      }
      progress.current = 1;
      if (seatTarget) azimuthCallback.current?.(Math.atan2(
        currentTarget.current.x - camera.position.x,
        currentTarget.current.z - camera.position.z,
      ));
    } else {
      progress.current = 0;
      duration.current = target.duration ?? 1.2;
    }
    hasFitted.current = hasFitted.current || initialFit;
    // Demand rendering needs an explicit frame for both snaps and the first
    // frame of every new/repeated request.
    invalidate();
  }, [preset, seat, seatMode, bounds, camera, controls, reducedMotion, requestId, invalidate]);

  useEffect(() => {
    if (!seatMode || !getSeatCameraTarget(seat)) return;
    const canvas = gl.domElement;
    const attributes = ['tabindex', 'role', 'aria-label', 'aria-keyshortcuts'] as const;
    const previousAttributes = attributes.map((name) => canvas.getAttribute(name));
    const previousTouchAction = canvas.style.touchAction;
    const previousCursor = canvas.style.cursor;
    canvas.setAttribute('tabindex', '0');
    canvas.setAttribute('role', 'application');
    canvas.setAttribute('aria-label', '3D seat view. Drag or use the arrow keys to look around from this fixed seat.');
    canvas.setAttribute('aria-keyshortcuts', 'ArrowUp ArrowDown ArrowLeft ArrowRight');
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'grab';

    const direction = new THREE.Vector3();
    const spherical = new THREE.Spherical();
    let drag: { id: number; x: number; y: number } | null = null;
    const look = (yaw: number, pitch: number) => {
      if (yaw === 0 && pitch === 0) return;
      spherical.setFromVector3(direction.subVectors(currentTarget.current, camera.position));
      spherical.theta += yaw;
      // Stay away from both poles so lookAt never flips the camera upside down.
      spherical.phi = THREE.MathUtils.clamp(spherical.phi + pitch, 0.02, Math.PI - 0.02);
      direction.setFromSpherical(spherical);
      currentTarget.current.copy(camera.position).add(direction);
      camera.lookAt(currentTarget.current);
      controls?.target?.copy(currentTarget.current);
      progress.current = 1;
      azimuthCallback.current?.(Math.atan2(direction.x, direction.z));
      invalidate();
    };
    const endDrag = () => {
      if (!drag) return;
      const id = drag.id;
      drag = null;
      canvas.style.cursor = 'grab';
      // Cancellation/unmount can happen after the browser has released capture.
      if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    };
    const pointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0 || drag || event.defaultPrevented) return;
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        return; // The pointer may already have been cancelled by the browser.
      }
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      canvas.style.cursor = 'grabbing';
      canvas.focus({ preventScroll: true });
      event.preventDefault();
    };
    const pointerMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      if ((event.buttons & 1) === 0) {
        endDrag();
        return;
      }
      // CSS-pixel deltas work for mouse, pen and a single primary touch.
      const yaw = -(event.clientX - drag.x) * 0.004;
      const pitch = (event.clientY - drag.y) * 0.004;
      drag.x = event.clientX;
      drag.y = event.clientY;
      look(yaw, pitch);
      event.preventDefault();
    };
    const pointerEnd = (event: PointerEvent) => {
      if (event.pointerId === drag?.id) endDrag();
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.target !== canvas || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const step = THREE.MathUtils.degToRad(3);
      switch (event.key) {
        case 'ArrowLeft': look(step, 0); break;
        case 'ArrowRight': look(-step, 0); break;
        case 'ArrowUp': look(0, -step); break;
        case 'ArrowDown': look(0, step); break;
        default: return;
      }
      event.preventDefault();
    };

    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', pointerEnd);
    canvas.addEventListener('pointercancel', pointerEnd);
    canvas.addEventListener('lostpointercapture', pointerEnd);
    canvas.addEventListener('blur', endDrag);
    canvas.addEventListener('keydown', keyDown);
    return () => {
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerEnd);
      canvas.removeEventListener('pointercancel', pointerEnd);
      canvas.removeEventListener('lostpointercapture', pointerEnd);
      canvas.removeEventListener('blur', endDrag);
      canvas.removeEventListener('keydown', keyDown);
      endDrag();
      attributes.forEach((name, index) => {
        const previous = previousAttributes[index];
        if (previous === null) canvas.removeAttribute(name);
        else canvas.setAttribute(name, previous);
      });
      canvas.style.touchAction = previousTouchAction;
      canvas.style.cursor = previousCursor;
    };
  }, [camera, controls, gl.domElement, seat, seatMode, requestId, invalidate]);

  useEffect(() => {
    if (!controls || seatMode) return;
    const cancel = () => {
      progress.current = 1;
      currentTarget.current.copy(controls.target);
    };
    const syncTarget = () => {
      if (progress.current >= 1) currentTarget.current.copy(controls.target);
    };
    controls.addEventListener?.('start', cancel);
    controls.addEventListener?.('change', syncTarget);
    return () => {
      controls.removeEventListener?.('start', cancel);
      controls.removeEventListener?.('change', syncTarget);
    };
  }, [controls, seatMode]);

  useFrame((_, delta) => {
    if (progress.current < 1) {
      // A demand-rendered canvas can sleep for a long time. Never let the
      // first frame after that idle period consume an entire camera tween.
      const step = Math.min(Math.max(delta, 0), 1 / 30);
      progress.current = Math.min(1, progress.current + step / duration.current);
      const t = easeInOutCubic(progress.current);
      animatedPosition.current.lerpVectors(startPos.current, endPos.current, t);
      animatedTarget.current.lerpVectors(startTarget.current, endTarget.current, t);
      camera.position.copy(animatedPosition.current);
      camera.lookAt(animatedTarget.current);
      if (controls?.target) {
        controls.target.copy(animatedTarget.current);
        if (!seatMode) controls.update();
      }
      currentTarget.current.copy(animatedTarget.current);
      if (progress.current < 1) invalidate();
    }

    // Drei updates OrbitControls at priority -1. Clip after our animation/update
    // too, so returning from a distant view restores close-up precision this frame.
    const full = bounds?.full ?? bounds;
    const [x, y, z] = full?.center ?? [0, 0, 0];
    const fullRadius = full?.radius ?? 100;
    const siteExtent = Math.hypot(fullRadius, fullRadius, (full?.height ?? 0) * 0.5);
    const siteDistance = Math.hypot(camera.position.x - x, camera.position.y - y, camera.position.z - z);
    const nearestGeometryDistance = Math.max(0, siteDistance - siteExtent);
    // Use only a quarter of the empty gap outside the enclosing sphere, keeping
    // ample clearance for every stadium surface while improving distant depth.
    const nextNear = seatMode ? 0.05 : Math.max(0.1, nearestGeometryDistance * 0.25);
    const nextFar = Math.max(1000, siteDistance + siteExtent * 1.1);
    let clippingChanged = false;
    if (camera.near !== nextNear) {
      camera.near = nextNear;
      clippingChanged = true;
    }
    if (camera.far !== nextFar) {
      camera.far = nextFar;
      clippingChanged = true;
    }
    if (clippingChanged) camera.updateProjectionMatrix();
  });

  return null;
}

function getTarget(preset: CameraPreset, bounds: ModelBounds | null, camera: THREE.PerspectiveCamera): CameraTarget {
  if (!bounds) return CAMERA_PRESETS[preset];
  const fit = preset === 'pitch' ? bounds.wicket ?? bounds.pitch ?? bounds : bounds;
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
    default:
      return { position: [center[0] + distance * 0.72, center[1] + distance * 0.55, center[2] + distance * 0.72], target, duration: 1.2 };
  }
}
