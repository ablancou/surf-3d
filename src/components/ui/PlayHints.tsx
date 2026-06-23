"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useTutorialStore } from "@/stores/tutorialStore";

type Hint = {
  id: string;
  text: string;
  detail?: string;
};

function pickHint(speed: number, riding: boolean, inTube: boolean, combo: number): Hint {
  if (inTube) {
    return {
      id: "tube",
      text: "Dentro del tubo — A/D suave, sin pop",
      detail: "Mantén velocidad y profundidad para más puntos",
    };
  }
  if (combo >= 3) {
    return {
      id: "combo",
      text: `Combo x${combo} — encadena maniobras`,
      detail: "Carve, pump y aéreos suben el multiplicador",
    };
  }
  if (!riding && speed < 2) {
    return {
      id: "paddle",
      text: "↑ W — rema hacia la ola",
      detail: "También puedes arrastrar el dedo o usar el stick izquierdo",
    };
  }
  if (speed < 3) {
    return {
      id: "catch",
      text: "Mantén W para coger la ola",
      detail: "Apunta a la pared inclinada frente a ti",
    };
  }
  if (speed < 7) {
    return {
      id: "carve",
      text: "A/D — carve en la pared",
      detail: "Inclínate en la ola para no perder velocidad",
    };
  }
  if (speed < 12) {
    return {
      id: "pump",
      text: "W arriba / S abajo — pump en la pared",
      detail: "Sube y baja la cara de la ola para ganar velocidad",
    };
  }
  return {
    id: "tricks",
    text: "Espacio — aéreo · suelta tap para pop",
    detail: "Busca secciones empinadas para tubos y floater",
  };
}

export function PlayHints() {
  const tutorialActive = useTutorialStore((s) => s.active);
  const speed = useGameStore((s) => s.speed);
  const riding = useGameStore((s) => s.riding);
  const inTube = useGameStore((s) => s.inTube);
  const combo = useGameStore((s) => s.combo);
  const [faded, setFaded] = useState(false);

  const hint = pickHint(speed, riding, inTube, combo);

  useEffect(() => {
    if (speed > 12 && combo < 2) {
      const t = setTimeout(() => setFaded(true), 3000);
      return () => clearTimeout(t);
    }
    setFaded(false);
  }, [speed, combo]);

  if (tutorialActive || faded) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 z-10 flex justify-center px-6 md:bottom-24">
      <div className="max-w-md rounded-full border border-white/10 bg-black/25 px-5 py-2.5 text-center backdrop-blur-sm">
        <p className="text-sm font-medium tracking-wide text-white/75">{hint.text}</p>
        {hint.detail && (
          <p className="mt-0.5 text-xs text-white/40">{hint.detail}</p>
        )}
      </div>
    </div>
  );
}