"use client";

import { useSyncExternalStore } from "react";

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
    cachedSessionValue = null;
    window.dispatchEvent(new Event(SESSION_EVENT));
  }
  return sessionUser;
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

export function mockSessionHeaders(user: SessionUser): HeadersInit {
  return {
    "x-mock-role": user.role,
    "x-mock-user-id": String(user.id),
    "x-mock-username": user.username,
  };
}

export function useMockSession(): SessionUser | null {
  return useSyncExternalStore(subscribeToMockSession, getMockSession, () => null);
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
