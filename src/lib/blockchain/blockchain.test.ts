import { describe, expect, it } from "vitest";

import { Block } from "@/lib/blockchain/block";
import { Blockchain } from "@/lib/blockchain/blockchain";
import type { BlockchainAccessLog } from "@/lib/blockchain/access-log";

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

describe("Block", () => {
  it("hashes deterministically from index, timestamp, data and previousHash", () => {
    const data = accessLog();

    const first = new Block(0, data.timestamp, data);
    const second = new Block(0, data.timestamp, data);

    expect(first.hash).toBe(second.hash);
    expect(first.hash).toHaveLength(64);
  });

  it("changes the hash when any field changes", () => {
    const data = accessLog();
    const base = new Block(0, data.timestamp, data).hash;

    expect(new Block(1, data.timestamp, data).hash).not.toBe(base);
    expect(new Block(0, "2026-09-29T11:00:00.000Z", data).hash).not.toBe(base);
    expect(new Block(0, data.timestamp, accessLog({ action: "edit" })).hash).not.toBe(base);
    expect(new Block(0, data.timestamp, data, "deadbeef").hash).not.toBe(base);
  });

  it("defaults previousHash to an empty string for the genesis block", () => {
    expect(new Block(0, "2026-09-29T10:00:00.000Z", accessLog()).previousHash).toBe("");
  });
});

describe("Blockchain.addAccessLog", () => {
  it("returns the block it added", () => {
    const blockchain = new Blockchain();
    const data = accessLog();

    const block = blockchain.addAccessLog(data);

    expect(block.data).toEqual(data);
    expect(blockchain.chain).toHaveLength(1);
  });

  it("links each new block to the previous hash", () => {
    const blockchain = new Blockchain();

    blockchain.addAccessLog(accessLog());
    const second = blockchain.addAccessLog(accessLog());

    expect(second.index).toBe(1);
    expect(second.previousHash).toBe(blockchain.chain[0]?.hash);
  });

  it("uses the genesis previousHash sentinel for the first block", () => {
    const blockchain = new Blockchain();

    const first = blockchain.addAccessLog(accessLog());

    expect(first.previousHash).toBe("0");
  });

  it("orders blocks by timestamp, not insertion order", () => {
    const blockchain = new Blockchain();
    const older = accessLog({ timestamp: "2026-01-01T00:00:00.000Z" });
    const newer = accessLog({ timestamp: "2026-12-31T00:00:00.000Z" });

    blockchain.addAccessLog(newer);
    const lateOlderBlock = blockchain.addAccessLog(older);

    expect(blockchain.chain.map((block) => block.data.timestamp)).toEqual([
      older.timestamp,
      newer.timestamp,
    ]);
    expect(lateOlderBlock.index).toBe(0);
  });

  it("breaks timestamp ties deterministically by eventId", () => {
    const timestamp = "2026-09-29T10:00:00.000Z";
    const blockchain = new Blockchain();

    blockchain.addAccessLog(accessLog({ timestamp, eventId: "event-b" }));
    blockchain.addAccessLog(accessLog({ timestamp, eventId: "event-a" }));

    expect(blockchain.chain.map((block) => block.data.eventId)).toEqual(["event-a", "event-b"]);
  });

  it("keeps the chain valid after a late out-of-order arrival", () => {
    const blockchain = new Blockchain();

    blockchain.addAccessLog(accessLog({ timestamp: "2026-02-01T00:00:00.000Z" }));
    blockchain.addAccessLog(accessLog({ timestamp: "2026-03-01T00:00:00.000Z" }));
    blockchain.addAccessLog(accessLog({ timestamp: "2026-01-01T00:00:00.000Z" }));

    expect(blockchain.chain.map((block) => block.index)).toEqual([0, 1, 2]);
    expect(blockchain.isValid()).toBe(true);
  });
});

describe("Blockchain.isValid", () => {
  it("accepts an empty chain", () => {
    expect(new Blockchain().isValid()).toBe(true);
  });

  it("accepts a chain built through addAccessLog", () => {
    const blockchain = new Blockchain();

    for (let i = 0; i < 5; i += 1) blockchain.addAccessLog(accessLog());

    expect(blockchain.isValid()).toBe(true);
  });

  it("detects tampered payload data", () => {
    const blockchain = new Blockchain();
    blockchain.addAccessLog(accessLog({ eventId: "a", action: "view" }));
    blockchain.addAccessLog(accessLog({ eventId: "b", action: "view" }));

    const victim = blockchain.chain[1];
    if (!victim) throw new Error("expected a second block");
    victim.data.action = "delete";

    expect(blockchain.isValid()).toBe(false);
  });

  it("detects a rewritten previousHash link", () => {
    const blockchain = new Blockchain();
    blockchain.addAccessLog(accessLog({ eventId: "a" }));
    blockchain.addAccessLog(accessLog({ eventId: "b" }));

    const second = blockchain.chain[1];
    if (!second) throw new Error("expected a second block");
    second.previousHash = "0";

    expect(blockchain.isValid()).toBe(false);
  });

  it("detects a removed block", () => {
    const blockchain = new Blockchain();
    blockchain.addAccessLog(accessLog({ eventId: "a" }));
    blockchain.addAccessLog(accessLog({ eventId: "b" }));
    blockchain.addAccessLog(accessLog({ eventId: "c" }));

    blockchain.chain.splice(1, 1);

    expect(blockchain.isValid()).toBe(false);
  });
});
