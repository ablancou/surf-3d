"use client";

import { Physics } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

import { CameraRig } from "@/components/game/CameraRig";
import { Effects } from "@/components/game/Effects";
import { OceanSystem } from "@/components/game/OceanSystem";
import { RemoteSurfers } from "@/components/game/RemoteSurfers";
import { ReplayGhosts } from "@/components/game/ReplayGhost";
import { Sky } from "@/components/game/Sky";
import { SprayParticles, type SprayParticlesHandle } from "@/components/game/SprayParticles";
import { Surfboard } from "@/components/game/Surfboard";
import { gameClock } from "@/lib/game/clock";
import { InputManager } from "@/lib/input/InputManager";
import { getActiveSpot } from "@/stores/spotStore";


type GameSceneProps = {
  inputManager: InputManager;
};

export function GameScene({ inputManager }: GameSceneProps) {
  const boardPosition = useRef(new THREE.Vector3(0, 2, -8));
  const boardRotation = useRef(new THREE.Quaternion());
  const particlesRef = useRef<SprayParticlesHandle>(null);
  const spot = getActiveSpot();

  const onTransform = useMemo(
    () => (position: THREE.Vector3, rotation: THREE.Quaternion) => {
      boardPosition.current.copy(position);
      boardRotation.current.copy(rotation);
    },
    [],
  );

  useFrame((_, delta) => {
    gameClock.delta = Math.min(delta, 0.05);
    gameClock.time += gameClock.delta;
  });

  return (
    <>
      <fog attach="fog" args={[spot.atmosphere.fogColor, spot.atmosphere.fogNear, spot.atmosphere.fogFar * 1.35]} />
      <hemisphereLight args={["#d4ecff", spot.atmosphere.shallowWater, 0.85]} />
      <ambientLight intensity={0.62} />
      <directionalLight intensity={2.4} position={[40, 60, 20]} />

      <Sky />
      <OceanSystem />
      <CameraRig
        targetPosition={boardPosition.current}
        targetRotation={boardRotation.current}
      />
      <SprayParticles ref={particlesRef} />
      <RemoteSurfers />
      <ReplayGhosts />

      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]} timeStep="vary" interpolate>
          <Surfboard
            inputManager={inputManager}
            particlesRef={particlesRef}
            onTransform={onTransform}
          />
        </Physics>
      </Suspense>

      <Effects />
    </>
  );
}