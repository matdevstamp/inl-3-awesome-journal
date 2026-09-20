import { NextResponse } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api/http";
import { getSessionOrMock } from "@/lib/api/mock-auth";
import { createAccessLog } from "@/lib/blockchain/access-log-service";
import { env } from "@/lib/env";
import { sendAccessLogToPeer } from "@/lib/p2p/transport";
import { prisma } from "@/lib/prisma";
import { NOTE_VISIBILITIES } from "@/lib/types/api";

const HEALTHCARE_ROLES = ["doctor", "nurse", "ambulance"] as const;

const createNoteSchema = z.object({
  recordId: z.number().int().positive(),
  content: z.string().trim().min(1).max(1000),
  visibility: z.enum(NOTE_VISIBILITIES),
});

async function logNoteAccess(userId: number, patientId: number, recordId: number, action: string) {
  const block = createAccessLog({
    userId,
    patientId,
    recordId,
    action,
    serverId: env.serverId,
  });

  await sendAccessLogToPeer(block.data);
}

export async function GET(request: Request) {
  try {
    const user = await getSessionOrMock(request);

    if (!user) {
      return fail("UNAUTHENTICATED", "Authentication required", 401);
    }

    if (user.role === "unauthorized") {
      return fail("UNAUTHORIZED", "You do not have access to notes", 403);
    }

    const url = new URL(request.url);
    const recordIdParam = url.searchParams.get("recordId");
    const recordId = Number(recordIdParam);

    if (!recordIdParam || !Number.isInteger(recordId) || recordId <= 0) {
      return fail("INVALID_REQUEST", "A valid recordId is required", 400);
    }

    const record = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      select: {
        id: true,
        patientId: true,
      },
    });

    if (!record) {
      return fail("NOT_FOUND", "Medical record not found", 404);
    }

    const notes = await prisma.note.findMany({
      where: { recordId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const isHealthcare = HEALTHCARE_ROLES.some((role) => role === user.role);

    const visibleNotes = notes.filter((note) => {
      if (note.visibility === "all") return true;

      if (note.visibility === "healthcare") {
        return isHealthcare;
      }

      if (note.visibility === "private") {
        return note.authorId === user.id;
      }

      return false;
    });

    const hiddenNotesCount = notes.length - visibleNotes.length;

    await logNoteAccess(user.id, record.patientId, record.id, "view");

    return ok({
      notes: visibleNotes.map((note) => ({
        id: note.id,
        recordId: note.recordId,
        content: note.content,
        visibility: note.visibility,
        authorUserId: note.authorId,
        author: note.author.username,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      })),
      hiddenNotesCount,
    });
  } catch (error) {
    console.error("Failed to load notes:", error);
    return fail("NOTES_FAILED", "Could not load notes", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionOrMock(request);

    if (!user) {
      return fail("UNAUTHENTICATED", "Authentication required", 401);
    }

    if (!HEALTHCARE_ROLES.some((role) => role === user.role)) {
      return fail("UNAUTHORIZED", "Only healthcare staff can create notes", 403);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return fail("INVALID_REQUEST", "Invalid request body", 400);
    }

    const parsed = createNoteSchema.safeParse(body);

    if (!parsed.success) {
      return fail("INVALID_REQUEST", "Invalid note data", 400);
    }

    const record = await prisma.medicalRecord.findUnique({
      where: {
        id: parsed.data.recordId,
      },
      select: {
        id: true,
        patientId: true,
      },
    });

    if (!record) {
      return fail("NOT_FOUND", "Medical record not found", 404);
    }

    const note = await prisma.note.create({
      data: {
        recordId: record.id,
        authorId: user.id,
        content: parsed.data.content,
        visibility: parsed.data.visibility,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    await logNoteAccess(user.id, record.patientId, record.id, "create");

    return NextResponse.json(
      {
        ok: true,
        data: {
          note: {
            id: note.id,
            recordId: note.recordId,
            content: note.content,
            visibility: note.visibility,
            authorUserId: note.authorId,
            author: note.author.username,
            createdAt: note.createdAt.toISOString(),
            updatedAt: note.updatedAt.toISOString(),
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create note:", error);
    return fail("NOTE_CREATE_FAILED", "Could not create note", 500);
  }
}
