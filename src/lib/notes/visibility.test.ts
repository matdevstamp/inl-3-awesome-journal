import { describe, expect, it } from "vitest";

import { ROLES, type Role, type SessionUser } from "@/lib/types/api";
import { makeSessionUser } from "@/test-utils/session";
import {
  canViewNote,
  DEFAULT_NOTE_VISIBILITY,
  NOTE_VISIBILITY_LABELS,
  visibleNotes,
} from "@/lib/notes/visibility";

const user = (role: Role, overrides: Partial<SessionUser> = {}) =>
  makeSessionUser(role, { organizationId: null, patientId: null, ...overrides });

const STAFF = ["doctor", "nurse", "ambulance"] as const;

describe("canViewNote", () => {
  it("shows `all` notes to every role that may read a journal", () => {
    for (const role of ROLES.filter((candidate) => candidate !== "unauthorized")) {
      expect(canViewNote({ visibility: "all", authorUserId: 99 }, user(role))).toBe(true);
    }
  });

  it("denies a role without journal access even for an `all` note", () => {
    expect(canViewNote({ visibility: "all", authorUserId: 1 }, user("unauthorized"))).toBe(false);
  });

  it("shows `healthcare` notes to staff and hides them from patients", () => {
    for (const role of STAFF) {
      expect(canViewNote({ visibility: "healthcare", authorUserId: 99 }, user(role))).toBe(true);
    }
    expect(canViewNote({ visibility: "healthcare", authorUserId: 1 }, user("patient"))).toBe(false);
    expect(canViewNote({ visibility: "healthcare", authorUserId: 1 }, user("unauthorized"))).toBe(
      false,
    );
  });

  it("shows a `private` note only to its author", () => {
    const author = user("nurse", { id: 2 });

    expect(canViewNote({ visibility: "private", authorUserId: 2 }, author)).toBe(true);
    expect(canViewNote({ visibility: "private", authorUserId: 2 }, user("doctor", { id: 1 }))).toBe(
      false,
    );
    expect(
      canViewNote({ visibility: "private", authorUserId: 2 }, user("patient", { id: 4 })),
    ).toBe(false);
  });

  it("lets a patient read their own private note", () => {
    const patient = user("patient", { id: 4, patientId: 1 });

    expect(canViewNote({ visibility: "private", authorUserId: 4 }, patient)).toBe(true);
  });
});

describe("visibleNotes", () => {
  const notes = [
    { id: 1, visibility: "all" as const, authorUserId: 2 },
    { id: 2, visibility: "healthcare" as const, authorUserId: 2 },
    { id: 3, visibility: "private" as const, authorUserId: 1 },
    { id: 4, visibility: "private" as const, authorUserId: 2 },
  ];

  it("returns every note for a staff viewer except other authors' private notes", () => {
    expect(visibleNotes(notes, user("doctor", { id: 1 })).map((note) => note.id)).toEqual([
      1, 2, 3,
    ]);
  });

  it("returns only `all` notes for a patient viewer", () => {
    expect(
      visibleNotes(notes, user("patient", { id: 4, patientId: 1 })).map((note) => note.id),
    ).toEqual([1]);
  });

  it("returns nothing for the unauthorized role", () => {
    expect(visibleNotes(notes, user("unauthorized"))).toEqual([]);
  });

  it("hides other authors' private notes from the unauthorized role's author claim", () => {
    // The `unauthorized` role has no permissions, so even an author match fails.
    expect(visibleNotes(notes, user("unauthorized", { id: 2 }))).toEqual([]);
  });

  it("preserves input order", () => {
    const viewer = user("nurse", { id: 2 });

    expect(visibleNotes(notes, viewer).map((note) => note.id)).toEqual([1, 2, 4]);
  });
});

describe("visibility constants", () => {
  it("defaults new notes to healthcare", () => {
    expect(DEFAULT_NOTE_VISIBILITY).toBe("healthcare");
  });

  it("labels every visibility level", () => {
    expect(Object.keys(NOTE_VISIBILITY_LABELS).sort()).toEqual(["all", "healthcare", "private"]);
  });
});
