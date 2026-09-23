import { z } from "zod";

import { AuthError, requireRole } from "@/lib/auth";
import { fail, ok } from "@/lib/api/http";
import { searchDatabasePatients } from "@/lib/patients/search";
import type { PatientSearchFilter, PatientSearchResponse } from "@/lib/types/api";

const searchSchema = z.object({
  query: z.string().trim().max(200),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  filters: z.array(z.enum(["name", "dob", "personalNumber"])).max(3),
});

export async function GET(request: Request) {
  try {
    const user = await requireRole("doctor", "nurse", "ambulance");

    const url = new URL(request.url);
    const parsed = searchSchema.safeParse({
      query: url.searchParams.get("q") ?? url.searchParams.get("name") ?? "",
      page: url.searchParams.get("page") ?? undefined,
      filters: url.searchParams.getAll("filter"),
    });
    if (!parsed.success) {
      return fail("INVALID_REQUEST", "Invalid patient search parameters.", 400);
    }
    const { query, page } = parsed.data;
    const filters: PatientSearchFilter[] = parsed.data.filters.length
      ? parsed.data.filters
      : ["name"];
    const result = await searchDatabasePatients(query, filters, page, user.id);

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
