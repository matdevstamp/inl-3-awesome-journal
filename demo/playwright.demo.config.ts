import { defineConfig, devices } from "@playwright/test";

/**
 * Recording config for the demo video.
 *
 * Deliberately separate from playwright.config.ts: the app servers and the
 * e2e global setup are the *subject* of the recording, not its harness, so
 * nothing here may start, build, migrate or seed anything. Run the two servers
 * yourself first (see demo/run.sh), then record against them.
 */
export default defineConfig({
  testDir: ".",
  testMatch: "record.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 30 * 60 * 1000,
  retries: 0,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1280, height: 720 },
    // The injected cursor is the pointer for the whole recording.
    trace: "off",
    screenshot: "off",
  },
});
