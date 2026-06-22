import type { ReplayFrame } from "@/lib/replay/types";
import { REPLAY_MAX_DURATION, REPLAY_SAMPLE_INTERVAL } from "@/lib/replay/types";

const MAX_FRAMES = Math.ceil(REPLAY_MAX_DURATION / REPLAY_SAMPLE_INTERVAL);

export class ReplayRecorder {
  private frames: ReplayFrame[] = [];
  private sampleTimer = 0;
  private startTime = 0;
  private running = false;

  start(time: number) {
    this.frames = [];
    this.sampleTimer = 0;
    this.startTime = time;
    this.running = true;
  }

  stop() {
    this.running = false;
  }

  reset() {
    this.frames = [];
    this.running = false;
  }

  sample(
    time: number,
    pos: { x: number; y: number; z: number },
    rot: { x: number; y: number; z: number; w: number },
    dt: number,
  ) {
    if (!this.running) return;
    this.sampleTimer += dt;
    if (this.sampleTimer < REPLAY_SAMPLE_INTERVAL) return;
    this.sampleTimer = 0;

    const t = time - this.startTime;
    if (t > REPLAY_MAX_DURATION) {
      this.frames.shift();
    }

    this.frames.push({
      t,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      qx: rot.x,
      qy: rot.y,
      qz: rot.z,
      qw: rot.w,
    });

    if (this.frames.length > MAX_FRAMES) {
      this.frames.shift();
    }
  }

  getFrames() {
    return this.frames;
  }

  getDuration() {
    if (this.frames.length === 0) return 0;
    return this.frames[this.frames.length - 1].t;
  }

  isRunning() {
    return this.running;
  }
}