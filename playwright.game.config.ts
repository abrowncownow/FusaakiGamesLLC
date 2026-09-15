import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/game",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/game", open: "never" }],
  ],
  outputDir: "test-results/game",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "pnpm --filter @fusaakigames/game preview",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: false,
    },
    {
      command: "pnpm --filter @fusaakigames/server start",
      url: "http://127.0.0.1:4310/api/health",
      reuseExistingServer: false,
    },
  ],
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
