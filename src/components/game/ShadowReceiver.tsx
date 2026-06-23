"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { boardVisualState } from "@/lib/game/boardVisualState";
import { OCEAN_SIZE } from "@/lib/waves/waveConfig";
import { getActiveSpot } from "@/stores/spotStore";
import { useSettingsStore } from "@/stores/settingsStore";

/** Flat plane that follows the rider and receives board shadows (GPU ocean has no shadow map in shader). */
export function ShadowReceiver() {
  const meshRef = useRef<THREE.Mesh>(null);
  const enableShadows = useSettingsStore((s) => s.perf.enableShadows);
  const spot = getActiveSpot();

  const material = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: spot.atmosphere.deepWater,
        transparent: true,
        opacity: 0.01,
        depthWrite: false,
      }),
    [spot.id],
  );

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.position.set(boardVisualState.x, -0.05, boardVisualState.z);
  });

  if (!enableShadows) return null;

  return (
    <mesh ref={meshRef} rotation-x={-Math.PI / 2} frustumCulled={false} receiveShadow material={material}>
      <planeGeometry args={[OCEAN_SIZE, OCEAN_SIZE, 1, 1]} />
    </mesh>
  );
}