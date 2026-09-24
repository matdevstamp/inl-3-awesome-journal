import { cookies } from "next/headers";
import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "@/lib/env";
import type { SessionUser } from "@/lib/types/api";
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

/** Sign a session token for a user (cookie is set by the login route in task 11). */
export function signSessionToken(user: SessionUser): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(user, env.jwtSecret, options);
}

/** Read the session from the httpOnly cookie, or null when absent/invalid. */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, env.jwtSecret) as SessionUser;
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
