import { describe, expect, it, beforeEach } from "vitest";
import { WipeoutDetector } from "@/lib/physics/wipeout";
import { SURF_SPOTS } from "@/lib/spots/spotConfig";
import { useSpotStore } from "@/stores/spotStore";
import type { RiderTelemetry } from "@/lib/tricks/types";

function baseTelemetry(overrides: Partial<RiderTelemetry> = {}): RiderTelemetry {
  return {
    speed: 8,
    tiltX: 0.1,
    tiltZ: 0.1,
    boardUpY: 0.6,
    angularVelocityY: 0,
    angularVelocityZ: 0,
    airTime: 0,
    submerged: true,
    waveSteepness: 0.35,
    waveFaceAlignment: 0.6,
    downhillSpeed: 3,
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

describe("WipeoutDetector", () => {
  beforeEach(() => {
    useSpotStore.setState({
      spotId: "beach_break",
      spot: SURF_SPOTS.beach_break,
    });
  });

  it("does not wipeout on brief bad telemetry while riding well", () => {
    const det = new WipeoutDetector();
    const bad = baseTelemetry({ boardUpY: 0.1, tiltX: 0.5 });
    expect(det.update(bad, 0, 0.05)).toBeNull();
    const good = baseTelemetry();
    expect(det.update(good, 0.05, 0.1)).toBeNull();
  });

  it("triggers rail bury after sustained upside-down roll", () => {
    const det = new WipeoutDetector();
    const buried = baseTelemetry({ boardUpY: -0.2, speed: 10, tiltX: 0.9 });
    let event = null;
    for (let i = 0; i < 30; i++) {
      event = det.update(buried, i * 0.05, 0.05);
      if (event) break;
    }
    expect(event?.reason).toBe("rail_bury");
  });

  it("recovers risk when riding well between bad frames", () => {
    const det = new WipeoutDetector();
    const buried = baseTelemetry({ boardUpY: -0.15, speed: 8 });
    det.update(buried, 0, 0.05);
    const good = baseTelemetry({ boardUpY: 0.7, waveFaceAlignment: 0.7 });
    for (let i = 0; i < 20; i++) {
      expect(det.update(good, 0.1 + i * 0.05, 0.05)).toBeNull();
    }
  });
});