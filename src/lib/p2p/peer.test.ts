import { describe, expect, it } from "vitest";

import { Peer } from "@/lib/p2p/peer";
import { Blockchain } from "@/lib/blockchain/blockchain";
import type { BlockchainAccessLog } from "@/lib/blockchain/access-log";
import type { P2PAccessLogMessage } from "@/lib/p2p/message";

let counter = 0;

function accessLog(overrides: Partial<BlockchainAccessLog> = {}): BlockchainAccessLog {
  counter += 1;
  return {
    eventId: `event-${counter}`,
    userId: 1,
    patientId: 1,
    recordId: 1,
    action: "view",
    serverId: "hospital-s",
    timestamp: `2026-09-29T10:00:${String(counter).padStart(2, "0")}.000Z`,
    ...overrides,
  };
}

function message(overrides: Partial<P2PAccessLogMessage> = {}): P2PAccessLogMessage {
  const data = overrides.data ?? accessLog();
  return {
    type: "access_log",
    from: data.serverId,
    timestamp: data.timestamp,
    data,
    ...overrides,
  };
}

describe("Peer.receiveAccessLog", () => {
  it("stores a new log", () => {
    const peer = new Peer("hospital-s");

    expect(peer.receiveAccessLog(accessLog())).toBe("stored");
    expect(peer.blockchain.chain).toHaveLength(1);
  });

  it("reports a duplicate eventId as a no-op, not a failure", () => {
    // syncServerPeer is a two-way sync, so the same eventId always comes back.
    const peer = new Peer("hospital-s");
    const data = accessLog();

    peer.receiveAccessLog(data);

    expect(peer.receiveAccessLog(data)).toBe("duplicate");
    expect(peer.blockchain.chain).toHaveLength(1);
  });

  it("rejects a log with a blank eventId", () => {
    const peer = new Peer("hospital-s");

    expect(peer.receiveAccessLog(accessLog({ eventId: "   " }))).toBe("rejected");
    expect(peer.blockchain.chain).toHaveLength(0);
  });

  it("shares the injected blockchain instance", () => {
    const blockchain = new Blockchain();
    const peer = new Peer("hospital-s", blockchain);

    peer.receiveAccessLog(accessLog());

    expect(blockchain.chain).toHaveLength(1);
  });
});

describe("Peer.receiveMessage", () => {
  it("accepts a well-formed access_log message", () => {
    const peer = new Peer("hospital-s");

    expect(peer.receiveMessage(message())).toBe("stored");
  });

  it("rejects a message whose type is not access_log", () => {
    const peer = new Peer("hospital-s");
    const forged = { ...message(), type: "note_created" } as unknown as P2PAccessLogMessage;

    expect(peer.receiveMessage(forged)).toBe("rejected");
    expect(peer.blockchain.chain).toHaveLength(0);
  });

  it("rejects a message that claims to come from a different server than its data", () => {
    const peer = new Peer("hospital-s");
    const data = accessLog({ serverId: "hospital-s" });

    expect(peer.receiveMessage(message({ from: "attacker", data }))).toBe("rejected");
    expect(peer.blockchain.chain).toHaveLength(0);
  });

  it("passes a duplicate through as a duplicate", () => {
    const peer = new Peer("hospital-s");
    const envelope = message();

    peer.receiveMessage(envelope);

    expect(peer.receiveMessage(envelope)).toBe("duplicate");
  });
});

describe("Peer.addPeer", () => {
  it("registers a new peer once", () => {
    const peer = new Peer("hospital-s");

    peer.addPeer(new Peer("ambulance-a"));
    peer.addPeer(new Peer("ambulance-a"));

    expect(peer.peers.map((candidate) => candidate.id)).toEqual(["ambulance-a"]);
  });
});

describe("Peer.broadcastAccessLog", () => {
  it("delivers the log to every registered peer", () => {
    const source = new Peer("hospital-s");
    const first = new Peer("ambulance-a");
    const second = new Peer("clinic-b");
    source.addPeer(first);
    source.addPeer(second);
    const data = accessLog();

    source.broadcastAccessLog(data);

    expect(first.blockchain.chain.map((block) => block.data.eventId)).toEqual([data.eventId]);
    expect(second.blockchain.chain.map((block) => block.data.eventId)).toEqual([data.eventId]);
  });

  it("is idempotent: re-delivery does not duplicate blocks on the peers", () => {
    const source = new Peer("hospital-s");
    const target = new Peer("ambulance-a");
    source.addPeer(target);
    const data = accessLog();

    source.broadcastAccessLog(data);
    source.broadcastAccessLog(data);

    expect(target.blockchain.chain).toHaveLength(1);
  });

  it("converges two peers that received the same logs in a different order", () => {
    const first = new Peer("hospital-s");
    const second = new Peer("ambulance-a");
    const older = accessLog({ timestamp: "2026-01-01T00:00:00.000Z" });
    const newer = accessLog({ timestamp: "2026-06-01T00:00:00.000Z" });

    first.receiveAccessLog(newer);
    first.receiveAccessLog(older);
    second.receiveAccessLog(older);
    second.receiveAccessLog(newer);

    expect(first.blockchain.chain.map((block) => block.hash)).toEqual(
      second.blockchain.chain.map((block) => block.hash),
    );
    expect(first.blockchain.isValid()).toBe(true);
    expect(second.blockchain.isValid()).toBe(true);
  });
});
