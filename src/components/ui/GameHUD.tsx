"use client";

import type { OceanMode } from "@/lib/waves/oceanSampler";
import type { RendererKind } from "@/lib/gpu/webgpu";
import type { PerfTier } from "@/lib/performance/tiers";
import { COMBO_WINDOW_SEC, useGameStore } from "@/stores/gameStore";
import { useLeaderboardStore } from "@/stores/leaderboardStore";
import { useSpotStore } from "@/stores/spotStore";
import { getSpotPhysics } from "@/lib/spots/spotPhysics";
import { gameClock } from "@/lib/game/clock";
import { useEffect, useRef, useState } from "react";

type GameHUDProps = {
  rendererKind?: RendererKind;
  oceanMode?: OceanMode;
  perfTier?: PerfTier;
};

export function GameHUD({ rendererKind, oceanMode, perfTier }: GameHUDProps) {
  const spotName = useSpotStore((s) => s.spot.name);
  const spotPersonalBest = useLeaderboardStore((s) => s.spotPersonalBest);
  const speed = useGameStore((s) => s.speed);
  const maxSpeed = getSpotPhysics().maxSpeed;
  const score = useGameStore((s) => s.score);
  const combo = useGameStore((s) => s.combo);
  const multiplier = useGameStore((s) => s.multiplier);
  const comboExpiresAt = useGameStore((s) => s.comboExpiresAt);
  const riding = useGameStore((s) => s.riding);
  const inTube = useGameStore((s) => s.inTube);
  const [comboFill, setComboFill] = useState(0);
  const [scorePulse, setScorePulse] = useState(false);
  const prevScore = useRef(0);

  useEffect(() => {
    if (score > prevScore.current) {
      setScorePulse(true);
      const t = window.setTimeout(() => setScorePulse(false), 220);
      prevScore.current = score;
      return () => window.clearTimeout(t);
    }
    prevScore.current = score;
  }, [score]);

  useEffect(() => {
    if (combo <= 0 || comboExpiresAt <= 0) {
      setComboFill(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, comboExpiresAt - gameClock.time);
      setComboFill(remaining / COMBO_WINDOW_SEC);
    };
    tick();
    const id = window.setInterval(tick, 50);
    return () => window.clearInterval(id);
  }, [combo, comboExpiresAt]);

  const comboUrgent = combo > 0 && comboFill > 0 && comboFill < 0.22;
  const beatingPb = spotPersonalBest > 0 && score > spotPersonalBest;
  const nearMaxSpeed = speed > maxSpeed * 0.88;
  const statusLabel = inTube ? "Tubo" : riding ? "Surfeando" : "Aéreo";

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`rounded-xl border bg-black/35 px-4 py-3 backdrop-blur-md transition-all duration-200 ${
            comboUrgent
              ? "animate-pulse border-red-400/50 shadow-[0_0_18px_rgba(248,113,113,0.35)]"
              : combo >= 3
                ? "border-white/20 shadow-[0_0_20px_rgba(251,191,36,0.25)]"
                : "border-white/20"
          }`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Puntos</p>
            {spotPersonalBest > 0 && (
              <p className={`text-[10px] ${beatingPb ? "text-green-300" : "text-white/40"}`}>
                PB {spotPersonalBest}
              </p>
            )}
          </div>
          <p
            className={`font-mono text-3xl font-semibold text-white tabular-nums transition-transform duration-150 ${
              scorePulse ? "scale-110 text-amber-100" : ""
            }`}
          >
            {score}
          </p>
          {combo > 0 && (
            <>
              <p className={`mt-1 text-sm font-medium ${comboUrgent ? "text-red-300" : "text-amber-300"}`}>
                Combo x{combo} · {multiplier.toFixed(1)}×
                {comboUrgent && " — ¡rápido!"}
              </p>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className={`h-full rounded-full transition-[width] duration-75 ${
                    comboUrgent ? "bg-red-400" : "bg-amber-300"
                  }`}
                  style={{ width: `${comboFill * 100}%` }}
                />
              </div>
            </>
          )}
        </div>
        <div
          className={`rounded-xl border bg-black/35 px-4 py-3 text-right backdrop-blur-md transition-shadow ${
            nearMaxSpeed ? "border-orange-400/40 shadow-[0_0_16px_rgba(251,146,60,0.25)]" : "border-white/20"
          }`}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Velocidad</p>
          <p
            className={`font-mono text-2xl font-semibold tabular-nums ${
              nearMaxSpeed ? "text-orange-200" : "text-white"
            }`}
          >
            {speed.toFixed(1)}
          </p>
          <p className="mt-1 text-xs text-white/60">{statusLabel}</p>
        </div>
      </div>
      {rendererKind && oceanMode && (
        <p className="text-center text-[11px] text-white/35">
          {spotName} · {rendererKind.toUpperCase()} ·{" "}
          {oceanMode === "ifft" ? "IFFT" : "Gerstner"}
          {perfTier ? ` · ${perfTier}` : ""}
        </p>
      )}
    </div>
  );
}