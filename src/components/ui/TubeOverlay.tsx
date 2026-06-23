"use client";

import { useGameStore } from "@/stores/gameStore";

export function TubeOverlay() {
  const inTube = useGameStore((s) => s.inTube);
  const tubeDepth = useGameStore((s) => s.tubeDepth);

  if (!inTube) return null;

  const intensity = Math.min(1, tubeDepth);

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background: `radial-gradient(ellipse at center, transparent 28%, rgba(6, 40, 70, ${0.38 + intensity * 0.38}) 100%)`,
        boxShadow: `inset 0 0 120px rgba(0, 30, 60, ${0.35 + intensity * 0.42})`,
      }}
    >
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-center">
        <p
          className="text-2xl font-black tracking-[0.25em] text-cyan-100 uppercase drop-shadow-lg md:text-4xl"
          style={{ opacity: 0.75 + intensity * 0.25 }}
        >
          En el tubo
        </p>
        <div className="mx-auto mt-3 h-1.5 w-36 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-cyan-300 transition-all duration-150"
            style={{ width: `${intensity * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs tracking-wide text-cyan-200/60">Profundidad del pocket</p>
      </div>
    </div>
  );
}