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
    title: "Bienvenido a Surf 3D",
    body: "Surfea olas simuladas en tiempo real. Usa teclado, táctil o mando de Xbox.",
  },
  {
    id: "carve",
    title: "Carve en la ola",
    body: "Pulsa A/D o arrastra para inclinarte en los giros. Gana velocidad bajando la pared de la ola.",
  },
  {
    id: "pop",
    title: "Pop / salto",
    body: "Espacio, RT o suelta el arrastre táctil para saltar del lip y hacer aéreos.",
  },
  {
    id: "speed",
    title: "Pump para velocidad",
    body: "Carve arriba y abajo en la pared para pump — más velocidad = mejores maniobras y puntuación.",
  },
  {
    id: "tube",
    title: "Busca el tubo",
    body: "Mantente profundo en una sección empinada ~1 s para marcar Tube Ride. Mira el overlay del barril.",
  },
  {
    id: "done",
    title: "¡Listo para surfear!",
    body: "Encadena maniobras en ~5 s para subir el combo. Un wipeout o cambiar de spot resetea la ronda.",
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