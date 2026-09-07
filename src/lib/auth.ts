import { cookies } from "next/headers";
import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "@/lib/env";
import type { Role, SessionUser } from "@/lib/types/api";

const COOKIE_NAME = "token";

/** Thrown by getSession/requireRole; route handlers map these to HTTP errors. */
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

/** Guard for protected route handlers: requires a session with one of the roles. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new AuthError("UNAUTHENTICATED");
  if (roles.length > 0 && !roles.includes(session.role)) {
    throw new AuthError("UNAUTHORIZED");
  }
  return session;
}
