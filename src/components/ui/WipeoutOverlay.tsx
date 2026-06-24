"use client";

import { useGameStore } from "@/stores/gameStore";

const REASON_LABELS = {
  nose_dive: "¡Ups — nariz bajo!",
  rail_bury: "¡Ups — poco equilibrio!",
  bail: "¡Splash!",
} as const;

export function WipeoutOverlay() {
  const wipedOut = useGameStore((s) => s.wipedOut);
  const reason = useGameStore((s) => s.wipeoutReason);
  const combo = useGameStore((s) => s.combo);

  if (!wipedOut || !reason) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-sky-950/25 backdrop-blur-[1px]">
      <div className="text-center">
        <p className="text-4xl font-black text-white drop-shadow-lg md:text-6xl">
          {REASON_LABELS[reason]}
        </p>
        <p className="mt-3 text-base text-white/75">
          {combo > 0
            ? `Combo x${combo} guardado — volviendo al lineup...`
            : "Volviendo al lineup — ¡sigue surfeando!"}
        </p>
      </div>
    </div>
  );
}