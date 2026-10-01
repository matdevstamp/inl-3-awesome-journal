import { describe, expect, it, vi } from "vitest";

import { createRateLimiter, fail, notImplemented, ok } from "@/lib/api/http";
import { applyCors, corsPreflight } from "@/lib/api/cors";

describe("response envelope helpers", () => {
  it("ok() wraps the payload in a 200 success envelope", async () => {
    const response = ok({ value: 42 });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, data: { value: 42 } });
  });

  it("fail() wraps the code and message in the requested status", async () => {
    const response = fail("UNAUTHORIZED", "Nope", 403);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Nope" },
    });
  });

  it("notImplemented() returns a 501 envelope", async () => {
    const response = notImplemented("Not yet");

    expect(response.status).toBe(501);
    expect(await response.json()).toEqual({
      ok: false,
      error: { code: "NOT_IMPLEMENTED", message: "Not yet" },
    });
  });
});

describe("createRateLimiter", () => {
  it("allows requests until the limit is reached", () => {
    const limiter = createRateLimiter(2, 60_000);

    expect(limiter.isAllowed("ip")).toBe(true);
    limiter.recordFailure("ip");
    expect(limiter.isAllowed("ip")).toBe(true);
    limiter.recordFailure("ip");
    expect(limiter.isAllowed("ip")).toBe(false);
  });

  it("counts each key separately", () => {
    const limiter = createRateLimiter(1, 60_000);

    limiter.recordFailure("a");

    expect(limiter.isAllowed("a")).toBe(false);
    expect(limiter.isAllowed("b")).toBe(true);
  });

  it("allows again once the window has elapsed", () => {
    vi.useFakeTimers();
    try {
      const limiter = createRateLimiter(1, 1_000);

      limiter.recordFailure("ip");
      expect(limiter.isAllowed("ip")).toBe(false);

      vi.advanceTimersByTime(1_001);

      expect(limiter.isAllowed("ip")).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("reset() clears the counter for a key", () => {
    const limiter = createRateLimiter(1, 60_000);

    limiter.recordFailure("ip");
    limiter.reset("ip");

    expect(limiter.isAllowed("ip")).toBe(true);
  });

  it("starts a fresh window when recording after expiry", () => {
    vi.useFakeTimers();
    try {
      const limiter = createRateLimiter(2, 1_000);

      limiter.recordFailure("ip");
      limiter.recordFailure("ip");
      expect(limiter.isAllowed("ip")).toBe(false);

      vi.advanceTimersByTime(1_001);
      limiter.recordFailure("ip");

      expect(limiter.isAllowed("ip")).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("cors", () => {
  function request(origin?: string): import("next/server").NextRequest {
    return new Request("http://localhost:3001/api/auth/login", {
      headers: origin ? { origin } : {},
    }) as unknown as import("next/server").NextRequest;
  }

  it("reflects an allowed origin and sets the credential headers", () => {
    const response = applyCors(request("http://localhost:3002"), ok(null));

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3002");
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("PATCH");
    expect(response.headers.get("Vary")).toBe("Origin");
  });

  it("does not set CORS headers for an unknown origin", () => {
    const response = applyCors(request("https://evil.example"), ok(null));

    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("does not set CORS headers when no origin is sent", () => {
    const response = applyCors(request(), ok(null));

    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("preflight responds 204 with the CORS headers", () => {
    const response = corsPreflight(request("http://localhost:3001"));

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3001");
  });
});
