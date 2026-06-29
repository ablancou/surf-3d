"use client";

import { useEffect, useState } from "react";
import { gameClock } from "@/lib/game/clock";
import { useGameStore } from "@/stores/gameStore";

export function DropBanner() {
  const dropBannerUntil = useGameStore((s) => s.dropBannerUntil);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (dropBannerUntil <= 0) {
      const t = setTimeout(() => setVisible(false), 0);
      return () => clearTimeout(t);
    }
    const tVisible = setTimeout(() => setVisible(true), 0);
    const tick = () => setVisible(gameClock.time < dropBannerUntil);
    tick();
    const id = window.setInterval(tick, 50);
    return () => {
      clearTimeout(tVisible);
      window.clearInterval(id);
    };
  }, [dropBannerUntil]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute top-2/5 left-1/2 z-20 -translate-x-1/2 animate-pulse">
      <p className="text-3xl font-black tracking-[0.3em] text-white uppercase drop-shadow-lg md:text-5xl">
        ¡Drop!
      </p>
    </div>
  );
}