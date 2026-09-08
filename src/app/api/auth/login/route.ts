import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

import { signSessionToken } from "@/lib/auth";
import { fail, ok } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";
import type { LoginRequest, LoginResponse, SessionUser } from "@/lib/types/api";

export async function POST(request: NextRequest) {
  let body: LoginRequest;

  try {
    body = (await request.json()) as LoginRequest;
  } catch {
    return fail("INVALID_REQUEST", "Invalid request body", 400);
  }

  const { username, password } = body;

  if (!username || !password) {
    return fail("INVALID_REQUEST", "Username and password are required", 400);
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return fail("INVALID_CREDENTIALS", "Invalid credentials", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return fail("INVALID_CREDENTIALS", "Invalid credentials", 401);
  }

  const sessionUser: SessionUser = {
    id: user.id,
    username: user.username,
    role: user.role,
    organizationId: user.organizationId,
  };

  const token = signSessionToken(sessionUser);

  const response = ok<LoginResponse>({
    user: sessionUser,
  });

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}