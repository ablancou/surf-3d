export type GerstnerWave = {
  amplitude: number;
  wavelength: number;
  speed: number;
  /** Direction angle in radians (0 = +X, π/2 = +Z) */
  direction: number;
  steepness: number;
};

/** Six layered octaves — primary swell aligned for down-the-line surfing */
export const SURF_WAVES: readonly GerstnerWave[] = [
  { amplitude: 1.6, wavelength: 80, speed: 3.0, direction: 0.0, steepness: 0.44 },
  { amplitude: 0.7, wavelength: 42, speed: 2.4, direction: 0.15, steepness: 0.36 },
  { amplitude: 0.38, wavelength: 24, speed: 2.0, direction: -0.12, steepness: 0.3 },
  { amplitude: 0.2, wavelength: 13, speed: 1.6, direction: 0.25, steepness: 0.26 },
  { amplitude: 0.1, wavelength: 7, speed: 1.2, direction: -0.3, steepness: 0.2 },
  { amplitude: 0.05, wavelength: 4, speed: 0.9, direction: 0.08, steepness: 0.16 },
] as const;

export const MAX_WAVES = 6;

export const OCEAN_SIZE = 256;
export const OCEAN_SEGMENTS = 256;