import * as THREE from "three";
import { sampleOcean, sampleOceanHeight } from "@/lib/waves/oceanSampler";

export type TubeSample = {
  /** Average side-wall height above center — barrel enclosure (meters) */
  enclosure: number;
  /** Lip height above the rider */
  lipOverhead: number;
  /** 0–1 pocket intensity */
  pocketDepth: number;
  /** Rider is inside a surfable barrel pocket */
  inTube: boolean;
};

const sampleScratch = {
  height: 0,
  normal: new THREE.Vector3(),
  displacement: new THREE.Vector3(),
  steepness: 0,
};

const downhill = new THREE.Vector3();
const across = new THREE.Vector3();
const uphill = new THREE.Vector3();
const lipDir = new THREE.Vector3();

/**
 * Lateral + lip sampling to detect barrel geometry around the board.
 * Samples the wave wall on left, right, and ahead of the rider.
 */
export function sampleTubeGeometry(
  boardX: number,
  boardY: number,
  boardZ: number,
  boardForward: THREE.Vector3,
  time: number,
  steepness: number,
  speed: number,
  submerged: boolean,
): TubeSample {
  const center = sampleOcean(boardX, boardZ, time, sampleScratch);

  downhill.set(-center.normal.x, 0, -center.normal.z);
  if (downhill.lengthSq() < 0.0001) {
    return { enclosure: 0, lipOverhead: 0, pocketDepth: 0, inTube: false };
  }
  downhill.normalize();

  across.set(downhill.z, 0, -downhill.x).normalize();
  uphill.copy(downhill).multiplyScalar(-1);

  const wallOffset = 2.2;
  const hCenter = center.height;
  const hLeft = sampleOceanHeight(
    boardX - across.x * wallOffset,
    boardZ - across.z * wallOffset,
    time,
  );
  const hRight = sampleOceanHeight(
    boardX + across.x * wallOffset,
    boardZ + across.z * wallOffset,
    time,
  );

  lipDir.copy(uphill).multiplyScalar(1.2).addScaledVector(boardForward, 0.6).normalize();
  const hLip = sampleOceanHeight(boardX + lipDir.x * 2.0, boardZ + lipDir.z * 2.0, time);

  const enclosure = (hLeft + hRight) * 0.5 - hCenter;
  const lipOverhead = hLip - boardY;
  const pocketDepth = Math.min(
    1,
    Math.max(0, enclosure * 0.8 + lipOverhead * 0.15 + steepness * 0.4),
  );

  const inTube =
    submerged &&
    speed > 3.5 &&
    steepness > 0.32 &&
    enclosure > 0.25 &&
    lipOverhead > 0.35 &&
    boardForward.dot(downhill) > 0.2;

  return { enclosure, lipOverhead, pocketDepth, inTube };
}