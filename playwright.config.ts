import { defineConfig, devices } from "@playwright/test";

/**
 * E2E smoke suite for the LIVE MTG Meta Hub (https://play.buildkit.store).
 * The site is fully static/client-side (no forms, no mutations), so running
 * against production is safe and is the point — it validates the real
 * deploy, not a local build. Override PLAYWRIGHT_BASE_URL to point at a
 * preview deploy or localhost if ever needed.
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "https://play.buildkit.store",
    trace: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
