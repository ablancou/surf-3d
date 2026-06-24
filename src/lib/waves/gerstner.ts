import * as THREE from "three";
import { breakingVertexDeform, sampleBreakingWave } from "@/lib/waves/breakingWave";
import type { GerstnerWave } from "./waveConfig";

export type WaveSample = {
  height: number;
  normal: THREE.Vector3;
  displacement: THREE.Vector3;
  /** Slope magnitude — drives crest foam */
  steepness: number;
};

const scratch = {
  displacement: new THREE.Vector3(),
  normal: new THREE.Vector3(0, 1, 0),
};

/**
 * CPU-side Gerstner sampler — must stay in sync with the ocean vertex shader.
 * Reuses internal scratch vectors; pass `out` to avoid per-frame allocations.
 */
export function sampleGerstnerWaves(
  x: number,
  z: number,
  time: number,
  waves: readonly GerstnerWave[],
  out?: WaveSample,
): WaveSample {
  let height = 0;
  scratch.displacement.set(0, 0, 0);

  let dHdX = 0;
  let dHdZ = 0;
  let tangentX = 1;
  let tangentZ = 0;
  let binormalX = 0;
  let binormalZ = 1;

  for (let i = 0; i < waves.length; i++) {
    const wave = waves[i];
    const k = (Math.PI * 2) / wave.wavelength;
    const dirX = Math.cos(wave.direction);
    const dirZ = Math.sin(wave.direction);
    const phase = k * (dirX * x + dirZ * z) - wave.speed * time;
    const sinP = Math.sin(phase);
    const cosP = Math.cos(phase);
    const qa = wave.steepness * wave.amplitude;

    height += wave.amplitude * sinP;
    scratch.displacement.x += dirX * qa * cosP;
    scratch.displacement.z += dirZ * qa * cosP;

    const wk = k * wave.amplitude;
    const wkCos = wk * cosP;
    const wkSin = wk * sinP;

    dHdX += dirX * wkCos;
    dHdZ += dirZ * wkCos;

    tangentX -= dirX * dirX * qa * wkSin;
    tangentZ -= dirX * dirZ * qa * wkSin;
    binormalX -= dirX * dirZ * qa * wkSin;
    binormalZ -= dirZ * dirZ * qa * wkSin;
  }

  const tx = tangentX;
  const ty = dHdX;
  const tz = tangentZ;
  const bx = binormalX;
  const by = dHdZ;
  const bz = binormalZ;

  scratch.normal.set(ty * bz - tz * by, tx * bz - tz * bx, tx * by - ty * bx).normalize();

  const breaking = sampleBreakingWave(x, z, time, waves);
  const lip = breakingVertexDeform(x, z, time, waves);
  height += lip.dy;
  scratch.displacement.x += lip.dx;
  scratch.displacement.z += lip.dz;

  let slope = Math.sqrt(dHdX * dHdX + dHdZ * dHdZ);
  slope *= 0.65 + breaking.curl * 0.55 + breaking.peelPhase * 0.2;

  if (out) {
    out.height = height;
    out.normal.copy(scratch.normal);
    out.displacement.copy(scratch.displacement);
    out.steepness = slope;
    return out;
  }

  return {
    height,
    normal: scratch.normal.clone(),
    displacement: scratch.displacement.clone(),
    steepness: slope,
  };
}

/** Sample height only — hot path for physics */
export function sampleWaveHeight(
  x: number,
  z: number,
  time: number,
  waves: readonly GerstnerWave[],
): number {
  let height = 0;
  for (let i = 0; i < waves.length; i++) {
    const wave = waves[i];
    const k = (Math.PI * 2) / wave.wavelength;
    const dirX = Math.cos(wave.direction);
    const dirZ = Math.sin(wave.direction);
    const phase = k * (dirX * x + dirZ * z) - wave.speed * time;
    height += wave.amplitude * Math.sin(phase);
  }
  return height;
}