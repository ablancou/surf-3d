import { create } from "zustand";
import type { LeaderboardEntry } from "@/lib/leaderboard/types";
import { useReplayStore } from "@/stores/replayStore";

type LeaderboardStore = {
  entries: LeaderboardEntry[];
  loading: boolean;
  lastRank: number | null;
  personalBest: number;
  trickCount: number;
  maxCombo: number;
  maxSpeed: number;
  fetchLeaderboard: () => Promise<void>;
  submitScore: (name: string, score: number, spot: string, replay?: import("@/lib/leaderboard/types").ReplayPayload) => Promise<void>;
  trackSession: (stats: { trickCount?: number; maxCombo?: number; maxSpeed?: number }) => void;
  resetSession: () => void;
  loadPersonalBest: () => void;
};

const PB_KEY = "surf3d-personal-best";

export const useLeaderboardStore = create<LeaderboardStore>((set, get) => ({
  entries: [],
  loading: false,
  lastRank: null,
  personalBest: 0,
  trickCount: 0,
  maxCombo: 0,
  maxSpeed: 0,

  loadPersonalBest: () => {
    try {
      const v = localStorage.getItem(PB_KEY);
      if (v) set({ personalBest: Number(v) });
    } catch {
      // ignore
    }
    useReplayStore.getState().loadPersonalBest();
  },

  fetchLeaderboard: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/leaderboard");
      const data = (await res.json()) as { entries: LeaderboardEntry[] };
      set({ entries: data.entries ?? [], loading: false });

      const top = data.entries?.[0];
      if (top?.replay) {
        useReplayStore.getState().setGlobalGhost(top.replay, top.name, top.score, top.id);
      }
    } catch {
      set({ loading: false });
    }
  },

  submitScore: async (name, score, spot, replay) => {
    const { maxCombo, maxSpeed, trickCount } = get();
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, score, spot, maxCombo, maxSpeed, tricks: trickCount, replay }),
      });
      const data = (await res.json()) as { rank?: number };
      set({ lastRank: data.rank ?? null });
      if (score > get().personalBest) {
        localStorage.setItem(PB_KEY, String(score));
        set({ personalBest: score });
      }
      await get().fetchLeaderboard();
    } catch {
      // offline
    }
  },

  trackSession: (stats) =>
    set((s) => ({
      trickCount: stats.trickCount ?? s.trickCount,
      maxCombo: Math.max(s.maxCombo, stats.maxCombo ?? 0),
      maxSpeed: Math.max(s.maxSpeed, stats.maxSpeed ?? 0),
    })),

  resetSession: () => set({ trickCount: 0, maxCombo: 0, maxSpeed: 0, lastRank: null }),
}));