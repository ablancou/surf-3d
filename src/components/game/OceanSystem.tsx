"use client";

import { Ocean } from "@/components/game/Ocean";
import { OceanGPU } from "@/components/game/OceanGPU";
import { OceanIFFT } from "@/components/game/OceanIFFT";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSpotStore } from "@/stores/spotStore";

export function OceanSystem() {
  const oceanMode = useSettingsStore((s) => s.oceanMode);
  const perfTier = useSettingsStore((s) => s.perfTier);
  const spotId = useSpotStore((s) => s.spotId);

  return (
    <group key={`${oceanMode}-${perfTier}-${spotId}`}>
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