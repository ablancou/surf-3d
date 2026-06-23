"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isCoarsePointer } from "@/lib/input/deviceProfile";
import type { InputManager } from "@/lib/input/InputManager";

type TouchControlsProps = {
  inputManager: InputManager;
};

const PAD_SIZE = 128;
const PAD_MAX = 52;

export function TouchControls({ inputManager }: TouchControlsProps) {
  const [visible, setVisible] = useState(false);
  const padRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef({ x: 0, y: 0 });
  const activeRef = useRef(false);
  const touchIdRef = useRef<number | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    setVisible(isCoarsePointer());
  }, []);

  const setKnob = useCallback((x: number, y: number) => {
    knobRef.current = { x, y };
    tick((n) => n + 1);
  }, []);

  const applyLean = useCallback(
    (dx: number, dy: number) => {
      const len = Math.sqrt(dx * dx + dy * dy);
      const clamped = Math.min(len, PAD_MAX);
      const scale = clamped / PAD_MAX;
      const angle = Math.atan2(dy, dx);
      inputManager.setVirtualLean(
        Math.cos(angle) * scale,
        -Math.sin(angle) * scale,
      );
      setKnob(
        Math.cos(angle) * clamped,
        Math.sin(angle) * clamped,
      );
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
        className="pointer-events-auto absolute bottom-6 left-4 touch-none select-none"
        style={{ width: PAD_SIZE, height: PAD_SIZE }}
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
        <div className="relative h-full w-full rounded-full border border-white/20 bg-black/30 backdrop-blur-sm">
          <div
            className="absolute top-1/2 left-1/2 h-12 w-12 rounded-full border border-white/30 bg-white/20 shadow-inner"
            style={{
              transform: `translate(calc(-50% + ${knobRef.current.x}px), calc(-50% + ${knobRef.current.y}px))`,
            }}
          />
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] tracking-wide text-white/50">
            Carve
          </span>
        </div>
      </div>

      <button
        type="button"
        className="pointer-events-auto absolute right-4 bottom-8 flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-black/35 text-xs font-bold tracking-wider text-white/90 backdrop-blur-sm active:bg-white/20"
        onTouchStart={(e) => e.preventDefault()}
        onTouchEnd={(e) => {
          e.preventDefault();
          inputManager.requestPop();
        }}
        onClick={() => inputManager.requestPop()}
      >
        POP
      </button>
    </div>
  );
}