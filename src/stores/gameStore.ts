import { create } from "zustand";
import type { TrickEvent } from "@/lib/tricks/types";
import type { WipeoutReason } from "@/lib/tricks/types";
import {
  COMBO_WINDOW_SEC,
  comboMultiplier,
  keptComboAfterWipeout,
  trickScore,
} from "@/lib/scoring/combo";

export type TrickPopup = TrickEvent & { id_key: string };

export { COMBO_WINDOW_SEC };

type GameStore = {
  speed: number;
  score: number;
  combo: number;
  multiplier: number;
  comboExpiresAt: number;
  airTime: number;
  riding: boolean;
  inTube: boolean;
  tubeDepth: number;
  wipedOut: boolean;
  wipeoutReason: WipeoutReason | null;
  cameraShake: number;
  popReady: number;
  dropBannerUntil: number;
  trickPopups: TrickPopup[];
  setSpeed: (speed: number) => void;
  setPopReady: (ready: number) => void;
  setAirTime: (airTime: number) => void;
  setRiding: (riding: boolean) => void;
  resetRide: () => void;
  setTubeState: (inTube: boolean, tubeDepth: number) => void;
  addTubeScore: (points: number) => void;
  addRideScore: (points: number) => void;
  registerTrick: (trick: TrickEvent, now: number) => void;
  triggerWipeout: (reason: WipeoutReason) => void;
  clearWipeout: () => void;
  triggerDropBanner: (now: number) => void;
  addCameraShake: (amount: number) => void;
  tickCameraShake: (dt: number) => void;
  tickComboDecay: (now: number) => void;
  prunePopups: (now: number) => void;
  resetCombo: () => void;
};

let popupCounter = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  speed: 0,
  score: 0,
  combo: 0,
  multiplier: 1,
  comboExpiresAt: 0,
  airTime: 0,
  riding: false,
  inTube: false,
  tubeDepth: 0,
  wipedOut: false,
  wipeoutReason: null,
  cameraShake: 0,
  popReady: 1,
  dropBannerUntil: 0,
  trickPopups: [],

  setSpeed: (speed) => set({ speed }),
  setPopReady: (popReady) => set({ popReady }),
  setAirTime: (airTime) => set({ airTime }),
  setRiding: (riding) => set({ riding }),
  resetRide: () =>
    set({
      speed: 0,
      score: 0,
      combo: 0,
      multiplier: 1,
      comboExpiresAt: 0,
      airTime: 0,
      riding: false,
      inTube: false,
      tubeDepth: 0,
      wipedOut: false,
      wipeoutReason: null,
      cameraShake: 0,
      popReady: 1,
      dropBannerUntil: 0,
      trickPopups: [],
    }),
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

  registerTrick: (trick, now) =>
    set((s) => {
      const combo = Math.min(s.combo + 1, 99);
      const multiplier = comboMultiplier(combo);
      const tierShake =
        trick.id === "aerial" || trick.id === "tube_ride"
          ? 0.28
          : trick.id === "cutback" || trick.id === "snap" || trick.id === "floater"
            ? 0.2
            : 0.12;
      return {
        combo,
        multiplier,
        comboExpiresAt: now + COMBO_WINDOW_SEC,
        score: s.score + trickScore(trick.points, combo),
        trickPopups: [
          ...s.trickPopups.slice(-4),
          { ...trick, id_key: `trick-${popupCounter++}` },
        ],
        cameraShake: Math.min(1, s.cameraShake + tierShake),
      };
    }),

  triggerWipeout: (reason) =>
    set((s) => {
      const keptCombo = keptComboAfterWipeout(s.combo);
      return {
        wipedOut: true,
        wipeoutReason: reason,
        combo: keptCombo,
        multiplier: comboMultiplier(keptCombo),
        comboExpiresAt: keptCombo > 0 ? s.comboExpiresAt : 0,
        cameraShake: 0.55,
      };
    }),

  clearWipeout: () => set({ wipedOut: false, wipeoutReason: null }),

  triggerDropBanner: (now) => set({ dropBannerUntil: now + 1.4 }),

  addCameraShake: (amount) =>
    set((s) => ({ cameraShake: Math.min(1, s.cameraShake + amount) })),

  tickCameraShake: (dt) =>
    set((s) => ({ cameraShake: Math.max(0, s.cameraShake - dt * 2.5) })),

  tickComboDecay: (now) => {
    const s = get();
    if (s.wipedOut || s.combo <= 0 || s.comboExpiresAt <= 0) return;
    if (now >= s.comboExpiresAt) {
      set({ combo: 0, multiplier: 1, comboExpiresAt: 0 });
    }
  },

  prunePopups: (now) =>
    set((s) => ({
      trickPopups: s.trickPopups.filter((p) => now - p.timestamp < 2.2),
    })),

  resetCombo: () => set({ combo: 0, multiplier: 1, comboExpiresAt: 0 }),
}));