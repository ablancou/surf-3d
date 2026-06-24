"use client";

import { useGameStore } from "@/stores/gameStore";

export function RideRecapOverlay() {
  const recap = useGameStore((s) => s.rideRecap);
  const phase = useGameStore((s) => s.ridePhase);

  if (phase !== "recap" || !recap) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-sky-950/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/20 bg-black/55 px-6 py-5 text-center backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.25em] text-white/50">Fin del ride</p>
        <p className="mt-2 font-mono text-4xl font-bold text-white">{recap.score}</p>
        <p className="text-sm text-white/60">puntos</p>
        <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-xs text-white/75">
          <div>
            <p className="text-white/40">Tricks</p>
            <p className="text-lg">{recap.trickCount}</p>
          </div>
          <div>
            <p className="text-white/40">Combo máx</p>
            <p className="text-lg">x{recap.maxCombo}</p>
          </div>
          <div>
            <p className="text-white/40">Vel máx</p>
            <p className="text-lg">{recap.maxSpeed.toFixed(1)}</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-white/45">
          {recap.durationSec.toFixed(0)}s surfeando — volviendo a remar...
        </p>
      </div>
    </div>
  );
}