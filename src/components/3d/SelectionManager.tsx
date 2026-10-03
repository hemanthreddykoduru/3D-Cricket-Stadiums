import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { LayerKey } from '@/types/stadium';

interface Props {
  root: THREE.Object3D;
  layers: Record<LayerKey, boolean>;
}

function belongsToEnvironment(name: string) {
  return name.startsWith('Web_Environment_') || name.startsWith('Step21_Environment_');
}

function belongsToRoads(name: string) {
  return name.includes('AccessRoad') || name.includes('PedestrianPlaza') || name.includes('Driveway') || name.includes('Access_Ribbon') || name.includes('Forecourt');
}

function belongsToParking(name: string) {
  return name.startsWith('Step21_Environment_Parking_');
}

function belongsToSeats(name: string) {
  return name.includes('Seating_Detail');
}

export function SelectionManager({ root, layers }: Props) {
  useLayoutEffect(() => {
    root.traverse((object) => {
      if (object === root) return;
      const name = object.name;
      let visible = layers.stadium;
      if (belongsToEnvironment(name)) visible = visible && layers.environment;
      if (belongsToRoads(name)) visible = visible && layers.roads;
      if (belongsToParking(name)) visible = visible && layers.parking;
      if (belongsToSeats(name)) visible = visible && layers.seats;
      object.visible = visible;
    });
  }, [root, layers]);

  return null;
}
