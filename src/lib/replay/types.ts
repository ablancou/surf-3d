export type ReplayFrame = {
  t: number;
  x: number;
  y: number;
  z: number;
  qx: number;
  qy: number;
  qz: number;
  qw: number;
};

export type ReplayClip = {
  id: string;
  name: string;
  spot: string;
  score: number;
  duration: number;
  recordedAt: number;
  frames: ReplayFrame[];
};

export const REPLAY_SAMPLE_INTERVAL = 0.05;
export const REPLAY_MAX_DURATION = 45;