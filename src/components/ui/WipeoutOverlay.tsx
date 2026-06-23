"use client";

import { useGameStore } from "@/stores/gameStore";

const REASON_LABELS = {
  nose_dive: "¡Nariz bajo!",
  rail_bury: "¡Rail enterrado!",
  bail: "¡Wipeout!",
} as const;

export function WipeoutOverlay() {
  const wipedOut = useGameStore((s) => s.wipedOut);
  const reason = useGameStore((s) => s.wipeoutReason);

  if (!wipedOut || !reason) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-red-950/30 backdrop-blur-[2px]">
      <div className="text-center">
        <p className="text-5xl font-black text-red-200 drop-shadow-lg md:text-7xl">
          {REASON_LABELS[reason]}
        </p>
        <p className="mt-3 text-lg text-white/80">Combo reseteado — reentrando...</p>
      </div>
    </div>
  );
}