import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3010",
    trace: "on-first-retry",
  },
  webServer: process.env.CI
    ? {
        command: "PORT=3010 npm run start",
        url: "http://127.0.0.1:3010",
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : {
        command: "PORT=3010 npm run start",
        url: "http://127.0.0.1:3010",
        reuseExistingServer: !process.env.PLAYWRIGHT_NO_REUSE,
        timeout: 120_000,
      },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--use-gl=angle", "--use-angle=swiftshader"],
        },
      },
    },
  ],
});