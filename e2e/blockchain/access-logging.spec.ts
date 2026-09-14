import { expect, test } from "@playwright/test";
import { Blockchain } from "../../src/lib/blockchain/blockchain";

test.describe("blockchain access logging", () => {
  test("adds an access log to the blockchain", () => {
    const blockchain = new Blockchain();

    const accessLog = {
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
});