import { expect, test } from "@playwright/test";

test.describe("POST /api/auth/login rate limiting", () => {
  test("returns 429 after too many login attempts", async ({ playwright }) => {
    const context = await playwright.request.newContext({
      baseURL: "http://localhost:3001",
      extraHTTPHeaders: {
        "x-forwarded-for": "203.0.113.10",
      },
    });

    for (let i = 0; i < 5; i += 1) {
      const response = await context.post("/api/auth/login", {
        data: {
          username: "dr_test",
          password: "wrong-password",
        },
      });

      expect(response.status()).toBe(401);
    }

    const blockedResponse = await context.post("/api/auth/login", {
      data: {
        username: "dr_test",
        password: "wrong-password",
      },
    });

    expect(blockedResponse.status()).toBe(429);

    const body = await blockedResponse.json();

    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("RATE_LIMITED");

    await context.dispose();
  });
});
