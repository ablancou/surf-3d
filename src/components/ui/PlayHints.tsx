"use client";

import { useEffect, useState } from "react";
import { isCoarsePointer } from "@/lib/input/deviceProfile";
import { useGameStore } from "@/stores/gameStore";
import { useSpotStore } from "@/stores/spotStore";
import { useTutorialStore } from "@/stores/tutorialStore";

type Hint = {
  id: string;
  text: string;
  detail?: string;
};

function pickHint(
  speed: number,
  riding: boolean,
  inTube: boolean,
  combo: number,
  airTime: number,
  mobile: boolean,
  spotTagline: string,
): Hint {
  if (!riding && airTime > 0.2) {
    return {
      id: "air",
      text: bigAirHint(airTime),
      detail: "Aterriza limpio para marcar el aéreo",
    };
  }
  if (inTube) {
    return {
      id: "tube",
      text: "Dentro del tubo — carve suave, sin pop",
      detail: mobile ? "Usa el pad izquierdo con calma" : "Mantén velocidad y profundidad",
    };
  }
  if (combo >= 2) {
    return {
      id: "combo",
      text: `Combo x${combo} — encadena antes de que expire`,
      detail: "Tienes ~5 s entre maniobras para mantener el multiplicador",
    };
  }
  if (!riding && speed < 2) {
    return mobile
      ? {
          id: "paddle",
          text: "Pad izquierdo — rema hacia la ola",
          detail: "Empuja arriba en el pad o arrastra en pantalla",
        }
      : {
          id: "paddle",
          text: "↑ W — rema hacia la ola",
          detail: "También puedes arrastrar el dedo o usar el stick",
        };
  }
  if (speed < 3) {
    return {
      id: "catch",
      text: mobile ? "Empuja arriba en el pad para coger la ola" : "Mantén W para coger la ola",
      detail: spotTagline,
    };
  }
  if (speed < 7) {
    return {
      id: "carve",
      text: mobile ? "Pad — inclínate en la pared" : "A/D — carve en la pared",
      detail: "Inclínate en la ola para no perder velocidad",
    };
  }
  if (speed < 12) {
    return mobile
      ? {
          id: "pump",
          text: "Arriba/abajo en el pad — pump",
          detail: "Sube y baja la cara para ganar velocidad",
        }
      : {
          id: "pump",
          text: "W arriba / S abajo — pump en la pared",
          detail: "Sube y baja la cara de la ola para ganar velocidad",
        };
  }
  return mobile
    ? {
        id: "tricks",
        text: "Botón POP — aéreo",
        detail: "Busca secciones empinadas para tubos",
      }
    : {
        id: "tricks",
        text: "Espacio — aéreo · suelta tap para pop",
        detail: "Busca secciones empinadas para tubos y floater",
      };
}

function bigAirHint(airTime: number) {
  if (airTime > 0.7) return "¡Mucho hang time!";
  if (airTime > 0.35) return "Buen despegue — prepárate para aterrizar";
  return "En el aire — controla el aterrizaje";
}

export function PlayHints() {
  const tutorialActive = useTutorialStore((s) => s.active);
  const speed = useGameStore((s) => s.speed);
  const riding = useGameStore((s) => s.riding);
  const inTube = useGameStore((s) => s.inTube);
  const combo = useGameStore((s) => s.combo);
  const airTime = useGameStore((s) => s.airTime);
  const spotTagline = useSpotStore((s) => s.spot.tagline);
  const [faded, setFaded] = useState(false);
  const [mobile] = useState(() => isCoarsePointer());

  const hint = pickHint(speed, riding, inTube, combo, airTime, mobile, spotTagline);

  useEffect(() => {
    if (speed > 12 && combo < 2) {
      const t = setTimeout(() => setFaded(true), 3000);
      return () => clearTimeout(t);
    }
    setFaded(false);
  }, [speed, combo]);

  if (tutorialActive || faded) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-28 z-10 flex justify-center px-6 md:bottom-24">
      <div className="max-w-md rounded-full border border-white/10 bg-black/25 px-5 py-2.5 text-center backdrop-blur-sm">
        <p className="text-sm font-medium tracking-wide text-white/75">{hint.text}</p>
        {hint.detail && (
          <p className="mt-0.5 text-xs text-white/40">{hint.detail}</p>
        )}
      </div>
    </div>
  );
}