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
import { useSettingsStore } from "@/stores/settingsStore";

type GameSceneProps = {
  inputManager: InputManager;
};

export function GameScene({ inputManager }: GameSceneProps) {
  const boardPosition = useRef(new THREE.Vector3(0, 2, -8));
  const boardRotation = useRef(new THREE.Quaternion());
  const particlesRef = useRef<SprayParticlesHandle>(null);
  const spot = getActiveSpot();
  const perf = useSettingsStore((s) => s.perf);

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
      <fog attach="fog" args={[spot.atmosphere.fogColor, spot.atmosphere.fogNear, spot.atmosphere.fogFar]} />
      <hemisphereLight args={["#c8e4f8", spot.atmosphere.shallowWater, 0.75]} />
      <ambientLight intensity={0.52} />
      <directionalLight
        castShadow={perf.enableShadows}
        intensity={2.2}
        position={[40, 60, 20]}
        shadow-mapSize={[perf.shadowMapSize, perf.shadowMapSize]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
      />

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