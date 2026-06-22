import { create } from "zustand";

export type TutorialStepId =
  | "welcome"
  | "carve"
  | "pop"
  | "speed"
  | "tube"
  | "done";

export const TUTORIAL_STEPS: { id: TutorialStepId; title: string; body: string }[] = [
  {
    id: "welcome",
    title: "Welcome to Surf 3D",
    body: "Ride procedurally simulated waves. Use any input device — keyboard, touch, or Xbox controller.",
  },
  {
    id: "carve",
    title: "Carve the Wave",
    body: "Press A/D or drag to lean into turns. Build speed by riding down the wave face.",
  },
  {
    id: "pop",
    title: "Pop Up",
    body: "Press Space, RT, or release a touch drag to pop off the lip for aerials and floaters.",
  },
  {
    id: "speed",
    title: "Pump for Speed",
    body: "Carve up and down the face to pump — speed unlocks bigger tricks and higher scores.",
  },
  {
    id: "tube",
    title: "Find the Barrel",
    body: "Stay deep on a steep section for ~1 second to score a Tube Ride. Watch for the barrel overlay.",
  },
  {
    id: "done",
    title: "You're Ready!",
    body: "Chain tricks for combo multipliers. Wipeouts reset your combo — bail smart!",
  },
];

type TutorialStore = {
  active: boolean;
  stepIndex: number;
  completed: boolean;
  start: () => void;
  skip: () => void;
  advance: () => void;
  goToStep: (index: number) => void;
  markAction: (action: string) => void;
};

export const useTutorialStore = create<TutorialStore>((set, get) => ({
  active: true,
  stepIndex: 0,
  completed: false,

  start: () => set({ active: true, stepIndex: 0, completed: false }),

  skip: () => {
    localStorage.setItem("surf3d-tutorial-done", "1");
    set({ active: false, completed: true });
  },

  advance: () => {
    const next = get().stepIndex + 1;
    if (next >= TUTORIAL_STEPS.length) {
      localStorage.setItem("surf3d-tutorial-done", "1");
      set({ active: false, completed: true, stepIndex: TUTORIAL_STEPS.length - 1 });
    } else {
      set({ stepIndex: next });
    }
  },

  goToStep: (index) => set({ stepIndex: Math.max(0, Math.min(index, TUTORIAL_STEPS.length - 1)) }),

  markAction: (action) => {
    const { active, stepIndex } = get();
    if (!active) return;
    const step = TUTORIAL_STEPS[stepIndex];
    if (step.id === "carve" && action === "carve") get().advance();
    if (step.id === "pop" && action === "pop") get().advance();
    if (step.id === "speed" && action === "fast") get().advance();
    if (step.id === "tube" && action === "tube") get().advance();
  },
}));