"use client";

import { Ocean } from "@/components/game/Ocean";
import { OceanGPU } from "@/components/game/OceanGPU";
import { OceanIFFT } from "@/components/game/OceanIFFT";
import { useSettingsStore } from "@/stores/settingsStore";

export function OceanSystem() {
  const oceanMode = useSettingsStore((s) => s.oceanMode);
  const perfTier = useSettingsStore((s) => s.perfTier);

  return (
    <group key={`${oceanMode}-${perfTier}`}>
      {oceanMode === "ifft" ? (
        <OceanIFFT />
      ) : perfTier === "high" ? (
        <OceanGPU />
      ) : (
        <Ocean />
      )}
    </group>
  );
}