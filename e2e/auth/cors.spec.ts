import { expect, test } from "@playwright/test";

test.describe("API CORS", () => {
  test("allows requests from server 3001", async ({ request }) => {
    const response = await request.fetch("/api/auth/login", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3001",
      },
    });

    expect(response.status()).toBe(204);
    expect(response.headers()["access-control-allow-origin"]).toBe("http://localhost:3001");
    expect(response.headers()["access-control-allow-credentials"]).toBe("true");
  });

  test("allows requests from server 3002", async ({ request }) => {
    const response = await request.fetch("/api/auth/login", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3002",
      },
    });

    expect(response.status()).toBe(204);
    expect(response.headers()["access-control-allow-origin"]).toBe("http://localhost:3002");
  });

  test("does not allow an unknown origin", async ({ request }) => {
    const response = await request.fetch("/api/auth/login", {
      method: "OPTIONS",
      headers: {
        Origin: "http://evil.example",
      },
    });

    expect(response.status()).toBe(204);
    expect(response.headers()["access-control-allow-origin"]).toBeUndefined();
  });
});
