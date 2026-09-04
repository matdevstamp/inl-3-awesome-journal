import { defineConfig, devices } from "@playwright/test";

/**
 * One Playwright suite for the whole Next.js app (no separate frontend/backend).
 *
 * The suite boots BOTH server instances the demo runs on:
 *   3001 hospital-s
 *   3002 ambulance-a
 * Each instance reads the shared Postgres; the global setup builds the app
 * and makes sure the database exists and is migrated+seeded.
 *
 * Note: Next 16 allows only ONE `next dev` per project directory, so the
 * two-instance demo (and this suite) runs production servers from the shared
 * build output instead: `npm run start -- -p 3001/3002`.
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
  ],
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // firefox/webkit land when the suite matures (task 09 open question).
  ],
  webServer: [
    {
      command: "npm run start -- -p 3001",
      url: "http://localhost:3001/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { SERVER_ID: "hospital-s" },
    },
    {
      command: "npm run start -- -p 3002",
      url: "http://localhost:3002/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { SERVER_ID: "ambulance-a" },
    },
  ],
});
