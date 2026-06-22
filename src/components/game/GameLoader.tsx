"use client";

import dynamic from "next/dynamic";

const Game = dynamic(() => import("@/components/game/Game").then((m) => m.Game), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh w-full items-center justify-center bg-sky-300 text-slate-900">
      Loading surf...
    </div>
  ),
});

export function GameLoader() {
  return <Game />;
}