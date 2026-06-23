import * as THREE from "three";
import type { SprayParticlesHandle } from "@/components/game/SprayParticles";
import type { RiderTelemetry, TrickId } from "@/lib/tricks/types";

const emitPos = new THREE.Vector3();
const emitVel = new THREE.Vector3();
const right = new THREE.Vector3();
const forward = new THREE.Vector3();

export function emitCarveSpray(
  particles: SprayParticlesHandle | null,
  position: THREE.Vector3,
  rotation: THREE.Quaternion,
  telemetry: RiderTelemetry,
) {
  if (!particles || !telemetry.submerged) return;
  const intensity = Math.min(1, Math.abs(telemetry.angularVelocityZ) / 3 + telemetry.speed / 12);
  if (intensity < 0.25) return;

  right.set(1, 0, 0).applyQuaternion(rotation);
  forward.set(0, 0, 1).applyQuaternion(rotation);

  const side = telemetry.tiltX > 0 ? 1 : -1;
  emitPos.copy(position).addScaledVector(right, side * 0.35).addScaledVector(forward, -0.4);
  emitVel.copy(forward).multiplyScalar(-telemetry.speed * 0.3).addScaledVector(right, side * 2);

  particles.emit({
    kind: "spray",
    position: emitPos,
    velocity: emitVel,
    count: Math.floor(3 + intensity * 8),
    spread: 0.4,
    speed: 2 + intensity * 4,
    size: 0.1 + intensity * 0.08,
    life: 0.4 + intensity * 0.3,
  });
}

export function emitFoamTrail(
  particles: SprayParticlesHandle | null,
  position: THREE.Vector3,
  rotation: THREE.Quaternion,
  speed: number,
  submerged: boolean,
) {
  if (!particles || !submerged || speed < 2) return;

  forward.set(0, 0, -1).applyQuaternion(rotation);
  emitPos.copy(position).addScaledVector(forward, 0.9);
  emitVel.set(0, 0.2, 0);

  particles.emit({
    kind: "foam",
    position: emitPos,
    velocity: emitVel,
    count: Math.floor(1 + speed * 0.3),
    spread: 0.25,
    speed: 0.5,
    size: 0.14,
    life: 0.6,
  });
}

export function emitWipeoutSplash(
  particles: SprayParticlesHandle | null,
  position: THREE.Vector3,
  speed: number,
) {
  if (!particles) return;
  emitPos.copy(position);
  emitVel.set(0, 4, 0);

  particles.emit({
    kind: "splash",
    position: emitPos,
    velocity: emitVel,
    count: Math.floor(30 + speed * 4),
    spread: 2.5,
    speed: 6 + speed * 0.5,
    size: 0.2,
    life: 1.2,
  });
}

export function emitTubeSpray(
  particles: SprayParticlesHandle | null,
  position: THREE.Vector3,
  rotation: THREE.Quaternion,
  tubeDepth: number,
) {
  if (!particles || tubeDepth < 0.3) return;
  forward.set(0, 0, 1).applyQuaternion(rotation);
  right.set(1, 0, 0).applyQuaternion(rotation);
  emitPos.copy(position).addScaledVector(forward, 0.3).y += 0.5;
  emitVel.set(0, 1.5, 0);

  particles.emit({
    kind: "spray",
    position: emitPos,
    velocity: emitVel,
    count: Math.floor(4 + tubeDepth * 10),
    spread: 1.2,
    speed: 2 + tubeDepth * 3,
    size: 0.14,
    life: 0.7,
  });
}

export function emitPopSpray(
  particles: SprayParticlesHandle | null,
  position: THREE.Vector3,
  rotation: THREE.Quaternion,
) {
  if (!particles) return;
  forward.set(0, 0, 1).applyQuaternion(rotation);
  emitPos.copy(position).addScaledVector(forward, 0.5);
  emitVel.copy(forward).multiplyScalar(2);
  emitVel.y = 3;

  particles.emit({
    kind: "spray",
    position: emitPos,
    velocity: emitVel,
    count: 12,
    spread: 0.6,
    speed: 3,
    size: 0.12,
    life: 0.5,
  });
}

function orientBasis(rotation: THREE.Quaternion) {
  right.set(1, 0, 0).applyQuaternion(rotation);
  forward.set(0, 0, 1).applyQuaternion(rotation);
}

export function emitLandingSplash(
  particles: SprayParticlesHandle | null,
  position: THREE.Vector3,
  rotation: THREE.Quaternion,
  airTime: number,
  speed: number,
) {
  if (!particles || airTime < 0.22) return;
  orientBasis(rotation);
  emitPos.copy(position).addScaledVector(forward, 0.15);
  emitVel.set(0, 2.5 + airTime * 2, 0).addScaledVector(forward, speed * 0.2);

  particles.emit({
    kind: "splash",
    position: emitPos,
    velocity: emitVel,
    count: Math.floor(12 + airTime * 18 + speed * 1.5),
    spread: 1.2 + airTime * 0.8,
    speed: 4 + airTime * 3,
    size: 0.14 + airTime * 0.06,
    life: 0.6 + airTime * 0.35,
  });
}

export function emitPumpSpray(
  particles: SprayParticlesHandle | null,
  position: THREE.Vector3,
  rotation: THREE.Quaternion,
  speed: number,
  leanZ: number,
) {
  if (!particles) return;
  orientBasis(rotation);
  const pumpingUp = leanZ < 0;
  emitPos.copy(position).addScaledVector(forward, pumpingUp ? 0.35 : -0.45);
  emitVel.copy(forward).multiplyScalar(pumpingUp ? speed * 0.15 : -speed * 0.1);
  emitVel.y = pumpingUp ? 1.2 : 0.5;

  particles.emit({
    kind: "foam",
    position: emitPos,
    velocity: emitVel,
    count: Math.floor(3 + speed * 0.25),
    spread: 0.35,
    speed: 1.5,
    size: 0.12,
    life: 0.45,
  });
}

