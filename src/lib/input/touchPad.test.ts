import { describe, expect, it } from "vitest";
import { DEADZONE, IDLE_PADDLE_Z, processPadLean } from "@/lib/input/touchPad";

describe("processPadLean", () => {
  it("returns idle paddle when finger is in deadzone", () => {
    const result = processPadLean(0, 0);
    expect(result.z).toBe(IDLE_PADDLE_Z);
    expect(result.x).toBe(0);
  });

  it("maps upward drag to forward lean", () => {
    const result = processPadLean(0, -DEADZONE - 20);
    expect(result.z).toBeGreaterThan(0.5);
  });

  it("maps horizontal drag to carve lean", () => {
    const result = processPadLean(30, 0);
    expect(Math.abs(result.x)).toBeGreaterThan(0.2);
  });
});