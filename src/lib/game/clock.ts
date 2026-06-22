/** Shared simulation clock — mutated in useFrame, read by physics & shaders */
export const gameClock = {
  time: 0,
  delta: 0,
};