"use client";

import { useFrame } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, HueSaturation, Vignette } from "@react-three/postprocessing";
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
        luminanceThreshold={0.65}
        luminanceSmoothing={0.3}
        mipmapBlur
      />
      <DepthOfField 
        focusDistance={0.015} 
        focalLength={0.05} 
        bokehScale={1.5} 
        height={480} 
      />
      <HueSaturation
        hue={0}
        saturation={0.15} // Ligeramente más saturado para un look más "Wow"
      />
      <Vignette eskil={false} offset={0.15} darkness={0.6} />
    </EffectComposer>
  );
}