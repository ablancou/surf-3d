"use client";

import { Sky as DreiSky } from "@react-three/drei";
import { getActiveSpot } from "@/stores/spotStore";

export function Sky() {
  const spot = getActiveSpot();
  return (
    <DreiSky
      distance={450000}
      sunPosition={[120, 45, 80]}
      inclination={spot.atmosphere.skyInclination}
      azimuth={0.22}
      mieCoefficient={0.005}
      mieDirectionalG={0.9}
      rayleigh={1.2}
      turbidity={4}
    />
  );
}