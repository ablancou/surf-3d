"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/stores/gameStore";

const MILESTONES = [500, 1000, 2000, 3500, 5000, 8000, 12000];

export function MilestoneBanner() {
  const score = useGameStore((s) => s.score);
  const wipedOut = useGameStore((s) => s.wipedOut);
  const [banner, setBanner] = useState<string | null>(null);
  const hitRef = useRef(0);

  useEffect(() => {
    if (wipedOut) {
      hitRef.current = 0;
      setBanner(null);
      return;
    }

    const milestone = MILESTONES.find((m) => score >= m && m > hitRef.current);
    if (!milestone) return;

    hitRef.current = milestone;
    setBanner(`¡${milestone.toLocaleString("es-ES")} pts!`);
    const t = setTimeout(() => setBanner(null), 1400);
    return () => clearTimeout(t);
  }, [score, wipedOut]);

  if (!banner) return null;

  return (
    <div className="pointer-events-none absolute top-1/4 left-1/2 z-20 -translate-x-1/2">
      <div className="rounded-2xl border border-cyan-300/35 bg-cyan-400/12 px-5 py-2 backdrop-blur-md">
        <p className="text-xl font-black tracking-wide text-cyan-100 md:text-2xl">{banner}</p>
      </div>
    </div>
  );
}