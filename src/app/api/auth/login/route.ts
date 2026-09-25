import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { signSessionToken } from "@/lib/auth";
import { applyCors, corsPreflight } from "@/lib/api/cors";
import { createRateLimiter, fail, ok } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";
import type { LoginResponse, SessionUser } from "@/lib/types/api";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const loginRateLimiter = createRateLimiter(5, 60_000);

export function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}

export async function POST(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  const ip = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

  if (!loginRateLimiter.isAllowed(ip)) {
    return applyCors(request, fail("RATE_LIMITED", "Too many login attempts", 429));
  }

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return applyCors(request, fail("INVALID_REQUEST", "Invalid request body", 400));
  }

  const parsed = loginSchema.safeParse(rawBody);

  if (!parsed.success) {
    return applyCors(request, fail("INVALID_REQUEST", "Invalid login data", 400));
  }

  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { username },
    include: { patient: { select: { id: true } } },
  });

  if (!user) {
    loginRateLimiter.recordFailure(ip);

    return applyCors(request, fail("INVALID_CREDENTIALS", "Invalid credentials", 401));
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    loginRateLimiter.recordFailure(ip);

    return applyCors(request, fail("INVALID_CREDENTIALS", "Invalid credentials", 401));
  }

  const sessionUser: SessionUser = {
    id: user.id,
    username: user.username,
    role: user.role,
    organizationId: user.organizationId,
    patientId: user.patient?.id ?? null,
  };

  loginRateLimiter.reset(ip);

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

  return applyCors(request, response);
}
