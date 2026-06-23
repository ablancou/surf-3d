export type InputProfile = {
  mobile: boolean;
  touchRadius: number;
  pointerRadius: number;
  smoothFactor: number;
  keyboardScale: number;
};

export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  );
}

export function getInputProfile(): InputProfile {
  const mobile = isCoarsePointer();
  return {
    mobile,
    touchRadius: mobile ? 68 : 90,
    pointerRadius: 120,
    smoothFactor: mobile ? 0.17 : 0.24,
    keyboardScale: mobile ? 0.9 : 1,
  };
}