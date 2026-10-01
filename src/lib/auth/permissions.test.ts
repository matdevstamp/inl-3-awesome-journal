import { describe, expect, it } from "vitest";

import {
  canAccessPatient,
  hasPermission,
  isStaffRole,
  PERMISSIONS,
  type Permission,
} from "@/lib/auth/permissions";
import { ROLES, type Role, type SessionUser } from "@/lib/types/api";

function user(role: Role, overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: 1,
    username: `${role}_test`,
    role,
    organizationId: null,
    patientId: null,
    ...overrides,
  };
}

describe("hasPermission", () => {
  const matrix: Record<Role, Permission[]> = {
    doctor: [...PERMISSIONS],
    nurse: [...PERMISSIONS],
    ambulance: [...PERMISSIONS],
    patient: ["readPatient", "readAccessLogs"],
    unauthorized: [],
  };

  for (const role of ROLES) {
    it(`grants exactly the documented permissions to ${role}`, () => {
      const expected = matrix[role];

      for (const permission of PERMISSIONS) {
        expect(hasPermission(role, permission), `${role} -> ${permission}`).toBe(
          expected.includes(permission),
        );
      }
    });
  }

  it("denies every permission to the unauthorized role", () => {
    for (const permission of PERMISSIONS) {
      expect(hasPermission("unauthorized", permission)).toBe(false);
    }
  });
});

describe("canAccessPatient", () => {
  it("lets staff open any patient journal", () => {
    for (const role of ["doctor", "nurse", "ambulance"] as const) {
      expect(canAccessPatient(user(role), 99)).toBe(true);
    }
  });

  it("lets a patient open only their own journal", () => {
    const patient = user("patient", { id: 4, patientId: 1 });

    expect(canAccessPatient(patient, 1)).toBe(true);
    expect(canAccessPatient(patient, 2)).toBe(false);
  });

  it("denies a patient with no linked patient record", () => {
    expect(canAccessPatient(user("patient", { id: 9, patientId: null }), 1)).toBe(false);
  });

  it("denies the unauthorized role before the patient check", () => {
    expect(canAccessPatient(user("unauthorized", { patientId: 1 }), 1)).toBe(false);
  });
});

describe("isStaffRole", () => {
  it("recognises the three clinical roles", () => {
    for (const role of ["doctor", "nurse", "ambulance"] as const) {
      expect(isStaffRole(role)).toBe(true);
    }
  });

  it("rejects patient and unauthorized roles", () => {
    expect(ROLES.filter(isStaffRole)).toEqual(["doctor", "nurse", "ambulance"]);
  });
});
