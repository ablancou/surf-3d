import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { sampleOcean } from "@/lib/waves/oceanSampler";
import { sampleTubeGeometry } from "@/lib/waves/tubeSampling";
import type { GameInputState } from "@/lib/input/types";
import type { RiderTelemetry } from "./types";

const boardUp = new THREE.Vector3();
const boardForward = new THREE.Vector3();
const downhill = new THREE.Vector3();
const velocity = new THREE.Vector3();
const euler = new THREE.Euler();
const sampleScratch = {
  height: 0,
  normal: new THREE.Vector3(),
  displacement: new THREE.Vector3(),
  steepness: 0,
};

export function buildRiderTelemetry(
  body: RapierRigidBody,
  rotation: THREE.Quaternion,
  time: number,
  input: GameInputState,
  speed: number,
  submerged: boolean,
  airTime: number,
): RiderTelemetry {
  const pos = body.translation();
  const angvel = body.angvel();
  const linvel = body.linvel();
  velocity.set(linvel.x, linvel.y, linvel.z);

  boardUp.set(0, 1, 0).applyQuaternion(rotation);
  boardForward.set(0, 0, 1).applyQuaternion(rotation);

  euler.setFromQuaternion(rotation, "YXZ");
  const tiltX = euler.z;
  const tiltZ = euler.x;

  const sample = sampleOcean(pos.x, pos.z, time, sampleScratch);
  downhill.set(-sample.normal.x, 0, -sample.normal.z);
  if (downhill.lengthSq() > 0.0001) downhill.normalize();

  const waveFaceAlignment = boardForward.dot(downhill);
  const downhillSpeed = velocity.dot(downhill);

  const tube = sampleTubeGeometry(
    pos.x,
    pos.y,
    pos.z,
    boardForward,
    time,
    sample.steepness,
    speed,
    submerged,
  );

  return {
    speed,
    tiltX,
    tiltZ,
    boardUpY: boardUp.y,
    angularVelocityY: angvel.y,
    angularVelocityZ: angvel.z,
    airTime,
    submerged,
    waveSteepness: sample.steepness,
    waveFaceAlignment,
    downhillSpeed,
    leanX: input.leanX,
    leanZ: input.leanZ,
    verticalVelocity: linvel.y,
    inTube: tube.inTube,
    tubeDepth: tube.pocketDepth,
    tubeEnclosure: tube.enclosure,
    lipOverhead: tube.lipOverhead,
  };
}