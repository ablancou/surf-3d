export type PerfTier = "high" | "medium" | "low";

export type PerfPreset = {
  oceanSegments: number;
  ifftSize: 32 | 64;
  particleMax: number;
  enableEffects: boolean;
  enableShadows: boolean;
  dprMax: number;
  shadowMapSize: number;
  fogFar: number;
};

export const PERF_PRESETS: Record<PerfTier, PerfPreset> = {
  high: {
    oceanSegments: 128,
    ifftSize: 64,
    particleMax: 1200,
    enableEffects: true,
    enableShadows: false,
    dprMax: 1.5,
    shadowMapSize: 2048,
    fogFar: 180,
  },
  medium: {
    oceanSegments: 80,
    ifftSize: 64,
    particleMax: 500,
    enableEffects: false,
    enableShadows: false,
    dprMax: 1.25,
    shadowMapSize: 1024,
    fogFar: 140,
  },
  low: {
    oceanSegments: 96,
    ifftSize: 32,
    particleMax: 350,
    enableEffects: false,
    enableShadows: false,
    dprMax: 1,
    shadowMapSize: 512,
    fogFar: 100,
  },
};

export function detectPerfTier(): PerfTier {
  if (typeof window === "undefined") return "medium";

  const ua = navigator.userAgent;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency ?? 4;

  if (mobile || (mem !== undefined && mem < 4) || cores < 4) return "low";
  if (mem !== undefined && mem < 8) return "medium";
  return "high";
}