"use client";

import { useGameStore } from "@/stores/gameStore";

export function SpeedStreaks() {
  const speed = useGameStore((s) => s.speed);
  const riding = useGameStore((s) => s.riding);
  const inTube = useGameStore((s) => s.inTube);

  if (!riding || speed < 7) return null;

  const intensity = Math.min(1, (speed - 7) / 10);
  const tubeDim = inTube ? 0.55 : 1;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ opacity: intensity * tubeDim * 0.7 }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 90% 55% at 50% 50%, transparent 42%, rgba(255,255,255,${0.06 + intensity * 0.1}) 100%)`,
        }}
      />
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 h-px origin-left bg-gradient-to-r from-transparent via-white/50 to-transparent"
          style={{
            width: `${28 + intensity * 42}%`,
            transform: `rotate(${i * 45}deg) translateX(${12 + intensity * 18}%)`,
            opacity: 0.15 + intensity * 0.35,
          }}
        />
      ))}
    </div>
  );
}