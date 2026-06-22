"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { ReplayClip } from "@/lib/replay/types";
import { gameClock } from "@/lib/game/clock";
import { useReplayStore } from "@/stores/replayStore";

type GhostProps = {
  clip: ReplayClip;
  color: string;
  label: string;
};

function GhostRider({ clip, color, label }: GhostProps) {
  const groupRef = useRef<THREE.Group>(null);
  const playbackTime = useRef(0);

  const smooth = useMemo(
    () => ({
      pos: new THREE.Vector3(clip.frames[0]?.x ?? 0, clip.frames[0]?.y ?? 2, clip.frames[0]?.z ?? 0),
      quat: new THREE.Quaternion(),
      targetQuat: new THREE.Quaternion(),
    }),
    [clip.id],
  );

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g || clip.frames.length < 2) return;

    const playing = useReplayStore.getState().ghostPlaying;
    if (playing) {
      playbackTime.current += delta;
      if (playbackTime.current > clip.duration) playbackTime.current = 0;
    }

    const t = playbackTime.current;
    let i = 0;
    while (i < clip.frames.length - 2 && clip.frames[i + 1].t < t) i++;

    const a = clip.frames[i];
    const b = clip.frames[Math.min(i + 1, clip.frames.length - 1)];
    const span = Math.max(b.t - a.t, 0.001);
    const alpha = Math.min(1, Math.max(0, (t - a.t) / span));

    smooth.pos.set(
      a.x + (b.x - a.x) * alpha,
      a.y + (b.y - a.y) * alpha,
      a.z + (b.z - a.z) * alpha,
    );
    smooth.quat.set(a.qx, a.qy, a.qz, a.qw);
    smooth.targetQuat.set(b.qx, b.qy, b.qz, b.qw);
    smooth.quat.slerp(smooth.targetQuat, alpha);

    g.position.copy(smooth.pos);
    g.quaternion.copy(smooth.quat);
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <boxGeometry args={[0.5, 0.14, 1.9]} />
        <meshStandardMaterial color={color} transparent opacity={0.35} roughness={0.5} />
      </mesh>
      <Html position={[0, 1.4, 0]} center distanceFactor={14} style={{ pointerEvents: "none" }}>
        <div className="rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur">
          {label} · {clip.score}
        </div>
      </Html>
    </group>
  );
}

export function ReplayGhosts() {
  const personal = useReplayStore((s) => s.personalBest);
  const globalGhost = useReplayStore((s) => s.globalGhost);
  const showPersonal = useReplayStore((s) => s.showPersonalGhost);
  const showGlobal = useReplayStore((s) => s.showGlobalGhost);

  return (
    <group>
      {showPersonal && personal && personal.frames.length > 1 && (
        <GhostRider clip={personal} color="#a78bfa" label="Your Best" />
      )}
      {showGlobal && globalGhost && globalGhost.frames.length > 1 && (
        <GhostRider clip={globalGhost} color="#fbbf24" label="World #1" />
      )}
    </group>
  );
}