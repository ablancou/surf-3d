"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";

function RapierGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void import("@dimforge/rapier3d-compat")
      .then((rapier) => rapier.init())
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-sky-300 text-slate-900">
        Loading surf...
      </div>
    );
  }

  return children;
}

const Game = dynamic(
  () =>
    import("@/components/game/Game")
      .then((m) => m.Game)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to load game";
        return function GameLoadError() {
          return (
            <div className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-sky-300 px-6 text-center text-slate-900">
              <p className="text-lg font-semibold">Could not start Surf 3D</p>
              <p className="max-w-md text-sm text-slate-700">{message}</p>
              <button
                type="button"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                onClick={() => window.location.reload()}
              >
                Reload
              </button>
            </div>
          );
        };
      }),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh w-full items-center justify-center bg-sky-300 text-slate-900">
        Loading surf...
      </div>
    ),
  },
);

type ErrorBoundaryState = { error: Error | null };

class GameErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-sky-300 px-6 text-center text-slate-900">
          <p className="text-lg font-semibold">Surf 3D crashed</p>
          <p className="max-w-md text-sm text-slate-700">{this.state.error.message}</p>
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function GameLoader() {
  return (
    <GameErrorBoundary>
      <RapierGate>
        <Game />
      </RapierGate>
    </GameErrorBoundary>
  );
}