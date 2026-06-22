import * as THREE from "three";
import { sampleGerstnerWaves, type WaveSample } from "@/lib/waves/gerstner";
import type { OceanSimulator } from "@/lib/waves/OceanSimulator";
import { getActiveWaves } from "@/stores/spotStore";

export type OceanMode = "ifft" | "gerstner";

const scratch: WaveSample = {
  height: 0,
  normal: new THREE.Vector3(0, 1, 0),
  displacement: new THREE.Vector3(),
  steepness: 0,
};

let mode: OceanMode = "gerstner";
let simulator: OceanSimulator | null = null;

export function setOceanMode(m: OceanMode) {
  mode = m;
}

export function getOceanMode() {
  return mode;
}

export function bindOceanSimulator(sim: OceanSimulator | null) {
  simulator = sim;
}

export function sampleOcean(
  x: number,
  z: number,
  time: number,
  out?: WaveSample,
): WaveSample {
  if (mode === "ifft" && simulator) {
    const height = simulator.sampleHeight(x, z);
    const normal = simulator.sampleNormal(x, z);
    const steepness = simulator.sampleSteepness(x, z);
    if (out) {
      out.height = height;
      out.normal.copy(normal);
      out.displacement.set(0, 0, 0);
      out.steepness = steepness;
      return out;
    }
    return {
      height,
      normal: normal.clone(),
      displacement: new THREE.Vector3(),
      steepness,
    };
  }

  return sampleGerstnerWaves(x, z, time, getActiveWaves(), out);
}

export function sampleOceanHeight(x: number, z: number, time: number): number {
  if (mode === "ifft" && simulator) return simulator.sampleHeight(x, z);
  return sampleGerstnerWaves(x, z, time, getActiveWaves()).height;
}