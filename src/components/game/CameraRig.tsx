"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";

const BASE_FOV = 55;
const TUBE_FOV = 48;

type CameraRigProps = {
  targetPosition: THREE.Vector3;
  targetRotation: THREE.Quaternion;
};

const desiredPosition = new THREE.Vector3();
const desiredLookAt = new THREE.Vector3();
const cameraOffset = new THREE.Vector3();
const lookOffset = new THREE.Vector3();
const shakeOffset = new THREE.Vector3();

export function CameraRig({ targetPosition, targetRotation }: CameraRigProps) {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3(0, 4, 12));
  const smoothLook = useRef(new THREE.Vector3(0, 1, 0));

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    const shake = state.cameraShake;
    state.tickCameraShake(delta);

    const targetFov = state.inTube ? TUBE_FOV : BASE_FOV;
    if ("fov" in camera) {
      const persp = camera as THREE.PerspectiveCamera;
      persp.fov += (targetFov - persp.fov) * Math.min(1, delta * 4);
      persp.updateProjectionMatrix();
    }

    cameraOffset.set(0, 2.8, -7).applyQuaternion(targetRotation);
    lookOffset.set(0, 0.6, 2).applyQuaternion(targetRotation);
    desiredPosition.copy(targetPosition).add(cameraOffset);
    desiredLookAt.copy(targetPosition).add(lookOffset);

    if (shake > 0.01) {
      shakeOffset.set(
        (Math.random() - 0.5) * shake * 0.6,
        (Math.random() - 0.5) * shake * 0.4,
        (Math.random() - 0.5) * shake * 0.3,
      );
      desiredPosition.add(shakeOffset);
    }

    const t = 1 - Math.exp(-4 * delta);
    smoothPos.current.lerp(desiredPosition, t);
    smoothLook.current.lerp(desiredLookAt, t);

    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothLook.current);
  });

  return null;
}