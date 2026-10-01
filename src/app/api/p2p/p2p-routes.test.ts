import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * P2P inbound endpoints. These are the only unauthenticated-by-session routes;
 * they are protected by the shared peer secret, and they validate the message
 * shape before anything reaches the chain or a patient's socket room.
 */

const receiveMessage = vi.fn();
const serverPeer = { receiveMessage, addPeer: vi.fn(), blockchain: { chain: [] } };

vi.mock("@/app/api/p2p/server-peer", () => ({
  serverPeer,
  syncServerPeer: vi.fn(),
}));

const broadcastNoteCreated = vi.fn();
vi.mock("@/lib/realtime/broadcast", () => ({ broadcastNoteCreated }));

const getAccessLogBlockchain = vi.fn();
vi.mock("@/lib/blockchain/access-log-service", () => ({
  getAccessLogBlockchain: () => getAccessLogBlockchain(),
}));

const { POST: postAccessLog, GET: getAccessLogRoute } =
  await import("@/app/api/p2p/access-log/route");
const { POST: postNote } = await import("@/app/api/p2p/note/route");
import { peerAuthHeaders } from "@/lib/p2p/peer-auth";

function request(body: unknown, path: string, authorized = true) {
  return new Request(`http://localhost:3002${path}`, {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json", ...(authorized ? peerAuthHeaders() : {}) },
  });
}

const accessLogMessage = {
  type: "access_log",
  from: "hospital-s",
  timestamp: "2026-09-29T10:00:00.000Z",
  data: {
    eventId: "e-1",
    userId: 1,
    patientId: 1,
    recordId: 1,
    action: "view",
    serverId: "hospital-s",
    timestamp: "2026-09-29T10:00:00.000Z",
  },
};

const noteMessage = {
  type: "note_created",
  from: "hospital-s",
  timestamp: "2026-09-29T10:00:00.000Z",
  patientId: 1,
  data: {
    id: 1,
    recordId: 1,
    text: "note",
    visibility: "healthcare",
    authorUserId: 1,
    author: "dr_test",
    createdAt: "2026-09-29T10:00:00.000Z",
    updatedAt: "2026-09-29T10:00:00.000Z",
  },
};

beforeEach(() => {
  receiveMessage.mockReset().mockReturnValue("stored");
  broadcastNoteCreated.mockReset().mockResolvedValue(undefined);
  getAccessLogBlockchain.mockReset().mockReturnValue({
    chain: [{ data: accessLogMessage.data }],
    isValid: () => true,
  });
});

describe("POST /api/p2p/access-log", () => {
  it("rejects a peer without the shared secret", async () => {
    const response = await postAccessLog(request(accessLogMessage, "/api/p2p/access-log", false));

    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe("Unauthorized peer");
  });

  it("does not touch the chain for an unauthorized peer", async () => {
    await postAccessLog(request(accessLogMessage, "/api/p2p/access-log", false));

    expect(receiveMessage).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON", async () => {
    const response = await postAccessLog(request("{oops", "/api/p2p/access-log"));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Invalid JSON");
  });

  it.each([
    ["a null body", "null"],
    ["a wrong type tag", { ...accessLogMessage, type: "note_created" }],
    ["a missing data payload", { ...accessLogMessage, data: undefined }],
    ["a blank eventId", { ...accessLogMessage, data: { ...accessLogMessage.data, eventId: "  " } }],
    [
      "a non-numeric userId",
      { ...accessLogMessage, data: { ...accessLogMessage.data, userId: "1" } },
    ],
    ["a missing action", { ...accessLogMessage, data: { ...accessLogMessage.data, action: null } }],
  ])("rejects %s with 400", async (_label, body) => {
    const response = await postAccessLog(request(body, "/api/p2p/access-log"));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Invalid P2P access-log message");
  });

  it("accepts a null recordId, which is what a journal-level event carries", async () => {
    const body = { ...accessLogMessage, data: { ...accessLogMessage.data, recordId: null } };

    const response = await postAccessLog(request(body, "/api/p2p/access-log"));

    expect(response.status).toBe(200);
  });

  it("stores a valid message and echoes it", async () => {
    const response = await postAccessLog(request(accessLogMessage, "/api/p2p/access-log"));
    const json = (await response.json()) as { ok: boolean; stored: boolean; data: unknown };

    expect(response.status).toBe(200);
    expect(json).toMatchObject({ ok: true, stored: true, data: accessLogMessage });
    expect(receiveMessage).toHaveBeenCalledWith(accessLogMessage);
  });

  it("returns 400 when the peer rejects the message", async () => {
    receiveMessage.mockReturnValue("rejected");

    const response = await postAccessLog(request(accessLogMessage, "/api/p2p/access-log"));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Access log was rejected");
  });

  it("reports a duplicate as a successful no-op rather than an error", async () => {
    // The two-way sync re-sends every eventId, so a duplicate must not 400 or
    // the sender logs a sync failure on every round-trip.
    receiveMessage.mockReturnValue("duplicate");

    const response = await postAccessLog(request(accessLogMessage, "/api/p2p/access-log"));
    const body = (await response.json()) as { ok: boolean; stored: boolean };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.stored).toBe(false);
  });
});

describe("GET /api/p2p/access-log", () => {
  it("serves the local chain and its validity to an authenticated peer", async () => {
    const response = await getAccessLogRoute();

    const body = (await response.json()) as {
      ok: boolean;
      data: { accessLogs: unknown[]; chainValid: boolean };
    };

    expect(body.ok).toBe(true);
    expect(body.data.chainValid).toBe(true);
    expect(body.data.accessLogs).toEqual([accessLogMessage.data]);
  });
});

describe("POST /api/p2p/note", () => {
  it("rejects a peer without the shared secret", async () => {
    const response = await postNote(request(noteMessage, "/api/p2p/note", false));

    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe("Unauthorized peer");
  });

  it("does not broadcast for an unauthorized peer", async () => {
    await postNote(request(noteMessage, "/api/p2p/note", false));

    expect(broadcastNoteCreated).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON", async () => {
    const response = await postNote(request("{oops", "/api/p2p/note"));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Invalid JSON");
  });

  it.each([
    ["a wrong type tag", { ...noteMessage, type: "access_log" }],
    ["a missing patientId", { ...noteMessage, patientId: undefined }],
    ["a string patientId", { ...noteMessage, patientId: "1" }],
    ["a null data payload", { ...noteMessage, data: null }],
  ])("rejects %s with 400", async (_label, body) => {
    const response = await postNote(request(body, "/api/p2p/note"));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Invalid P2P note message");
  });

  it("broadcasts an accepted note into the patient's room", async () => {
    const response = await postNote(request(noteMessage, "/api/p2p/note"));

    expect(response.status).toBe(200);
    expect(broadcastNoteCreated).toHaveBeenCalledWith(1, noteMessage.data);
  });

  it("lets the shared visibility rule filter the broadcast", async () => {
    await postNote(request(noteMessage, "/api/p2p/note"));

    // broadcastNoteCreated is the real decision point; it is covered in its own
    // suite, so here we only assert the raw note is forwarded untouched.
    expect(broadcastNoteCreated.mock.calls[0]?.[1].visibility).toBe("healthcare");
  });
});
