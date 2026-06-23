"use client";

import { useGameStore } from "@/stores/gameStore";

export function AerialOverlay() {
  const riding = useGameStore((s) => s.riding);
  const airTime = useGameStore((s) => s.airTime);
  const speed = useGameStore((s) => s.speed);

  if (riding || airTime < 0.12) return null;

  const hang = Math.min(1, airTime / 1.2);
  const bigAir = airTime > 0.55;

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background: `radial-gradient(ellipse at center, transparent 35%, rgba(252, 211, 77, ${0.08 + hang * 0.12}) 100%)`,
      }}
    >
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-center">
        <p
          className={`font-black tracking-[0.2em] uppercase drop-shadow-lg ${
            bigAir ? "text-3xl text-amber-200 md:text-5xl" : "text-xl text-amber-100/90 md:text-3xl"
          }`}
        >
          {bigAir ? "¡Gran aéreo!" : "En el aire"}
        </p>
        <div className="mx-auto mt-3 h-1.5 w-32 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-amber-300 transition-all duration-75"
            style={{ width: `${hang * 100}%` }}
          />
        </div>
        {speed > 4 && (
          <p className="mt-2 font-mono text-xs text-amber-200/60">{speed.toFixed(1)} m/s</p>
        )}
      </div>
    </div>
  );
}