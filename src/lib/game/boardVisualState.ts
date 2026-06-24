import type { TrickId } from "@/lib/tricks/types";

/** Per-frame board visual state — mutated in physics, read in render */
export const boardVisualState = {
  speed: 0,
  tiltX: 0,
  paddling: true,
  inTube: false,
  airborne: false,
  airTime: 0,
  verticalVelocity: 0,
  /** gameClock.time until front-flip animation ends */
  flipUntil: 0,
  lastTrick: null as TrickId | null,
  x: 0,
  y: 2,
  z: -8,
};