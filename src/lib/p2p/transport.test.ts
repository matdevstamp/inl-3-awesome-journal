import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  checkPeerHealth,
  fetchAccessLogsFromPeer,
  fetchPeerHealth,
  sendAccessLogToPeer,
  sendNoteToPeer,
} from "@/lib/p2p/transport";
import {
  getPeerSecret,
  isPeerAuthorized,
  peerAuthHeaders,
  PEER_SECRET_HEADER,
} from "@/lib/p2p/peer-auth";
import type { BlockchainAccessLog } from "@/lib/blockchain/access-log";
import type { Note } from "@/lib/types/api";

const PEER_URL = "http://localhost:3002";

function accessLog(): BlockchainAccessLog {
  return {
    eventId: "event-1",
    userId: 1,
    patientId: 1,
    recordId: 1,
    action: "view",
    serverId: "hospital-s",
    timestamp: "2026-09-29T10:00:00.000Z",
  };
}

function note(): Note {
  return {
    id: 1,
    recordId: 1,
    text: "Follow-up in six months.",
    visibility: "healthcare",
    authorUserId: 2,
    author: "nurse_test",
    createdAt: "2026-09-29T10:00:00.000Z",
    updatedAt: "2026-09-29T10:00:00.000Z",
  };
}

function jsonResponse(body: unknown, init: { status?: number; ok?: boolean } = {}) {
  const status = init.status ?? 200;
  return {
    ok: init.ok ?? status < 400,
    status,
    json: async () => body,
  } as unknown as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("peer auth", () => {
  it("authorizes a request carrying the shared secret", () => {
    const request = new Request("http://localhost:3001/api/p2p/note", {
      headers: { [PEER_SECRET_HEADER]: getPeerSecret() },
    });

    expect(isPeerAuthorized(request)).toBe(true);
  });

  it("rejects a missing or wrong secret", () => {
    expect(isPeerAuthorized(new Request("http://localhost:3001/api/p2p/note"))).toBe(false);
    expect(
      isPeerAuthorized(
        new Request("http://localhost:3001/api/p2p/note", {
          headers: { [PEER_SECRET_HEADER]: "guess" },
        }),
      ),
    ).toBe(false);
  });

  it("exposes the secret as a header for outgoing calls", () => {
    expect(peerAuthHeaders()).toEqual({ [PEER_SECRET_HEADER]: getPeerSecret() });
  });
});

describe("sendAccessLogToPeer", () => {
  it("posts an access_log envelope with the peer auth header", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await sendAccessLogToPeer(accessLog());

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${PEER_URL}/api/p2p/access-log`);
    expect(init.method).toBe("POST");
    expect(init.headers[PEER_SECRET_HEADER]).toBe(getPeerSecret());

    const payload = JSON.parse(init.body) as {
      type: string;
      from: string;
      data: BlockchainAccessLog;
    };
    expect(payload.type).toBe("access_log");
    expect(payload.from).toBe("hospital-s");
    expect(payload.data).toEqual(accessLog());
  });

  it("forwards a relayed log under the origin server, not the local one", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    // syncServerPeer re-pushes logs this server received from its peer, so the
    // envelope must name the peer as the originator. Stamping the local id
    // would trip the peer's `from === data.serverId` check and drop the log.
    await sendAccessLogToPeer({
      ...accessLog(),
      eventId: "event-from-peer",
      serverId: "ambulance-a",
    });

    const [, init] = fetchMock.mock.calls[0] ?? [];
    const payload = JSON.parse(init.body) as {
      from: string;
      data: BlockchainAccessLog;
    };

    expect(payload.data.serverId).toBe("ambulance-a");
    expect(payload.from).toBe("ambulance-a");
  });

  it("warns instead of throwing when the peer rejects the sync", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, { status: 500 }));

    await expect(sendAccessLogToPeer(accessLog())).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("Peer sync failed with status 500"),
    );
  });

  it("keeps the local log when the peer is unreachable", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(sendAccessLogToPeer(accessLog())).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("remains stored locally"),
      expect.any(Error),
    );
  });
});

describe("sendNoteToPeer", () => {
  it("posts a note_created envelope tagged with the patient id", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await sendNoteToPeer(7, note());

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${PEER_URL}/api/p2p/note`);
    const payload = JSON.parse(init.body) as { type: string; patientId: number };
    expect(payload).toMatchObject({ type: "note_created", patientId: 7 });
  });

  it("does not throw when the peer is unreachable", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(sendNoteToPeer(7, note())).resolves.toBeUndefined();
  });
});

describe("fetchPeerHealth", () => {
  it("returns the peer identity and a check timestamp", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { status: "ok", server: "ambulance-a" } }));

    const health = await fetchPeerHealth();

    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${PEER_URL}/api/health`);
    expect(health.healthy).toBe(true);
    expect(health.serverId).toBe("ambulance-a");
    expect(Date.parse(health.lastCheckedAt)).not.toBeNaN();
  });

  it("throws on a non-ok HTTP status", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, { status: 503 }));

    await expect(fetchPeerHealth()).rejects.toThrow("status 503");
  });

  it("throws when the peer reports an unhealthy status", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { status: "degraded", server: "x" } }));

    await expect(fetchPeerHealth()).rejects.toThrow("unhealthy status");
  });

  it("falls back to an empty server id when the payload omits it", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { status: "ok" } }));

    expect((await fetchPeerHealth()).serverId).toBe("");
  });
});

describe("checkPeerHealth", () => {
  it("reports healthy when the probe succeeds", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { status: "ok", server: "ambulance-a" } }));

    expect(await checkPeerHealth()).toBe(true);
  });

  it("reports unhealthy without throwing when the peer is down", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    expect(await checkPeerHealth()).toBe(false);
  });
});

describe("fetchAccessLogsFromPeer", () => {
  it("returns the peer chain when it verifies", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: { accessLogs: [accessLog()], chainValid: true } }),
    );

    expect(await fetchAccessLogsFromPeer()).toEqual([accessLog()]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${PEER_URL}/api/p2p/access-log`);
  });

  it("throws on a non-ok response", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, { status: 500 }));

    await expect(fetchAccessLogsFromPeer()).rejects.toThrow("status 500");
  });

  it("refuses to ingest a chain the peer reports as invalid", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: { accessLogs: [accessLog()], chainValid: false } }),
    );

    await expect(fetchAccessLogsFromPeer()).rejects.toThrow("blockchain is invalid");
  });
});
