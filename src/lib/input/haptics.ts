import type { TrickId } from "@/lib/tricks/types";
import { isCoarsePointer } from "@/lib/input/deviceProfile";

function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  if (!isCoarsePointer()) return;
  navigator.vibrate(pattern);
}

const TRICK_PATTERNS: Record<TrickId, number | number[]> = {
  carve_left: 14,
  carve_right: 14,
  pumping: [10, 35, 12],
  bottom_turn: 22,
  cutback: [16, 28, 20],
  snap: [14, 22, 18],
  floater: 26,
  aerial: [12, 18, 35, 28],
  tube_ride: [24, 50, 70, 45],
};

export function hapticTrick(id: TrickId, combo: number) {
  const base = TRICK_PATTERNS[id];
  if (typeof base === "number") {
    vibrate(Math.min(80, base + combo * 2));
    return;
  }
  vibrate(base.map((v, i) => (i % 2 === 0 ? Math.min(90, v + combo * 2) : v)));
}

export function hapticPop() {
  vibrate(10);
}

export function hapticTubeEntry() {
  vibrate([18, 40, 30]);
}

export function hapticWipeout() {
  vibrate([60, 40, 90, 30]);
}