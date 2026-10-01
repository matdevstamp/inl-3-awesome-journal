import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Route-handler tests for /api/patients. The handler owns query-string
 * parsing, default filter selection and the permission gate; the search query
 * building itself is covered in @/lib/patients/search.
 */

const cookieValue = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: (name: string) => ({ value: cookieValue(name) }) }),
}));

const searchDatabasePatients = vi.fn();
vi.mock("@/lib/patients/search", () => ({ searchDatabasePatients }));

const { GET } = await import("@/app/api/patients/route");
const { signSessionToken } = await import("@/lib/auth");
import { makeSessionUser } from "@/test-utils/session";
import type { SessionUser } from "@/lib/types/api";

const user = makeSessionUser;

function authenticate(session: SessionUser | null) {
  cookieValue.mockImplementation((name: string) =>
    name === "token" && session ? signSessionToken(session) : undefined,
  );
}

function get(query = "") {
  return GET(new Request(`http://localhost:3000/api/patients${query}`));
}

const emptyResult = {
  patients: [],
  page: 1,
  pageSize: 3,
  total: 0,
  totalPages: 1,
};

beforeEach(() => {
  cookieValue.mockReset();
  searchDatabasePatients.mockReset().mockResolvedValue(emptyResult);
});

describe("GET /api/patients", () => {
  it("returns 401 without a session", async () => {
    authenticate(null);

    const response = await get();

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 403 for a role without searchPatients", async () => {
    authenticate(user("patient"));

    const response = await get();

    expect(response.status).toBe(403);
  });

  it("searches with the viewer's user id so note counts are filtered per user", async () => {
    authenticate(user("doctor"));

    await get("?q=anna");

    expect(searchDatabasePatients).toHaveBeenCalledWith("anna", ["name"], 1, 1);
  });

  it("accepts `name` as an alias for `q`", async () => {
    authenticate(user("doctor"));

    await get("?name=anna");

    expect(searchDatabasePatients).toHaveBeenCalledWith("anna", ["name"], 1, 1);
  });

  it("prefers `q` when both are present", async () => {
    authenticate(user("doctor"));

    await get("?q=first&name=second");

    expect(searchDatabasePatients.mock.calls[0]?.[0]).toBe("first");
  });

  it("defaults to the name filter when none is given", async () => {
    authenticate(user("doctor"));

    await get("?q=anna");

    expect(searchDatabasePatients.mock.calls[0]?.[1]).toEqual(["name"]);
  });

  it("passes every requested filter through", async () => {
    authenticate(user("nurse"));

    await get("?q=1990&filter=name&filter=dob&filter=personalNumber");

    expect(searchDatabasePatients.mock.calls[0]?.[1]).toEqual(["name", "dob", "personalNumber"]);
  });

  it("echoes the resolved query and filters in the response", async () => {
    authenticate(user("doctor"));

    const body = (await (await get("?q=anna&filter=name")).json()) as {
      data: { query: string; filters: string[] };
    };

    expect(body.data.query).toBe("anna");
    expect(body.data.filters).toEqual(["name"]);
  });

  it("defaults the query to an empty string", async () => {
    authenticate(user("doctor"));

    await get();

    expect(searchDatabasePatients.mock.calls[0]?.[0]).toBe("");
  });

  it("coerces the page from a string query param", async () => {
    authenticate(user("doctor"));

    await get("?q=anna&page=3");

    expect(searchDatabasePatients.mock.calls[0]?.[2]).toBe(3);
  });

  it.each(["page=0", "page=-1", "page=abc", "page=1.5", "page=100001"])(
    "returns 400 for %s",
    async (query) => {
      authenticate(user("doctor"));

      const response = await get(`?q=anna&${query}`);

      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe("INVALID_REQUEST");
    },
  );

  it("returns 400 for a query longer than 200 characters", async () => {
    authenticate(user("doctor"));

    expect((await get(`?q=${"a".repeat(201)}`)).status).toBe(400);
  });

  it("returns 400 for an unknown filter", async () => {
    authenticate(user("doctor"));

    expect((await get("?q=anna&filter=nickname")).status).toBe(400);
  });

  it("returns 400 for more than three filters", async () => {
    authenticate(user("doctor"));

    const query = "?q=anna&filter=name&filter=name&filter=name&filter=name";

    expect((await get(query)).status).toBe(400);
  });

  it("returns 500 when the search throws", async () => {
    authenticate(user("doctor"));
    searchDatabasePatients.mockRejectedValue(new Error("db down"));

    const response = await get("?q=anna");

    expect(response.status).toBe(500);
    expect((await response.json()).error.code).toBe("PATIENT_SEARCH_FAILED");
  });
});
