"use client";

import type { OceanMode } from "@/lib/waves/oceanSampler";
import type { RendererKind } from "@/lib/gpu/webgpu";
import type { PerfTier } from "@/lib/performance/tiers";
import { COMBO_WINDOW_SEC, useGameStore } from "@/stores/gameStore";
import { useSpotStore } from "@/stores/spotStore";
import { gameClock } from "@/lib/game/clock";
import { useEffect, useState } from "react";

type GameHUDProps = {
  rendererKind?: RendererKind;
  oceanMode?: OceanMode;
  perfTier?: PerfTier;
};

export function GameHUD({ rendererKind, oceanMode, perfTier }: GameHUDProps) {
  const spotName = useSpotStore((s) => s.spot.name);
  const speed = useGameStore((s) => s.speed);
  const score = useGameStore((s) => s.score);
  const combo = useGameStore((s) => s.combo);
  const multiplier = useGameStore((s) => s.multiplier);
  const comboExpiresAt = useGameStore((s) => s.comboExpiresAt);
  const riding = useGameStore((s) => s.riding);
  const inTube = useGameStore((s) => s.inTube);
  const [comboFill, setComboFill] = useState(0);

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

  const statusLabel = inTube ? "Tubo" : riding ? "Surfeando" : "Aéreo";

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`rounded-xl border border-white/20 bg-black/35 px-4 py-3 backdrop-blur-md transition-shadow duration-300 ${
            combo >= 3 ? "shadow-[0_0_20px_rgba(251,191,36,0.25)]" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Puntos</p>
          <p className="font-mono text-3xl font-semibold text-white tabular-nums">{score}</p>
          {combo > 0 && (
            <>
              <p className="mt-1 text-sm font-medium text-amber-300">
                Combo x{combo} · {multiplier.toFixed(1)}×
              </p>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-amber-300 transition-[width] duration-75"
                  style={{ width: `${comboFill * 100}%` }}
                />
              </div>
            </>
          )}
        </div>
        <div className="rounded-xl border border-white/20 bg-black/35 px-4 py-3 text-right backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Velocidad</p>
          <p className="font-mono text-2xl font-semibold text-white tabular-nums">
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