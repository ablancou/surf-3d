import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("surf3d-tutorial-done", "1");
    Object.defineProperty(navigator, "deviceMemory", { value: 4, configurable: true });
  });
});

test("loads game canvas and accelerates when holding W", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Loading surf...")).toBeHidden({ timeout: 45_000 });

  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible({ timeout: 10_000 });

  await page.waitForTimeout(2000);

  const speedBefore = await readSpeed(page);
  expect(speedBefore).toBeGreaterThanOrEqual(0);

  await page.keyboard.down("w");
  await page.waitForTimeout(3500);
  await page.keyboard.up("w");

  const speedAfter = await readSpeed(page);
  expect(speedAfter).toBeGreaterThan(3);

  await expect(page.getByText(/Riding|Barrel/i)).toBeVisible();
});

async function readSpeed(page: import("@playwright/test").Page): Promise<number> {
  const speedLocator = page.locator(".font-mono.text-2xl.font-semibold").first();
  await expect(speedLocator).toBeVisible({ timeout: 15_000 });
  const text = await speedLocator.textContent();
  return parseFloat(text?.trim() ?? "0") || 0;
}