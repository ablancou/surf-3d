import { create } from "zustand";
import { clipToPayload, payloadToClip } from "@/lib/replay/encode";
import type { ReplayClip } from "@/lib/replay/types";
import type { ReplayPayload } from "@/lib/leaderboard/types";

const STORAGE_KEY = "surf3d-best-replay";

type ReplayStore = {
  personalBest: ReplayClip | null;
  globalGhost: ReplayClip | null;
  showPersonalGhost: boolean;
  showGlobalGhost: boolean;
  ghostTime: number;
  ghostPlaying: boolean;
  savePersonalBest: (clip: ReplayClip) => void;
  loadPersonalBest: () => void;
  setGlobalGhost: (payload: ReplayPayload | null, name: string, score: number, id: string) => void;
  togglePersonalGhost: () => void;
  toggleGlobalGhost: () => void;
  setGhostTime: (t: number) => void;
  setGhostPlaying: (playing: boolean) => void;
};

export const useReplayStore = create<ReplayStore>((set, get) => ({
  personalBest: null,
  globalGhost: null,
  showPersonalGhost: false,
  showGlobalGhost: false,
  ghostTime: 0,
  ghostPlaying: true,

  savePersonalBest: (clip) => {
    try {
      const payload = clipToPayload(clip);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ clip, payload }));
    } catch {
      // quota
    }
    set({ personalBest: clip, showPersonalGhost: true });
  },

  loadPersonalBest: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { clip: ReplayClip };
      set({ personalBest: data.clip });
    } catch {
      // ignore
    }
  },

  setGlobalGhost: (payload, name, score, id) => {
    if (!payload || payload.frames.length < 8) {
      set({ globalGhost: null });
      return;
    }
    set({ globalGhost: payloadToClip(payload, { id, name, score }) });
  },

  togglePersonalGhost: () => set((s) => ({ showPersonalGhost: !s.showPersonalGhost })),
  toggleGlobalGhost: () => set((s) => ({ showGlobalGhost: !s.showGlobalGhost })),
  setGhostTime: (ghostTime) => set({ ghostTime }),
  setGhostPlaying: (ghostPlaying) => set({ ghostPlaying }),
}));