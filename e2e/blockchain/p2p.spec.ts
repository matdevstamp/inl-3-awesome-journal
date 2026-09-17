import { expect, test } from "@playwright/test";
import { Peer } from "../../src/lib/p2p/peer";
import { serverPeer, syncServerPeer } from "../../src/app/api/p2p/server-peer";
import { checkPeerHealth, fetchAccessLogsFromPeer } from "../../src/lib/p2p/transport";

test("propagates an access log from Hospital S to Ambulance A", () => {
  const hospital = new Peer("hospital-s");
  const ambulance = new Peer("ambulance-a");

  const accessLog = {
    eventId: "event-p2p-1",
    userId: 1,
    patientId: 2,
    recordId: null,
    action: "view",
    serverId: hospital.id,
    timestamp: "2026-09-15T12:00:00Z",
  };

  hospital.blockchain.addAccessLog(accessLog);
  ambulance.receiveAccessLog(accessLog);

  expect(hospital.blockchain.chain).toHaveLength(1);
  expect(ambulance.blockchain.chain).toHaveLength(1);

  expect(ambulance.blockchain.chain[0]?.data).toEqual(accessLog);
  expect(ambulance.blockchain.isValid()).toBe(true);
});

test("does not add the same access log twice", () => {
  const ambulance = new Peer("ambulance-a");

  const accessLog = {
    eventId: "event-duplicate-1",
    userId: 1,
    patientId: 2,
    recordId: null,
    action: "view",
    serverId: "hospital-s",
    timestamp: "2026-09-15T12:00:00Z",
  };

  ambulance.receiveAccessLog(accessLog);
  ambulance.receiveAccessLog(accessLog);

  expect(ambulance.blockchain.chain).toHaveLength(1);
});
test("rejects an invalid access log", () => {
  const ambulance = new Peer("ambulance-a");

  const invalidAccessLog = {
    eventId: "",
    userId: 1,
    patientId: 2,
    recordId: null,
    action: "view",
    serverId: "hospital-s",
    timestamp: "2026-09-15T12:00:00Z",
  };

  ambulance.receiveAccessLog(invalidAccessLog);

  expect(ambulance.blockchain.chain).toHaveLength(0);
});
test("receives an access log through a P2P message", () => {
  const ambulance = new Peer("ambulance-a");

  const message = {
    type: "access_log" as const,
    from: "hospital-s",
    timestamp: "2026-09-16T09:30:00Z",
    data: {
      eventId: "event-message-1",
      userId: 1,
      patientId: 2,
      recordId: null,
      action: "view",
      serverId: "hospital-s",
      timestamp: "2026-09-16T09:30:00Z",
    },
  };

  ambulance.receiveMessage(message);

  expect(ambulance.blockchain.chain).toHaveLength(1);
  expect(ambulance.blockchain.chain[0]?.data.eventId).toBe("event-message-1");
});
test("peers can discover each other", () => {
  const hospital = new Peer("hospital-s");
  const ambulance = new Peer("ambulance-a");

  hospital.addPeer(ambulance);

  expect(hospital.peers).toContain(ambulance);
});
test("does not add the same peer twice", () => {
  const hospital = new Peer("hospital-s");
  const ambulance = new Peer("ambulance-a");

  hospital.addPeer(ambulance);
  hospital.addPeer(ambulance);

  expect(hospital.peers).toHaveLength(1);
});
test("broadcasts an access log to connected peers", () => {
  const hospital = new Peer("hospital-s");
  const ambulance = new Peer("ambulance-a");

  hospital.addPeer(ambulance);

  const accessLog = {
    eventId: "event-broadcast-1",
    userId: 1,
    patientId: 2,
    recordId: null,
    action: "view",
    serverId: hospital.id,
    timestamp: "2026-09-16T10:00:00Z",
  };

  hospital.broadcastAccessLog(accessLog);

  expect(ambulance.blockchain.chain).toHaveLength(1);
  expect(ambulance.blockchain.chain[0]?.data.eventId).toBe("event-broadcast-1");
});
test("P2P access-log endpoint accepts an access log message", async ({ request }) => {
  const response = await request.post("/api/p2p/access-log", {
    data: {
      type: "access_log",
      from: "hospital-s",
      timestamp: "2026-09-16T14:00:00Z",
      data: {
        eventId: "event-network-1",
        userId: 1,
        patientId: 2,
        recordId: null,
        action: "view",
        serverId: "hospital-s",
        timestamp: "2026-09-16T14:00:00Z",
      },
    },
  });

  expect(response.ok()).toBeTruthy();
});
test("P2P endpoint returns the received access log", async ({ request }) => {
  const accessLog = {
    eventId: "event-network-2",
    userId: 1,
    patientId: 2,
    recordId: null,
    action: "view",
    serverId: "hospital-s",
    timestamp: "2026-09-16T15:00:00Z",
  };

  const response = await request.post("/api/p2p/access-log", {
    data: {
      type: "access_log",
      from: "hospital-s",
      timestamp: "2026-09-16T15:00:00Z",
      data: accessLog,
    },
  });

  expect(response.ok()).toBeTruthy();

  const body = await response.json();

  expect(body.data.data.eventId).toBe("event-network-2");
});
test("P2P endpoint stores the received access log in the server blockchain", async ({
  request,
}) => {
  const accessLog = {
    eventId: "event-network-store-1",
    userId: 1,
    patientId: 2,
    recordId: null,
    action: "view",
    serverId: "hospital-s",
    timestamp: "2026-09-16T15:30:00Z",
  };

  const response = await request.post("/api/p2p/access-log", {
    data: {
      type: "access_log",
      from: "hospital-s",
      timestamp: "2026-09-16T15:30:00Z",
      data: accessLog,
    },
  });

  const body = await response.json();

  expect(response.ok()).toBeTruthy();
  expect(body.stored).toBe(true);
});
test("syncs a real patient access log from Hospital S to Ambulance A", async ({ request }) => {
  const eventBefore = await request.get("http://localhost:3002/api/access-log");
  expect(eventBefore.ok()).toBeTruthy();

  const patientResponse = await request.get("http://localhost:3001/api/patients/1", {
    headers: {
      "x-mock-role": "doctor",
      "x-mock-user-id": "1",
    },
  });

  expect(patientResponse.ok()).toBeTruthy();

  const ambulanceResponse = await request.get("http://localhost:3002/api/access-log");

  expect(ambulanceResponse.ok()).toBeTruthy();

  const body = await ambulanceResponse.json();

  const syncedLog = body.data.accessLogs.find(
    (log: { patientId: number; action: string; serverId: string }) =>
      log.patientId === 1 && log.action === "view" && log.serverId === "hospital-s",
  );

  expect(syncedLog).toBeDefined();
  expect(body.data.chainValid).toBe(true);
});
test("rejects a P2P message with a forged server identity", () => {
  const ambulance = new Peer("ambulance-a");

  const message = {
    type: "access_log" as const,
    from: "ambulance-a",
    timestamp: "2026-09-16T16:00:00Z",
    data: {
      eventId: "event-forged-1",
      userId: 1,
      patientId: 2,
      recordId: null,
      action: "view",
      serverId: "hospital-s",
      timestamp: "2026-09-16T16:00:00Z",
    },
  };

  ambulance.receiveMessage(message);

  expect(ambulance.blockchain.chain).toHaveLength(0);
});
test("detects when the configured peer is healthy", async () => {
  const isHealthy = await checkPeerHealth();

  expect(isHealthy).toBe(true);
});

