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