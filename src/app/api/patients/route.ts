import { AuthError } from "@/lib/auth";
import { fail, ok } from "@/lib/api/http";
import { requireRoleOrMock } from "@/lib/api/mock-auth";
import { DEFAULT_PATIENT_FILTERS, searchPatients } from "@/lib/patients/mock-patients";
import type { PatientSearchFilter, PatientSearchResponse } from "@/lib/types/api";

const VALID_FILTERS = new Set<PatientSearchFilter>(["name", "dob", "personalNumber"]);

export async function GET(request: Request) {
  try {
    await requireRoleOrMock(request, "doctor", "nurse", "ambulance");

    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "";
    const page = Number(url.searchParams.get("page") ?? "1");
    const filters = parseFilters(url.searchParams.getAll("filter"));
    const result = searchPatients(query, filters, Number.isFinite(page) ? page : 1);

    return ok({
      ...result,
      query,
      filters,
    } satisfies PatientSearchResponse);
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.code, error.message, error.code === "UNAUTHENTICATED" ? 401 : 403);
    }
    return fail("PATIENT_SEARCH_FAILED", "Could not search patients.", 500);
  }
}

function parseFilters(values: string[]): PatientSearchFilter[] {
  const filters = values.filter((value): value is PatientSearchFilter =>
    VALID_FILTERS.has(value as PatientSearchFilter),
  );
  return filters.length > 0 ? filters : DEFAULT_PATIENT_FILTERS;
}
