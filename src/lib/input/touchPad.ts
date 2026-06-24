export const PAD_MAX = 58;
export const DEADZONE = 14;
export const IDLE_PADDLE_Z = 0.82;

function clamp(v: number, min = -1, max = 1) {
  return Math.max(min, Math.min(max, v));
}

/** Normalizes touch-pad delta into game lean axes. */
export function processPadLean(dx: number, dy: number): { x: number; z: number } {
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len < DEADZONE) {
    return { x: 0, z: IDLE_PADDLE_Z };
  }

  const clamped = Math.min(len, PAD_MAX);
  const scale = clamped / PAD_MAX;
  let leanX = (dx / PAD_MAX) * scale;
  let leanZ = (-dy / PAD_MAX) * scale;

  if (leanZ > 0.12 && Math.abs(leanX) < leanZ * 0.6) {
    leanZ = Math.min(1, leanZ * 1.2 + 0.18);
    leanX *= 0.55;
  }

  return { x: clamp(leanX), z: clamp(leanZ) };
}