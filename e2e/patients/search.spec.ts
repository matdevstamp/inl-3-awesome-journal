import { expect, test } from "@playwright/test";

import { apiGet } from "../helpers/api.helper";
import type { PatientSearchResponse } from "@/lib/types/api";

test.describe("patient search", () => {
  test("finds a patient by name through the API", async ({ request }) => {
    const login = await request.post("/api/auth/login", {
      data: { username: "dr_test", password: "test123" },
    });
    expect(login.status()).toBe(200);
    const data = await apiGet<PatientSearchResponse>(request, "/api/patients?q=Anna&filter=name");

    expect(data.total).toBe(1);
    expect(data.patients[0]?.name).toBe("Anna Andersson");
    expect(data.patients[0]?.dateOfBirth).toBe("1990-01-01");
  });

  test("rejects forged mock headers without a session", async ({ request }) => {
    const response = await request.get("/api/patients?q=Anna", {
      headers: { "x-mock-role": "doctor", "x-mock-user-id": "1" },
    });
    expect(response.status()).toBe(401);
    expect((await response.json()).ok).toBe(false);
  });

  for (const username of ["patient_test", "unauth_test"]) {
    test(`refuses search for ${username}`, async ({ request }) => {
      const login = await request.post("/api/auth/login", {
        data: { username, password: "test123" },
      });
      expect(login.status()).toBe(200);
      expect((await request.get("/api/patients?q=Anna")).status()).toBe(403);
    });
  }

  test("supports SQL filters and rejects invalid search parameters", async ({ request }) => {
    const login = await request.post("/api/auth/login", {
      data: { username: "nurse_test", password: "test123" },
    });
    expect(login.status()).toBe(200);
    for (const path of [
      "/api/patients?q=ANNA%20ANDERSSON&filter=name",
      "/api/patients?q=1990-01&filter=dob",
      "/api/patients?q=19900101-1234&filter=personalNumber",
    ]) {
      const data = await apiGet<PatientSearchResponse>(request, path);
      expect(data.patients[0]?.name).toBe("Anna Andersson");
    }
    for (const params of ["page=0", "page=1.5", "page=oops", "filter=unknown"]) {
      expect((await request.get(`/api/patients?${params}`)).status()).toBe(400);
    }
  });

  test("shows an empty visible state for no frontend results", async ({ page }) => {
    const loginResponse = await page.request.post("/api/auth/login", {
      data: {
        username: "dr_test",
        password: "test123",
      },
    });

    expect(loginResponse.status()).toBe(200);

    await page.goto("/");

    await page.evaluate(() => {
      window.localStorage.setItem(
        "awesome-journal.mock-user",
        JSON.stringify({
          id: 1,
          username: "doctor",
          role: "doctor",
          organizationId: 1,
        }),
      );
    });

    await page.goto("/patients");

    await page.getByPlaceholder("Search patients...").fill("ZZZZZ");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.getByText("No patients found")).toBeVisible();
  });

  test("refuses a patient opening another patient's identifier", async ({ request }) => {
    const response = await request.get("/api/patients/2", {
      headers: {
        "x-mock-role": "patient",
        "x-mock-user-id": "4",
        "x-mock-username": "patient",
      },
    });

    const body = await response.json();

    expect(response.status()).toBe(403);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});
