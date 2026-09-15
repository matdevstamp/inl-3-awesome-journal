import { AuthError } from "@/lib/auth";
import { fail, ok } from "@/lib/api/http";
import { requireRoleOrMock } from "@/lib/api/mock-auth";
import {
  findPatient,
  getJournalForPatient,
  isStaffRole,
  patientIdForUser,
} from "@/lib/patients/mock-patients";
import type { PatientJournalResponse } from "@/lib/types/api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireRoleOrMock(request, "doctor", "nurse", "ambulance", "patient");
    const { id } = await context.params;
    const patientId = Number(id);

    if (!Number.isInteger(patientId)) {
      return fail("BAD_PATIENT_ID", "Patient id must be a number.", 400);
    }

    const ownPatientId = patientIdForUser(user);
    const canOpenJournal = isStaffRole(user.role) || ownPatientId === patientId;

    if (!canOpenJournal) {
      return fail("UNAUTHORIZED", "Patients can only open their own journal.", 403);
    }

    const patient = findPatient(patientId);
    if (!patient) {
      return fail("PATIENT_NOT_FOUND", "Patient could not be found.", 404);
    }

    const journal = getJournalForPatient(patientId, user.role);

    return ok({
      patient,
      viewerRole: user.role,
      isOwnJournal: ownPatientId === patientId,
      ...journal,
    } satisfies PatientJournalResponse);
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.code, error.message, error.code === "UNAUTHENTICATED" ? 401 : 403);
    }
    return fail("PATIENT_JOURNAL_FAILED", "Could not load patient journal.", 500);
  }
}
