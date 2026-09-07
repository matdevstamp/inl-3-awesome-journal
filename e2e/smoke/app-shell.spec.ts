import { expect, test } from "@playwright/test";

test.describe("app shell (Gate 2)", () => {
  test("landing page renders and exposes the theme toggle", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Secure health-record access")).toBeVisible();
    await expect(page.getByRole("button", { name: "Toggle theme" })).toBeVisible();
  });

  test("both server instances report health with their own server id", async ({ request }) => {
    for (const [port, serverId] of [
      [3001, "hospital-s"],
      [3002, "ambulance-a"],
    ] as const) {
      const response = await request.get(`http://localhost:${port}/api/health`);
      expect(response.status(), `server on :${port} answers`).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.data.status).toBe("ok");
      expect(body.data.server).toBe(serverId);
    }
  });
});
