"use client";

import { useEffect, useRef } from "react";
import { TRICK_COLORS, TRICK_TIER, type TrickId } from "@/lib/tricks/types";
import { useGameStore } from "@/stores/gameStore";

const TIER_SCALE: Record<string, string> = {
  basic: "text-3xl md:text-4xl",
  mid: "text-4xl md:text-5xl",
  big: "text-4xl md:text-6xl",
  epic: "text-5xl md:text-7xl",
};

export function TrickPopups() {
  const popups = useGameStore((s) => s.trickPopups);
  const multiplier = useGameStore((s) => s.multiplier);
  const combo = useGameStore((s) => s.combo);
  const lastId = useRef<string | null>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const latest = popups[popups.length - 1];

  useEffect(() => {
    if (!latest || latest.id_key === lastId.current) return;
    lastId.current = latest.id_key;

    const el = flashRef.current;
    if (!el) return;
    el.style.opacity = "1";
    const t = setTimeout(() => {
      el.style.opacity = "0";
    }, 180);
    return () => clearTimeout(t);
  }, [latest]);

  if (popups.length === 0) return null;

  return (
    <>
      <div
        ref={flashRef}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150"
        style={{
          background: latest
            ? `radial-gradient(circle at center, ${TRICK_COLORS[latest.id as TrickId]}22 0%, transparent 65%)`
            : undefined,
        }}
      />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          {popups.slice(-3).map((popup, i) => {
            const isLatest = i === popups.slice(-3).length - 1;
            const color = TRICK_COLORS[popup.id as TrickId] ?? "#fff";
            const tier = TRICK_TIER[popup.id as TrickId] ?? "basic";
            const points = Math.floor(popup.points * multiplier);

            return (
              <div
                key={popup.id_key}
                className="text-center"
                style={{
                  opacity: 1 - i * 0.28,
                  transform: `translateY(${-i * 14}px) scale(${isLatest ? 1 : 0.92})`,
                  transition: "transform 0.2s ease-out, opacity 0.3s",
                }}
              >
                {isLatest && combo > 1 && (
                  <p
                    className="mb-1 text-xs font-bold tracking-[0.2em] uppercase md:text-sm"
                    style={{ color }}
                  >
                    Combo x{combo}
                  </p>
                )}
                <p
                  className={`font-black tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] ${TIER_SCALE[tier]}`}
                  style={{
                    color,
                    textShadow: isLatest ? `0 0 24px ${color}88` : undefined,
                  }}
                >
                  {popup.label}
                </p>
                <p
                  className="font-mono text-lg font-semibold md:text-xl"
                  style={{ color: tier === "epic" ? "#fcd34d" : "#fbbf24" }}
                >
                  +{points}
                  {multiplier > 1 && (
                    <span className="ml-1 text-sm text-white/50">×{multiplier.toFixed(1)}</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}