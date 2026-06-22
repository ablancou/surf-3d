export type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
  spot: string;
  maxCombo: number;
  maxSpeed: number;
  tricks: number;
  timestamp: number;
  /** Compact replay frames (optional) */
  replay?: ReplayPayload;
};

export type ReplayPayload = {
  spot: string;
  duration: number;
  interval: number;
  frames: number[];
};

export type SubmitScorePayload = {
  name: string;
  score: number;
  spot: string;
  maxCombo: number;
  maxSpeed: number;
  tricks: number;
  replay?: ReplayPayload;
};