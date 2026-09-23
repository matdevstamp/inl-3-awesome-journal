import { prisma } from "@/lib/prisma";
import type { PatientJournalResponse, SessionUser } from "@/lib/types/api";

export async function getDatabasePatientJournal(patientId: number, viewer: SessionUser) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      records: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
          author: true,
          notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
  if (!patient) return null;

  const isOwnJournal = viewer.role === "patient";
  const notes = patient.records.flatMap((record) => record.notes);
  const visibleNotes = notes.filter((note) =>
    isOwnJournal
      ? note.visibility === "all"
      : note.visibility !== "private" || note.authorId === viewer.id,
  );
  const formatDate = (date: Date) => date.toISOString().slice(0, 10);

  return {
    patient: {
      id: patient.id,
      name: `${patient.firstName} ${patient.lastName}`,
      dateOfBirth: formatDate(patient.dateOfBirth),
      personalNumber: patient.personalNumber,
      recordCount: patient.records.length,
      noteCount: visibleNotes.length,
      lastVisit: patient.records[0] ? formatDate(patient.records[0].createdAt) : "-",
    },
    viewerRole: viewer.role,
    viewerUserId: viewer.id,
    isOwnJournal,
    records: patient.records.map((record) => ({
      id: record.id,
      date: formatDate(record.createdAt),
      title: record.recordType,
      practitioner: record.author.username,
      summary: record.content,
    })),
    notes: visibleNotes.map((note) => ({
      id: note.id,
      createdAt: note.createdAt.toISOString(),
      author: note.author.username,
      authorUserId: note.authorId,
      visibility: note.visibility,
      text: note.content,
    })),
    hiddenNotesCount: isOwnJournal
      ? notes.filter((note) => note.visibility === "healthcare").length
      : 0,
    accessLogs: [],
  } satisfies PatientJournalResponse;
}
