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
  const groupRef = useRef<THREE.Group>(null);
  const segments = useSettingsStore((s) => s.perf.oceanSegments);
  const spot = getActiveSpot();

  const baseMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: spot.atmosphere.shallowWater,
        toneMapped: false,
      }),
    [spot.id],
  );

  const waveMaterial = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: spot.atmosphere.shallowWater,
        emissive: spot.atmosphere.deepWater,
        emissiveIntensity: 0.12,
        side: THREE.DoubleSide,
      }),
    [spot.id],
  );

  const computeNormals = useSettingsStore((s) => s.perfTier !== "low");

  useEffect(() => {
    setOceanMode("gerstner");
    bindOceanSimulator(null);
    return () => bindOceanSimulator(null);
  }, [spot.id]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    group.position.set(boardVisualState.x, 0, boardVisualState.z);

    const waveMesh = group.children[1] as THREE.Mesh | undefined;
    if (!waveMesh) return;

    const geo = waveMesh.geometry as THREE.PlaneGeometry;
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
      const sample = sampleGerstnerWaves(wx, wz, time, waves);
      pos.setZ(i, sample.height);
    }

    pos.needsUpdate = true;
    if (computeNormals) geo.computeVertexNormals();
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false} material={baseMaterial}>
        <planeGeometry args={[OCEAN_SIZE, OCEAN_SIZE, 1, 1]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false} material={waveMaterial}>
        <planeGeometry args={[OCEAN_SIZE, OCEAN_SIZE, segments, segments]} />
      </mesh>
    </group>
  );
}