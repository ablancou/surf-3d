"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useSettingsStore } from "@/stores/settingsStore";

export function Effects() {
  const enabled = false && useSettingsStore((s) => s.perf.enableEffects);
  if (!enabled) return null;

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.35}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.12} darkness={0.55} />
    </EffectComposer>
  );
}