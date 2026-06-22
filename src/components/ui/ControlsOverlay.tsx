"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PerfTier } from "@/lib/performance/tiers";
import { useSettingsStore } from "@/stores/settingsStore";

export function ControlsOverlay() {
  const [open, setOpen] = useState(false);
  const oceanMode = useSettingsStore((s) => s.oceanMode);
  const rendererKind = useSettingsStore((s) => s.rendererKind);
  const setOceanMode = useSettingsStore((s) => s.setOceanMode);
  const perfTier = useSettingsStore((s) => s.perfTier);
  const setPerfTier = useSettingsStore((s) => s.setPerfTier);

  return (
    <div className="pointer-events-auto absolute right-4 bottom-16 md:bottom-6">
      <Button
        variant="secondary"
        size="sm"
        className="bg-black/40 text-white backdrop-blur hover:bg-black/55"
        onClick={() => setOpen((v) => !v)}
      >
        Controls
      </Button>
      {open && (
        <div className="mt-2 w-72 rounded-xl border border-white/20 bg-black/55 p-4 text-sm text-white/90 backdrop-blur-md">
          <p className="mb-2 font-semibold text-white">Keyboard + Mouse</p>
          <ul className="mb-3 space-y-1 text-white/80">
            <li>WASD / Arrows — lean & carve</li>
            <li>Space — pop up</li>
            <li>Click + drag — lean direction</li>
          </ul>
          <p className="mb-2 font-semibold text-white">Touch</p>
          <ul className="mb-3 space-y-1 text-white/80">
            <li>Drag — lean & carve</li>
            <li>Release — pop up</li>
          </ul>
          <p className="mb-2 font-semibold text-white">Xbox Controller</p>
          <ul className="mb-3 space-y-1 text-white/80">
            <li>Left stick — lean</li>
            <li>RT or A — pop up</li>
          </ul>
          <p className="mb-2 font-semibold text-white">Graphics</p>
          <p className="mb-2 text-xs text-white/60">
            Renderer: {rendererKind.toUpperCase()}
          </p>
          <div className="mb-2 flex gap-2">
            <Button
              size="sm"
              variant={oceanMode === "ifft" ? "default" : "secondary"}
              className="flex-1 text-xs"
              onClick={() => setOceanMode("ifft")}
            >
              IFFT
            </Button>
            <Button
              size="sm"
              variant={oceanMode === "gerstner" ? "default" : "secondary"}
              className="flex-1 text-xs"
              onClick={() => setOceanMode("gerstner")}
            >
              Gerstner
            </Button>
          </div>
          <p className="mb-1 text-xs text-white/60">Performance</p>
          <div className="flex gap-1">
            {(["high", "medium", "low"] as PerfTier[]).map((tier) => (
              <Button
                key={tier}
                size="sm"
                variant={perfTier === tier ? "default" : "secondary"}
                className="flex-1 text-xs capitalize"
                onClick={() => setPerfTier(tier)}
              >
                {tier}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}