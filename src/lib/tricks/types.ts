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

export type TrickTier = "basic" | "mid" | "big" | "epic";

export const TRICK_TIER: Record<TrickId, TrickTier> = {
  carve_left: "basic",
  carve_right: "basic",
  pumping: "basic",
  bottom_turn: "mid",
  cutback: "big",
  floater: "big",
  aerial: "epic",
  tube_ride: "epic",
};

export const TRICK_COLORS: Record<TrickId, string> = {
  carve_left: "#67e8f9",
  carve_right: "#67e8f9",
  pumping: "#86efac",
  bottom_turn: "#93c5fd",
  cutback: "#c4b5fd",
  floater: "#5eead4",
  aerial: "#fcd34d",
  tube_ride: "#e0f2fe",
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