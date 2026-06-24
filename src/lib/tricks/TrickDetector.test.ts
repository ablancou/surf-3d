import { describe, expect, it } from "vitest";
import { TrickDetector } from "@/lib/tricks/TrickDetector";
import type { RiderTelemetry } from "@/lib/tricks/types";

function telemetry(overrides: Partial<RiderTelemetry>): RiderTelemetry {
  return {
    speed: 8,
    tiltX: 0,
    tiltZ: 0,
    boardUpY: 0.7,
    angularVelocityY: 0,
    angularVelocityZ: 0,
    airTime: 0,
    submerged: true,
    waveSteepness: 0.4,
    waveFaceAlignment: 0.6,
    downhillSpeed: 4,
    leanX: 0,
    leanZ: 0.5,
    verticalVelocity: 0,
    inTube: false,
    tubeDepth: 0,
    tubeEnclosure: 0,
    lipOverhead: 0,
    ...overrides,
  };
}

describe("TrickDetector", () => {
  it("detects snap on sharp redirect at speed", () => {
    const det = new TrickDetector();
    const trick = det.update(
      telemetry({
        speed: 7,
        tiltX: -0.55,
        leanX: -0.45,
        angularVelocityY: 2.5,
        waveFaceAlignment: 0.4,
      }),
      1,
      0.016,
    );
    expect(trick?.id).toBe("snap");
  });

  it("detects aerial after sufficient air time", () => {
    const det = new TrickDetector();
    det.update(telemetry({ submerged: false, airTime: 0.4 }), 1, 0.016);
    det.update(telemetry({ submerged: false, airTime: 0.7 }), 1.5, 0.016);
    const land = det.update(telemetry({ submerged: true, airTime: 0 }), 2, 0.016);
    expect(land?.id).toBe("aerial");
  });
});