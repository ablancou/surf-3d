import { describe, expect, it } from "vitest";
import { canCatchWave } from "@/lib/game/rideSession";

describe("canCatchWave", () => {
  it("requires speed, alignment, lean and paddle time", () => {
    expect(canCatchWave(2, 0.5, 0.5, 0.5)).toBe(false);
    expect(canCatchWave(3.5, 0.4, 0.3, 0.4)).toBe(true);
    expect(canCatchWave(4, 0.5, 0.2, 0.1)).toBe(false);
  });
});