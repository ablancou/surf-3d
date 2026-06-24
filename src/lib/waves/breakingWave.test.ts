import { describe, expect, it } from "vitest";
import { sampleBreakingWave } from "@/lib/waves/breakingWave";
import { SURF_WAVES } from "@/lib/waves/waveConfig";

describe("sampleBreakingWave", () => {
  it("evolves peel phase over time at fixed position", () => {
    const a = sampleBreakingWave(0, -10, 0, SURF_WAVES);
    const b = sampleBreakingWave(0, -10, 8, SURF_WAVES);
    expect(a.peelPhase).not.toBe(b.peelPhase);
  });

  it("produces curl when wave is steep", () => {
    const br = sampleBreakingWave(2, -14, 12, SURF_WAVES);
    expect(br.curl).toBeGreaterThan(0);
    expect(br.peelDirection).toBe(SURF_WAVES[0].direction);
  });

  it("flags breaking section at crest peel", () => {
    let foundBreaking = false;
    for (let z = -18; z <= -6; z += 2) {
      for (let t = 0; t < 60; t += 0.5) {
        const br = sampleBreakingWave(0, z, t, SURF_WAVES);
        if (br.isBreaking) foundBreaking = true;
      }
    }
    expect(foundBreaking).toBe(true);
  });
});