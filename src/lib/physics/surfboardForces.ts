import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { getSpotPhysics } from "@/lib/spots/spotPhysics";
import { sampleOcean } from "@/lib/waves/oceanSampler";
import type { GameInputState } from "@/lib/input/types";

export const BOARD_HALF_HEIGHT = 0.08;
const BOARD_HALF_LENGTH = 1.05;
const BOARD_HALF_WIDTH = 0.28;
const BOARD_MASS = 7;

const SURFACE_SPRING = 58;
const WATER_DRAG = 0.935;
const AIR_DRAG = 0.996;
const ALIGN_TORQUE = 15;
const CRUISE_MIN_SPEED = 5.5;
const INPUT_TORQUE = 9;
const MAX_SINK_SPEED = -1.8;

export const POP_COOLDOWN_SEC = 0.35;
export const BASE_POP_IMPULSE = 3.8;

export function popImpulseForSpeed(speed: number) {
  return BASE_POP_IMPULSE * (1 + Math.min(speed / 14, 0.38));
}

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
  const p = getSpotPhysics();
  const pos = body.translation();
  const linvel = body.linvel();
  vel.set(linvel.x, linvel.y, linvel.z);

  forward.set(0, 0, 1).applyQuaternion(rotation);
  right.set(1, 0, 0).applyQuaternion(rotation);

  let buoyancySum = 0;
  let avgHeight = 0;
  let totalSubmersion = 0;
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
      totalSubmersion += submersion * point.weight;
      buoyancySum += submersion * p.buoyancy * point.weight * dt;
    }
  }

  const weightSum = SAMPLE_POINTS.reduce((s, p) => s + p.weight, 0);
  avgHeight /= weightSum;
  avgNormal.normalize();

  const surfaceY = avgHeight + BOARD_HALF_HEIGHT;
  const surfaceGap = surfaceY - pos.y;
  if (surfaceGap > -0.35) {
    submerged = true;
    buoyancySum += BOARD_MASS * 9.81 * dt;
    buoyancySum += surfaceGap * SURFACE_SPRING * dt;
  }

  downhill.set(-avgNormal.x, 0, -avgNormal.z);
  if (downhill.lengthSq() > 0.0001) downhill.normalize();
  const downhillSpeed = vel.dot(downhill);
  const faceAlignment = forward.dot(downhill);
  let speed = Math.sqrt(linvel.x ** 2 + linvel.z ** 2);

  if (wipedOut) {
    body.applyImpulse({ x: 0, y: -2 * dt, z: 0 }, true);
    return { submerged, speed: vel.length(), waterHeight: avgHeight, waveSteepness: maxSteepness, downhillSpeed };
  }

  if (submerged) {
    body.applyImpulse({ x: 0, y: buoyancySum, z: 0 }, true);

    const drag = WATER_DRAG - Math.abs(input.leanX) * 0.02;
    let vy = linvel.y * (drag * 0.85 + 0.1);
    if (vy < MAX_SINK_SPEED) vy = MAX_SINK_SPEED;
    body.setLinvel(
      { x: linvel.x * drag, y: vy, z: linvel.z * drag },
      true,
    );

    if (downhill.lengthSq() > 0.0001) {
      const alignment = Math.max(vel.dot(downhill), 0);
      const lift = alignment * p.liftFactor * dt;
      const railBoost = Math.abs(input.leanX) * p.railGrip * dt;
      body.applyImpulse(
        {
          x: downhill.x * (lift + railBoost),
          y: 0,
          z: downhill.z * (lift + railBoost),
        },
        true,
      );

      if (faceAlignment > 0.38 && Math.abs(input.leanX) < 0.4) {
        const trim = faceAlignment * p.trimFactor * dt * 1.15;
        body.applyImpulse({ x: downhill.x * trim, y: 0, z: downhill.z * trim }, true);
      }

      if (downhillSpeed < -0.45 && input.leanZ > 0.15) {
        const pump = input.leanZ * p.pumpFactor * dt * 1.1;
        body.applyImpulse({ x: downhill.x * pump, y: 0, z: downhill.z * pump }, true);
      }

      if (speed < 8 && faceAlignment > 0.28 && input.leanZ > 0.1) {
        const glide = (8 - speed) * 0.5 * faceAlignment * Math.max(input.leanZ, 0.35) * dt;
        body.applyImpulse({ x: downhill.x * glide, y: 0, z: downhill.z * glide }, true);
      }

      // Flow assist: mantener velocidad al ir recto en la pared
      if (
        faceAlignment > 0.48 &&
        speed >= CRUISE_MIN_SPEED &&
        speed < p.maxSpeed * 0.95 &&
        Math.abs(input.leanX) < 0.22
      ) {
        const cruise = faceAlignment * (1 - Math.abs(input.leanX)) * 0.65 * dt;
        body.applyImpulse({ x: downhill.x * cruise, y: 0, z: downhill.z * cruise }, true);
      }

      // Antislot: evita quedarte parado en la ola
      if (faceAlignment > 0.35 && speed > 1.5 && speed < CRUISE_MIN_SPEED) {
        const recover = (CRUISE_MIN_SPEED - speed) * 0.55 * faceAlignment * dt;
        body.applyImpulse({ x: downhill.x * recover, y: 0, z: downhill.z * recover }, true);
      }
    }

    boardUp.set(0, 1, 0).applyQuaternion(rotation);
    targetUp.copy(avgNormal);
    torqueAxis.crossVectors(boardUp, targetUp);
    const tubeGrip = maxSteepness > 0.34 && faceAlignment > 0.45 ? p.tubeGrip : 1;
    const alignStrength = torqueAxis.length() * ALIGN_TORQUE * tubeGrip * dt;
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
  if (submerged) {
    // En el agua W/S impulsan — no deben hundir la nariz (causaba wipeouts al mantener W)
    body.applyTorqueImpulse(
      {
        x: input.leanZ * leanTorque * 0.1,
        y: -input.leanX * leanTorque * 1.6,
        z: input.leanX * leanTorque * 0.7,
      },
      true,
    );
  } else {
    body.applyTorqueImpulse(
      {
        x: -input.leanZ * leanTorque * 0.35,
        y: -input.leanX * leanTorque * 1.2,
        z: input.leanX * leanTorque * 0.5,
      },
      true,
    );
  }

  const accel = p.inputAccel * dt;
  if (submerged && downhill.lengthSq() > 0.0001) {
    const drive = input.leanZ * accel * 1.55;
    body.applyImpulse(
      { x: downhill.x * drive, y: 0, z: downhill.z * drive },
      true,
    );
    const carveScale = Math.max(0.5, 1 - speed / 30);
    const carve = input.leanX * accel * carveScale;
    body.applyImpulse(
      { x: right.x * carve, y: 0, z: right.z * carve },
      true,
    );
  } else {
    body.applyImpulse(
      {
        x: (right.x * input.leanX + forward.x * input.leanZ) * accel,
        y: 0,
        z: (right.z * input.leanX + forward.z * input.leanZ) * accel,
      },
      true,
    );
  }

  speed = Math.sqrt(linvel.x ** 2 + linvel.z ** 2);
  if (speed > p.maxSpeed) {
    const scale = p.maxSpeed / speed;
    body.setLinvel({ x: linvel.x * scale, y: linvel.y, z: linvel.z * scale }, true);
    speed = p.maxSpeed;
  }

  return { submerged, speed, waterHeight: avgHeight, waveSteepness: maxSteepness, downhillSpeed };
}