import type { GerstnerWave } from "@/lib/waves/waveConfig";
import type { OceanMode } from "@/lib/waves/oceanSampler";
import type { SpotMusicTuning, SpotPhysicsTuning, SpotTubeTuning } from "@/lib/spots/spotPhysics";

export type SpotId = "pipeline" | "beach_break" | "point_break" | "sunset_beach" | "zicatela" | "capo_mannu" | "nazare" | "teahupoo";

export type SpotConfig = {
  id: SpotId;
  name: string;
  description: string;
  tagline: string;
  waves: readonly GerstnerWave[];
  /** Phillips IFFT params */
  ifft: {
    windSpeed: number;
    windDirection: number;
    amplitude: number;
    heightScale: number;
  };
  spawn: { zMin: number; zMax: number; xRange: number };
  physics: SpotPhysicsTuning;
  tube: SpotTubeTuning;
  music: SpotMusicTuning;
  /** Océano preferido en tier medio/alto */
  preferredOcean: OceanMode;
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
    tagline: "Tubos épicos — desafío con flow",
    waves: [
      { amplitude: 1.75, wavelength: 90, speed: 3.2, direction: 0.0, steepness: 0.46 },
      { amplitude: 0.9, wavelength: 45, speed: 2.6, direction: 0.1, steepness: 0.4 },
      { amplitude: 0.45, wavelength: 22, speed: 2.0, direction: -0.15, steepness: 0.32 },
      { amplitude: 0.2, wavelength: 11, speed: 1.5, direction: 0.2, steepness: 0.24 },
      { amplitude: 0.1, wavelength: 6, speed: 1.1, direction: -0.25, steepness: 0.18 },
      { amplitude: 0.05, wavelength: 3.5, speed: 0.8, direction: 0.05, steepness: 0.14 },
    ],
    ifft: { windSpeed: 16, windDirection: 0.05, amplitude: 0.0014, heightScale: 3.8 },
    spawn: { zMin: -22, zMax: -6, xRange: 14 },
    physics: {
      buoyancy: 160,
      liftFactor: 2.55,
      pumpFactor: 2.45,
      trimFactor: 1.28,
      railGrip: 2.05,
      tubeGrip: 1.65,
      inputAccel: 10.5,
      maxSpeed: 23,
      spawnBoost: 1.24,
      wipeoutScale: 1.28,
    },
    tube: {
      minSpeed: 2.4,
      minSteepness: 0.22,
      minEnclosure: 0.12,
      minLip: 0.15,
      pocketBonus: 1.35,
      rideScoreMultiplier: 3.8,
    },
    music: {
      baseBpm: 68,
      chords: [82.41, 98.0, 116.54],
      filterBase: 520,
      kickLow: 48,
      kickHigh: 62,
      tubeMuffle: 0.38,
    },
    preferredOcean: "ifft",
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
    tagline: "Ideal para aprender — olas suaves",
    waves: [
      { amplitude: 1.0, wavelength: 68, speed: 2.4, direction: 0.2, steepness: 0.32 },
      { amplitude: 0.55, wavelength: 36, speed: 2.0, direction: -0.15, steepness: 0.26 },
      { amplitude: 0.3, wavelength: 18, speed: 1.7, direction: 0.4, steepness: 0.24 },
      { amplitude: 0.15, wavelength: 10, speed: 1.3, direction: -0.3, steepness: 0.2 },
      { amplitude: 0.08, wavelength: 5.5, speed: 1.0, direction: 0.1, steepness: 0.16 },
      { amplitude: 0.04, wavelength: 3, speed: 0.7, direction: -0.1, steepness: 0.12 },
    ],
    ifft: { windSpeed: 10, windDirection: 0.3, amplitude: 0.0008, heightScale: 2.8 },
    spawn: { zMin: -18, zMax: -4, xRange: 20 },
    physics: {
      buoyancy: 168,
      liftFactor: 2.65,
      pumpFactor: 3.2,
      trimFactor: 1.55,
      railGrip: 1.75,
      tubeGrip: 1.15,
      inputAccel: 12.5,
      maxSpeed: 22,
      spawnBoost: 1.32,
      wipeoutScale: 1.65,
    },
    tube: {
      minSpeed: 3.2,
      minSteepness: 0.3,
      minEnclosure: 0.19,
      minLip: 0.24,
      pocketBonus: 0.85,
      rideScoreMultiplier: 2.2,
    },
    music: {
      baseBpm: 92,
      chords: [130.81, 164.81, 196.0],
      filterBase: 1150,
      kickLow: 72,
      kickHigh: 88,
      tubeMuffle: 0.55,
    },
    preferredOcean: "gerstner",
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
    tagline: "Línea larga — pump y velocidad",
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
    physics: {
      buoyancy: 152,
      liftFactor: 2.45,
      pumpFactor: 2.95,
      trimFactor: 1.35,
      railGrip: 1.95,
      tubeGrip: 1.3,
      inputAccel: 11,
      maxSpeed: 25,
      spawnBoost: 1.18,
      wipeoutScale: 1.2,
    },
    tube: {
      minSpeed: 3.2,
      minSteepness: 0.3,
      minEnclosure: 0.2,
      minLip: 0.24,
      pocketBonus: 1.0,
      rideScoreMultiplier: 2.8,
    },
    music: {
      baseBpm: 84,
      chords: [98.0, 123.47, 146.83],
      filterBase: 880,
      kickLow: 65,
      kickHigh: 78,
      tubeMuffle: 0.48,
    },
    preferredOcean: "ifft",
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
    tagline: "Glassy al atardecer — flow y estilo",
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
    physics: {
      buoyancy: 155,
      liftFactor: 2.4,
      pumpFactor: 2.6,
      trimFactor: 1.3,
      railGrip: 1.95,
      tubeGrip: 1.25,
      inputAccel: 10.5,
      maxSpeed: 23,
      spawnBoost: 1.15,
      wipeoutScale: 1.28,
    },
    tube: {
      minSpeed: 3.0,
      minSteepness: 0.29,
      minEnclosure: 0.19,
      minLip: 0.22,
      pocketBonus: 1.1,
      rideScoreMultiplier: 2.6,
    },
    music: {
      baseBpm: 76,
      chords: [116.54, 146.83, 174.61],
      filterBase: 980,
      kickLow: 68,
      kickHigh: 82,
      tubeMuffle: 0.5,
    },
    preferredOcean: "ifft",
    atmosphere: {
      skyInclination: 0.62,
      fogColor: "#f0b88a",
      fogNear: 45,
      fogFar: 190,
      deepWater: "#243858",
      shallowWater: "#4a9aba",
    },
  },
  zicatela: {
    id: "zicatela",
    name: "Zicatela",
    description: "Mexican Pipeline — fast, powerful, and sandy barrels.",
    tagline: "El Pipeline Mexicano — rápido y letal",
    waves: [
      { amplitude: 1.6, wavelength: 85, speed: 3.0, direction: 0.1, steepness: 0.45 },
      { amplitude: 0.8, wavelength: 42, speed: 2.5, direction: -0.1, steepness: 0.38 },
      { amplitude: 0.4, wavelength: 21, speed: 2.0, direction: 0.2, steepness: 0.3 },
      { amplitude: 0.2, wavelength: 10, speed: 1.5, direction: -0.15, steepness: 0.22 },
      { amplitude: 0.1, wavelength: 6, speed: 1.1, direction: 0.1, steepness: 0.16 },
      { amplitude: 0.05, wavelength: 3, speed: 0.8, direction: 0.0, steepness: 0.12 },
    ],
    ifft: { windSpeed: 15, windDirection: 0.1, amplitude: 0.0013, heightScale: 3.5 },
    spawn: { zMin: -20, zMax: -5, xRange: 16 },
    physics: {
      buoyancy: 158,
      liftFactor: 2.5,
      pumpFactor: 2.6,
      trimFactor: 1.3,
      railGrip: 2.0,
      tubeGrip: 1.5,
      inputAccel: 11,
      maxSpeed: 24,
      spawnBoost: 1.2,
      wipeoutScale: 1.35,
    },
    tube: {
      minSpeed: 2.6,
      minSteepness: 0.25,
      minEnclosure: 0.15,
      minLip: 0.18,
      pocketBonus: 1.3,
      rideScoreMultiplier: 3.5,
    },
    music: {
      baseBpm: 80,
      chords: [98.0, 110.0, 130.81],
      filterBase: 650,
      kickLow: 55,
      kickHigh: 70,
      tubeMuffle: 0.45,
    },
    preferredOcean: "ifft",
    atmosphere: {
      skyInclination: 0.58,
      fogColor: "#d4a373", // Atardecer cálido
      fogNear: 35,
      fogFar: 180,
      deepWater: "#083d56", // Azul más verde y profundo
      shallowWater: "#3e8e9d",
    },
  },
  capo_mannu: {
    id: "capo_mannu",
    name: "Capo Mannu",
    description: "Sardinian rock-bottom gem — Mediterranean perfection.",
    tagline: "La gema del Mediterráneo",
    waves: [
      { amplitude: 1.1, wavelength: 65, speed: 2.6, direction: -0.2, steepness: 0.35 },
      { amplitude: 0.6, wavelength: 32, speed: 2.1, direction: -0.1, steepness: 0.3 },
      { amplitude: 0.3, wavelength: 16, speed: 1.7, direction: -0.3, steepness: 0.25 },
      { amplitude: 0.15, wavelength: 8, speed: 1.3, direction: 0.1, steepness: 0.2 },
      { amplitude: 0.08, wavelength: 4, speed: 1.0, direction: -0.15, steepness: 0.15 },
      { amplitude: 0.04, wavelength: 2, speed: 0.7, direction: -0.05, steepness: 0.1 },
    ],
    ifft: { windSpeed: 12, windDirection: -0.2, amplitude: 0.001, heightScale: 2.9 },
    spawn: { zMin: -16, zMax: -4, xRange: 18 },
    physics: {
      buoyancy: 165,
      liftFactor: 2.6,
      pumpFactor: 3.0,
      trimFactor: 1.4,
      railGrip: 1.85,
      tubeGrip: 1.2,
      inputAccel: 12,
      maxSpeed: 21,
      spawnBoost: 1.25,
      wipeoutScale: 1.15,
    },
    tube: {
      minSpeed: 3.0,
      minSteepness: 0.28,
      minEnclosure: 0.18,
      minLip: 0.2,
      pocketBonus: 0.9,
      rideScoreMultiplier: 2.4,
    },
    music: {
      baseBpm: 88,
      chords: [146.83, 164.81, 196.0],
      filterBase: 1000,
      kickLow: 70,
      kickHigh: 85,
      tubeMuffle: 0.52,
    },
    preferredOcean: "gerstner",
    atmosphere: {
      skyInclination: 0.5,
      fogColor: "#b2d8d8",
      fogNear: 40,
      fogFar: 200,
      deepWater: "#004c4c", // Verde esmeralda profundo
      shallowWater: "#008080", // Cyan esmeralda
    },
  },
  nazare: {
    id: "nazare",
    name: "Nazaré",
    description: "The biggest wave in the world — immense, dark, and terrifying.",
    tagline: "El gigante de Portugal — sobrevive",
    waves: [
      { amplitude: 4.5, wavelength: 180, speed: 4.5, direction: 0.05, steepness: 0.5 },
      { amplitude: 2.2, wavelength: 90, speed: 3.6, direction: 0.1, steepness: 0.4 },
      { amplitude: 1.0, wavelength: 45, speed: 2.8, direction: -0.1, steepness: 0.3 },
      { amplitude: 0.5, wavelength: 22, speed: 2.2, direction: 0.05, steepness: 0.25 },
      { amplitude: 0.2, wavelength: 10, speed: 1.6, direction: -0.05, steepness: 0.18 },
      { amplitude: 0.1, wavelength: 5, speed: 1.2, direction: 0.15, steepness: 0.12 },
    ],
    ifft: { windSpeed: 24, windDirection: 0.05, amplitude: 0.0035, heightScale: 6.5 },
    spawn: { zMin: -35, zMax: -15, xRange: 25 },
    physics: {
      buoyancy: 130, // Agua pesada
      liftFactor: 2.2,
      pumpFactor: 1.8, // Difícil bombear
      trimFactor: 1.1,
      railGrip: 2.5,
      tubeGrip: 1.8,
      inputAccel: 8.5,
      maxSpeed: 35, // Velocidad máxima altísima
      spawnBoost: 2.5, // Empuje inicial masivo
      wipeoutScale: 3.5, // Wipeout brutal
    },
    tube: {
      minSpeed: 4.0,
      minSteepness: 0.35,
      minEnclosure: 0.25,
      minLip: 0.3,
      pocketBonus: 2.0,
      rideScoreMultiplier: 5.0,
    },
    music: {
      baseBpm: 120, // Rápido y tenso
      chords: [55.0, 65.41, 73.42], // Muy grave
      filterBase: 300,
      kickLow: 35,
      kickHigh: 50,
      tubeMuffle: 0.2,
    },
    preferredOcean: "ifft",
    atmosphere: {
      skyInclination: 0.45,
      fogColor: "#6c7a86", // Gris tormentoso
      fogNear: 20,
      fogFar: 140, // Niebla pesada
      deepWater: "#04141c", // Casi negro
      shallowWater: "#132d3b",
    },
  },
  teahupoo: {
    id: "teahupoo",
    name: "Teahupo'o",
    description: "The heaviest slab — below sea level barrel.",
    tagline: "El muro de calaveras — tubo extremo",
    waves: [
      { amplitude: 2.2, wavelength: 100, speed: 3.5, direction: 0.0, steepness: 0.55 }, // Ola corta pero altísima pendiente
      { amplitude: 0.9, wavelength: 50, speed: 2.7, direction: 0.0, steepness: 0.45 },
      { amplitude: 0.4, wavelength: 25, speed: 2.1, direction: -0.1, steepness: 0.35 },
      { amplitude: 0.2, wavelength: 12, speed: 1.6, direction: 0.1, steepness: 0.25 },
      { amplitude: 0.1, wavelength: 6, speed: 1.2, direction: -0.1, steepness: 0.18 },
      { amplitude: 0.05, wavelength: 3, speed: 0.9, direction: 0.05, steepness: 0.14 },
    ],
    ifft: { windSpeed: 14, windDirection: 0.0, amplitude: 0.0018, heightScale: 4.2 },
    spawn: { zMin: -24, zMax: -8, xRange: 12 },
    physics: {
      buoyancy: 155,
      liftFactor: 2.8, // Mucho lift en el drop
      pumpFactor: 2.1,
      trimFactor: 1.4,
      railGrip: 2.2,
      tubeGrip: 1.7,
      inputAccel: 11.5,
      maxSpeed: 28,
      spawnBoost: 1.4,
      wipeoutScale: 2.2,
    },
    tube: {
      minSpeed: 2.8,
      minSteepness: 0.2,
      minEnclosure: 0.1,
      minLip: 0.12,
      pocketBonus: 1.5,
      rideScoreMultiplier: 4.5,
    },
    music: {
      baseBpm: 70,
      chords: [73.42, 87.31, 103.83],
      filterBase: 450,
      kickLow: 45,
      kickHigh: 60,
      tubeMuffle: 0.3,
    },
    preferredOcean: "ifft",
    atmosphere: {
      skyInclination: 0.52,
      fogColor: "#a3c2cf",
      fogNear: 30,
      fogFar: 170,
      deepWater: "#09253d",
      shallowWater: "#13c4a3", // Coral vibrante
    },
  },
};

export const DEFAULT_SPOT: SpotId = "beach_break";