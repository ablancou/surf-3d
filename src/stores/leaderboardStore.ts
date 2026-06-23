import { create } from "zustand";
import type { SpotId } from "@/lib/spots/spotConfig";
import type { LeaderboardEntry } from "@/lib/leaderboard/types";
import { useReplayStore } from "@/stores/replayStore";
import { useSpotStore } from "@/stores/spotStore";

type LeaderboardStore = {
  entries: LeaderboardEntry[];
  loading: boolean;
  lastRank: number | null;
  personalBest: number;
  spotPersonalBest: number;
  trickCount: number;
  maxCombo: number;
  maxSpeed: number;
  fetchLeaderboard: () => Promise<void>;
  submitScore: (name: string, score: number, spot: string, replay?: import("@/lib/leaderboard/types").ReplayPayload) => Promise<void>;
  trackSession: (stats: { trickCount?: number; maxCombo?: number; maxSpeed?: number }) => void;
  resetSession: () => void;
  loadPersonalBest: () => void;
  loadSpotPersonalBest: (spotId: SpotId) => void;
};

const PB_KEY = "surf3d-personal-best";
const PB_BY_SPOT_KEY = "surf3d-pb-by-spot";

function readSpotBests(): Partial<Record<SpotId, number>> {
  try {
    const raw = localStorage.getItem(PB_BY_SPOT_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<SpotId, number>>) : {};
  } catch {
    return {};
  }
}

function writeSpotBest(spotId: SpotId, score: number) {
  const bests = readSpotBests();
  if ((bests[spotId] ?? 0) >= score) return;
  bests[spotId] = score;
  localStorage.setItem(PB_BY_SPOT_KEY, JSON.stringify(bests));
}

export const useLeaderboardStore = create<LeaderboardStore>((set, get) => ({
  entries: [],
  loading: false,
  lastRank: null,
  personalBest: 0,
  spotPersonalBest: 0,
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
    get().loadSpotPersonalBest(useSpotStore.getState().spotId);
    useReplayStore.getState().loadPersonalBest();
  },

  loadSpotPersonalBest: (spotId) => {
    const bests = readSpotBests();
    set({ spotPersonalBest: bests[spotId] ?? 0 });
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
      const spotId = useSpotStore.getState().spotId;
      if (score > get().spotPersonalBest) {
        writeSpotBest(spotId, score);
        set({ spotPersonalBest: score });
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