test("reports an unavailable peer as unhealthy", async () => {
  const isHealthy = await checkPeerHealth("http://localhost:3999");

  expect(isHealthy).toBe(false);
});

test("fetches access logs from a healthy peer", async () => {
  const accessLogs = await fetchAccessLogsFromPeer("http://localhost:3002");

  expect(Array.isArray(accessLogs)).toBe(true);
});
test("recovers access logs from a peer after reconnecting", async () => {
  const chainLengthBefore = serverPeer.blockchain.chain.length;

  await syncServerPeer();

  expect(serverPeer.blockchain.isValid()).toBe(true);
  expect(serverPeer.blockchain.chain.length).toBeGreaterThanOrEqual(chainLengthBefore);
});
test("handles simultaneous access-log events", () => {
  const hospital = new Peer("hospital-s");
  const ambulance = new Peer("ambulance-a");

  hospital.addPeer(ambulance);

  const accessLogs = [
    {
      eventId: "event-simultaneous-1",
      userId: 1,
      patientId: 1,
      recordId: null,
      action: "view",
      serverId: "hospital-s",
      timestamp: "2026-09-17T12:00:00Z",
    },
    {
      eventId: "event-simultaneous-2",
      userId: 2,
      patientId: 2,
      recordId: null,
      action: "view",
      serverId: "hospital-s",
      timestamp: "2026-09-17T12:00:00Z",
    },
  ];

  accessLogs.forEach((accessLog) => {
    hospital.blockchain.addAccessLog(accessLog);
    hospital.broadcastAccessLog(accessLog);
  });

  expect(hospital.blockchain.chain).toHaveLength(2);
  expect(ambulance.blockchain.chain).toHaveLength(2);
  expect(hospital.blockchain.isValid()).toBe(true);
  expect(ambulance.blockchain.isValid()).toBe(true);
});
