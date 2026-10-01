import { cookies } from "next/headers";
import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "@/lib/env";
import { ROLES, type SessionUser } from "@/lib/types/api";
import { hasPermission, type Permission } from "@/lib/auth/permissions";

const COOKIE_NAME = "token";

/** Thrown by session guards; route handlers map these to HTTP errors. */
export class AuthError extends Error {
  constructor(
    readonly code: "UNAUTHENTICATED" | "UNAUTHORIZED",
    message?: string,
  ) {
    super(message ?? code);
    this.name = "AuthError";
  }
}

/**
 * Narrow a decoded JWT payload down to the session fields. jsonwebtoken adds
 * `iat`/`exp` to whatever was signed, so without this the session object would
 * carry claims the `SessionUser` type does not declare - and `/api/auth/me`
 * would serialise them straight back to the client.
 */
function toSessionUser(payload: unknown): SessionUser | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const { id, username, role, organizationId, patientId } = payload as Record<string, unknown>;

  if (typeof id !== "number" || typeof username !== "string" || !isRole(role)) {
    return null;
  }

  return {
    id,
    username,
    role,
    organizationId: typeof organizationId === "number" ? organizationId : null,
    patientId: typeof patientId === "number" ? patientId : null,
  };
}

function isRole(value: unknown): value is SessionUser["role"] {
  return ROLES.includes(value as SessionUser["role"]);
}

/** Sign a session token for a user (cookie is set by the login route in task 11). */
export function signSessionToken(user: SessionUser): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(user, env.jwtSecret, options);
}
/** Verify a raw session token, used outside Next.js request handlers (e.g. Socket.io). */
export function verifySessionToken(token: string): SessionUser | null {
  try {
    return toSessionUser(jwt.verify(token, env.jwtSecret));
  } catch {
    return null;
  }
}

/** Read the session from the httpOnly cookie, or null when absent/invalid. */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return toSessionUser(jwt.verify(token, env.jwtSecret));
  } catch {
    return null;
  }
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new AuthError("UNAUTHENTICATED");
  if (!hasPermission(session.role, permission)) throw new AuthError("UNAUTHORIZED");
  return session;
}
