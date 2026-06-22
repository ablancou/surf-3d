import type { RiderTelemetry, WipeoutEvent, WipeoutReason } from "@/lib/tricks/types";

const WIPEOUT_COOLDOWN = 2.5;

export class WipeoutDetector {
  private cooldown = 0;

  update(telemetry: RiderTelemetry, time: number, dt: number): WipeoutEvent | null {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.cooldown > 0) return null;

    const reason = detectWipeout(telemetry);
    if (!reason) return null;

    this.cooldown = WIPEOUT_COOLDOWN;
    return { reason, timestamp: time };
  }

  resetCooldown() {
    this.cooldown = 0;
  }
}

function detectWipeout(t: RiderTelemetry): WipeoutReason | null {
  if (t.submerged && t.boardUpY < 0.15 && t.speed > 1.5) {
    return "rail_bury";
  }

  if (t.submerged && t.tiltZ > 0.85 && t.speed > 3) {
    return "nose_dive";
  }

  if (t.submerged && Math.abs(t.tiltX) > 1.1 && t.speed > 4) {
    return "bail";
  }

  if (!t.submerged && t.airTime > 2.8 && t.verticalVelocity < -8) {
    return "bail";
  }

  return null;
}