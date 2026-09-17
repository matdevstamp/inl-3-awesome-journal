import { expect, test } from "@playwright/test";
import { Blockchain } from "../../src/lib/blockchain/blockchain";
import {
  createAccessLog,
  getAccessLogBlockchain,
} from "../../src/lib/blockchain/access-log-service";

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
  test("blocks anonymous users from reading access logs", async ({ request }) => {
    const response = await request.get("/api/access-log");

    expect(response.status()).toBe(401);

    const body = await response.json();

    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });
  test("patient can only read access logs for their own journal", async ({ request }) => {
    const createOwnLog = await request.get("/api/patients/1", {
      headers: {
        "x-mock-role": "doctor",
        "x-mock-user-id": "1",
      },
    });

    expect(createOwnLog.status()).toBe(200);

    const createOtherLog = await request.get("/api/patients/2", {
      headers: {
        "x-mock-role": "doctor",
        "x-mock-user-id": "1",
      },
    });

    expect(createOtherLog.status()).toBe(200);

    const response = await request.get("/api/access-log", {
      headers: {
        "x-mock-role": "patient",
        "x-mock-user-id": "4",
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.ok).toBe(true);
    expect(body.data.accessLogs.length).toBeGreaterThan(0);

    for (const log of body.data.accessLogs) {
      expect(log.patientId).toBe(1);
    }
  });
  test("staff can read access logs", async ({ request }) => {
    createAccessLog({
      userId: 1,
      patientId: 1,
      action: "view",
      serverId: "hospital-s",
    });

    createAccessLog({
      userId: 2,
      patientId: 2,
      action: "view",
      serverId: "hospital-s",
    });

    const response = await request.get("/api/access-log", {
      headers: {
        "x-mock-role": "doctor",
        "x-mock-user-id": "1",
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.ok).toBe(true);

    const patientIds = body.data.accessLogs.map((log: { patientId: number }) => log.patientId);

    expect(patientIds).toContain(1);
    expect(patientIds).toContain(2);
  });
  test("logs a denied patient access attempt", async ({ request }) => {
    const response = await request.get("/api/patients/2", {
      headers: {
        "x-mock-role": "patient",
        "x-mock-user-id": "4",
      },
    });

    expect(response.status()).toBe(403);

    const logResponse = await request.get("/api/access-log", {
      headers: {
        "x-mock-role": "doctor",
        "x-mock-user-id": "1",
      },
    });

    expect(logResponse.status()).toBe(200);

    const body = await logResponse.json();

    const deniedLog = body.data.accessLogs.find(
      (log: { userId: number; patientId: number; action: string }) =>
        log.userId === 4 && log.patientId === 2 && log.action === "view_denied",
    );

    expect(deniedLog).toBeDefined();
  });
  test("logs an access attempt when patient is not found", async ({ request }) => {
    const response = await request.get("/api/patients/999", {
      headers: {
        "x-mock-role": "doctor",
        "x-mock-user-id": "1",
      },
    });

    expect(response.status()).toBe(404);

    const logResponse = await request.get("/api/access-log", {
      headers: {
        "x-mock-role": "doctor",
        "x-mock-user-id": "1",
      },
    });

    expect(logResponse.status()).toBe(200);

    const body = await logResponse.json();

    const notFoundLog = body.data.accessLogs.find(
      (log: { userId: number; patientId: number; action: string }) =>
        log.userId === 1 && log.patientId === 999 && log.action === "view_not_found",
    );

    expect(notFoundLog).toBeDefined();
  });
});
