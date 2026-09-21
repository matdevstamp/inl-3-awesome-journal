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
  /** Last-known status of the configured peer, kept fresh by the heartbeat. */
  peer?: {
    healthy: boolean | null;
    serverId: string | null;
    lastCheckedAt: string | null;
  };
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

/** Patient search filters supported by task 13. */
export type PatientSearchFilter = "name" | "dob" | "personalNumber";

/** Patient summary shown in search results. */
export interface PatientSummary {
  id: number;
  name: string;
  dateOfBirth: string;
  personalNumber: string;
  recordCount: number;
  noteCount: number;
  lastVisit: string;
}

/** GET /api/patients search payload. */
export interface PatientSearchResponse {
  patients: PatientSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  query: string;
  filters: PatientSearchFilter[];
}

/** Role-filtered medical record preview for the journal page. */
export interface MedicalRecordPreview {
  id: number;
  date: string;
  title: string;
  practitioner: string;
  summary: string;
}

/** Role-filtered note preview for the journal page. */
export interface JournalNotePreview {
  id: number;
  createdAt: string;
  author: string;
  authorUserId: number;
  visibility: NoteVisibility;
  text: string;
}

/** A single note returned by the notes API. */
export interface Note {
  id: number;
  recordId: number;
  text: string;
  visibility: NoteVisibility;
  authorUserId: number;
  author: string;
  createdAt: string;
  updatedAt: string;
}

/** GET /api/notes payload. */
export interface NoteListResponse {
  notes: Note[];
  hiddenNotesCount: number;
}

/** POST /api/notes request payload. */
export interface CreateNoteRequest {
  recordId: number;
  text: string;
  visibility: NoteVisibility;
}

/** PATCH /api/notes/[id] request payload (at least one field is required). */
export interface UpdateNoteRequest {
  text?: string;
  visibility?: NoteVisibility;
}

/** POST /api/notes and PATCH /api/notes/[id] payload. */
export interface NoteMutationResponse {
  note: Note;
}

/** DELETE /api/notes/[id] payload. */
export interface NoteDeleteResponse {
  deletedId: number;
}

/** Access event preview for patient and staff views. */
export interface AccessLogPreview {
  id: number;
  timestamp: string;
  actorName: string;
  actorRole: Role;
  action: "viewed" | "created_note" | "updated_record";
  verified: boolean;
}

/** GET /api/patients/[id] journal payload. */
export interface PatientJournalResponse {
  patient: PatientSummary;
  viewerRole: Role;
  viewerUserId: number;
  isOwnJournal: boolean;
  records: MedicalRecordPreview[];
  notes: JournalNotePreview[];
  hiddenNotesCount: number;
  accessLogs: AccessLogPreview[];
}
