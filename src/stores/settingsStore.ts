import { create } from "zustand";
import {
  detectPerfTier,
  PERF_PRESETS,
  type PerfPreset,
  type PerfTier,
} from "@/lib/performance/tiers";
import type { OceanMode } from "@/lib/waves/oceanSampler";
import { setOceanMode as applyOceanMode } from "@/lib/waves/oceanSampler";
import type { RendererKind } from "@/lib/gpu/webgpu";
import { preferredOceanForTier } from "@/lib/spots/spotOcean";
import { useSpotStore } from "@/stores/spotStore";

type SettingsStore = {
  oceanMode: OceanMode;
  rendererKind: RendererKind;
  perfTier: PerfTier;
  perf: PerfPreset;
  setOceanMode: (mode: OceanMode) => void;
  setRendererKind: (kind: RendererKind) => void;
  setPerfTier: (tier: PerfTier) => void;
  initPerf: () => void;
};

const initialPerfTier = detectPerfTier();

export const useSettingsStore = create<SettingsStore>((set) => ({
  oceanMode: "gerstner",
  rendererKind: "webgl",
  perfTier: initialPerfTier,
  perf: PERF_PRESETS[initialPerfTier],

  setOceanMode: (oceanMode) => {
    applyOceanMode(oceanMode);
    set({ oceanMode });
  },

  setRendererKind: (rendererKind) => set({ rendererKind }),

  setPerfTier: (perfTier) => {
    const spotId = useSpotStore.getState().spotId;
    const oceanMode = preferredOceanForTier(perfTier, spotId);
    applyOceanMode(oceanMode);
    set({ perfTier, perf: PERF_PRESETS[perfTier], oceanMode });
  },

  initPerf: () => {
    const tier = detectPerfTier();
    const spotId = useSpotStore.getState().spotId;
    const oceanMode = preferredOceanForTier(tier, spotId);
    applyOceanMode(oceanMode);
    set({ perfTier: tier, perf: PERF_PRESETS[tier], oceanMode });
  },
}));