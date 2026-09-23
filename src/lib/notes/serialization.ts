import type { Note } from "@/lib/types/api";

interface PrismaNote {
  id: number;
  recordId: number;
  content: string;
  visibility: Note["visibility"];
  authorId: number;
  author: { id: number; username: string };
  createdAt: Date;
  updatedAt: Date;
}

/** Map a Prisma note row to the shared API Note shape. */
export function serializeNote(note: PrismaNote): Note {
  return {
    id: note.id,
    recordId: note.recordId,
    text: note.content,
    visibility: note.visibility,
    authorUserId: note.authorId,
    author: note.author.username,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}
