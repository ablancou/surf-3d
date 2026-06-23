"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { boardVisualState } from "@/lib/game/boardVisualState";
import { gameClock } from "@/lib/game/clock";

const DECK_WHITE = "#f8fafc";
const BLUE_MAIN = "#2563eb";
const BLUE_DEEP = "#1e3a8a";
const BLUE_LIGHT = "#93c5fd";

function createSurfboardGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, -1.05);
  shape.bezierCurveTo(0.3, -0.7, 0.28, -0.2, 0.24, 0);
  shape.bezierCurveTo(0.2, 0.55, 0.12, 0.9, 0, 1.05);
  shape.bezierCurveTo(-0.12, 0.9, -0.2, 0.55, -0.24, 0);
  shape.bezierCurveTo(-0.28, -0.2, -0.3, -0.7, 0, -1.05);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.11,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.018,
    bevelSegments: 3,
    curveSegments: 20,
    steps: 1,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0.055, 0);
  geo.computeVertexNormals();
  return geo;
}

export function SurfboardModel() {
  const groupRef = useRef<THREE.Group>(null);
  const geometry = useMemo(() => createSurfboardGeometry(), []);

  const deckMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: DECK_WHITE,
        emissive: BLUE_LIGHT,
        emissiveIntensity: 0.18,
        roughness: 0.28,
        metalness: 0.06,
      }),
    [],
  );

  const hullMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BLUE_MAIN,
        emissive: BLUE_DEEP,
        emissiveIntensity: 0.12,
        roughness: 0.35,
        metalness: 0.1,
      }),
    [],
  );

  const accentMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BLUE_DEEP,
        emissive: BLUE_MAIN,
        emissiveIntensity: 0.08,
        roughness: 0.4,
      }),
    [],
  );

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const { speed, tiltX, inTube } = boardVisualState;
    const flex = Math.sin(gameClock.time * (6 + speed * 0.5)) * speed * 0.004;
    const carveBank = tiltX * 0.15;

    group.rotation.z = carveBank + flex * 0.3;
    deckMaterial.emissiveIntensity = inTube ? 0.28 : 0.18 + speed * 0.01;
  });

  return (
    <group ref={groupRef} scale={1.55}>
      <mesh geometry={geometry} material={deckMaterial} />
      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} material={hullMaterial}>
        <planeGeometry args={[0.46, 2.05]} />
      </mesh>
      <mesh position={[0, 0.09, 0.05]} rotation={[-Math.PI / 2, 0, 0]} material={accentMaterial}>
        <planeGeometry args={[0.07, 1.45]} />
      </mesh>
      <mesh position={[0.22, 0.07, 0]} rotation={[0, 0, 0.08]} material={accentMaterial}>
        <boxGeometry args={[0.025, 0.04, 1.75]} />
      </mesh>
      <mesh position={[-0.22, 0.07, 0]} rotation={[0, 0, -0.08]} material={accentMaterial}>
        <boxGeometry args={[0.025, 0.04, 1.75]} />
      </mesh>
      <mesh position={[0, 0.05, -0.82]} rotation={[0.35, 0, 0]} material={hullMaterial}>
        <boxGeometry args={[0.07, 0.14, 0.12]} />
      </mesh>
      <mesh position={[0, 0.1, 0.82]} rotation={[-Math.PI / 2, 0, 0]} material={accentMaterial}>
        <circleGeometry args={[0.09, 16]} />
      </mesh>
    </group>
  );
}