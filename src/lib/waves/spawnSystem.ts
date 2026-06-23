import * as THREE from "three";
import { BOARD_HALF_HEIGHT } from "@/lib/physics/surfboardForces";
import { sampleOcean, sampleOceanHeight } from "@/lib/waves/oceanSampler";
import { getActiveSpot } from "@/stores/spotStore";

const SPAWN_CLEARANCE = 0.14;
const downhill = new THREE.Vector3();

export type SpawnPoint = {
  x: number;
  y: number;
  z: number;
  boost: number;
  quality: number;
  /** Y-axis yaw — board faces down-the-line */
  yaw: number;
  /** Unit vector along the wave face */
  downhillX: number;
  downhillZ: number;
};

function buildSpawn(x: number, z: number, time: number, quality: number, boost: number): SpawnPoint {
  const center = sampleOcean(x, z, time);
  const waterY = sampleOceanHeight(x, z, time);

  downhill.set(-center.normal.x, 0, -center.normal.z);
  if (downhill.lengthSq() < 0.0001) downhill.set(0, 0, 1);
  downhill.normalize();

  return {
    x,
    y: waterY + BOARD_HALF_HEIGHT + SPAWN_CLEARANCE,
    z,
    boost,
    quality,
    yaw: Math.atan2(downhill.x, downhill.z),
    downhillX: downhill.x,
    downhillZ: downhill.z,
  };
}

/**
 * Scans the ocean surface for the best surfable spawn — steep face, downhill flow.
 */
export function findOptimalSpawn(time: number): SpawnPoint {
  const spot = getActiveSpot();
  const { zMin, zMax, xRange } = spot.spawn;
  let best: SpawnPoint = buildSpawn(0, zMin, time, 0, 8);

  for (let z = zMin; z <= zMax; z += 2) {
    for (let x = -xRange; x <= xRange; x += 2) {
      const center = sampleOcean(x, z, time);
      const ahead = sampleOcean(x, z + 3, time);
      const behind = sampleOcean(x, z - 3, time);

      const slope = center.steepness;
      const faceDrop = behind.height - ahead.height;
      const faceQuality = slope * 2 + faceDrop * 0.8 + center.normal.y * 0.3;

      if (faceQuality > best.quality) {
        best = buildSpawn(x, z, time, faceQuality, 7 + Math.min(slope * 4, 5));
      }
    }
  }

  return best;
}

export function findRespawnPoint(x: number, z: number, time: number): SpawnPoint {
  const local = findOptimalSpawn(time);
  const dist = Math.sqrt((local.x - x) ** 2 + (local.z - z) ** 2);
  if (dist < 30) return local;

  const sample = sampleOcean(x, z, time);
  return buildSpawn(x, z, time, sample.steepness, 4 + sample.steepness * 2);
}