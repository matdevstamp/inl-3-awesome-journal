import type { Role, SessionUser } from "@/lib/types/api";

export const PERMISSIONS = [
  "searchPatients",
  "readPatient",
  "createRecord",
  "createNote",
  "readAccessLogs",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  doctor: ["searchPatients", "readPatient", "createRecord", "createNote", "readAccessLogs"],
  nurse: ["searchPatients", "readPatient", "createNote", "readAccessLogs"],
  ambulance: ["searchPatients", "readPatient", "createNote", "readAccessLogs"],
  patient: ["readPatient", "readAccessLogs"],
  unauthorized: [],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAccessPatient(user: SessionUser, patientId: number): boolean {
  if (!hasPermission(user.role, "readPatient")) return false;
  return user.role !== "patient" || user.patientId === patientId;
}

export function isStaffRole(role: Role): boolean {
  return role === "doctor" || role === "nurse" || role === "ambulance";
}
