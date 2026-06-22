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

export const useSettingsStore = create<SettingsStore>((set) => ({
  oceanMode: "gerstner",
  rendererKind: "webgl",
  perfTier: "medium",
  perf: PERF_PRESETS.medium,

  setOceanMode: (oceanMode) => {
    applyOceanMode(oceanMode);
    set({ oceanMode });
  },

  setRendererKind: (rendererKind) => set({ rendererKind }),

  setPerfTier: (perfTier) => set({ perfTier, perf: PERF_PRESETS[perfTier] }),

  initPerf: () => {
    const tier = detectPerfTier();
    set({ perfTier: tier, perf: PERF_PRESETS[tier] });
  },
}));