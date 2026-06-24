export const COMBO_WINDOW_SEC = 6.5;

export function comboMultiplier(combo: number): number {
  return 1 + combo * 0.18;
}

export function trickScore(basePoints: number, combo: number): number {
  return Math.floor(basePoints * comboMultiplier(combo));
}

export function keptComboAfterWipeout(combo: number): number {
  return Math.max(0, Math.floor(combo * 0.5));
}