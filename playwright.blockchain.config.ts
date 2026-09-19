import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/blockchain",
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3001",
  },
});
