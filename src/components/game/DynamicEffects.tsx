"use client";

import { useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useRef, useState } from "react";
import { boardVisualState } from "@/lib/game/boardVisualState";
import { useGameStore } from "@/stores/gameStore";

export function DynamicEffects() {
  const [bloomIntensity, setBloomIntensity] = useState(0.35);
  const smooth = useRef(0.35);
  const frame = useRef(0);

  useFrame((_, delta) => {
    const { cameraShake, inTube, combo } = useGameStore.getState();
    const speed = boardVisualState.speed;
    const target =
      0.32 +
      cameraShake * 0.3 +
      Math.min(speed / 22, 0.18) +
      (inTube ? 0.1 : 0) +
      Math.min(combo * 0.008, 0.12);

    smooth.current += (target - smooth.current) * Math.min(1, delta * 5);
    frame.current += 1;
    if (frame.current % 3 === 0) {
      setBloomIntensity(smooth.current);
    }
  });

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.58}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.12} darkness={0.55} />
    </EffectComposer>
  );
}