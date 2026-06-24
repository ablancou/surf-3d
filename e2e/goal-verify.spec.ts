import { expect, test } from "@playwright/test";
import path from "path";

const SCRATCH =
  process.env.GOAL_SCRATCH ??
  "/var/folders/r1/bcp2p7hj5vs3nljwnbnv6h6m0000gn/T/grok-goal-ff522b85b1ba/implementer";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("surf3d-tutorial-done", "1");
    Object.defineProperty(navigator, "deviceMemory", { value: 4, configurable: true });
  });
});

test("production surf session: canvas, input, score", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");
  await expect(page.getByText("Loading surf...")).toBeHidden({ timeout: 45_000 });

  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(200);
  expect(box?.height ?? 0).toBeGreaterThan(200);

  await page.screenshot({ path: path.join(SCRATCH, "surf-launch-desktop.png"), fullPage: true });

  const speedBefore = await readSpeed(page);
  await page.keyboard.down("w");
  await page.waitForTimeout(3500);
  await page.keyboard.up("w");
  const speedAfter = await readSpeed(page);
  expect(speedAfter).toBeGreaterThan(speedBefore);

  await page.screenshot({ path: path.join(SCRATCH, "surf-mid-ride-desktop.png"), fullPage: true });

  expect(errors.filter((e) => !e.includes("favicon"))).toEqual([]);
});

test("mobile portrait viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await expect(page.getByText("Loading surf...")).toBeHidden({ timeout: 45_000 });
  await expect(page.locator("canvas")).toBeVisible();
  await page.screenshot({
    path: path.join(SCRATCH, "surf-mobile-portrait.png"),
    fullPage: true,
  });
});

async function readSpeed(page: import("@playwright/test").Page): Promise<number> {
  const text = await page.locator(".font-mono.text-2xl.font-semibold").first().textContent();
  return parseFloat(text?.trim() ?? "0") || 0;
}