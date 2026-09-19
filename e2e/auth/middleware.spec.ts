import { expect, test } from "@playwright/test";

test.describe("Authentication middleware", () => {
  test("redirects an unauthenticated dashboard request to login", async ({ playwright }) => {
    const context = await playwright.request.newContext({
      baseURL: "http://localhost:3001",
    });

    const response = await context.get("/dashboard", {
      maxRedirects: 0,
    });

    expect([307, 308]).toContain(response.status());

    const location = response.headers()["location"];

    expect(location).toContain("/login");
    expect(location).toContain("next=%2Fdashboard");

    await context.dispose();
  });
});
