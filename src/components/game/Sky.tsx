"use client";

import { Sky as DreiSky } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { useSpotStore } from "@/stores/spotStore";

export function Sky() {
  const spot = useSpotStore((s) => s.spot);

  const background = useMemo(
    () => new THREE.Color(spot.atmosphere.fogColor).lerp(new THREE.Color("#b8d9f0"), 0.35),
    [spot.id],
  );

  const sunPosition = useMemo(() => {
    // skyInclination 0 = zenith, 0.5 = horizon
    const phi = 2 * Math.PI * (spot.atmosphere.skyInclination - 0.5); 
    const theta = Math.PI * 0.22; // azimuth
    return new THREE.Vector3(
      Math.cos(phi),
      Math.sin(phi),
      Math.sin(theta)
    ).multiplyScalar(100);
  }, [spot.atmosphere.skyInclination]);

  return (
    <>
      <DreiSky
        distance={450000}
        sunPosition={sunPosition}
        mieCoefficient={0.005}
        mieDirectionalG={0.82}
        rayleigh={0.55}
        turbidity={6}
      />
      <color attach="background" args={[background]} />
    </>
  );
}