import { z } from "zod";

import { fail, ok } from "@/lib/api/http";
import { getSessionOrMock } from "@/lib/api/mock-auth";
import { createAccessLog } from "@/lib/blockchain/access-log-service";
import { env } from "@/lib/env";
import { sendAccessLogToPeer } from "@/lib/p2p/transport";
import { prisma } from "@/lib/prisma";
import { NOTE_VISIBILITIES } from "@/lib/types/api";

const HEALTHCARE_ROLES = ["doctor", "nurse", "ambulance"] as const;

const updateNoteSchema = z
  .object({
    content: z.string().trim().min(1).max(1000).optional(),
    visibility: z.enum(NOTE_VISIBILITIES).optional(),
  })
  .refine((data) => data.content !== undefined || data.visibility !== undefined);

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function logNoteOperation(
  userId: number,
  patientId: number,
  recordId: number,
  action: string,
) {
  const block = createAccessLog({
    userId,
    patientId,
    recordId,
    action,
    serverId: env.serverId,
  });

  await sendAccessLogToPeer(block.data);
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getSessionOrMock(request);

    if (!user) {
      return fail("UNAUTHENTICATED", "Authentication required", 401);
    }

    if (!HEALTHCARE_ROLES.some((role) => role === user.role)) {
      return fail("UNAUTHORIZED", "You cannot edit notes", 403);
    }

    const { id } = await context.params;
    const noteId = Number(id);

    if (!Number.isInteger(noteId) || noteId <= 0) {
      return fail("INVALID_REQUEST", "Invalid note id", 400);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return fail("INVALID_REQUEST", "Invalid request body", 400);
    }

    const parsed = updateNoteSchema.safeParse(body);

    if (!parsed.success) {
      return fail("INVALID_REQUEST", "Invalid note data", 400);
    }

    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        record: {
          select: {
            patientId: true,
          },
        },
      },
    });

    if (!note) {
      return fail("NOT_FOUND", "Note not found", 404);
    }

    if (note.authorId !== user.id) {
      return fail("UNAUTHORIZED", "Only the note author can edit this note", 403);
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: parsed.data,
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    await logNoteOperation(user.id, note.record.patientId, note.recordId, "edit");

    return ok({
      note: {
        id: updatedNote.id,
        recordId: updatedNote.recordId,
        content: updatedNote.content,
        visibility: updatedNote.visibility,
        authorUserId: updatedNote.authorId,
        author: updatedNote.author.username,
        createdAt: updatedNote.createdAt.toISOString(),
        updatedAt: updatedNote.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to edit note:", error);
    return fail("NOTE_EDIT_FAILED", "Could not edit note", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await getSessionOrMock(request);

    if (!user) {
      return fail("UNAUTHENTICATED", "Authentication required", 401);
    }

    if (!HEALTHCARE_ROLES.some((role) => role === user.role)) {
      return fail("UNAUTHORIZED", "You cannot delete notes", 403);
    }

    const { id } = await context.params;
    const noteId = Number(id);

    if (!Number.isInteger(noteId) || noteId <= 0) {
      return fail("INVALID_REQUEST", "Invalid note id", 400);
    }

    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        record: {
          select: {
            patientId: true,
          },
        },
      },
    });

    if (!note) {
      return fail("NOT_FOUND", "Note not found", 404);
    }

    if (note.authorId !== user.id) {
      return fail("UNAUTHORIZED", "Only the note author can delete this note", 403);
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    await logNoteOperation(user.id, note.record.patientId, note.recordId, "delete");

    return ok({
      deletedId: noteId,
    });
  } catch (error) {
    console.error("Failed to delete note:", error);
    return fail("NOTE_DELETE_FAILED", "Could not delete note", 500);
  }
}
