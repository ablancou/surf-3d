"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useTutorialStore } from "@/stores/tutorialStore";

type Hint = {
  id: string;
  text: string;
  detail?: string;
};

function pickHint(speed: number, riding: boolean, inTube: boolean): Hint {
  if (inTube) {
    return {
      id: "tube",
      text: "Dentro del tubo — mantén A/D suave",
      detail: "No hagas pop hasta salir de la ola",
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
      text: "Mantén W para coger velocidad",
      detail: "Busca la pared inclinada de la ola",
    };
  }
  if (speed < 7) {
    return {
      id: "carve",
      text: "A D — carve para mantener el flujo",
      detail: "Inclínate en la pared de la ola para no perder velocidad",
    };
  }
  return {
    id: "tricks",
    text: "Espacio — salto aéreo · suelta tap para pop",
    detail: "Encadena maniobras para subir el combo",
  };
}

export function PlayHints() {
  const tutorialActive = useTutorialStore((s) => s.active);
  const speed = useGameStore((s) => s.speed);
  const riding = useGameStore((s) => s.riding);
  const inTube = useGameStore((s) => s.inTube);
  const [visible, setVisible] = useState(true);
  const [hint, setHint] = useState<Hint>(() => pickHint(0, false, false));

  useEffect(() => {
    setHint(pickHint(speed, riding, inTube));
  }, [speed, riding, inTube]);

  useEffect(() => {
    if (speed > 10) {
      const t = setTimeout(() => setVisible(false), 2500);
      return () => clearTimeout(t);
    }
    setVisible(true);
  }, [speed]);

  if (tutorialActive || !visible) return null;

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