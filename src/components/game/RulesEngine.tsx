"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useRulesStore, SurfRuleId } from "@/stores/rulesStore";

// Este motor simula escenarios de etiqueta en el surf para enseñar reglas
export function RulesEngine() {
  const ridePhase = useGameStore((s) => s.ridePhase);
  const triggerRuleEvent = useRulesStore((s) => s.triggerRuleEvent);
  
  const lastPhase = useRef(ridePhase);
  const paddleStartTime = useRef(0);

  useEffect(() => {
    // Si acaba de empezar a remar (esperando la ola)
    if (ridePhase === "paddling" && lastPhase.current !== "paddling") {
      paddleStartTime.current = Date.now();
      
      // Simular un escenario de "Respect the Lineup" si espera lo suficiente (5s)
      const lineupTimeout = setTimeout(() => {
        if (useGameStore.getState().ridePhase === "paddling") {
          triggerRuleEvent("respect_lineup", true);
          useGameStore.getState().addRideScore(500);
        }
      }, 5000);

      return () => clearTimeout(lineupTimeout);
    }

    // Si acaba de tomar la ola (pasó a riding o algo diferente de paddling)
    if (lastPhase.current === "paddling" && ridePhase !== "paddling" && ridePhase !== "menu") {
      // Un 20% de probabilidad de tener un "Drop In" simulado en su contra
      // Y un 20% de probabilidad de que él haya respetado la prioridad ("Peak Priority")
      const rand = Math.random();
      
      if (rand < 0.2) {
        // Drop in scenario
        setTimeout(() => {
          triggerRuleEvent("no_drop_in", false);
          useGameStore.getState().triggerWipeout("collision"); // Castigo por drop in
        }, 1500);
      } else if (rand > 0.8) {
        // Peak priority respetada
        setTimeout(() => {
          triggerRuleEvent("peak_priority", true);
          useGameStore.getState().addRideScore(1000);
        }, 2000);
      }
    }

    lastPhase.current = ridePhase;
  }, [ridePhase, triggerRuleEvent]);

  return null;
}
