import { describe, expect, it } from "vitest";
import {
  comboMultiplier,
  keptComboAfterWipeout,
  trickScore,
} from "@/lib/scoring/combo";

describe("scoring combo", () => {
  it("increases multiplier with combo depth", () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(3)).toBeGreaterThan(comboMultiplier(1));
  });

  it("scores tricks with combo multiplier", () => {
    expect(trickScore(200, 2)).toBeGreaterThan(200);
  });

  it("keeps half combo after wipeout", () => {
    expect(keptComboAfterWipeout(5)).toBe(2);
    expect(keptComboAfterWipeout(1)).toBe(0);
  });
});