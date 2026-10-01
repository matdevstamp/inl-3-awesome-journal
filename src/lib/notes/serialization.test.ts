import { describe, expect, it } from "vitest";

import { serializeNote } from "@/lib/notes/serialization";

function prismaNote(overrides: Partial<Parameters<typeof serializeNote>[0]> = {}) {
  return {
    id: 7,
    recordId: 1,
    content: "Follow-up in six months.",
    visibility: "healthcare" as const,
    authorId: 2,
    author: { id: 2, username: "nurse_test" },
    createdAt: new Date("2026-09-29T10:00:00.000Z"),
    updatedAt: new Date("2026-09-29T11:00:00.000Z"),
    ...overrides,
  };
}

describe("serializeNote", () => {
  it("maps the Prisma row onto the shared API Note shape", () => {
    expect(serializeNote(prismaNote())).toEqual({
      id: 7,
      recordId: 1,
      text: "Follow-up in six months.",
      visibility: "healthcare",
      authorUserId: 2,
      author: "nurse_test",
      createdAt: "2026-09-29T10:00:00.000Z",
      updatedAt: "2026-09-29T11:00:00.000Z",
    });
  });

  it("renames content to text and authorId to authorUserId", () => {
    const note = serializeNote(prismaNote({ content: "x", authorId: 5 }));

    expect(note.text).toBe("x");
    expect(note.authorUserId).toBe(5);
    expect(note).not.toHaveProperty("content");
    expect(note).not.toHaveProperty("authorId");
  });

  it("serialises timestamps as ISO strings", () => {
    const note = serializeNote(prismaNote());

    expect(typeof note.createdAt).toBe("string");
    expect(typeof note.updatedAt).toBe("string");
  });

  it("passes every visibility level through unchanged", () => {
    for (const visibility of ["private", "healthcare", "all"] as const) {
      expect(serializeNote(prismaNote({ visibility })).visibility).toBe(visibility);
    }
  });
});
