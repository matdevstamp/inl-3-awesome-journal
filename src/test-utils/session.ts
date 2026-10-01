import type { Role, SessionUser } from "@/lib/types/api";

/**
 * Test-only factories. Lives outside `src/lib` and is excluded from coverage so
 * the suite does not duplicate the same `SessionUser` builder in every file.
 */

/** Seeded organization ids (prisma/seed.js). */
export const HOSPITAL_ID = 1;
export const AMBULANCE_ID = 2;

export function makeSessionUser(role: Role, overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: 1,
    username: `${role}_test`,
    role,
    organizationId: role === "patient" ? null : HOSPITAL_ID,
    patientId: role === "patient" ? 1 : null,
    ...overrides,
  };
}
