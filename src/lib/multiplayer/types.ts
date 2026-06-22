export type RemotePlayer = {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  qx: number;
  qy: number;
  qz: number;
  qw: number;
  speed: number;
  score: number;
};

export type MultiplayerStatus = "offline" | "connecting" | "connected" | "error";