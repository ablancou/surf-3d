import { create } from "zustand";

export type SurfRuleId = 
  | "peak_priority" 
  | "no_drop_in"
  | "no_snaking"
  | "respect_lineup";

export type RuleEvent = {
  id: string;
  ruleId: SurfRuleId;
  title: string;
  description: string;
  points: number; // Positivos si se respetó, negativos si se rompió
  timestamp: number;
};

type RulesStore = {
  activeEvents: RuleEvent[];
  triggerRuleEvent: (ruleId: SurfRuleId, respected: boolean) => void;
  clearEvent: (id: string) => void;
};

const RULES_DATA: Record<SurfRuleId, { title: string; descRespected: string; descBroken: string; }> = {
  peak_priority: {
    title: "Peak Priority",
    descRespected: "¡Bien hecho! Le diste prioridad al que estaba más cerca del pico.",
    descBroken: "Saltaste la prioridad. El que está más profundo tiene derecho a la ola.",
  },
  no_drop_in: {
    title: "No Drop In",
    descRespected: "Esperaste tu turno paciente. ¡Buena etiqueta!",
    descBroken: "¡Drop In! Te metiste en la ola de alguien más. Peligroso.",
  },
  no_snaking: {
    title: "No Snaking",
    descRespected: "Respetaste la rotación. Surf limpio.",
    descBroken: "¡Snake! Remaste por detrás de otro para robar el pico.",
  },
  respect_lineup: {
    title: "Respect the Lineup",
    descRespected: "Esperaste tu turno de forma pacífica.",
    descBroken: "Causaste caos en el lineup. Sé respetuoso.",
  }
};

export const useRulesStore = create<RulesStore>((set) => ({
  activeEvents: [],
  triggerRuleEvent: (ruleId, respected) => {
    const rule = RULES_DATA[ruleId];
    const newEvent: RuleEvent = {
      id: Math.random().toString(36).substring(7),
      ruleId,
      title: rule.title,
      description: respected ? rule.descRespected : rule.descBroken,
      points: respected ? 500 : -1000,
      timestamp: Date.now(),
    };
    
    set((state) => ({
      activeEvents: [...state.activeEvents, newEvent]
    }));
  },
  clearEvent: (id) => {
    set((state) => ({
      activeEvents: state.activeEvents.filter(e => e.id !== id)
    }));
  }
}));
