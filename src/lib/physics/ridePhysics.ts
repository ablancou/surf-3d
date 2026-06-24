import type { GameInputState } from "@/lib/input/types";
import type { SpotPhysicsTuning } from "@/lib/spots/spotPhysics";

export const CRUISE_MIN_SPEED = 5.5;

/** Pure downhill impulse from wave-face alignment and rider input (no Rapier). */
export function computeRideImpulses(
  downhill: { x: number; z: number },
  speed: number,
  faceAlignment: number,
  downhillSpeed: number,
  input: GameInputState,
  tuning: SpotPhysicsTuning,
  dt: number,
): { ix: number; iz: number } {
  let ix = 0;
  let iz = 0;

  if (downhill.x === 0 && downhill.z === 0) return { ix, iz };

  const alignment = Math.max(0, faceAlignment);
  const lift = alignment * tuning.liftFactor * dt;
  const railBoost = Math.abs(input.leanX) * tuning.railGrip * dt;
  ix += downhill.x * (lift + railBoost);
  iz += downhill.z * (lift + railBoost);

  if (faceAlignment > 0.38 && Math.abs(input.leanX) < 0.4) {
    const trim = faceAlignment * tuning.trimFactor * dt * 1.15;
    ix += downhill.x * trim;
    iz += downhill.z * trim;
  }

  if (downhillSpeed < -0.45 && input.leanZ > 0.15) {
    const pump = input.leanZ * tuning.pumpFactor * dt * 1.1;
    ix += downhill.x * pump;
    iz += downhill.z * pump;
  }

  if (speed < 8 && faceAlignment > 0.28 && input.leanZ > 0.1) {
    const glide = (8 - speed) * 0.5 * faceAlignment * Math.max(input.leanZ, 0.35) * dt;
    ix += downhill.x * glide;
    iz += downhill.z * glide;
  }

  if (
    faceAlignment > 0.48 &&
    speed >= CRUISE_MIN_SPEED &&
    speed < tuning.maxSpeed * 0.95 &&
    Math.abs(input.leanX) < 0.22
  ) {
    const cruise = faceAlignment * (1 - Math.abs(input.leanX)) * 0.65 * dt;
    ix += downhill.x * cruise;
    iz += downhill.z * cruise;
  }

  if (faceAlignment > 0.35 && speed > 1.5 && speed < CRUISE_MIN_SPEED) {
    const recover = (CRUISE_MIN_SPEED - speed) * 0.55 * faceAlignment * dt;
    ix += downhill.x * recover;
    iz += downhill.z * recover;
  }

  const accel = tuning.inputAccel * dt;
  const drive = input.leanZ * accel * 1.55;
  ix += downhill.x * drive;
  iz += downhill.z * drive;

  return { ix, iz };
}