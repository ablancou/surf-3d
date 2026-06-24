import type { GerstnerWave } from "@/lib/waves/waveConfig";

export type BreakingWaveState = {
  /** 0 = trough, 1 = crest peel */
  peelPhase: number;
  /** Radians — direction swell travels */
  peelDirection: number;
  /** 0–1 lip curl / overhang intensity */
  curl: number;
  steepness: number;
  /** Lip is actively throwing (barrel forming) */
  isBreaking: boolean;
};

/**
 * Evolving peel + curl from primary swell phase — drives barrel geometry.
 */
export function sampleBreakingWave(
  x: number,
  z: number,
  time: number,
  waves: readonly GerstnerWave[],
): BreakingWaveState {
  const primary = waves[0] ?? {
    amplitude: 1,
    wavelength: 80,
    speed: 3,
    direction: 0,
    steepness: 0.4,
  };

  const k = (Math.PI * 2) / primary.wavelength;
  const dirX = Math.cos(primary.direction);
  const dirZ = Math.sin(primary.direction);
  const phase = k * (dirX * x + dirZ * z) - primary.speed * time;

  const sinP = Math.sin(phase);
  const cosP = Math.cos(phase);

  const peelPhase = (sinP + 1) * 0.5;
  const curlRaw = Math.max(0, sinP - 0.25) * primary.steepness * 1.35;
  const curl = Math.min(1, curlRaw + Math.max(0, -cosP) * 0.15);

  const steepness = Math.sqrt(
    (k * primary.amplitude * cosP * dirX) ** 2 +
      (k * primary.amplitude * cosP * dirZ) ** 2,
  );

  const isBreaking = peelPhase > 0.48 && curl > 0.12 && steepness > 0.08;

  return {
    peelPhase,
    peelDirection: primary.direction,
    curl,
    steepness,
    isBreaking,
  };
}

/** Overhang height at a point ahead of the rider (lip curl geometry). */
export function sampleLipOverhang(
  x: number,
  z: number,
  time: number,
  waves: readonly GerstnerWave[],
  ahead = 2.4,
): number {
  const br = sampleBreakingWave(x, z, time, waves);
  const dirX = Math.cos(br.peelDirection);
  const dirZ = Math.sin(br.peelDirection);
  const lip = sampleBreakingWave(x + dirX * ahead, z + dirZ * ahead, time, waves);
  return br.curl * primaryAmp(waves) * (0.6 + lip.peelPhase * 0.5);
}

function primaryAmp(waves: readonly GerstnerWave[]) {
  return waves[0]?.amplitude ?? 1;
}