"use client";

import { useGameStore } from "@/stores/gameStore";

export function TrickPopups() {
  const popups = useGameStore((s) => s.trickPopups);
  const multiplier = useGameStore((s) => s.multiplier);

  if (popups.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        {popups.slice(-3).map((popup, i) => (
          <div
            key={popup.id_key}
            className="text-center transition-opacity duration-300"
            style={{ opacity: 1 - i * 0.25, transform: `translateY(${-i * 12}px)` }}
          >
            <p className="text-3xl font-black tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] md:text-5xl">
              {popup.label}
            </p>
            <p className="font-mono text-lg font-semibold text-amber-300 md:text-xl">
              +{Math.floor(popup.points * multiplier)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}