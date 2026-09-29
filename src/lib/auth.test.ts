import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";

import { AuthError, signSessionToken, verifySessionToken } from "@/lib/auth";
import { makeSessionUser } from "@/test-utils/session";
import type { Role, SessionUser } from "@/lib/types/api";

const JWT_SECRET = "test-secret";

const user = (role: Role, overrides: Partial<SessionUser> = {}) =>
  makeSessionUser(role, { organizationId: 1, patientId: null, ...overrides });

describe("signSessionToken / verifySessionToken", () => {
  it("round-trips every field of the session user", () => {
    const session = user("patient", { id: 4, patientId: 1, organizationId: null });

    expect(verifySessionToken(signSessionToken(session))).toEqual(session);
  });

  it("strips the jwt claims so the session is exactly a SessionUser", () => {
    const decoded = verifySessionToken(signSessionToken(user("doctor")));

    // Without this, /api/auth/me would serialise iat/exp back to the client.
    expect(decoded).not.toHaveProperty("iat");
    expect(decoded).not.toHaveProperty("exp");
  });

  it("rejects a token whose payload is not shaped like a session", () => {
    const claimsOnly = jwt.sign({ hello: "world" }, JWT_SECRET, { expiresIn: "1h" });
    const wrongRole = jwt.sign({ ...user("doctor"), role: "admin" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    expect(verifySessionToken(claimsOnly)).toBeNull();
    expect(verifySessionToken(wrongRole)).toBeNull();
  });

  it("normalises optional session fields that are missing or mistyped", () => {
    const token = jwt.sign({ id: 1, username: "dr_test", role: "doctor" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    expect(verifySessionToken(token)).toEqual({
      id: 1,
      username: "dr_test",
      role: "doctor",
      organizationId: null,
      patientId: null,
    });
  });

  it("preserves each role through the round-trip", () => {
    for (const role of ["doctor", "nurse", "ambulance", "patient", "unauthorized"] as const) {
      expect(verifySessionToken(signSessionToken(user(role)))?.role).toBe(role);
    }
  });

  it("rejects a token signed with a different secret", () => {
    const forged = jwt.sign(user("doctor"), "attacker-secret", { expiresIn: "24h" });

    expect(verifySessionToken(forged)).toBeNull();
  });

  it("rejects a token whose payload was tampered with", () => {
    const token = signSessionToken(user("unauthorized", { id: 5 }));
    const [header, , signature] = token.split(".");
    const forgedPayload = Buffer.from(JSON.stringify(user("doctor", { id: 1 }))).toString(
      "base64url",
    );

    expect(verifySessionToken(`${header}.${forgedPayload}.${signature}`)).toBeNull();
  });

  it("rejects an expired token", () => {
    const expired = jwt.sign(user("doctor"), JWT_SECRET, { expiresIn: "-1s" });

    expect(verifySessionToken(expired)).toBeNull();
  });

  it("returns null for malformed input rather than throwing", () => {
    expect(verifySessionToken("")).toBeNull();
    expect(verifySessionToken("not-a-jwt")).toBeNull();
    expect(verifySessionToken("a.b.c")).toBeNull();
  });
});

describe("AuthError", () => {
  it("defaults the message to the error code", () => {
    const error = new AuthError("UNAUTHENTICATED");

    expect(error.name).toBe("AuthError");
    expect(error.message).toBe("UNAUTHENTICATED");
    expect(error.code).toBe("UNAUTHENTICATED");
  });

  it("keeps a custom message", () => {
    expect(new AuthError("UNAUTHORIZED", "Nope").message).toBe("Nope");
  });
});
