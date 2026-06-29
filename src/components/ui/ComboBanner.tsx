"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/stores/gameStore";

const MILESTONES = [3, 5, 8, 12, 20];

export function ComboBanner() {
  const combo = useGameStore((s) => s.combo);
  const multiplier = useGameStore((s) => s.multiplier);
  const wipedOut = useGameStore((s) => s.wipedOut);
  const [banner, setBanner] = useState<string | null>(null);
  const hitRef = useRef(0);

  useEffect(() => {
    if (wipedOut) {
      const t0 = setTimeout(() => setBanner(null), 0);
      hitRef.current = 0;
      return () => clearTimeout(t0);
      return;
    }

    const milestone = MILESTONES.find((m) => combo === m && m > hitRef.current);
    if (!milestone) return;

    hitRef.current = milestone;
    setBanner(`¡Combo x${milestone}!`);
    const t = setTimeout(() => setBanner(null), 1600);
    return () => clearTimeout(t);
  }, [combo, wipedOut]);

  if (!banner) return null;

  return (
    <div className="pointer-events-none absolute top-1/3 left-1/2 z-20 -translate-x-1/2 animate-pulse">
      <div className="rounded-2xl border border-amber-300/40 bg-amber-400/15 px-6 py-3 text-center backdrop-blur-md">
        <p className="text-2xl font-black tracking-wide text-amber-200 md:text-3xl">{banner}</p>
        <p className="mt-0.5 text-sm text-amber-100/70">Multiplicador {multiplier.toFixed(1)}×</p>
      </div>
    </div>
  );
}