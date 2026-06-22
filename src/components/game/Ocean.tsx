"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { boardVisualState } from "@/lib/game/boardVisualState";
import { gameClock } from "@/lib/game/clock";
import { oceanFragmentShader, oceanVertexShader } from "@/lib/waves/oceanShader";
import { MAX_WAVES, OCEAN_SIZE } from "@/lib/waves/waveConfig";
import { bindOceanSimulator, setOceanMode } from "@/lib/waves/oceanSampler";
import { getActiveSpot, getActiveWaves } from "@/stores/spotStore";
import { useSettingsStore } from "@/stores/settingsStore";

function buildWaveUniforms() {
  const waves = getActiveWaves();
  const waveA = Array.from({ length: MAX_WAVES }, () => new THREE.Vector4());
  const waveB = Array.from({ length: MAX_WAVES }, () => new THREE.Vector4());

  for (let i = 0; i < MAX_WAVES; i++) {
    const w = waves[i];
    if (!w) continue;
    waveA[i].set(w.amplitude, w.wavelength, w.speed, w.steepness);
    waveB[i].set(Math.cos(w.direction), Math.sin(w.direction), 0, 0);
  }

  return { waveA, waveB };
}

export function Ocean() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const segments = useSettingsStore((s) => s.perf.oceanSegments);
  const spot = getActiveSpot();
  const waveUniforms = useMemo(() => buildWaveUniforms(), [spot.id]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWaveA: { value: waveUniforms.waveA },
      uWaveB: { value: waveUniforms.waveB },
      uDeepColor: { value: new THREE.Color(spot.atmosphere.deepWater) },
      uShallowColor: { value: new THREE.Color(spot.atmosphere.shallowWater) },
      uFoamColor: { value: new THREE.Color("#e8f4f8") },
      uSunDirection: { value: new THREE.Vector3(0.6, 0.85, 0.3).normalize() },
      uFoamThreshold: { value: 0.28 },
    }),
    [waveUniforms, spot.id],
  );

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

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = gameClock.time;
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      frustumCulled={false}
      receiveShadow
    >
      <planeGeometry args={[OCEAN_SIZE, OCEAN_SIZE, segments, segments]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={oceanVertexShader}
        fragmentShader={oceanFragmentShader}
        uniforms={uniforms}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}