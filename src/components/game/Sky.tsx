"use client";

import { Sky as DreiSky } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { getActiveSpot } from "@/stores/spotStore";

export function Sky() {
  const spot = getActiveSpot();

  const background = useMemo(
    () => new THREE.Color(spot.atmosphere.fogColor).lerp(new THREE.Color("#b8d9f0"), 0.35),
    [spot.id],
  );

  const sunPosition = useMemo(() => new THREE.Vector3(80, 120, 60), []);

  return (
    <>
      <DreiSky
        distance={450000}
        sunPosition={sunPosition}
        inclination={spot.atmosphere.skyInclination}
        azimuth={0.22}
        mieCoefficient={0.004}
        mieDirectionalG={0.82}
        rayleigh={0.55}
        turbidity={6}
      />
      <color attach="background" args={[background]} />
    </>
  );
}