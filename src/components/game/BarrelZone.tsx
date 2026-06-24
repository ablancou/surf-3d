"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { boardVisualState } from "@/lib/game/boardVisualState";
import { gameClock } from "@/lib/game/clock";
import { sampleBreakingWave } from "@/lib/waves/breakingWave";
import { getActiveWaves } from "@/stores/spotStore";
import { useGameStore } from "@/stores/gameStore";

/** 3D barrel tunnel mesh — visible when inside curl geometry */
export function BarrelZone() {
  const meshRef = useRef<THREE.Mesh>(null);
  const inTube = useGameStore((s) => s.inTube);
  const tubeDepth = useGameStore((s) => s.tubeDepth);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#0c4a6e",
        transparent: true,
        opacity: 0.22,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [],
  );

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const show = inTube && tubeDepth > 0.12;
    mesh.visible = show;
    if (!show) return;

    const br = sampleBreakingWave(
      boardVisualState.x,
      boardVisualState.z,
      gameClock.time,
      getActiveWaves(),
    );

    const radius = 1.8 + br.curl * 2.2 + tubeDepth * 1.4;
    const length = 4 + br.peelPhase * 3;
    mesh.position.set(boardVisualState.x, boardVisualState.y + 0.6, boardVisualState.z);
    mesh.rotation.y = br.peelDirection;
    mesh.scale.set(radius, length * 0.5, radius);
    material.opacity = 0.15 + tubeDepth * 0.25 + br.curl * 0.12;
  });

  return (
    <mesh ref={meshRef} visible={false} material={material}>
      <cylinderGeometry args={[1, 1.15, 1, 16, 1, true]} />
    </mesh>
  );
}