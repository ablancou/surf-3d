"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { boardVisualState } from "@/lib/game/boardVisualState";
import { useGameStore } from "@/stores/gameStore";

const BASE_FOV = 62;
const TUBE_FOV = 54;
const CAMERA_DISTANCE = 8.5;
const LOOK_AHEAD = 13;

type CameraRigProps = {
  targetPosition: THREE.Vector3;
  targetRotation: THREE.Quaternion;
};

const desiredPosition = new THREE.Vector3();
const desiredLookAt = new THREE.Vector3();
const cameraOffset = new THREE.Vector3();
const lookOffset = new THREE.Vector3();
const shakeOffset = new THREE.Vector3();
const forward = new THREE.Vector3();

export function CameraRig({ targetPosition, targetRotation }: CameraRigProps) {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3(0, 8.5, -18));
  const smoothLook = useRef(new THREE.Vector3(0, 0.8, 12));
  const snapped = useRef(false);
  const wasWipedOut = useRef(false);

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    const shake = state.wipedOut ? state.cameraShake * 0.35 : state.cameraShake;
    state.tickCameraShake(delta);

    if (wasWipedOut.current && !state.wipedOut) {
      snapped.current = false;
    }
    wasWipedOut.current = state.wipedOut;

    const targetFov = state.inTube ? TUBE_FOV : BASE_FOV;
    if ("fov" in camera) {
      const persp = camera as THREE.PerspectiveCamera;
      persp.fov += (targetFov - persp.fov) * Math.min(1, delta * 4);
      persp.updateProjectionMatrix();
    }

    forward.set(0, 0, 1).applyQuaternion(targetRotation);
    forward.y = 0;
    if (forward.lengthSq() < 0.0001) forward.set(0, 0, 1);
    forward.normalize();

    const tx = boardVisualState.x;
    const ty = boardVisualState.y;
    const tz = boardVisualState.z;

    cameraOffset.copy(forward).multiplyScalar(-CAMERA_DISTANCE);
    cameraOffset.y = 5.2;

    lookOffset.copy(forward).multiplyScalar(LOOK_AHEAD);
    lookOffset.y = 0.6;

    desiredPosition.set(tx, ty, tz).add(cameraOffset);
    desiredLookAt.set(tx, 0.8, tz).add(lookOffset);

    if (shake > 0.01) {
      shakeOffset.set(
        (Math.random() - 0.5) * shake * 0.6,
        (Math.random() - 0.5) * shake * 0.4,
        (Math.random() - 0.5) * shake * 0.3,
      );
      desiredPosition.add(shakeOffset);
    }

    if (!snapped.current) {
      smoothPos.current.copy(desiredPosition);
      smoothLook.current.copy(desiredLookAt);
      snapped.current = true;
    }

    const followRate = state.wipedOut ? 16 : 5.5;
    const t = 1 - Math.exp(-followRate * delta);
    smoothPos.current.lerp(desiredPosition, t);
    smoothLook.current.lerp(desiredLookAt, t * 0.85);

    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothLook.current);
  });

  return null;
}