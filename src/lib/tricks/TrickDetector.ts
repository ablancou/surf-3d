import {
  TRICK_LABELS,
  TRICK_POINTS,
  type RiderTelemetry,
  type TrickEvent,
  type TrickId,
} from "./types";

const HISTORY = 30;

type HistorySample = {
  speed: number;
  tiltX: number;
  downhillSpeed: number;
  waveFaceAlignment: number;
  submerged: boolean;
  leanX: number;
  inTube: boolean;
  tubeDepth: number;
};

/**
 * Multi-signal trick detector with temporal history for maneuver recognition.
 */
export class TrickDetector {
  private history: HistorySample[] = [];
  private cooldowns = new Map<TrickId, number>();
  private carveState: "none" | "left" | "right" = "none";
  private carveTimer = 0;
  private airStart = 0;
  private wasAirborne = false;
  private peakAirHeight = 0;
  private tubeTimer = 0;
  private tubeTriggered = false;
  private globalCooldown = 0;

  update(telemetry: RiderTelemetry, time: number, dt: number): TrickEvent | null {
    this.globalCooldown = Math.max(0, this.globalCooldown - dt);
    for (const [id, cd] of this.cooldowns) {
      this.cooldowns.set(id, Math.max(0, cd - dt));
    }

    this.pushHistory(telemetry);
    this.trackAir(telemetry, time);

    if (this.globalCooldown > 0) return null;

    return (
      this.detectAerial(telemetry, time) ??
      this.detectTubeRide(telemetry, time, dt) ??
      this.detectFloater(telemetry, time) ??
      this.detectCutback(telemetry, time) ??
      this.detectBottomTurn(telemetry, time) ??
      this.detectPumping(telemetry, time) ??
      this.detectCarve(telemetry, time, dt)
    );
  }

  private pushHistory(t: RiderTelemetry) {
    this.history.push({
      speed: t.speed,
      tiltX: t.tiltX,
      downhillSpeed: t.downhillSpeed,
      waveFaceAlignment: t.waveFaceAlignment,
      submerged: t.submerged,
      leanX: t.leanX,
      inTube: t.inTube,
      tubeDepth: t.tubeDepth,
    });
    if (this.history.length > HISTORY) this.history.shift();
  }

  private trackAir(t: RiderTelemetry, time: number) {
    if (!t.submerged && !this.wasAirborne) {
      this.airStart = time;
      this.peakAirHeight = 0;
      this.wasAirborne = true;
    }
    if (!t.submerged) {
      this.peakAirHeight = Math.max(this.peakAirHeight, t.airTime);
    }
    if (t.submerged) this.wasAirborne = false;
  }

  private detectCarve(t: RiderTelemetry, time: number, dt: number): TrickEvent | null {
    if (!t.submerged || t.speed < 3) {
      this.carveState = "none";
      return null;
    }

    const carvingLeft = t.tiltX < -0.16 && Math.abs(t.angularVelocityZ) > 0.32 && t.leanX < -0.08;
    const carvingRight = t.tiltX > 0.16 && Math.abs(t.angularVelocityZ) > 0.32 && t.leanX > 0.08;

    if (carvingLeft) {
      this.carveState = "left";
      this.carveTimer = 0.35;
      return null;
    }
    if (carvingRight) {
      this.carveState = "right";
      this.carveTimer = 0.35;
      return null;
    }

    if (this.carveState !== "none") {
      this.carveTimer -= dt;
      if (this.carveTimer <= 0) {
        const finished = this.carveState;
        this.carveState = "none";
        if (finished === "left" && this.canTrigger("carve_left")) {
          return this.emit("carve_left", time, 0.5);
        }
        if (finished === "right" && this.canTrigger("carve_right")) {
          return this.emit("carve_right", time, 0.5);
        }
      }
    }

    return null;
  }

