"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { boardVisualState } from "@/lib/game/boardVisualState";
import { OCEAN_SIZE } from "@/lib/waves/waveConfig";
import { useSpotStore } from "@/stores/spotStore";

export function Seafloor() {
  const meshRef = useRef<THREE.Mesh>(null);
  const spot = useSpotStore((s) => s.spot);

  const material = useMemo(() => {
    const shallow = new THREE.Color(spot.atmosphere.shallowWater);
    const sand = new THREE.Color(
      spot.id === "pipeline" ? "#4a3528" : spot.id === "beach_break" ? "#c9a66b" : "#8a7355",
    );
    return new THREE.MeshStandardMaterial({
      color: shallow.clone().lerp(sand, 0.62),
      roughness: 0.95,
      metalness: 0.02,
    });
  }, [spot.id, spot.atmosphere.shallowWater]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.position.set(boardVisualState.x, -6.5, boardVisualState.z);
  });

  return (
    <mesh ref={meshRef} rotation-x={-Math.PI / 2} frustumCulled={false} receiveShadow material={material}>
      <planeGeometry args={[OCEAN_SIZE, OCEAN_SIZE, 1, 1]} />
    </mesh>
  );
}