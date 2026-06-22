"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { boardVisualState } from "@/lib/game/boardVisualState";
import { gameClock } from "@/lib/game/clock";
import { OceanSimulator } from "@/lib/waves/OceanSimulator";
import { bindOceanSimulator, setOceanMode } from "@/lib/waves/oceanSampler";
import { ifftOceanFragmentShader, ifftOceanVertexShader } from "@/lib/waves/oceanIFFTShader";
import { OCEAN_SIZE } from "@/lib/waves/waveConfig";
import { getActiveSpot } from "@/stores/spotStore";
import { useSettingsStore } from "@/stores/settingsStore";

export function OceanIFFT() {
  const meshRef = useRef<THREE.Mesh>(null);
  const simRef = useRef<OceanSimulator | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const textureRef = useRef<THREE.DataTexture | null>(null);
  const segments = useSettingsStore((s) => s.perf.oceanSegments);
  const ifftSize = useSettingsStore((s) => s.perf.ifftSize);
  const spot = getActiveSpot();

  useEffect(() => {
    const sim = new OceanSimulator({ size: ifftSize });
    simRef.current = sim;
    textureRef.current = sim.getHeightTexture();
    setOceanMode("ifft");
    bindOceanSimulator(sim);
    return () => {
      bindOceanSimulator(null);
      setOceanMode("gerstner");
    };
  }, [ifftSize, spot.id]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHeightMap: { value: textureRef.current },
      uOceanSize: { value: OCEAN_SIZE },
      uHeightScale: { value: spot.ifft.heightScale },
      uDeepColor: { value: new THREE.Color(spot.atmosphere.deepWater) },
      uShallowColor: { value: new THREE.Color(spot.atmosphere.shallowWater) },
      uFoamColor: { value: new THREE.Color("#e8f6fc") },
      uSunDirection: { value: new THREE.Vector3(0.6, 0.85, 0.3).normalize() },
      uFoamThreshold: { value: 0.18 },
    }),
    [spot.id],
  );

  useFrame(() => {
    const mesh = meshRef.current;
    if (mesh) {
      mesh.position.set(boardVisualState.x, 0, boardVisualState.z);
    }

    const sim = simRef.current;
    const mat = materialRef.current;
    const tex = textureRef.current;
    if (!sim || !mat || !tex) return;

    sim.step(gameClock.time);
    tex.image.data = sim.heightField;
    tex.needsUpdate = true;
    mat.uniforms.uTime.value = gameClock.time;
    mat.uniforms.uHeightScale.value = sim.heightScale;
    if (mat.uniforms.uHeightMap.value !== tex) {
      mat.uniforms.uHeightMap.value = tex;
    }
  });

  return (
    <mesh ref={meshRef} rotation-x={-Math.PI / 2} frustumCulled={false} receiveShadow>
      <planeGeometry args={[OCEAN_SIZE, OCEAN_SIZE, segments, segments]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={ifftOceanVertexShader}
        fragmentShader={ifftOceanFragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        transparent={false}
        depthWrite
      />
    </mesh>
  );
}