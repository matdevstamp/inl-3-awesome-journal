/**
 * Shared API types — the single source of truth for the request/response
 * contract between route handlers and client components (kickoff decision:
 * no OpenAPI/generated client; both sides live in one TS codebase).
 */

/** The five supported access roles. */
export const ROLES = ["doctor", "nurse", "ambulance", "patient", "unauthorized"] as const;
export type Role = (typeof ROLES)[number];

/** Note visibility levels. */
export const NOTE_VISIBILITIES = ["private", "healthcare", "all"] as const;
export type NoteVisibility = (typeof NOTE_VISIBILITIES)[number];

/** Authenticated session user, decoded from the JWT / session cookie. */
export interface SessionUser {
  id: number;
  username: string;
  role: Role;
  organizationId: number | null;
}

/** Standard envelope for every JSON API response. */
export type ApiResponse<T> =
  { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

/** GET /api/health payload. */
export interface HealthData {
  status: "ok";
  server: string;
  timestamp: string;
}

/** POST /api/auth/login request payload. */
export interface LoginRequest {
  username: string;
  password: string;
}

/** POST /api/auth/login response payload (no token — it lives in an httpOnly cookie). */
export interface LoginResponse {
  user: SessionUser;
}
