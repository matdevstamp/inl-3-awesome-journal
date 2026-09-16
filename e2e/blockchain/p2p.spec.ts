import { expect, test } from "@playwright/test";
import { Peer } from "../../src/lib/p2p/peer";

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
