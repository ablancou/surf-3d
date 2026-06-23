"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { RemotePlayer } from "@/lib/multiplayer/types";
import { useMultiplayerStore } from "@/stores/multiplayerStore";

function RemoteSurfer({ player }: { player: RemotePlayer }) {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3());
  const targetQuat = useRef(new THREE.Quaternion());

  const smooth = useMemo(
    () => ({
      pos: new THREE.Vector3(player.x, player.y, player.z),
      quat: new THREE.Quaternion(player.qx, player.qy, player.qz, player.qw),
    }),
    [player.id],
  );

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const t = 1 - Math.exp(-12 * delta);
    targetPos.current.set(player.x, player.y, player.z);
    targetQuat.current.set(player.qx, player.qy, player.qz, player.qw);
    smooth.pos.lerp(targetPos.current, t);
    smooth.quat.slerp(targetQuat.current, t);
    g.position.copy(smooth.pos);
    g.quaternion.copy(smooth.quat);
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <boxGeometry args={[0.5, 0.14, 1.9]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.75} roughness={0.4} />
      </mesh>
      <Html position={[0, 1.2, 0]} center distanceFactor={12} style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap rounded-md bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
          {player.name} · {player.speed.toFixed(1)}
        </div>
      </Html>
    </group>
  );
}

export function RemoteSurfers() {
  const remotes = useMultiplayerStore((s) => s.remotePlayers);
  const status = useMultiplayerStore((s) => s.status);

  if (status !== "connected") return null;

  return (
    <group>
      {remotes.map((p) => (
        <RemoteSurfer key={p.id} player={p} />
      ))}
    </group>
  );
}