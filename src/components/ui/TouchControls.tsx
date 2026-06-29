"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isCoarsePointer } from "@/lib/input/deviceProfile";
import type { InputManager } from "@/lib/input/InputManager";
import { DEADZONE, PAD_MAX, processPadLean } from "@/lib/input/touchPad";
import { useGameStore } from "@/stores/gameStore";

type TouchControlsProps = {
  inputManager: InputManager;
};

const PAD_SIZE = 148;

export function TouchControls({ inputManager }: TouchControlsProps) {
  const [visible, setVisible] = useState(false);
  const padRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const t = setTimeout(() => setVisible(isCoarsePointer()), 0);
    return () => clearTimeout(t);
  }, []);

  const setKnob = useCallback((x: number, y: number) => {
    knobRef.current = { x, y };
    setKnobPos({ x, y });
  }, []);

  const applyLean = useCallback(
    (dx: number, dy: number) => {
      const { x, z } = processPadLean(dx, dy);
      inputManager.setVirtualLean(x, z);

      const len = Math.sqrt(dx * dx + dy * dy);
      const visual = len < DEADZONE ? { x: 0, y: -22 } : { x: dx, y: dy };
      const vLen = Math.sqrt(visual.x * visual.x + visual.y * visual.y);
      const clamped = Math.min(vLen, PAD_MAX);
      if (vLen > 0.001) {
        setKnob(
          (visual.x / vLen) * clamped,
          (visual.y / vLen) * clamped,
        );
      } else {
        setKnob(0, -22);
      }
    },
    [inputManager, setKnob],
  );

  const releasePad = useCallback(() => {
    activeRef.current = false;
    touchIdRef.current = null;
    inputManager.clearVirtualLean();
    setKnob(0, 0);
  }, [inputManager, setKnob]);

  const onPadStart = useCallback(
    (clientX: number, clientY: number, id?: number) => {
      const pad = padRef.current;
      if (!pad) return;
      const rect = pad.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      activeRef.current = true;
      touchIdRef.current = id ?? null;
      applyLean(clientX - cx, clientY - cy);
    },
    [applyLean],
  );

  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 md:hidden">
      <div
        ref={padRef}
        className="pointer-events-auto absolute left-3 touch-none select-none"
        style={{
          width: PAD_SIZE,
          height: PAD_SIZE,
          bottom: "max(1.25rem, env(safe-area-inset-bottom))",
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          const t = e.changedTouches[0];
          if (t) onPadStart(t.clientX, t.clientY, t.identifier);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          if (!activeRef.current) return;
          const t = Array.from(e.touches).find((touch) => touch.identifier === touchIdRef.current);
          if (!t) return;
          const rect = padRef.current!.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          applyLean(t.clientX - cx, t.clientY - cy);
        }}
        onTouchEnd={(e) => {
          const ended = Array.from(e.changedTouches).some((t) => t.identifier === touchIdRef.current);
          if (ended) releasePad();
        }}
        onTouchCancel={releasePad}
      >
        <div className="relative h-full w-full rounded-full border border-white/25 bg-black/35 shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-sm">
          <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[11px] font-medium text-white/55">
            ↑ Rema
          </span>
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-white/35">
            ← Carve →
          </span>
          <div
            className="absolute top-1/2 left-1/2 h-14 w-14 rounded-full border border-white/35 bg-white/25 shadow-inner transition-transform duration-75"
            style={{
              transform: `translate(calc(-50% + ${knobPos.x}px), calc(-50% + ${knobPos.y}px))`,
            }}
          />
        </div>
      </div>

      <button
        type="button"
        aria-label="Pop aéreo"
        className={`pointer-events-auto absolute right-3 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border text-sm font-bold tracking-wider backdrop-blur-sm active:scale-95 ${
          popReady >= 0.98
            ? "border-amber-300/55 bg-amber-400/20 text-amber-50 shadow-[0_0_18px_rgba(251,191,36,0.4)]"
            : "border-white/25 bg-black/40 text-white/75"
        }`}
        style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        onTouchStart={(e) => e.preventDefault()}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (popReady >= 0.98) inputManager.requestPop();
        }}
        onClick={() => {
          if (popReady >= 0.98) inputManager.requestPop();
        }}
      >
        <span
          className="absolute inset-0 rounded-full border-2 border-amber-300/60"
          style={{
            clipPath: `inset(${100 - Math.round(popReady * 100)}% 0 0 0)`,
            opacity: popReady >= 0.98 ? 0 : 0.7,
          }}
        />
        POP
      </button>
    </div>
  );
}