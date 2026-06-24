import * as THREE from "three";
import { sampleBreakingWave } from "@/lib/waves/breakingWave";
import { getSpotTube } from "@/lib/spots/spotPhysics";
import { sampleOcean, sampleOceanHeight } from "@/lib/waves/oceanSampler";
import { getActiveWaves } from "@/stores/spotStore";

export type TubeSample = {
  enclosure: number;
  lipOverhead: number;
  pocketDepth: number;
  inTube: boolean;
  /** 0–1 curl phase from breaking wave model */
  curlPhase: number;
  peelPhase: number;
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
  const waves = getActiveWaves();
  const breaking = sampleBreakingWave(boardX, boardZ, time, waves);
  const center = sampleOcean(boardX, boardZ, time, sampleScratch);

  downhill.set(-center.normal.x, 0, -center.normal.z);
  if (downhill.lengthSq() < 0.0001) {
    return {
      enclosure: 0,
      lipOverhead: 0,
      pocketDepth: 0,
      inTube: false,
      curlPhase: 0,
      peelPhase: 0,
    };
  }
  downhill.normalize();

  across.set(downhill.z, 0, -downhill.x).normalize();
  uphill.copy(downhill).multiplyScalar(-1);

  const wallOffset = 2.2 + breaking.curl * 0.8;
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

  lipDir.copy(uphill).multiplyScalar(1.2 + breaking.curl).addScaledVector(boardForward, 0.6).normalize();
  const lipBreak = sampleBreakingWave(
    boardX + lipDir.x * 2.0,
    boardZ + lipDir.z * 2.0,
    time,
    waves,
  );
  const hLip = sampleOceanHeight(boardX + lipDir.x * 2.0, boardZ + lipDir.z * 2.0, time);
  const curlOverhang = breaking.curl * waves[0].amplitude * (0.5 + lipBreak.peelPhase * 0.6);

  const enclosure = (hLeft + hRight) * 0.5 - hCenter + breaking.curl * 0.35;
  const lipOverhead = hLip + curlOverhang - boardY;
  const tube = getSpotTube();
  const pocketDepth = Math.min(
    1,
    Math.max(
      0,
      (enclosure * 0.75 + lipOverhead * 0.2 + steepness * 0.35 + breaking.curl * 0.4) *
        tube.pocketBonus,
    ),
  );

  const inTube =
    submerged &&
    breaking.isBreaking &&
    speed > tube.minSpeed &&
    steepness > tube.minSteepness &&
    enclosure > tube.minEnclosure &&
    lipOverhead > tube.minLip &&
    boardForward.dot(downhill) > 0.15;

  return {
    enclosure,
    lipOverhead,
    pocketDepth,
    inTube,
    curlPhase: breaking.curl,
    peelPhase: breaking.peelPhase,
  };
}