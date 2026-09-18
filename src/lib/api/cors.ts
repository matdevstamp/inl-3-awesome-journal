import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const allowedOrigins = new Set(["http://localhost:3001", "http://localhost:3002"]);

export function applyCors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");

  if (origin && allowedOrigins.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Vary", "Origin");
  }

  return response;
}

export function corsPreflight(request: NextRequest): NextResponse {
  const response = new NextResponse(null, { status: 204 });

  return applyCors(request, response);
}
