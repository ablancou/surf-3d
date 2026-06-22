"use client";

import { Ocean } from "@/components/game/Ocean";
import { OceanIFFT } from "@/components/game/OceanIFFT";
import { useSettingsStore } from "@/stores/settingsStore";

export function OceanSystem() {
  const oceanMode = useSettingsStore((s) => s.oceanMode);
  return (
    <group key={oceanMode}>
      {oceanMode === "ifft" ? <OceanIFFT /> : <Ocean />}
    </group>
  );
}