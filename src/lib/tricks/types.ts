export type TrickId =
  | "carve_left"
  | "carve_right"
  | "pumping"
  | "bottom_turn"
  | "cutback"
  | "floater"
  | "aerial"
  | "tube_ride";

export type TrickEvent = {
  id: TrickId;
  label: string;
  points: number;
  timestamp: number;
};

export const TRICK_LABELS: Record<TrickId, string> = {
  carve_left: "Carve izquierda",
  carve_right: "Carve derecha",
  pumping: "Pump",
  bottom_turn: "Bottom turn",
  cutback: "Cutback",
  floater: "Floater",
  aerial: "Aéreo",
  tube_ride: "Tubo",
};

export const TRICK_POINTS: Record<TrickId, number> = {
  carve_left: 150,
  carve_right: 150,
  pumping: 200,
  bottom_turn: 350,
  cutback: 500,
  floater: 400,
  aerial: 750,
  tube_ride: 1000,
};

export type RiderTelemetry = {
  speed: number;
  tiltX: number;
  tiltZ: number;
  boardUpY: number;
  angularVelocityY: number;
  angularVelocityZ: number;
  airTime: number;
  submerged: boolean;
  waveSteepness: number;
  waveFaceAlignment: number;
  downhillSpeed: number;
  leanX: number;
  leanZ: number;
  verticalVelocity: number;
  /** Barrel pocket metrics */
  inTube: boolean;
  tubeDepth: number;
  tubeEnclosure: number;
  lipOverhead: number;
};

export type WipeoutReason = "nose_dive" | "rail_bury" | "bail";

export type WipeoutEvent = {
  reason: WipeoutReason;
  timestamp: number;
};