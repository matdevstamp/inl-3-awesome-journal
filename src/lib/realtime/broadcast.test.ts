import { beforeEach, describe, expect, it, vi } from "vitest";

import { HOSPITAL_ID } from "@/test-utils/session";

/**
 * broadcast.ts fans a note/access-log event out to the sockets in a patient's
 * room, using the same visibility rule as the REST routes. The socket server is
 * mocked with a fake `io.in().fetchSockets()` so we assert exactly which
 * sockets received which event.
 */

const inSpy = vi.fn();
const getSocketServer = vi.fn();

vi.mock("@/lib/realtime/socket-server", () => ({
  getSocketServer: () => getSocketServer(),
}));

const { broadcastNoteCreated, broadcastAccessLogCreated } =
  await import("@/lib/realtime/broadcast");

type Socket = { data: { user?: unknown }; emit: ReturnType<typeof vi.fn> };

function socket(user?: unknown): Socket {
  return { data: user === undefined ? {} : { user }, emit: vi.fn() };
}

/** Wire the fake io so `io.in(room)` resolves to the given sockets. */
function roomHas(sockets: Socket[]) {
  inSpy.mockReturnValue({ fetchSockets: () => Promise.resolve(sockets) });
  getSocketServer.mockReturnValue({ in: inSpy });
}

const staff = {
  id: 1,
  username: "dr_test",
  role: "doctor",
  organizationId: HOSPITAL_ID,
  patientId: null,
};
const ownPatient = {
  id: 4,
  username: "anna_test",
  role: "patient",
  organizationId: null,
  patientId: 1,
};
const otherPatient = {
  id: 5,
  username: "bo_test",
  role: "patient",
  organizationId: null,
  patientId: 2,
};

const note = (visibility: "all" | "healthcare" | "private", authorUserId: number) => ({
  id: 1,
  recordId: 1,
  text: "note",
  visibility,
  authorUserId,
  author: "dr_test",
  createdAt: "2026-09-29T10:00:00.000Z",
  updatedAt: "2026-09-29T10:00:00.000Z",
});

const accessLog = {
  eventId: "e-1",
  userId: 1,
  patientId: 1,
  recordId: 1,
  action: "read",
  serverId: "hospital-s",
  timestamp: "2026-09-29T10:00:00.000Z",
};

beforeEach(() => {
  inSpy.mockReset();
  getSocketServer.mockReset();
});

describe("broadcastNoteCreated", () => {
  it("subscribes to the patient's room", async () => {
    roomHas([]);

    await broadcastNoteCreated(1, note("all", 1));

    expect(inSpy).toHaveBeenCalledWith("patient:1");
  });

  it("delivers a healthcare note to staff", async () => {
    const staffSocket = socket(staff);
    roomHas([staffSocket]);

    await broadcastNoteCreated(1, note("healthcare", 1));

    expect(staffSocket.emit).toHaveBeenCalledWith("note-created", {
      patientId: 1,
      note: note("healthcare", 1),
    });
  });

  it("delivers an `all` note to the patient's own socket", async () => {
    const patientSocket = socket(ownPatient);
    roomHas([patientSocket]);

    await broadcastNoteCreated(1, note("all", 1));

    expect(patientSocket.emit).toHaveBeenCalledWith("note-created", {
      patientId: 1,
      note: note("all", 1),
    });
  });

  it("hides a healthcare note from the patient it is about", async () => {
    // Matches the REST rule: `healthcare` is staff-only, even for the patient.
    const patientSocket = socket(ownPatient);
    roomHas([patientSocket]);

    await broadcastNoteCreated(1, note("healthcare", 1));

    expect(patientSocket.emit).not.toHaveBeenCalled();
  });

  it("hides a healthcare note from a patient viewing a different patient", async () => {
    const stranger = socket(otherPatient);
    roomHas([stranger]);

    await broadcastNoteCreated(1, note("healthcare", 1));

    expect(stranger.emit).not.toHaveBeenCalled();
  });

  it("hides a private note from staff who did not write it", async () => {
    const staffSocket = socket(staff);
    roomHas([staffSocket]);

    await broadcastNoteCreated(1, note("private", 99));

    expect(staffSocket.emit).not.toHaveBeenCalled();
  });

  it("delivers a private note to its author", async () => {
    const authorSocket = socket(staff);
    roomHas([authorSocket]);

    await broadcastNoteCreated(1, note("private", 1));

    expect(authorSocket.emit).toHaveBeenCalledTimes(1);
  });

  it("skips a socket that has not authenticated yet", async () => {
    const anonymous = socket();
    roomHas([anonymous]);

    await broadcastNoteCreated(1, note("all", 1));

    expect(anonymous.emit).not.toHaveBeenCalled();
  });
});

describe("broadcastAccessLogCreated", () => {
  it("subscribes to the room of the logged patient", async () => {
    roomHas([]);

    await broadcastAccessLogCreated(accessLog);

    expect(inSpy).toHaveBeenCalledWith("patient:1");
  });

  it("delivers the log to staff and to the patient the log is about", async () => {
    const staffSocket = socket(staff);
    const patientSocket = socket(ownPatient);
    roomHas([staffSocket, patientSocket]);

    await broadcastAccessLogCreated(accessLog);

    const payload = { accessLog };
    expect(staffSocket.emit).toHaveBeenCalledWith("access-log-created", payload);
    expect(patientSocket.emit).toHaveBeenCalledWith("access-log-created", payload);
  });

  it("hides the log from an unrelated patient", async () => {
    const stranger = socket(otherPatient);
    roomHas([stranger]);

    await broadcastAccessLogCreated(accessLog);

    expect(stranger.emit).not.toHaveBeenCalled();
  });

  it("skips a socket with no session", async () => {
    const anonymous = socket();
    roomHas([anonymous]);

    await broadcastAccessLogCreated(accessLog);

    expect(anonymous.emit).not.toHaveBeenCalled();
  });

  it("resolves when the room is empty", async () => {
    roomHas([]);

    await expect(broadcastAccessLogCreated(accessLog)).resolves.toBeUndefined();
  });
});
