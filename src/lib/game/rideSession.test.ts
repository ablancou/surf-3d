import { describe, expect, it } from "vitest";
import { canCatchWave, shouldCompleteRide } from "@/lib/game/rideSession";

describe("canCatchWave", () => {
  it("requires speed, alignment, lean and paddle time", () => {
    expect(canCatchWave(2, 0.5, 0.5, 0.5)).toBe(false);
    expect(canCatchWave(3.5, 0.4, 0.3, 0.4)).toBe(true);
    expect(canCatchWave(4, 0.5, 0.2, 0.1)).toBe(false);
  });
});

describe("shouldCompleteRide", () => {
  it("ends successful rides after leaving the wave face", () => {
    expect(
      shouldCompleteRide({
        phase: "riding",
        speed: 1.1,
        faceAlignment: 0.05,
        rideSec: 12,
        peakSpeed: 6,
        slowSec: 3,
      }),
    ).toBe(true);
    expect(
      shouldCompleteRide({
        phase: "riding",
        speed: 5,
        faceAlignment: 0.6,
        rideSec: 12,
        peakSpeed: 6,
        slowSec: 0.5,
      }),
    ).toBe(false);
    expect(
      shouldCompleteRide({
        phase: "paddling",
        speed: 0.5,
        faceAlignment: 0,
        rideSec: 40,
        peakSpeed: 0,
        slowSec: 5,
      }),
    ).toBe(false);
  });
});