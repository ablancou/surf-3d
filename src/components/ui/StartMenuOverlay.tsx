"use client";

import { gameClock } from "@/lib/game/clock";
import { useGameStore } from "@/stores/gameStore";
import { useSpotStore } from "@/stores/spotStore";

export function StartMenuOverlay() {
  const phase = useGameStore((s) => s.ridePhase);
  const beginSession = useGameStore((s) => s.beginSession);
  const spotName = useSpotStore((s) => s.spot.name);

  if (phase !== "menu") return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-sky-950/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-white/20 bg-black/55 px-8 py-8 text-center backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Surf 3D</p>
        <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">El mejor surf del navegador</h1>
        <p className="mt-3 text-sm text-white/65">
          Rema, levántate, carvea y busca el tubo en {spotName}.
        </p>
        <button
          type="button"
          data-testid="start-session"
          className="pointer-events-auto mt-6 w-full rounded-xl bg-sky-500 px-6 py-3.5 text-lg font-semibold text-white shadow-lg transition hover:bg-sky-400 active:scale-[0.98]"
          onClick={() => beginSession(gameClock.time)}
        >
          Entrar al agua
        </button>
        <p className="mt-4 text-xs text-white/40">W rema · A/D carvea · Espacio aéreo</p>
      </div>
    </div>
  );
}