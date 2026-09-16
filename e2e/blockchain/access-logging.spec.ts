import { expect, test } from "@playwright/test";
import { Blockchain } from "../../src/lib/blockchain/blockchain";
import { createAccessLog, getAccessLogBlockchain } from "../../src/lib/blockchain/access-log-service";

test.describe("blockchain access logging", () => {
  test("adds an access log to the blockchain", () => {
    const blockchain = new Blockchain();

    const accessLog = {
      eventId: "event-1",
      userId: 1,
      patientId: 10,
      recordId: 100,
      action: "view",
      serverId: "server-1",
      timestamp: "2026-09-14T12:00:00Z",
    };

    blockchain.addAccessLog(accessLog);

    expect(blockchain.chain).toHaveLength(1);
    expect(blockchain.chain[0]?.data).toEqual(accessLog);
    expect(blockchain.isValid()).toBe(true);
  });

  test("detects tampering with an access log", () => {
  const blockchain = new Blockchain();

  const accessLog = {
    eventId: "event-2",
    userId: 1,
    patientId: 10,
    recordId: 100,
    action: "view",
    serverId: "server-1",
    timestamp: "2026-09-14T12:00:00Z",
  };

  blockchain.addAccessLog(accessLog);

  // Someone changes data after the block was created
  blockchain.chain[0]!.data.action = "edit";

  expect(blockchain.isValid()).toBe(false);
});
test("does not store medical record content on the blockchain", () => {
  const blockchain = new Blockchain();

  const accessLog = {
    eventId: "event-3",
    userId: 1,
    patientId: 10,
    recordId: 100,
    action: "view",
    serverId: "server-1",
    timestamp: "2026-09-14T12:00:00Z",
  };

  blockchain.addAccessLog(accessLog);

  const storedData = blockchain.chain[0]?.data;

  expect(storedData).not.toHaveProperty("content");
  expect(storedData).not.toHaveProperty("note");
  expect(storedData).not.toHaveProperty("personalNumber");
});
test("creates a blockchain log for a journal view", () => {
  const blockchain = getAccessLogBlockchain();
  const before = blockchain.chain.length;

  createAccessLog({
    userId: 1,
    patientId: 10,
    action: "view",
    serverId: "hospital-s",
  });

  expect(blockchain.chain).toHaveLength(before + 1);

  const block = blockchain.chain.at(-1);

  expect(block?.data.userId).toBe(1);
  expect(block?.data.patientId).toBe(10);
  expect(block?.data.action).toBe("view");
  expect(block?.data.recordId).toBeNull();
});
test("returns access logs and blockchain status", async ({ request }) => {
  const response = await request.get("/api/access-log");

  expect(response.ok()).toBeTruthy();

  const body = await response.json();

  expect(body.ok).toBe(true);
  expect(body.data.accessLogs).toBeDefined();
  expect(body.data.chainValid).toBe(true);
});
});