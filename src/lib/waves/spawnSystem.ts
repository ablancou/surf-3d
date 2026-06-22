import { getActiveSpot } from "@/stores/spotStore";
import { sampleOcean, sampleOceanHeight } from "@/lib/waves/oceanSampler";

export type SpawnPoint = {
  x: number;
  y: number;
  z: number;
  boost: number;
  quality: number;
};

/**
 * Scans the ocean surface for the best surfable spawn — steep face, downhill flow.
 */
export function findOptimalSpawn(time: number): SpawnPoint {
  const spot = getActiveSpot();
  const { zMin, zMax, xRange } = spot.spawn;
  let best: SpawnPoint = { x: 0, y: 2, z: zMin, boost: 6, quality: 0 };

  for (let z = zMin; z <= zMax; z += 2) {
    for (let x = -xRange; x <= xRange; x += 2) {
      const center = sampleOcean(x, z, time);
      const ahead = sampleOcean(x, z + 3, time);
      const behind = sampleOcean(x, z - 3, time);

      const slope = center.steepness;
      const downhill = behind.height - ahead.height;
      const faceQuality = slope * 2 + downhill * 0.8 + center.normal.y * 0.3;

      if (faceQuality > best.quality) {
        const waterY = sampleOceanHeight(x, z, time);
        best = {
          x,
          y: waterY + 0.5,
          z,
          boost: 5 + Math.min(slope * 4, 4),
          quality: faceQuality,
        };
      }
    }
  }

  return best;
}

export function findRespawnPoint(x: number, z: number, time: number): SpawnPoint {
  const local = findOptimalSpawn(time);
  const dist = Math.sqrt((local.x - x) ** 2 + (local.z - z) ** 2);
  if (dist < 30) return local;

  const waterY = sampleOceanHeight(x, z, time);
  const sample = sampleOcean(x, z, time);
  return {
    x,
    y: waterY + 0.5,
    z,
    boost: 4 + sample.steepness * 2,
    quality: sample.steepness,
  };
}