import { create } from "zustand";
import type { TrickEvent } from "@/lib/tricks/types";
import type { WipeoutReason } from "@/lib/tricks/types";

export type TrickPopup = TrickEvent & { id_key: string };

type GameStore = {
  speed: number;
  score: number;
  combo: number;
  multiplier: number;
  riding: boolean;
  inTube: boolean;
  tubeDepth: number;
  wipedOut: boolean;
  wipeoutReason: WipeoutReason | null;
  cameraShake: number;
  trickPopups: TrickPopup[];
  setSpeed: (speed: number) => void;
  setRiding: (riding: boolean) => void;
  setTubeState: (inTube: boolean, tubeDepth: number) => void;
  addTubeScore: (points: number) => void;
  addRideScore: (points: number) => void;
  registerTrick: (trick: TrickEvent) => void;
  triggerWipeout: (reason: WipeoutReason) => void;
  clearWipeout: () => void;
  addCameraShake: (amount: number) => void;
  tickCameraShake: (dt: number) => void;
  prunePopups: (now: number) => void;
  resetCombo: () => void;
};

let popupCounter = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  speed: 0,
  score: 0,
  combo: 0,
  multiplier: 1,
  riding: false,
  inTube: false,
  tubeDepth: 0,
  wipedOut: false,
  wipeoutReason: null,
  cameraShake: 0,
  trickPopups: [],

  setSpeed: (speed) => set({ speed }),
  setRiding: (riding) => set({ riding }),
  setTubeState: (inTube, tubeDepth) => set({ inTube, tubeDepth }),
  addTubeScore: (points) => {
    if (get().wipedOut || points <= 0) return;
    set((s) => ({
      score: s.score + Math.floor(points * s.multiplier * 1.5),
    }));
  },

  addRideScore: (points) => {
    if (get().wipedOut || points <= 0) return;
    set((s) => ({
      score: s.score + Math.floor(points * s.multiplier),
    }));
  },

  registerTrick: (trick) =>
    set((s) => {
      const combo = Math.min(s.combo + 1, 99);
      const multiplier = 1 + combo * 0.18;
      const tierShake =
        trick.id === "aerial" || trick.id === "tube_ride"
          ? 0.28
          : trick.id === "cutback" || trick.id === "floater"
            ? 0.2
            : 0.12;
      return {
        combo,
        multiplier,
        score: s.score + Math.floor(trick.points * multiplier),
        trickPopups: [
          ...s.trickPopups.slice(-4),
          { ...trick, id_key: `trick-${popupCounter++}` },
        ],
        cameraShake: Math.min(1, s.cameraShake + tierShake),
      };
    }),

  triggerWipeout: (reason) =>
    set({
      wipedOut: true,
      wipeoutReason: reason,
      combo: 0,
      multiplier: 1,
      cameraShake: 1,
    }),

  clearWipeout: () => set({ wipedOut: false, wipeoutReason: null }),

  addCameraShake: (amount) =>
    set((s) => ({ cameraShake: Math.min(1, s.cameraShake + amount) })),

  tickCameraShake: (dt) =>
    set((s) => ({ cameraShake: Math.max(0, s.cameraShake - dt * 2.5) })),

  prunePopups: (now) =>
    set((s) => ({
      trickPopups: s.trickPopups.filter((p) => now - p.timestamp < 2.2),
    })),

  resetCombo: () => set({ combo: 0, multiplier: 1 }),
}));