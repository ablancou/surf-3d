"use client";

import { getActiveSpot } from "@/stores/spotStore";
import { useSettingsStore } from "@/stores/settingsStore";

export function SceneLighting() {
  const enableShadows = useSettingsStore((s) => s.perf.enableShadows);
  const shadowMapSize = useSettingsStore((s) => s.perf.shadowMapSize);
  const spot = getActiveSpot();

  return (
    <>
      <hemisphereLight args={["#d4ecff", spot.atmosphere.shallowWater, 0.85]} />
      <ambientLight intensity={enableShadows ? 0.48 : 0.62} />
      <directionalLight
        intensity={2.4}
        position={[40, 60, 20]}
        castShadow={enableShadows}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={0.5}
        shadow-camera-far={220}
        shadow-bias={-0.00015}
        shadow-normalBias={0.02}
      />
    </>
  );
}