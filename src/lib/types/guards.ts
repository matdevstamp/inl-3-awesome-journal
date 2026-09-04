import { NOTE_VISIBILITIES, ROLES, type Role } from "@/lib/types/api";

/** True when the value is a plain object (not null, not an array). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** True when the value is a non-empty string. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** True when the value is one of the supported roles. */
export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Narrow an unknown to a known note visibility, or undefined. */
export function asNoteVisibility(value: unknown) {
  return typeof value === "string" && (NOTE_VISIBILITIES as readonly string[]).includes(value)
    ? (value as (typeof NOTE_VISIBILITIES)[number])
    : undefined;
}
