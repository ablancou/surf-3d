import { SURF_SPOTS, type SpotId } from "@/lib/spots/spotConfig";
import type { OceanMode } from "@/lib/waves/oceanSampler";
import { useSettingsStore } from "@/stores/settingsStore";

export function preferredOceanForTier(tier: "high" | "medium" | "low", spotId: SpotId): OceanMode {
  if (tier === "low") return "gerstner";
  return SURF_SPOTS[spotId].preferredOcean;
}

export function syncOceanModeForSpot(spotId: SpotId) {
  const { perfTier, setOceanMode } = useSettingsStore.getState();
  setOceanMode(preferredOceanForTier(perfTier, spotId));
}