import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

import { HOSPITAL_ID } from "@/test-utils/session";

/**
 * Route-handler tests for /api/auth/login. The rate limiter is a module-level
 * singleton, so each test uses a distinct x-forwarded-for to stay independent.
 */

const findUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique } },
}));

const { POST, OPTIONS } = await import("@/app/api/auth/login/route");

const HASH = bcrypt.hashSync("correct-horse", 4);

function login(body: unknown, ip = `10.0.0.${Math.floor(Math.random() * 250)}`) {
  return POST(
    new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers: { "content-type": "application/json", "x-forwarded-for": `${ip}, 10.1.1.1` },
    }) as never,
  );
}

const doctorRow = {
  id: 1,
  username: "dr_test",
  role: "doctor",
  organizationId: HOSPITAL_ID,
  passwordHash: HASH,
  patient: null,
};

const patientRow = {
  id: 4,
  username: "patient_test",
  role: "patient",
  organizationId: null,
  passwordHash: HASH,
  patient: { id: 1 },
};

beforeEach(() => {
  findUnique.mockReset().mockResolvedValue(doctorRow);
});

describe("POST /api/auth/login", () => {
  it("returns 401 for an unknown user", async () => {
    findUnique.mockResolvedValue(null);

    const response = await login({ username: "ghost", password: "x" });

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns 401 for a wrong password", async () => {
    const response = await login({ username: "dr_test", password: "wrong" });

    expect(response.status).toBe(401);
    expect((await response.json()).error.message).toBe("Invalid credentials");
  });

  it("does not leak whether the username exists", async () => {
    findUnique.mockResolvedValue(null);
    const unknown = await (await login({ username: "ghost", password: "x" })).json();

    findUnique.mockResolvedValue(doctorRow);
    const wrongPassword = await (await login({ username: "dr_test", password: "wrong" })).json();

    expect(unknown).toEqual(wrongPassword);
  });

  it("returns 400 for a body that is not JSON", async () => {
    const response = await login("{oops");

    expect(response.status).toBe(400);
    expect((await response.json()).error.message).toBe("Invalid request body");
  });

  it.each([
    ["a missing password", { username: "dr_test" }],
    ["an empty username", { username: "", password: "x" }],
  ])("returns 400 for %s", async (_label, body) => {
    const response = await login(body);

    expect(response.status).toBe(400);
    expect((await response.json()).error.message).toBe("Invalid login data");
  });

  it("returns the session user on success", async () => {
    const response = await login({ username: "dr_test", password: "correct-horse" });
    const body = (await response.json()) as {
      ok: boolean;
      data: { user: Record<string, unknown> };
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.user).toEqual({
      id: 1,
      username: "dr_test",
      role: "doctor",
      organizationId: HOSPITAL_ID,
      patientId: null,
    });
  });

  it("never returns the password hash", async () => {
    const response = await login({ username: "dr_test", password: "correct-horse" });

    expect(JSON.stringify(await response.json())).not.toContain(HASH);
  });

  it("resolves a patient's patientId from the relation", async () => {
    findUnique.mockResolvedValue(patientRow);

    const body = (await (
      await login({ username: "patient_test", password: "correct-horse" })
    ).json()) as { data: { user: { patientId: number | null } } };

    expect(body.data.user.patientId).toBe(1);
  });

  it("sets an httpOnly session cookie", async () => {
    const response = await login({ username: "dr_test", password: "correct-horse" });
    const cookie = response.headers.get("set-cookie") ?? "";

    expect(cookie).toContain("token=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/");
  });

  it("issues a token that verifySessionToken accepts", async () => {
    const { verifySessionToken } = await import("@/lib/auth");
    const response = await login({ username: "dr_test", password: "correct-horse" });
    const cookie = response.headers.get("set-cookie") ?? "";
    const token = cookie.match(/token=([^;]+)/)?.[1] ?? "";

    expect(verifySessionToken(token)).toMatchObject({ username: "dr_test", role: "doctor" });
  });

  it("rate-limits a flood of failed logins from one ip", async () => {
    const ip = "203.0.113.7";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await login({ username: "dr_test", password: "wrong" }, ip);
      expect(response.status).toBe(401);
    }

    const blocked = await login({ username: "dr_test", password: "wrong" }, ip);

    expect(blocked.status).toBe(429);
    expect((await blocked.json()).error.code).toBe("RATE_LIMITED");
  });

  it("does not rate-limit a different ip", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await login({ username: "dr_test", password: "wrong" }, "203.0.113.8");
    }

    const response = await login({ username: "dr_test", password: "wrong" }, "203.0.113.9");

    expect(response.status).toBe(401);
  });
});

describe("OPTIONS /api/auth/login", () => {
  it("answers the CORS preflight", async () => {
    const response = OPTIONS(
      new Request("http://localhost:3000/api/auth/login", {
        method: "OPTIONS",
        headers: { origin: "http://localhost:3001", "access-control-request-method": "POST" },
      }) as never,
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:3001");
  });
});
