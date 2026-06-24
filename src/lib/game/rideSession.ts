import type { WipeoutReason } from "@/lib/tricks/types";

export type RidePhase = "menu" | "paddling" | "riding" | "wiped" | "recap";

export type RideEndReason = WipeoutReason | "fall" | "completed";

export type RideRecap = {
  score: number;
  trickCount: number;
  maxCombo: number;
  maxSpeed: number;
  reason: RideEndReason;
  durationSec: number;
};

export const RIDE_MAX_SEC = 75;
export const RIDE_EXIT_SPEED = 1.4;
export const RIDE_EXIT_ALIGNMENT = 0.12;
export const RIDE_SLOW_SEC = 2.8;
export const WIPE_TO_RECAP_SEC = 0.65;

export const CATCH_SPEED = 2.8;
export const CATCH_ALIGNMENT = 0.32;
export const STAND_UP_PADDLE_SEC = 0.35;
export const STAND_UP_BOOST = 5.5;

export function canCatchWave(
  speed: number,
  faceAlignment: number,
  leanZ: number,
  paddleSec: number,
): boolean {
  return (
    speed >= CATCH_SPEED &&
    faceAlignment >= CATCH_ALIGNMENT &&
    leanZ > 0.12 &&
    paddleSec >= STAND_UP_PADDLE_SEC
  );
}

/** Natural end of a successful ride — left the wave face or max duration. */
export function shouldCompleteRide(params: {
  phase: RidePhase;
  speed: number;
  faceAlignment: number;
  rideSec: number;
  peakSpeed: number;
  slowSec: number;
}): boolean {
  if (params.phase !== "riding") return false;
  if (params.rideSec >= RIDE_MAX_SEC) return true;
  if (params.peakSpeed < 3.5) return false;
  if (params.slowSec < RIDE_SLOW_SEC) return false;
  if (params.speed < RIDE_EXIT_SPEED) return true;
  if (params.faceAlignment < RIDE_EXIT_ALIGNMENT) return true;
  return false;
}