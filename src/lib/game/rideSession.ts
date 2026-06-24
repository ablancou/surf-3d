import type { WipeoutReason } from "@/lib/tricks/types";

export type RidePhase = "paddling" | "riding" | "wiped" | "recap";

export type RideRecap = {
  score: number;
  trickCount: number;
  maxCombo: number;
  maxSpeed: number;
  reason: WipeoutReason | "fall";
  durationSec: number;
};

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