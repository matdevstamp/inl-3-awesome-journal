import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * access-log-service owns the single in-process chain and must never let a
 * failing realtime broadcast lose an audit event, so the broadcast is fire and
 * forget and the block is returned before it settles.
 */

const broadcastAccessLogCreated = vi.fn();
vi.mock("@/lib/realtime/broadcast", () => ({ broadcastAccessLogCreated }));

const { createAccessLog, getAccessLogBlockchain } =
  await import("@/lib/blockchain/access-log-service");

const input = {
  userId: 1,
  patientId: 2,
  action: "view",
  serverId: "hospital-s",
};

beforeEach(() => {
  broadcastAccessLogCreated.mockReset().mockResolvedValue(undefined);
});

describe("createAccessLog", () => {
  it("appends a block carrying the event data", () => {
    const block = createAccessLog(input);

    expect(block.data).toMatchObject({
      userId: 1,
      patientId: 2,
      recordId: null,
      action: "view",
      serverId: "hospital-s",
    });
  });

  it("gives every event a distinct eventId", () => {
    const first = createAccessLog(input);
    const second = createAccessLog(input);

    expect(first.data.eventId).toMatch(/^[0-9a-f-]{36}$/);
    expect(first.data.eventId).not.toBe(second.data.eventId);
  });

  it("stamps the event with an ISO timestamp", () => {
    const { timestamp } = createAccessLog(input).data;

    expect(Date.parse(timestamp)).not.toBeNaN();
  });

  it("keeps an explicit recordId", () => {
    expect(createAccessLog({ ...input, recordId: 7 }).data.recordId).toBe(7);
  });

  it("defaults a missing recordId to null", () => {
    expect(createAccessLog(input).data.recordId).toBeNull();
  });

  it("broadcasts the log to the sockets in the patient's room", () => {
    const block = createAccessLog(input);

    expect(broadcastAccessLogCreated).toHaveBeenCalledWith(block.data);
  });

  it("still returns the block when the broadcast rejects", async () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    broadcastAccessLogCreated.mockRejectedValue(new Error("socket down"));

    const block = createAccessLog(input);
    await vi.waitFor(() => expect(consoleWarn).toHaveBeenCalled());

    expect(block.data.action).toBe("view");
    consoleWarn.mockRestore();
  });
});

describe("getAccessLogBlockchain", () => {
  it("returns the same chain instance every call", () => {
    expect(getAccessLogBlockchain()).toBe(getAccessLogBlockchain());
  });

  it("accumulates every logged event", () => {
    const before = getAccessLogBlockchain().chain.length;

    createAccessLog({ ...input, action: "create" });
    createAccessLog({ ...input, action: "edit" });

    expect(getAccessLogBlockchain().chain.length).toBe(before + 2);
  });

  it("stays valid after logging", () => {
    createAccessLog(input);

    expect(getAccessLogBlockchain().isValid()).toBe(true);
  });
});
