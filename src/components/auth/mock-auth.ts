"use client";

import type { Role, SessionUser } from "@/lib/types/api";

export const MOCK_USERS: Array<SessionUser & { displayName: string; password: string }> = [
  {
    id: 1,
    username: "doctor",
    password: "demo123",
    role: "doctor",
    organizationId: 1,
    displayName: "Dr. Sofia Berg",
  },
  {
    id: 2,
    username: "nurse",
    password: "demo123",
    role: "nurse",
    organizationId: 1,
    displayName: "Nurse Alex Lind",
  },
  {
    id: 3,
    username: "ambulance",
    password: "demo123",
    role: "ambulance",
    organizationId: 2,
    displayName: "Ambulance Unit A",
  },
  {
    id: 4,
    username: "patient",
    password: "demo123",
    role: "patient",
    organizationId: null,
    displayName: "Anna Andersson",
  },
  {
    id: 5,
    username: "unauthorized",
    password: "demo123",
    role: "unauthorized",
    organizationId: null,
    displayName: "Unauthorized visitor",
  },
];

const STORAGE_KEY = "awesome-journal.mock-user";

export function roleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    doctor: "Doctor",
    nurse: "Nurse",
    ambulance: "Ambulance",
    patient: "Patient",
    unauthorized: "Unauthorized",
  };
  return labels[role];
}

export function signInWithMockUser(username: string, password: string): SessionUser | null {
  const user = MOCK_USERS.find(
    (candidate) => candidate.username === username && candidate.password === password,
  );

  if (!user) {
    return null;
  }

  const sessionUser: SessionUser = {
    id: user.id,
    username: user.username,
    role: user.role,
    organizationId: user.organizationId,
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
  }
  return sessionUser;
}

export function getMockSession(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(STORAGE_KEY);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as SessionUser;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearMockSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
