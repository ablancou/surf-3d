import { create } from "zustand";
import { DEFAULT_SPOT, SURF_SPOTS, type SpotConfig, type SpotId } from "@/lib/spots/spotConfig";
import { syncOceanModeForSpot } from "@/lib/spots/spotOcean";

type SpotStore = {
  spotId: SpotId;
  spot: SpotConfig;
  setSpot: (id: SpotId) => void;
};

export const useSpotStore = create<SpotStore>((set) => ({
  spotId: DEFAULT_SPOT,
  spot: SURF_SPOTS[DEFAULT_SPOT],
  setSpot: (spotId) => {
    set({ spotId, spot: SURF_SPOTS[spotId] });
    syncOceanModeForSpot(spotId);
  },
}));

export function getActiveSpot(): SpotConfig {
  return useSpotStore.getState().spot;
}

export function getActiveWaves() {
  return getActiveSpot().waves;
}