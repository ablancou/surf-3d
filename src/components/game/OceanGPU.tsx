"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Ocean } from "@/components/game/Ocean";
import { boardVisualState } from "@/lib/game/boardVisualState";
import { gameClock } from "@/lib/game/clock";
import { oceanFragmentShader, oceanVertexShader } from "@/lib/waves/oceanShader";
import { bindOceanSimulator, setOceanMode } from "@/lib/waves/oceanSampler";
import { MAX_WAVES, OCEAN_SIZE } from "@/lib/waves/waveConfig";
import { getActiveSpot, getActiveWaves } from "@/stores/spotStore";
import { useSettingsStore } from "@/stores/settingsStore";

function buildWaveUniforms(waves: ReturnType<typeof getActiveWaves>) {
  const uWaveA: THREE.Vector4[] = [];
  const uWaveB: THREE.Vector4[] = [];
  for (let i = 0; i < MAX_WAVES; i++) {
    const w = waves[i];
    if (w) {
      uWaveA.push(new THREE.Vector4(w.amplitude, w.wavelength, w.speed, w.steepness));
      uWaveB.push(new THREE.Vector4(Math.cos(w.direction), Math.sin(w.direction), 0, 0));
    } else {
      uWaveA.push(new THREE.Vector4());
      uWaveB.push(new THREE.Vector4());
    }
  }
  return { uWaveA, uWaveB };
}

export function OceanGPU() {
  const { gl, scene, camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [useCpuFallback, setUseCpuFallback] = useState(false);
  const segments = useSettingsStore((s) => s.perf.oceanSegments);
  const spot = getActiveSpot();

  const uniforms = useMemo(() => {
    const { uWaveA, uWaveB } = buildWaveUniforms(getActiveWaves());
    return {
      uTime: { value: 0 },
      uWaveA: { value: uWaveA },
      uWaveB: { value: uWaveB },
      uDeepColor: { value: new THREE.Color(spot.atmosphere.deepWater) },
      uShallowColor: { value: new THREE.Color(spot.atmosphere.shallowWater) },
      uFoamColor: { value: new THREE.Color("#e8f6fc") },
      uSunDirection: { value: new THREE.Vector3(0.6, 0.85, 0.3).normalize() },
      uCameraPosition: { value: new THREE.Vector3() },
      uFoamThreshold: { value: 0.18 },
    };
  }, [spot.id]);

  useEffect(() => {
    setOceanMode("gerstner");
    bindOceanSimulator(null);
    return () => bindOceanSimulator(null);
  }, [spot.id]);

  useEffect(() => {
    const mesh = meshRef.current;
    const mat = materialRef.current;
    if (!mesh || !mat) return;

    let cancelled = false;
    void gl.compileAsync(scene, camera).then(() => {
      if (cancelled) return;
      const ctx = gl.getContext();
      const program = (mat as THREE.ShaderMaterial & { program?: { program: WebGLProgram } }).program;
      if (!program?.program || !ctx.getProgramParameter(program.program, ctx.LINK_STATUS)) {
        setUseCpuFallback(true);
      }
    }).catch(() => {
      if (!cancelled) setUseCpuFallback(true);
    });

    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, spot.id, segments]);

  useFrame(() => {
    const mesh = meshRef.current;
    const mat = materialRef.current;
    if (!mesh || !mat) return;

    mesh.position.set(boardVisualState.x, 0, boardVisualState.z);
    mat.uniforms.uTime.value = gameClock.time;
    mat.uniforms.uCameraPosition.value.copy(camera.position);

    const activeWaves = getActiveWaves();
    const waveA = mat.uniforms.uWaveA.value as THREE.Vector4[];
    const waveB = mat.uniforms.uWaveB.value as THREE.Vector4[];
    for (let i = 0; i < MAX_WAVES; i++) {
      const w = activeWaves[i];
      if (w) {
        waveA[i].set(w.amplitude, w.wavelength, w.speed, w.steepness);
        waveB[i].set(Math.cos(w.direction), Math.sin(w.direction), 0, 0);
      }
    }
  });

  if (useCpuFallback) return <Ocean />;

  return (
    <mesh ref={meshRef} rotation-x={-Math.PI / 2} frustumCulled={false}>
      <planeGeometry args={[OCEAN_SIZE, OCEAN_SIZE, segments, segments]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={oceanVertexShader}
        fragmentShader={oceanFragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        depthWrite
      />
    </mesh>
  );
}