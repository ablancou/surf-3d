import type { ReplayClip, ReplayFrame } from "@/lib/replay/types";
import type { ReplayPayload } from "@/lib/leaderboard/types";
import { REPLAY_SAMPLE_INTERVAL } from "@/lib/replay/types";

/** Pack frames into compact flat array for API storage */
export function encodeReplay(frames: ReplayFrame[]): ReplayPayload {
  const flat: number[] = [];
  for (const f of frames) {
    flat.push(f.t, f.x, f.y, f.z, f.qx, f.qy, f.qz, f.qw);
  }
  return {
    spot: "",
    duration: frames.length > 0 ? frames[frames.length - 1].t : 0,
    interval: REPLAY_SAMPLE_INTERVAL,
    frames: flat,
  };
}

export function decodeReplay(payload: ReplayPayload, spot: string): ReplayFrame[] {
  const out: ReplayFrame[] = [];
  const f = payload.frames;
  for (let i = 0; i < f.length; i += 8) {
    out.push({
      t: f[i],
      x: f[i + 1],
      y: f[i + 2],
      z: f[i + 3],
      qx: f[i + 4],
      qy: f[i + 5],
      qz: f[i + 6],
      qw: f[i + 7],
    });
  }
  return out;
}

export function clipToPayload(clip: ReplayClip): ReplayPayload {
  const p = encodeReplay(clip.frames);
  p.spot = clip.spot;
  return p;
}

export function payloadToClip(payload: ReplayPayload, meta: { id: string; name: string; score: number }): ReplayClip {
  return {
    id: meta.id,
    name: meta.name,
    spot: payload.spot,
    score: meta.score,
    duration: payload.duration,
    recordedAt: Date.now(),
    frames: decodeReplay(payload, payload.spot),
  };
}