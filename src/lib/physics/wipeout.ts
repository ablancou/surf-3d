import { getSpotPhysics } from "@/lib/spots/spotPhysics";
import type { RiderTelemetry, WipeoutEvent, WipeoutReason } from "@/lib/tricks/types";

const WIPEOUT_COOLDOWN = 4;

type RiskState = {
  rail: number;
  nose: number;
  bail: number;
};

export class WipeoutDetector {
  private cooldown = 0;
  private risk: RiskState = { rail: 0, nose: 0, bail: 0 };

  update(telemetry: RiderTelemetry, time: number, dt: number): WipeoutEvent | null {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.cooldown > 0) {
      this.decayRisk(dt * 2.2);
      return null;
    }

    const reason = this.accumulateRisk(telemetry, dt);
    if (!reason) {
      const ridingWell =
        telemetry.submerged &&
        telemetry.waveFaceAlignment > 0.35 &&
        telemetry.boardUpY > 0.25;
      if (ridingWell) this.decayRisk(dt * 2.5);
      return null;
    }

    this.cooldown = WIPEOUT_COOLDOWN;
    this.risk = { rail: 0, nose: 0, bail: 0 };
    return { reason, timestamp: time };
  }

  resetCooldown() {
    this.cooldown = 0;
    this.risk = { rail: 0, nose: 0, bail: 0 };
  }

  private decayRisk(rate: number) {
    this.risk.rail = Math.max(0, this.risk.rail - rate);
    this.risk.nose = Math.max(0, this.risk.nose - rate);
    this.risk.bail = Math.max(0, this.risk.bail - rate);
  }

  private accumulateRisk(t: RiderTelemetry, dt: number): WipeoutReason | null {
    const s = getSpotPhysics().wipeoutScale;
    if (t.submerged && t.boardUpY < -0.15 / s && t.speed > 6 * s) {
      this.risk.rail += dt * 1.4;
      if (this.risk.rail >= 1) return "rail_bury";
    }

    if (
      t.submerged &&
      t.tiltZ > 1.45 * s &&
      t.speed > 8 * s &&
      t.downhillSpeed > 5 &&
      t.boardUpY < 0.2
    ) {
      this.risk.nose += dt * 1.1;
      if (this.risk.nose >= 1) return "nose_dive";
    }

    if (t.submerged && Math.abs(t.tiltX) > 1.65 * s && t.speed > 9 * s && t.boardUpY < 0.15) {
      this.risk.bail += dt * 1.2;
      if (this.risk.bail >= 1) return "bail";
    }

    if (!t.submerged && t.airTime > 4 * s && t.verticalVelocity < -10 / s) {
      this.risk.bail += dt * 1.5;
      if (this.risk.bail >= 1) return "bail";
    }

    return null;
  }
}