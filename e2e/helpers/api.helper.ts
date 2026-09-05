import type { APIRequestContext } from "@playwright/test";
import type { ApiResponse } from "@/lib/types/api";

/** GET an endpoint and unwrap the ApiResponse envelope. */
export async function apiGet<T>(request: APIRequestContext, path: string): Promise<T> {
  const response = await request.get(path);
  expectStatus(response.status());
  const body = (await response.json()) as ApiResponse<T>;
  if (!body.ok) throw new Error(`API error ${body.error.code}: ${body.error.message}`);
  return body.data;
}

function expectStatus(status: number): void {
  if (status < 200 || status >= 300) {
    throw new Error(`Unexpected API status ${status}`);
  }
}
