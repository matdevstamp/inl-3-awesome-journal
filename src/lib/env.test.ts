import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * env.ts validates once at first read and throws on a bad value, so these
 * tests re-import the module with `vi.resetModules()` per environment.
 */

const DEFAULTS = {
  PORT: "3001",
  DATABASE_URL: "postgresql://healthaccess:healthaccess@localhost:5432/healthaccess",
  JWT_SECRET: "test-secret",
  JWT_EXPIRES_IN: "24h",
  PEER_URL: "http://localhost:3002",
  PEER_HEARTBEAT_MS: "10000",
};

const original = { ...process.env };

function setEnv(overrides: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries({ ...DEFAULTS, ...overrides })) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

/** Import a fresh copy of env.ts with the current process.env. */
async function loadEnv() {
  vi.resetModules();
  return (await import("@/lib/env")).env;
}

beforeEach(() => {
  setEnv({});
  delete process.env.SERVER_ID;
});

afterEach(() => {
  process.env = { ...original };
});

describe("env defaults", () => {
  it("defaults SERVER_ID to hospital-s", async () => {
    expect((await loadEnv()).serverId).toBe("hospital-s");
  });

  it("derives the peer url from the server id", async () => {
    setEnv({ SERVER_ID: "ambulance-a" });
    delete process.env.PEER_URL;

    expect((await loadEnv()).peerUrl).toBe("http://localhost:3001");
  });

  it("prefers an explicit PEER_URL over the derived one", async () => {
    setEnv({ SERVER_ID: "ambulance-a", PEER_URL: "http://example.test" });

    expect((await loadEnv()).peerUrl).toBe("http://example.test");
  });

  it("falls back to hospital-s's peer for an unknown server id", async () => {
    setEnv({ SERVER_ID: "unknown-clinic" });
    delete process.env.PEER_URL;

    expect((await loadEnv()).peerUrl).toBe("http://localhost:3002");
  });

  it("applies the documented defaults", async () => {
    const env = await loadEnv();

    expect(env).toMatchObject({
      port: 3001,
      jwtExpiresIn: "24h",
      peerHeartbeatMs: 10000,
      databaseUrl: DEFAULTS.DATABASE_URL,
    });
  });
});

describe("env validation", () => {
  it("throws when PORT is not a number", async () => {
    setEnv({ PORT: "http" });

    await expect(loadEnv()).rejects.toThrow("Invalid port value: http");
  });

  it.each(["0", "-1", "70000", "3000.5"])("throws for the invalid port %s", async (port) => {
    setEnv({ PORT: port });

    await expect(loadEnv()).rejects.toThrow(/Invalid port value/);
  });

  it("throws when PEER_HEARTBEAT_MS is not a positive integer", async () => {
    setEnv({ PEER_HEARTBEAT_MS: "0" });

    await expect(loadEnv()).rejects.toThrow("Invalid PEER_HEARTBEAT_MS value: 0");
  });

  it("fails fast when JWT_SECRET is missing", async () => {
    setEnv({ JWT_SECRET: undefined });

    const env = await loadEnv();

    expect(() => env.jwtSecret).toThrow("Missing required environment variable: JWT_SECRET");
  });

  it("reads JWT_SECRET lazily so startup survives without it", async () => {
    setEnv({ JWT_SECRET: undefined });

    const env = await loadEnv();

    expect(() => env.databaseUrl).not.toThrow();
  });
});
