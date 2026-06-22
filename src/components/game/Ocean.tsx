"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { boardVisualState } from "@/lib/game/boardVisualState";
import { OCEAN_SIZE } from "@/lib/waves/waveConfig";
import { bindOceanSimulator, setOceanMode } from "@/lib/waves/oceanSampler";
import { getActiveSpot } from "@/stores/spotStore";

export function Ocean() {
  const meshRef = useRef<THREE.Mesh>(null);
  const spot = getActiveSpot();

  useEffect(() => {
    setOceanMode("gerstner");
    bindOceanSimulator(null);
    return () => bindOceanSimulator(null);
  }, [spot.id]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const tileX = Math.floor(boardVisualState.x / OCEAN_SIZE) * OCEAN_SIZE;
    const tileZ = Math.floor(boardVisualState.z / OCEAN_SIZE) * OCEAN_SIZE;
    mesh.position.set(tileX, 0, tileZ);
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
      <planeGeometry args={[OCEAN_SIZE, OCEAN_SIZE, 1, 1]} />
      <meshBasicMaterial color={spot.atmosphere.shallowWater} side={THREE.DoubleSide} />
    </mesh>
  );
}