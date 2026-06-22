"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { getActiveSpot } from "@/stores/spotStore";

export function Sky() {
  const spot = getActiveSpot();
  const background = useMemo(
    () => new THREE.Color(spot.atmosphere.fogColor).lerp(new THREE.Color("#b8d9f0"), 0.35),
    [spot.id],
  );

  return <color attach="background" args={[background]} />;
}