import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * logNoteAccess is the seam every note-reading route calls. It must write to
 * the chain with this server's id, and it must await the peer sync so a note
 * read is never only local.
 */

const createAccessLog = vi.fn();
vi.mock("@/lib/blockchain/access-log-service", () => ({ createAccessLog }));

const sendAccessLogToPeer = vi.fn();
vi.mock("@/lib/p2p/transport", () => ({ sendAccessLogToPeer }));

const { logNoteAccess } = await import("@/lib/notes/log");

beforeEach(() => {
  createAccessLog.mockReset().mockReturnValue({ data: { action: "view" } });
  sendAccessLogToPeer.mockReset().mockResolvedValue(undefined);
});

describe("logNoteAccess", () => {
  it("records the event against this server's id", async () => {
    await logNoteAccess(1, 2, 3, "view");

    expect(createAccessLog).toHaveBeenCalledWith({
      userId: 1,
      patientId: 2,
      recordId: 3,
      action: "view",
      serverId: process.env.SERVER_ID,
    });
  });

  it("forwards the new block to the peer", async () => {
    await logNoteAccess(1, 2, 3, "view");

    expect(sendAccessLogToPeer).toHaveBeenCalledWith({ action: "view" });
  });

  it("awaits the peer sync before resolving", async () => {
    const order: string[] = [];
    sendAccessLogToPeer.mockImplementation(() => {
      order.push("peer");
      return Promise.resolve();
    });
    createAccessLog.mockImplementation(() => {
      order.push("local");
      return { data: {} };
    });

    await logNoteAccess(1, 2, 3, "view");

    expect(order).toEqual(["local", "peer"]);
  });

  it("propagates a peer-sync failure to the caller", async () => {
    sendAccessLogToPeer.mockRejectedValue(new Error("peer down"));

    await expect(logNoteAccess(1, 2, 3, "view")).rejects.toThrow("peer down");
  });
});
