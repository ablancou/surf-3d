"use client";

import { Physics } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

import { CameraRig } from "@/components/game/CameraRig";
import { Effects } from "@/components/game/Effects";
import { OceanSystem } from "@/components/game/OceanSystem";
import { SceneLighting } from "@/components/game/SceneLighting";
import { Seafloor } from "@/components/game/Seafloor";
import { ShadowReceiver } from "@/components/game/ShadowReceiver";
import { RemoteSurfers } from "@/components/game/RemoteSurfers";
import { ReplayGhosts } from "@/components/game/ReplayGhost";
import { Sky } from "@/components/game/Sky";
import { SprayParticles, type SprayParticlesHandle } from "@/components/game/SprayParticles";
import { Surfboard } from "@/components/game/Surfboard";
import { gameClock } from "@/lib/game/clock";
import { InputManager } from "@/lib/input/InputManager";
import { useSpotStore } from "@/stores/spotStore";
import { useSettingsStore } from "@/stores/settingsStore";

type GameSceneProps = {
  inputManager: InputManager;
};

export function GameScene({ inputManager }: GameSceneProps) {
  const boardPosition = useRef(new THREE.Vector3(0, 2, -8));
  const boardRotation = useRef(new THREE.Quaternion());
  const particlesRef = useRef<SprayParticlesHandle>(null);
  const spot = useSpotStore((s) => s.spot);
  const fogFar = useSettingsStore((s) => s.perf.fogFar);

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
      <fog
        attach="fog"
        key={spot.id}
        args={[spot.atmosphere.fogColor, spot.atmosphere.fogNear, Math.min(spot.atmosphere.fogFar, fogFar)]}
      />
      <SceneLighting />

      <Sky />
      <OceanSystem />
      <Seafloor />
      <ShadowReceiver />
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