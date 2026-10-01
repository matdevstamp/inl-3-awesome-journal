import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getPeerHealth,
  refreshPeerHealth,
  startPeerHeartbeat,
  stopPeerHeartbeat,
} from "@/lib/p2p/peer-health";

/**
 * peer-health keeps its store on a globalThis symbol because Next bundles
 * instrumentation separately from route handlers. These tests reset that store
 * between cases so the module-level singleton cannot leak across suites.
 */

const fetchPeerHealth = vi.fn();

vi.mock("@/lib/p2p/transport", () => ({
  fetchPeerHealth: (...args: unknown[]) => fetchPeerHealth(...args),
}));

const PEER_URL = "http://localhost:3002";

beforeEach(() => {
  const holder = globalThis as typeof globalThis & {
    [key: symbol]: { status: unknown; timer: NodeJS.Timeout | null; running: boolean } | undefined;
  };
  for (const key of Object.getOwnPropertySymbols(holder)) {
    if (key.description === "awesome-journal.peer-health.store") {
      delete holder[key];
    }
  }
  fetchPeerHealth.mockReset();
  stopPeerHeartbeat();
});

afterEach(() => {
  stopPeerHeartbeat();
});

describe("getPeerHealth", () => {
  it("starts unknown until the first probe", () => {
    expect(getPeerHealth()).toEqual({
      peerUrl: PEER_URL,
      healthy: null,
      serverId: null,
      lastCheckedAt: null,
      lastError: null,
    });
  });

  it("returns a copy so callers cannot mutate the store", () => {
    const status = getPeerHealth();
    status.healthy = true;

    expect(getPeerHealth().healthy).toBeNull();
  });
});

describe("refreshPeerHealth", () => {
  it("records a healthy peer identity", async () => {
    fetchPeerHealth.mockResolvedValue({
      healthy: true,
      serverId: "ambulance-a",
      lastCheckedAt: "2026-09-29T10:00:00.000Z",
    });

    const status = await refreshPeerHealth();

    expect(status).toMatchObject({
      healthy: true,
      serverId: "ambulance-a",
      lastCheckedAt: "2026-09-29T10:00:00.000Z",
      lastError: null,
    });
  });

  it("probes the configured peer url", async () => {
    fetchPeerHealth.mockResolvedValue({ healthy: true, serverId: "x", lastCheckedAt: "t" });

    await refreshPeerHealth();

    expect(fetchPeerHealth).toHaveBeenCalledWith(PEER_URL);
  });

  it("records the failure message and never throws", async () => {
    fetchPeerHealth.mockRejectedValue(new Error("ECONNREFUSED"));

    const status = await refreshPeerHealth();

    expect(status.healthy).toBe(false);
    expect(status.lastError).toBe("ECONNREFUSED");
    expect(Date.parse(status.lastCheckedAt ?? "")).not.toBeNaN();
  });

  it("stringifies a non-Error rejection", async () => {
    fetchPeerHealth.mockRejectedValue("offline");

    expect((await refreshPeerHealth()).lastError).toBe("offline");
  });

  it("clears a previous error after the peer recovers", async () => {
    fetchPeerHealth.mockRejectedValueOnce(new Error("down"));
    await refreshPeerHealth();

    fetchPeerHealth.mockResolvedValueOnce({
      healthy: true,
      serverId: "ambulance-a",
      lastCheckedAt: "t",
    });
    const status = await refreshPeerHealth();

    expect(status.lastError).toBeNull();
    expect(status.healthy).toBe(true);
  });
});

describe("startPeerHeartbeat", () => {
  it("probes immediately and then on the interval", async () => {
    vi.useFakeTimers();
    try {
      startPeerHeartbeat(1_000);

      expect(fetchPeerHealth).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(3_000);

      expect(fetchPeerHealth).toHaveBeenCalledTimes(4);
    } finally {
      vi.useRealTimers();
    }
  });

  it("is idempotent: a second start does not add another timer", async () => {
    vi.useFakeTimers();
    try {
      startPeerHeartbeat(1_000);
      startPeerHeartbeat(1_000);

      await vi.advanceTimersByTimeAsync(3_000);

      expect(fetchPeerHealth).toHaveBeenCalledTimes(4);
    } finally {
      vi.useRealTimers();
    }
  });

  it("probes again immediately when restarted after stop", async () => {
    vi.useFakeTimers();
    try {
      startPeerHeartbeat(1_000);
      expect(fetchPeerHealth).toHaveBeenCalledTimes(1);

      stopPeerHeartbeat();
      startPeerHeartbeat(1_000);

      expect(fetchPeerHealth).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("stopPeerHeartbeat", () => {
  it("halts further probes", async () => {
    vi.useFakeTimers();
    try {
      startPeerHeartbeat(1_000);
      stopPeerHeartbeat();

      await vi.advanceTimersByTimeAsync(5_000);

      expect(fetchPeerHealth).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("is safe to call when no heartbeat is running", () => {
    expect(() => stopPeerHeartbeat()).not.toThrow();
  });
});
