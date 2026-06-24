import { describe, expect, it } from "vitest";
import { computeRideImpulses } from "@/lib/physics/ridePhysics";
import type { SpotPhysicsTuning } from "@/lib/spots/spotPhysics";

const tuning: SpotPhysicsTuning = {
  buoyancy: 160,
  liftFactor: 2.5,
  pumpFactor: 3,
  trimFactor: 1.3,
  railGrip: 1.8,
  tubeGrip: 1.2,
  inputAccel: 11,
  maxSpeed: 22,
  spawnBoost: 1.2,
  wipeoutScale: 1.3,
};

describe("computeRideImpulses", () => {
  it("applies forward impulse when aligned on wave face with W input", () => {
    const downhill = { x: 0, z: 1 };
    const result = computeRideImpulses(
      downhill,
      4,
      0.7,
      2,
      { leanX: 0, leanZ: 1, popUp: false },
      tuning,
      0.016,
    );
    expect(result.iz).toBeGreaterThan(0);
  });

  it("applies cruise assist at speed on face without carve input", () => {
    const downhill = { x: 0.2, z: 0.98 };
    const len = Math.hypot(downhill.x, downhill.z);
    const nd = { x: downhill.x / len, z: downhill.z / len };
    const slow = computeRideImpulses(
      nd,
      6,
      0.6,
      3,
      { leanX: 0, leanZ: 0.5, popUp: false },
      tuning,
      0.016,
    );
    const fast = computeRideImpulses(
      nd,
      12,
      0.6,
      8,
      { leanX: 0, leanZ: 0.5, popUp: false },
      tuning,
      0.016,
    );
    expect(slow.iz + slow.ix).toBeGreaterThan(0);
    expect(fast.iz + fast.ix).toBeGreaterThan(0);
  });

  it("returns zero impulse when no downhill vector", () => {
    const result = computeRideImpulses(
      { x: 0, z: 0 },
      10,
      0.5,
      2,
      { leanX: 0, leanZ: 1, popUp: false },
      tuning,
      0.016,
    );
    expect(result.ix).toBe(0);
    expect(result.iz).toBe(0);
  });
});