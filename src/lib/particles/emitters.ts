import * as THREE from "three";
import type { SprayParticlesHandle } from "@/components/game/SprayParticles";
import type { RiderTelemetry } from "@/lib/tricks/types";

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