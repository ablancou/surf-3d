import type { GerstnerWave } from "@/lib/waves/waveConfig";

export type SpotId = "pipeline" | "beach_break" | "point_break" | "sunset_beach";

export type SpotConfig = {
  id: SpotId;
  name: string;
  description: string;
  waves: readonly GerstnerWave[];
  /** Phillips IFFT params */
  ifft: {
    windSpeed: number;
    windDirection: number;
    amplitude: number;
    heightScale: number;
  };
  spawn: { zMin: number; zMax: number; xRange: number };
  atmosphere: {
    skyInclination: number;
    fogColor: string;
    fogNear: number;
    fogFar: number;
    deepWater: string;
    shallowWater: string;
  };
};

export const SURF_SPOTS: Record<SpotId, SpotConfig> = {
  pipeline: {
    id: "pipeline",
    name: "Pipeline",
    description: "Heavy reef barrel — steep faces, deep tubes.",
    waves: [
      { amplitude: 2.0, wavelength: 90, speed: 3.4, direction: 0.0, steepness: 0.48 },
      { amplitude: 0.9, wavelength: 45, speed: 2.6, direction: 0.1, steepness: 0.4 },
      { amplitude: 0.45, wavelength: 22, speed: 2.0, direction: -0.15, steepness: 0.32 },
      { amplitude: 0.2, wavelength: 11, speed: 1.5, direction: 0.2, steepness: 0.24 },
      { amplitude: 0.1, wavelength: 6, speed: 1.1, direction: -0.25, steepness: 0.18 },
      { amplitude: 0.05, wavelength: 3.5, speed: 0.8, direction: 0.05, steepness: 0.14 },
    ],
    ifft: { windSpeed: 18, windDirection: 0.05, amplitude: 0.0016, heightScale: 4.2 },
    spawn: { zMin: -22, zMax: -6, xRange: 12 },
    atmosphere: {
      skyInclination: 0.48,
      fogColor: "#7eb8d4",
      fogNear: 35,
      fogFar: 160,
      deepWater: "#0a3048",
      shallowWater: "#1f7aa8",
    },
  },
  beach_break: {
    id: "beach_break",
    name: "Beach Break",
    description: "Mellow A-frames — great for learning and flow.",
    waves: [
      { amplitude: 1.2, wavelength: 65, speed: 2.6, direction: 0.2, steepness: 0.36 },
      { amplitude: 0.6, wavelength: 34, speed: 2.1, direction: -0.15, steepness: 0.3 },
      { amplitude: 0.3, wavelength: 18, speed: 1.7, direction: 0.4, steepness: 0.24 },
      { amplitude: 0.15, wavelength: 10, speed: 1.3, direction: -0.3, steepness: 0.2 },
      { amplitude: 0.08, wavelength: 5.5, speed: 1.0, direction: 0.1, steepness: 0.16 },
      { amplitude: 0.04, wavelength: 3, speed: 0.7, direction: -0.1, steepness: 0.12 },
    ],
    ifft: { windSpeed: 10, windDirection: 0.3, amplitude: 0.0008, heightScale: 2.8 },
    spawn: { zMin: -18, zMax: -4, xRange: 20 },
    atmosphere: {
      skyInclination: 0.55,
      fogColor: "#9ecae1",
      fogNear: 40,
      fogFar: 200,
      deepWater: "#124060",
      shallowWater: "#2a8aaa",
    },
  },
  point_break: {
    id: "point_break",
    name: "Point Break",
    description: "Long peeling right — pump down the line.",
    waves: [
      { amplitude: 1.5, wavelength: 78, speed: 3.1, direction: -0.35, steepness: 0.42 },
      { amplitude: 0.75, wavelength: 40, speed: 2.5, direction: -0.3, steepness: 0.36 },
      { amplitude: 0.4, wavelength: 21, speed: 2.0, direction: -0.2, steepness: 0.28 },
      { amplitude: 0.2, wavelength: 12, speed: 1.5, direction: -0.4, steepness: 0.22 },
      { amplitude: 0.1, wavelength: 7, speed: 1.1, direction: -0.15, steepness: 0.18 },
      { amplitude: 0.05, wavelength: 4, speed: 0.85, direction: -0.25, steepness: 0.14 },
    ],
    ifft: { windSpeed: 14, windDirection: -0.35, amplitude: 0.0011, heightScale: 3.5 },
    spawn: { zMin: -24, zMax: -8, xRange: 16 },
    atmosphere: {
      skyInclination: 0.5,
      fogColor: "#8ec8e0",
      fogNear: 38,
      fogFar: 175,
      deepWater: "#103550",
      shallowWater: "#2a90b0",
    },
  },
  sunset_beach: {
    id: "sunset_beach",
    name: "Sunset Beach",
    description: "Golden hour glass-offs — smooth and stylish.",
    waves: [
      { amplitude: 1.3, wavelength: 70, speed: 2.8, direction: 0.08, steepness: 0.38 },
      { amplitude: 0.65, wavelength: 36, speed: 2.2, direction: 0.2, steepness: 0.32 },
      { amplitude: 0.35, wavelength: 19, speed: 1.8, direction: -0.1, steepness: 0.26 },
      { amplitude: 0.18, wavelength: 10, speed: 1.4, direction: 0.15, steepness: 0.2 },
      { amplitude: 0.09, wavelength: 6, speed: 1.0, direction: -0.2, steepness: 0.16 },
      { amplitude: 0.045, wavelength: 3.5, speed: 0.75, direction: 0.05, steepness: 0.12 },
    ],
    ifft: { windSpeed: 11, windDirection: 0.1, amplitude: 0.0009, heightScale: 3.0 },
    spawn: { zMin: -20, zMax: -5, xRange: 18 },
    atmosphere: {
      skyInclination: 0.62,
      fogColor: "#f0b88a",
      fogNear: 45,
      fogFar: 190,
      deepWater: "#243858",
      shallowWater: "#4a9aba",
    },
  },
};

export const DEFAULT_SPOT: SpotId = "beach_break";