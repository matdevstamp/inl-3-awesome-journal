import { AuthError, requireRole } from "@/lib/auth";
import { fail, ok } from "@/lib/api/http";
import { createAccessLog } from "@/lib/blockchain/access-log-service";
import { env } from "@/lib/env";
import { sendAccessLogToPeer } from "@/lib/p2p/transport";
import { getDatabasePatientJournal } from "@/lib/patients/journal";
import { isStaffRole, patientIdForUser } from "@/lib/patients/mock-patients";
import type { PatientJournalResponse } from "@/lib/types/api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireRole("doctor", "nurse", "ambulance", "patient");
    const { id } = await context.params;
    const patientId = Number(id);

    if (!Number.isSafeInteger(patientId) || patientId <= 0) {
      return fail("BAD_PATIENT_ID", "Patient id must be a number.", 400);
    }

    const ownPatientId = patientIdForUser(user);
    const canOpenJournal = isStaffRole(user.role) || ownPatientId === patientId;

    if (!canOpenJournal) {
      const block = createAccessLog({
        userId: user.id,
        patientId,
        recordId: null,
        action: "view_denied",
        serverId: env.serverId,
      });

      await sendAccessLogToPeer(block.data);

      return fail("UNAUTHORIZED", "Patients can only open their own journal.", 403);
    }

    const journal = await getDatabasePatientJournal(patientId, user);
    if (!journal) {
      const block = createAccessLog({
        userId: user.id,
        patientId,
        recordId: null,
        action: "view_not_found",
        serverId: env.serverId,
      });

      await sendAccessLogToPeer(block.data);

      return fail("PATIENT_NOT_FOUND", "Patient could not be found.", 404);
    }

    const block = createAccessLog({
      userId: user.id,
      patientId,
      recordId: null,
      action: "view",
      serverId: env.serverId,
    });
    await sendAccessLogToPeer(block.data);

    return ok(journal satisfies PatientJournalResponse);
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.code, error.message, error.code === "UNAUTHENTICATED" ? 401 : 403);
    }
    return fail("PATIENT_JOURNAL_FAILED", "Could not load patient journal.", 500);
  }
}
