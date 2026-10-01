import { afterEach, describe, expect, it, vi } from "vitest";

import { apiRequest, ApiClientError } from "@/lib/api/client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  it("unwraps the data field of a success envelope", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ ok: true, data: { id: 7 } })));

    expect(await apiRequest<{ id: number }>("/api/patients/7")).toEqual({ id: 7 });
  });

  it("always sends a JSON content type", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true, data: null }));
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/api/auth/me");

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: expect.objectContaining({ "Content-Type": "application/json" }),
    });
  });

  it("throws ApiClientError with the API code and status on a failure envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ ok: false, error: { code: "UNAUTHORIZED", message: "Nope" } }, 403),
        ),
    );

    const error = await apiRequest("/api/patients/1").catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({ code: "UNAUTHORIZED", message: "Nope", status: 403 });
  });

  it("throws with the HTTP status when the body is not an envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>502</html>", { status: 502 })),
    );

    const error = await apiRequest("/api/patients").catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({ code: "UNKNOWN", status: 502 });
  });

  it("forwards method and body to fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true, data: null }));
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/api/notes", {
      method: "POST",
      body: JSON.stringify({ recordId: 1 }),
    });

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "POST" });
  });
});
