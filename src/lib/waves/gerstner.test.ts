import { describe, expect, it } from "vitest";
import { sampleGerstnerWaves } from "@/lib/waves/gerstner";
import { SURF_WAVES } from "@/lib/waves/waveConfig";

describe("sampleGerstnerWaves", () => {
  it("produces varying height over time on a fixed point", () => {
    const a = sampleGerstnerWaves(0, -10, 0, SURF_WAVES);
    const b = sampleGerstnerWaves(0, -10, 5, SURF_WAVES);
    expect(a.height).not.toBe(b.height);
  });

  it("returns non-trivial steepness on wave face", () => {
    const sample = sampleGerstnerWaves(4, -12, 10, SURF_WAVES);
    expect(sample.steepness).toBeGreaterThan(0.05);
    expect(sample.normal.y).toBeGreaterThan(0);
    expect(sample.normal.y).toBeLessThanOrEqual(1);
  });

  it("downhill direction derived from normal accelerates riding", () => {
    const sample = sampleGerstnerWaves(0, -8, 20, SURF_WAVES);
    const downhillX = -sample.normal.x;
    const downhillZ = -sample.normal.z;
    const downhillLen = Math.hypot(downhillX, downhillZ);
    expect(downhillLen).toBeGreaterThan(0.01);
  });
});