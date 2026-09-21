import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthError, requireRole } from "@/lib/auth";
import { fail, ok } from "@/lib/api/http";
import { isStaffRole, patientIdForUser } from "@/lib/patients/mock-patients";
import { logNoteAccess } from "@/lib/notes/log";
import { serializeNote } from "@/lib/notes/serialization";
import { prisma } from "@/lib/prisma";
import { NOTE_VISIBILITIES } from "@/lib/types/api";
import type { NoteListResponse, NoteMutationResponse } from "@/lib/types/api";

const createNoteSchema = z.object({
  recordId: z.number().int().positive(),
  text: z.string().trim().min(1).max(1000),
  visibility: z.enum(NOTE_VISIBILITIES),
});

export async function GET(request: Request) {
  try {
    const user = await requireRole("doctor", "nurse", "ambulance", "patient");

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

    const canOpenJournal = isStaffRole(user.role) || patientIdForUser(user) === record.patientId;

    if (!canOpenJournal) {
      await logNoteAccess(user.id, record.patientId, record.id, "view_denied");
      return fail("UNAUTHORIZED", "Patients can only read their own journal notes.", 403);
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

    const isHealthcare = isStaffRole(user.role);

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
      notes: visibleNotes.map(serializeNote),
      hiddenNotesCount,
    } satisfies NoteListResponse);
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.code, error.message, error.code === "UNAUTHENTICATED" ? 401 : 403);
    }
    console.error("Failed to load notes:", error);
    return fail("NOTES_FAILED", "Could not load notes", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("doctor", "nurse", "ambulance");

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
        content: parsed.data.text,
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
          note: serializeNote(note),
        },
      } satisfies { ok: true; data: NoteMutationResponse },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.code, error.message, error.code === "UNAUTHENTICATED" ? 401 : 403);
    }
    console.error("Failed to create note:", error);
    return fail("NOTE_CREATE_FAILED", "Could not create note", 500);
  }
}
