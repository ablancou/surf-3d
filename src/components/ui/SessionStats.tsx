"use client";

import { useGameStore } from "@/stores/gameStore";
import { useLeaderboardStore } from "@/stores/leaderboardStore";

export function SessionStats() {
  const score = useGameStore((s) => s.score);
  const trickCount = useLeaderboardStore((s) => s.trickCount);
  const maxCombo = useLeaderboardStore((s) => s.maxCombo);
  const maxSpeed = useLeaderboardStore((s) => s.maxSpeed);

  if (score < 30 && trickCount === 0) return null;

  return (
    <div className="pointer-events-none absolute bottom-28 left-4 rounded-lg border border-white/15 bg-black/30 px-3 py-2 backdrop-blur-sm md:bottom-6 md:left-auto md:right-36">
      <p className="mb-1 text-[10px] uppercase tracking-[0.15em] text-white/45">Sesión</p>
      <div className="flex gap-3 font-mono text-xs text-white/75">
        <span>{trickCount} tricks</span>
        <span>x{maxCombo} combo</span>
        <span>{maxSpeed.toFixed(1)} máx</span>
      </div>
    </div>
  );
}