export function emitAirborneMist(
  particles: SprayParticlesHandle | null,
  position: THREE.Vector3,
  rotation: THREE.Quaternion,
  airTime: number,
  speed: number,
) {
  if (!particles || airTime < 0.08) return;
  orientBasis(rotation);
  emitPos.copy(position).addScaledVector(forward, -0.5);
  emitVel.set(0, -0.8, 0);

  particles.emit({
    kind: "foam",
    position: emitPos,
    velocity: emitVel,
    count: Math.floor(1 + airTime * 4 + speed * 0.2),
    spread: 0.35 + airTime * 0.2,
    speed: 0.6,
    size: 0.1,
    life: 0.35 + airTime * 0.15,
  });
}

export function emitTrickSpray(
  particles: SprayParticlesHandle | null,
  position: THREE.Vector3,
  rotation: THREE.Quaternion,
  telemetry: RiderTelemetry,
  trickId: TrickId,
  combo = 1,
) {
  if (!particles) return;
  orientBasis(rotation);
  const comboBoost = Math.min(1.6, 1 + (combo - 1) * 0.08);

  switch (trickId) {
    case "carve_left":
    case "carve_right": {
      const side = trickId === "carve_right" ? 1 : -1;
      emitPos.copy(position).addScaledVector(right, side * 0.45).addScaledVector(forward, -0.35);
      emitVel.copy(forward).multiplyScalar(-telemetry.speed * 0.35).addScaledVector(right, side * 3);
      particles.emit({
        kind: "spray",
        position: emitPos,
        velocity: emitVel,
        count: Math.floor((10 + telemetry.speed * 0.6) * comboBoost),
        spread: 0.55,
        speed: 3 + telemetry.speed * 0.15,
        size: 0.12,
        life: 0.55,
      });
      break;
    }
    case "pumping": {
      emitPos.copy(position).addScaledVector(forward, -0.7);
      emitVel.copy(forward).multiplyScalar(-1.5);
      emitVel.y = 0.4;
      particles.emit({
        kind: "foam",
        position: emitPos,
        velocity: emitVel,
        count: Math.floor(8 * comboBoost),
        spread: 0.4,
        speed: 1.2,
        size: 0.13,
        life: 0.7,
      });
      break;
    }
    case "bottom_turn": {
      emitPos.copy(position).addScaledVector(forward, 0.2);
      emitVel.set(0, 1.8, 0).addScaledVector(forward, telemetry.speed * 0.2);
      particles.emit({
        kind: "spray",
        position: emitPos,
        velocity: emitVel,
        count: Math.floor(16 * comboBoost),
        spread: 1.4,
        speed: 4 + telemetry.speed * 0.2,
        size: 0.14,
        life: 0.65,
      });
      break;
    }
    case "cutback": {
      emitPos.copy(position).addScaledVector(forward, -0.2);
      emitVel.copy(forward).multiplyScalar(-telemetry.speed * 0.45);
      emitVel.y = 2.2;
      particles.emit({
        kind: "splash",
        position: emitPos,
        velocity: emitVel,
        count: Math.floor((22 + telemetry.speed) * comboBoost),
        spread: 1.8,
        speed: 5 + telemetry.speed * 0.25,
        size: 0.16,
        life: 0.85,
      });
      break;
    }
    case "floater": {
      emitPos.copy(position).addScaledVector(forward, 0.4);
      emitVel.set(0, 3.5, 0).addScaledVector(forward, telemetry.speed * 0.15);
      particles.emit({
        kind: "spray",
        position: emitPos,
        velocity: emitVel,
        count: Math.floor(18 * comboBoost),
        spread: 1.1,
        speed: 4,
        size: 0.15,
        life: 0.75,
      });
      break;
    }
    case "aerial": {
      emitPos.copy(position);
      emitVel.set(0, 5, 0);
      particles.emit({
        kind: "splash",
        position: emitPos,
        velocity: emitVel,
        count: Math.floor((35 + telemetry.speed * 2) * comboBoost),
        spread: 2.8,
        speed: 7 + telemetry.speed * 0.3,
        size: 0.2,
        life: 1.1,
      });
      emitPos.copy(position).addScaledVector(forward, 0.3);
      emitVel.copy(forward).multiplyScalar(telemetry.speed * 0.25);
      emitVel.y = 2;
      particles.emit({
        kind: "spray",
        position: emitPos,
        velocity: emitVel,
        count: Math.floor(14 * comboBoost),
        spread: 1.5,
        speed: 4,
        size: 0.13,
        life: 0.6,
      });
      break;
    }
    case "tube_ride": {
      emitTubeSpray(particles, position, rotation, Math.max(0.55, telemetry.tubeDepth));
      emitPos.copy(position).addScaledVector(right, 0.5).y += 0.4;
      emitVel.set(0, 2.5, 0);
      particles.emit({
        kind: "spray",
        position: emitPos,
        velocity: emitVel,
        count: Math.floor((14 + telemetry.tubeDepth * 12) * comboBoost),
        spread: 1.6,
        speed: 3 + telemetry.tubeDepth * 2,
        size: 0.15,
        life: 0.9,
      });
      break;
    }
  }
}