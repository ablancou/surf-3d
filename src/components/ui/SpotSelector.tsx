"use client";

import { Button } from "@/components/ui/button";
import { SURF_SPOTS, type SpotId } from "@/lib/spots/spotConfig";
import { useSpotStore } from "@/stores/spotStore";

export function SpotSelector() {
  const spotId = useSpotStore((s) => s.spotId);
  const spot = useSpotStore((s) => s.spot);
  const setSpot = useSpotStore((s) => s.setSpot);

  return (
    <div className="pointer-events-auto absolute top-4 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1">
      <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-white/20 bg-black/40 p-1.5 backdrop-blur-md md:gap-2">
        {(Object.keys(SURF_SPOTS) as SpotId[]).map((id) => (
          <Button
            key={id}
            size="sm"
            variant={spotId === id ? "default" : "ghost"}
            className={`shrink-0 text-xs ${spotId !== id ? "text-white/80 hover:text-white" : ""}`}
            onClick={() => setSpot(id)}
          >
            {SURF_SPOTS[id].name}
          </Button>
        ))}
      </div>
      <p className="max-w-xs text-center text-[10px] text-white/45 md:max-w-md md:text-[11px]">
        {spot.tagline}
      </p>
    </div>
  );
}