  private detectPumping(t: RiderTelemetry, time: number): TrickEvent | null {
    if (!this.canTrigger("pumping") || !t.submerged || this.history.length < 12) return null;

    const recent = this.history.slice(-12);
    const speedGain = recent[recent.length - 1].speed - recent[0].speed;
    const uphill = recent.filter((s) => s.downhillSpeed < -0.5).length >= 4;
    const accel = recent.slice(-4).every((s, i, arr) => i === 0 || s.speed >= arr[i - 1].speed - 0.2);

    if (speedGain > 0.9 && uphill && accel && t.speed > 2.8) {
      return this.emit("pumping", time, 0.75);
    }
    return null;
  }

  private detectBottomTurn(t: RiderTelemetry, time: number): TrickEvent | null {
    if (!this.canTrigger("bottom_turn") || !t.submerged || this.history.length < 10) return null;

    const recent = this.history.slice(-10);
    const hadCarve = recent.some((s) => Math.abs(s.tiltX) > 0.4);
    const dirShift =
      recent[0].waveFaceAlignment < -0.2 && recent[recent.length - 1].waveFaceAlignment > 0.35;
    const speedOk = t.speed > 5;

    if (hadCarve && dirShift && speedOk && Math.abs(t.angularVelocityY) > 1.2) {
      return this.emit("bottom_turn", time, 1.1);
    }
    return null;
  }

  private detectCutback(t: RiderTelemetry, time: number): TrickEvent | null {
    if (!this.canTrigger("cutback") || !t.submerged || this.history.length < 14) return null;

    const recent = this.history.slice(-14);
    const mid = Math.floor(recent.length / 2);
    const firstHalf = recent.slice(0, mid);
    const secondHalf = recent.slice(mid);

    const firstDir = average(firstHalf.map((s) => s.leanX));
    const secondDir = average(secondHalf.map((s) => s.leanX));
    const reversal = Math.sign(firstDir) !== Math.sign(secondDir) && Math.abs(firstDir) > 0.3 && Math.abs(secondDir) > 0.3;

    if (reversal && t.speed > 4.5 && Math.abs(t.angularVelocityY) > 1.5) {
      return this.emit("cutback", time, 1.4);
    }
    return null;
  }

  private detectTubeRide(t: RiderTelemetry, time: number, dt: number): TrickEvent | null {
    if (t.inTube && t.speed > 4) {
      this.tubeTimer += dt;
    } else {
      this.tubeTimer = 0;
      this.tubeTriggered = false;
    }

    if (
      !this.tubeTriggered &&
      this.tubeTimer >= 0.85 &&
      this.canTrigger("tube_ride") &&
      t.tubeDepth > 0.35
    ) {
      this.tubeTriggered = true;
      const depthBonus = Math.floor(t.tubeDepth * 400 + t.tubeEnclosure * 150);
      return this.emit("tube_ride", time, 2.5, TRICK_POINTS.tube_ride + depthBonus);
    }

    return null;
  }

  private detectFloater(t: RiderTelemetry, time: number): TrickEvent | null {
    if (!this.canTrigger("floater")) return null;

    const justLanded = t.submerged && this.wasAirborne === false && t.airTime < 0.05;
    const hadShortAir = this.peakAirHeight > 0.15 && this.peakAirHeight < 0.9;

    if (justLanded && hadShortAir && t.waveSteepness > 0.35 && t.speed > 3) {
      this.peakAirHeight = 0;
      return this.emit("floater", time, 1.2);
    }
    return null;
  }

  private detectAerial(t: RiderTelemetry, time: number): TrickEvent | null {
    if (!this.canTrigger("aerial")) return null;

    if (t.submerged && this.peakAirHeight > 0.38 && t.airTime < 0.1) {
      const peak = this.peakAirHeight;
      this.peakAirHeight = 0;
      if (peak > 0.38) {
        const bonus = Math.floor(peak * 200);
        return this.emit("aerial", time, 1.6, TRICK_POINTS.aerial + bonus);
      }
    }
    return null;
  }

  private canTrigger(id: TrickId) {
    return (this.cooldowns.get(id) ?? 0) <= 0;
  }

  private emit(id: TrickId, time: number, cooldown: number, points = TRICK_POINTS[id]): TrickEvent {
    this.cooldowns.set(id, cooldown);
    this.globalCooldown = 0.25;
    return { id, label: TRICK_LABELS[id], points, timestamp: time };
  }
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}