"use client";

import { useFrame } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import { gameClock } from "@/lib/game/clock";
import { ParticlePool, type EmitConfig } from "@/lib/particles/ParticlePool";
import { particleFragmentShader, particleVertexShader } from "@/lib/particles/particleShader";
import { sampleOceanHeight } from "@/lib/waves/oceanSampler";
import { useSettingsStore } from "@/stores/settingsStore";

export type SprayParticlesHandle = {
  pool: ParticlePool;
  emit: (config: EmitConfig) => void;
};

export const SprayParticles = forwardRef<SprayParticlesHandle>(function SprayParticles(_, ref) {
  const particleMax = useSettingsStore((s) => s.perf.particleMax);
  const poolRef = useRef<ParticlePool | null>(null);
  const pointsRef = useRef<THREE.Points>(null);

  if (!poolRef.current || poolRef.current.count !== particleMax) {
    poolRef.current = new ParticlePool(particleMax);
  }

  const geometry = useMemo(() => {
    const pool = poolRef.current!;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pool.positions, 3));
    geo.setAttribute("aLife", new THREE.BufferAttribute(pool.lives, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(pool.sizes, 1));
    geo.setAttribute("aKind", new THREE.BufferAttribute(pool.kinds, 1));
    return geo;
  }, [particleMax]);

  useImperativeHandle(ref, () => ({
    pool: poolRef.current!,
    emit: (config) => poolRef.current?.emit(config),
  }));

  useFrame(() => {
    const pool = poolRef.current;
    if (!pool) return;
    pool.update(gameClock.delta, (x, z) => sampleOceanHeight(x, z, gameClock.time));

    const geo = pointsRef.current?.geometry;
    if (!geo) return;
    (geo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    (geo.getAttribute("aLife") as THREE.BufferAttribute).needsUpdate = true;
    (geo.getAttribute("aSize") as THREE.BufferAttribute).needsUpdate = true;
    (geo.getAttribute("aKind") as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false} key={particleMax}>
      <shaderMaterial
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
});