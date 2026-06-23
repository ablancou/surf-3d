import { create } from "zustand";
import { DEFAULT_SPOT, SURF_SPOTS, type SpotConfig, type SpotId } from "@/lib/spots/spotConfig";
import { syncOceanModeForSpot } from "@/lib/spots/spotOcean";
import { useGameStore } from "@/stores/gameStore";
import { useLeaderboardStore } from "@/stores/leaderboardStore";

type SpotStore = {
  spotId: SpotId;
  spot: SpotConfig;
  setSpot: (id: SpotId) => void;
};

export const useSpotStore = create<SpotStore>((set, get) => ({
  spotId: DEFAULT_SPOT,
  spot: SURF_SPOTS[DEFAULT_SPOT],
  setSpot: (spotId) => {
    if (spotId === get().spotId) return;
    set({ spotId, spot: SURF_SPOTS[spotId] });
    syncOceanModeForSpot(spotId);
    useGameStore.getState().resetRide();
    useLeaderboardStore.getState().resetSession();
  },
}));

export function getActiveSpot(): SpotConfig {
  return useSpotStore.getState().spot;
}

export function getActiveWaves() {
  return getActiveSpot().waves;
}