import { NextResponse } from "next/server";
import type { ApiResponse } from "@/lib/types/api";

/** 501 stub response used until a feature task implements the endpoint. */
export function notImplemented(message: string): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: { code: "NOT_IMPLEMENTED", message },
    } satisfies ApiResponse<never>,
    { status: 501 },
  );
}

/** Uniform JSON success helper. */
export function ok<T>(data: T): NextResponse {
  return NextResponse.json({ ok: true, data } satisfies ApiResponse<T>);
}

/** Uniform JSON error helper. */
export function fail(code: string, message: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, error: { code, message } } satisfies ApiResponse<never>, {
    status,
  });
}

export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  function isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now >= entry.resetAt) {
      return true;
    }

    return entry.count < limit;
  }

  function recordFailure(key: string): void {
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now >= entry.resetAt) {
      hits.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });

      return;
    }

    entry.count += 1;
  }

  function reset(key: string): void {
    hits.delete(key);
  }

  return {
    isAllowed,
    recordFailure,
    reset,
  };
}
