import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { sampleOcean } from "@/lib/waves/oceanSampler";
import type { GameInputState } from "@/lib/input/types";

const BOARD_HALF_HEIGHT = 0.08;
const BOARD_HALF_LENGTH = 1.05;
const BOARD_HALF_WIDTH = 0.28;

const BUOYANCY = 16;
const WATER_DRAG = 0.91;
const AIR_DRAG = 0.994;
const LIFT_FACTOR = 1.8;
const MAX_SPEED = 24;
const GRAVITY = 9.81;
const ALIGN_TORQUE = 22;
const INPUT_TORQUE = 11;
const INPUT_ACCEL = 7.5;
const POP_IMPULSE = 3.8;
const RAIL_GRIP = 1.6;

const sampleOut = {
  height: 0,
  normal: new THREE.Vector3(),
  displacement: new THREE.Vector3(),
  steepness: 0,
};

const boardUp = new THREE.Vector3();
const targetUp = new THREE.Vector3();
const torqueAxis = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const vel = new THREE.Vector3();
const slopeFlow = new THREE.Vector3();
const downhill = new THREE.Vector3();

type SamplePoint = { lx: number; lz: number; weight: number };

const SAMPLE_POINTS: SamplePoint[] = [
  { lx: 0, lz: 0, weight: 1.4 },
  { lx: 0, lz: BOARD_HALF_LENGTH, weight: 0.9 },
  { lx: 0, lz: -BOARD_HALF_LENGTH, weight: 0.9 },
  { lx: BOARD_HALF_WIDTH, lz: 0, weight: 0.7 },
  { lx: -BOARD_HALF_WIDTH, lz: 0, weight: 0.7 },
];

export type SurfboardPhysicsResult = {
  submerged: boolean;
  speed: number;
  waterHeight: number;
  waveSteepness: number;
  downhillSpeed: number;
};

export function applySurfboardForces(
  body: RapierRigidBody,
  rotation: THREE.Quaternion,
  time: number,
  input: GameInputState,
  dt: number,
  wipedOut: boolean,
): SurfboardPhysicsResult {
  const pos = body.translation();
  const linvel = body.linvel();
  vel.set(linvel.x, linvel.y, linvel.z);

  forward.set(0, 0, 1).applyQuaternion(rotation);
  right.set(1, 0, 0).applyQuaternion(rotation);

  let buoyancySum = 0;
  let avgHeight = 0;
  const avgNormal = new THREE.Vector3();
  let submerged = false;
  let maxSteepness = 0;

  for (const point of SAMPLE_POINTS) {
    const wx = pos.x + right.x * point.lx + forward.x * point.lz;
    const wz = pos.z + right.z * point.lx + forward.z * point.lz;
    const sample = sampleOcean(wx, wz, time, sampleOut);
    const submersion = sample.height - pos.y + BOARD_HALF_HEIGHT;

    avgHeight += sample.height * point.weight;
    avgNormal.addScaledVector(sample.normal, point.weight);
    maxSteepness = Math.max(maxSteepness, sample.steepness);

    if (submersion > 0) {
      submerged = true;
      buoyancySum += submersion * BUOYANCY * point.weight * dt;
    }
  }

  const weightSum = SAMPLE_POINTS.reduce((s, p) => s + p.weight, 0);
  avgHeight /= weightSum;
  avgNormal.normalize();

  downhill.set(-avgNormal.x, 0, -avgNormal.z);
  if (downhill.lengthSq() > 0.0001) downhill.normalize();
  const downhillSpeed = vel.dot(downhill);

  if (wipedOut) {
    body.applyImpulse({ x: 0, y: -2 * dt, z: 0 }, true);
    return { submerged, speed: vel.length(), waterHeight: avgHeight, waveSteepness: maxSteepness, downhillSpeed };
  }

  if (submerged) {
    body.applyImpulse({ x: 0, y: buoyancySum, z: 0 }, true);

    const drag = WATER_DRAG - Math.abs(input.leanX) * 0.02;
    body.setLinvel(
      { x: linvel.x * drag, y: linvel.y * (drag * 0.85 + 0.1), z: linvel.z * drag },
      true,
    );

    slopeFlow.copy(avgNormal);
    if (downhill.lengthSq() > 0.0001) {
      const alignment = Math.max(vel.dot(downhill), 0);
      const lift = alignment * LIFT_FACTOR * dt;
      const railBoost = Math.abs(input.leanX) * RAIL_GRIP * dt;
      body.applyImpulse(
        {
          x: downhill.x * (lift + railBoost),
          y: 0,
          z: downhill.z * (lift + railBoost),
        },
        true,
      );
    }

    boardUp.set(0, 1, 0).applyQuaternion(rotation);
    targetUp.copy(avgNormal);
    torqueAxis.crossVectors(boardUp, targetUp);
    const alignStrength = torqueAxis.length() * ALIGN_TORQUE * dt;
    if (alignStrength > 0.0001) {
      torqueAxis.normalize();
      body.applyTorqueImpulse(
        {
          x: torqueAxis.x * alignStrength,
          y: torqueAxis.y * alignStrength,
          z: torqueAxis.z * alignStrength,
        },
        true,
      );
    }
  } else {
    body.setLinvel(
      { x: linvel.x * AIR_DRAG, y: linvel.y * AIR_DRAG, z: linvel.z * AIR_DRAG },
      true,
    );
  }

  const leanTorque = INPUT_TORQUE * dt;
  body.applyTorqueImpulse(
    {
      x: input.leanZ * leanTorque,
      y: -input.leanX * leanTorque * 1.6,
      z: input.leanX * leanTorque * 0.7,
    },
    true,
  );

  const accel = INPUT_ACCEL * dt;
  body.applyImpulse(
    {
      x: (right.x * input.leanX + forward.x * input.leanZ) * accel,
      y: 0,
      z: (right.z * input.leanX + forward.z * input.leanZ) * accel,
    },
    true,
  );

  if (input.popUp && submerged) {
    body.applyImpulse({ x: 0, y: POP_IMPULSE, z: 0 }, true);
  }

  let speed = Math.sqrt(linvel.x ** 2 + linvel.z ** 2);
  if (speed > MAX_SPEED) {
    const scale = MAX_SPEED / speed;
    body.setLinvel({ x: linvel.x * scale, y: linvel.y, z: linvel.z * scale }, true);
    speed = MAX_SPEED;
  }

  return { submerged, speed, waterHeight: avgHeight, waveSteepness: maxSteepness, downhillSpeed };
}