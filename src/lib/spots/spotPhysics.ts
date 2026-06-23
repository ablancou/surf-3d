import { getActiveSpot } from "@/stores/spotStore";

export type SpotPhysicsTuning = {
  buoyancy: number;
  liftFactor: number;
  pumpFactor: number;
  trimFactor: number;
  railGrip: number;
  tubeGrip: number;
  inputAccel: number;
  maxSpeed: number;
  spawnBoost: number;
  /** >1 = más tolerante a wipeouts */
  wipeoutScale: number;
};

export type SpotMusicTuning = {
  baseBpm: number;
  chords: readonly [number, number, number];
  filterBase: number;
  kickLow: number;
  kickHigh: number;
  /** Extra lowpass when in tube (0–1, lower = más apagado) */
  tubeMuffle: number;
};

export type SpotTubeTuning = {
  minSpeed: number;
  minSteepness: number;
  minEnclosure: number;
  minLip: number;
  pocketBonus: number;
  rideScoreMultiplier: number;
};

export function getSpotPhysics(): SpotPhysicsTuning {
  return getActiveSpot().physics;
}

export function getSpotTube(): SpotTubeTuning {
  return getActiveSpot().tube;
}

export function getSpotMusic(): SpotMusicTuning {
  return getActiveSpot().music;
}