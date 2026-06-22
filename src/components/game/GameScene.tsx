"use client";

import { Physics } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

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

  useFrame(({ camera }, delta) => {
    gameClock.delta = Math.min(delta, 0.05);
    gameClock.time += gameClock.delta;

    const target = boardPosition.current;
    camera.position.set(target.x, 7, target.z + 14);
    camera.lookAt(target.x, 0, target.z - 30);
  });

  return (
    <>
      <hemisphereLight args={["#b8d9f0", spot.atmosphere.deepWater, 0.65]} />
      <ambientLight intensity={0.45} />
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

      <OceanSystem />
      <Sky />
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