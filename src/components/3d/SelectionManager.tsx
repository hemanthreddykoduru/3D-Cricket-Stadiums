import { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getStadiumLayer, isModelObjectExcluded, isStadiumLayerVisible } from '@/lib/model';
import type { LayerKey } from '@/types/stadium';

interface Props {
  root: THREE.Object3D;
  layers: Record<LayerKey, boolean>;
}

export function SelectionManager({ root, layers }: Props) {
  const { gl, invalidate } = useThree();

  useLayoutEffect(() => {
    const shadowMap = gl.shadowMap;
    const previousAutoUpdate = shadowMap.autoUpdate;
    shadowMap.autoUpdate = false;
    invalidate();

    return () => {
      // Restore renderer state only while this effect still owns the static
      // setting; another scene/controller may have taken over meanwhile.
      if (shadowMap.autoUpdate === false) shadowMap.autoUpdate = previousAutoUpdate;
    };
  }, [gl, invalidate]);

  useLayoutEffect(() => {
    root.traverse((object) => {
      // Classify renderable meshes, keeping groups open for child metadata overrides.
      object.visible = !isModelObjectExcluded(object) && (object instanceof THREE.Mesh
        ? isStadiumLayerVisible(getStadiumLayer(object), layers)
        : layers.stadium);
    });
    // Visibility changes alter shadow casters. With automatic updates off,
    // explicitly rebuild the cached map and wake the demand-rendered canvas.
    gl.shadowMap.needsUpdate = true;
    invalidate();
  }, [root, layers, gl, invalidate]);

  return null;
}
