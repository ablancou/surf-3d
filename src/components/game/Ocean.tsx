"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { boardVisualState } from "@/lib/game/boardVisualState";
import { gameClock } from "@/lib/game/clock";
import { sampleGerstnerWaves } from "@/lib/waves/gerstner";
import { OCEAN_SIZE } from "@/lib/waves/waveConfig";
import { bindOceanSimulator, setOceanMode } from "@/lib/waves/oceanSampler";
import { getActiveSpot, getActiveWaves } from "@/stores/spotStore";
import { useSettingsStore } from "@/stores/settingsStore";

export function Ocean() {
  const meshRef = useRef<THREE.Mesh>(null);
  const segments = useSettingsStore((s) => s.perf.oceanSegments);
  const spot = getActiveSpot();

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: spot.atmosphere.shallowWater,
        emissive: spot.atmosphere.deepWater,
        emissiveIntensity: 0.12,
        roughness: 0.28,
        metalness: 0.18,
        side: THREE.DoubleSide,
        flatShading: false,
      }),
    [spot.id],
  );

  useEffect(() => {
    setOceanMode("gerstner");
    bindOceanSimulator(null);
    return () => bindOceanSimulator(null);
  }, [spot.id]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.position.set(boardVisualState.x, 0, boardVisualState.z);

    const geo = mesh.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const waves = getActiveWaves();
    const bx = boardVisualState.x;
    const bz = boardVisualState.z;
    const time = gameClock.time;

    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const ly = pos.getY(i);
      const wx = lx + bx;
      const wz = -ly + bz;
      const h = sampleGerstnerWaves(wx, wz, time, waves).height;
      pos.setZ(i, h);
    }

    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      frustumCulled={false}
      receiveShadow
      material={material}
    >
      <planeGeometry args={[OCEAN_SIZE, OCEAN_SIZE, segments, segments]} />
    </mesh>
  );
}