import type { ApiResponse } from "@/lib/types/api";

export class ApiClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * Typed fetch wrapper for client components. Every endpoint speaks the
 * ApiResponse envelope, so this unwraps it and throws on failures.
 */
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!body || !body.ok) {
    const code = body?.ok === false ? body.error.code : "UNKNOWN";
    const message = body?.ok === false ? body.error.message : `HTTP ${response.status}`;
    throw new ApiClientError(code, message, response.status);
  }
  return body.data;
}
