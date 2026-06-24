export type InputProfile = {
  mobile: boolean;
  touchRadius: number;
  pointerRadius: number;
  smoothFactor: number;
  keyboardScale: number;
};

export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  const narrow = window.innerWidth < 768;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const touch =
    navigator.maxTouchPoints > 0 ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return coarse || (narrow && touch);
}

export function getInputProfile(): InputProfile {
  const mobile = isCoarsePointer();
  return {
    mobile,
    touchRadius: mobile ? 82 : 90,
    pointerRadius: 120,
    smoothFactor: mobile ? 0.2 : 0.24,
    keyboardScale: mobile ? 0.95 : 1,
  };
}