"use client";

import { useGameStore } from "@/stores/gameStore";

export function PopMeter() {
  const popReady = useGameStore((s) => s.popReady);
  const riding = useGameStore((s) => s.riding);

  if (!riding) return null;

  const pct = Math.round(popReady * 100);
  const ready = popReady >= 0.98;

  return (
    <div className="pointer-events-none absolute bottom-28 left-1/2 hidden -translate-x-1/2 md:block">
      <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 backdrop-blur-sm">
        <div className="relative h-7 w-7">
          <svg viewBox="0 0 36 36" className="h-7 w-7 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke={ready ? "#fcd34d" : "#93c5fd"}
              strokeWidth="3"
              strokeDasharray={`${pct} 100`}
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className={`text-xs font-medium ${ready ? "text-amber-200" : "text-white/55"}`}>
          {ready ? "POP listo — Espacio" : "POP cargando..."}
        </span>
      </div>
    </div>
  );
}