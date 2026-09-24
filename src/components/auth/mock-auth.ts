"use client";

import { useSyncExternalStore } from "react";

import type { Role, SessionUser } from "@/lib/types/api";

export const MOCK_USERS: Array<SessionUser & { displayName: string }> = [
  {
    id: 1,
    username: "dr_test",
    role: "doctor",
    organizationId: 1,
    patientId: null,
    displayName: "Dr. Sofia Berg",
  },
  {
    id: 2,
    username: "nurse_test",
    role: "nurse",
    organizationId: 1,
    patientId: null,
    displayName: "Nurse Alex Lind",
  },
  {
    id: 3,
    username: "amb_test",
    role: "ambulance",
    organizationId: 2,
    patientId: null,
    displayName: "Ambulance Unit A",
  },
  {
    id: 4,
    username: "patient_test",
    role: "patient",
    organizationId: null,
    patientId: 1,
    displayName: "Anna Andersson",
  },
  {
    id: 5,
    username: "unauth_test",
    role: "unauthorized",
    organizationId: null,
    patientId: null,
    displayName: "Unauthorized visitor",
  },
];

const STORAGE_KEY = "awesome-journal.mock-user";
const SESSION_EVENT = "awesome-journal.mock-session-change";
let cachedSessionValue: string | null = null;
let cachedSession: SessionUser | null = null;

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

export function getMockUserDisplayName(user: SessionUser): string {
  return MOCK_USERS.find((candidate) => candidate.id === user.id)?.displayName ?? user.username;
}

export function setMockSession(sessionUser: SessionUser): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    cachedSessionValue = null;
    window.dispatchEvent(new Event(SESSION_EVENT));
  }
}

export function getMockSession(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(STORAGE_KEY);
  if (!value) {
    cachedSessionValue = null;
    cachedSession = null;
    return null;
  }

  if (value === cachedSessionValue) {
    return cachedSession;
  }

  try {
    cachedSessionValue = value;
    cachedSession = JSON.parse(value) as SessionUser;
    return cachedSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    cachedSessionValue = null;
    cachedSession = null;
    return null;
  }
}

export function clearMockSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  cachedSessionValue = null;
  cachedSession = null;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function useMockSession(): SessionUser | null | undefined {
  return useSyncExternalStore(subscribeToMockSession, getMockSession, () => undefined);
}

function subscribeToMockSession(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SESSION_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SESSION_EVENT, onStoreChange);
  };
}
