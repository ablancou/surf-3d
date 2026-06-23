"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { boardVisualState } from "@/lib/game/boardVisualState";
import { gameClock } from "@/lib/game/clock";

function createSurfboardGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, -1.05);
  shape.bezierCurveTo(0.3, -0.7, 0.28, -0.2, 0.24, 0);
  shape.bezierCurveTo(0.2, 0.55, 0.12, 0.9, 0, 1.05);
  shape.bezierCurveTo(-0.12, 0.9, -0.2, 0.55, -0.24, 0);
  shape.bezierCurveTo(-0.28, -0.2, -0.3, -0.7, 0, -1.05);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.13,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.02,
    bevelSegments: 3,
    curveSegments: 16,
    steps: 1,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0.065, 0);
  geo.computeVertexNormals();
  return geo;
}

export function SurfboardModel() {
  const groupRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const noseRef = useRef<THREE.Mesh>(null);
  const colorTarget = useRef(new THREE.Color("#f97316"));
  const geometry = useMemo(() => createSurfboardGeometry(), []);

  const deckMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f97316",
        emissive: "#c2410c",
        emissiveIntensity: 0.2,
        roughness: 0.32,
        metalness: 0.12,
      }),
    [],
  );

  const railMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#c2410c",
        roughness: 0.45,
        metalness: 0.05,
      }),
    [],
  );

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const { speed, tiltX, inTube } = boardVisualState;

    colorTarget.current.set(inTube ? "#ea580c" : "#f97316");
    deckMaterial.color.lerp(colorTarget.current, 0.08);

    const flex = Math.sin(gameClock.time * (6 + speed * 0.5)) * speed * 0.004;
    const carveBank = tiltX * 0.15;

    group.rotation.z = carveBank + flex * 0.3;

    if (tailRef.current) tailRef.current.rotation.x = -flex * 0.8;
    if (noseRef.current) noseRef.current.rotation.x = flex * 1.2;
  });

  return (
    <group ref={groupRef} scale={1.25}>
      <mesh geometry={geometry} castShadow receiveShadow material={deckMaterial} />
      <mesh ref={noseRef} position={[0, 0.08, 0.75]} castShadow>
        <boxGeometry args={[0.18, 0.03, 0.35]} />
        <meshStandardMaterial color="#fdba74" roughness={0.38} />
      </mesh>
      <mesh ref={tailRef} position={[0, 0.07, -0.7]} castShadow>
        <boxGeometry args={[0.22, 0.03, 0.28]} />
        <meshStandardMaterial color="#fed7aa" roughness={0.4} />
      </mesh>
      <mesh position={[0.26, 0.04, 0]} rotation={[0, 0, 0.1]} material={railMaterial}>
        <boxGeometry args={[0.03, 0.06, 1.8]} />
      </mesh>
      <mesh position={[-0.26, 0.04, 0]} rotation={[0, 0, -0.1]} material={railMaterial}>
        <boxGeometry args={[0.03, 0.06, 1.8]} />
      </mesh>
    </group>
  );
}