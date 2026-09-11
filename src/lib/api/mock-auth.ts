import { AuthError, getSession } from "@/lib/auth";
import type { Role, SessionUser } from "@/lib/types/api";

const MOCK_ROLES: Role[] = ["doctor", "nurse", "ambulance", "patient", "unauthorized"];

export async function getSessionOrMock(request: Request): Promise<SessionUser | null> {
  const session = await getSession();
  if (session) {
    return session;
  }

  const role = request.headers.get("x-mock-role");
  const userId = Number(request.headers.get("x-mock-user-id"));

  if (!role || !MOCK_ROLES.includes(role as Role) || !Number.isInteger(userId)) {
    return null;
  }

  return {
    id: userId,
    username: request.headers.get("x-mock-username") ?? role,
    role: role as Role,
    organizationId: null,
  };
}

export async function requireRoleOrMock(request: Request, ...roles: Role[]): Promise<SessionUser> {
  const session = await getSessionOrMock(request);
  if (!session) {
    throw new AuthError("UNAUTHENTICATED");
  }

  if (roles.length > 0 && !roles.includes(session.role)) {
    throw new AuthError("UNAUTHORIZED");
  }

  return session;
}
