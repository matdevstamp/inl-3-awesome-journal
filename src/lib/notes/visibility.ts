import { hasPermission, isStaffRole } from "@/lib/auth/permissions";
import type { NoteVisibility, SessionUser } from "@/lib/types/api";

/** Visibility a new note gets when the author does not pick one. */
export const DEFAULT_NOTE_VISIBILITY: NoteVisibility = "healthcare";

export const NOTE_VISIBILITY_LABELS: Record<NoteVisibility, string> = {
  private: "Private",
  healthcare: "Healthcare",
  all: "All",
};

/** The minimum a note must carry for the visibility rule to apply. */
export interface VisibleNote {
  visibility: NoteVisibility;
  authorUserId: number;
}

/**
 * The single note-visibility rule, shared by the notes API, the patient
 * journal and the Socket.io fan-out so all three agree:
 *
 *   all        -> anyone who may read a patient journal
 *   healthcare -> staff roles only
 *   private    -> the author only
 *
 * The `readPatient` check is deliberate defence in depth: route handlers
 * already reject unauthorized callers, so this only matters if a future
 * caller reaches a note without going through `requirePermission`.
 */
export function canViewNote(note: VisibleNote, viewer: SessionUser): boolean {
  if (!hasPermission(viewer.role, "readPatient")) {
    return false;
  }

  if (note.visibility === "all") {
    return true;
  }

  if (note.visibility === "healthcare") {
    return isStaffRole(viewer.role);
  }

  return note.authorUserId === viewer.id;
}

/** Notes in `notes` that `viewer` is allowed to read, in input order. */
export function visibleNotes<T extends VisibleNote>(notes: T[], viewer: SessionUser): T[] {
  return notes.filter((note) => canViewNote(note, viewer));
}
