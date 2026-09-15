import { expect, test, type Page } from "@playwright/test";

import { apiGet } from "../helpers/api.helper";
import type { PatientSearchResponse, SessionUser } from "@/lib/types/api";

const doctorSession: SessionUser = {
  id: 1,
  username: "doctor",
  role: "doctor",
  organizationId: 1,
};

test.describe("patient search", () => {
  test("finds a patient by name through the API", async ({ request }) => {
    const data = await apiGet<PatientSearchResponse>(request, "/api/patients?q=Anna&filter=name", {
      "x-mock-role": "doctor",
      "x-mock-user-id": "1",
      "x-mock-username": "doctor",
    });

    expect(data.total).toBe(1);
    expect(data.patients[0]?.name).toBe("Anna Andersson");
  });

  test("shows an empty visible state for no frontend results", async ({ page }) => {
    await setMockSession(page, doctorSession);
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

async function setMockSession(page: Page, user: SessionUser) {
  await page.addInitScript((sessionUser) => {
    window.localStorage.setItem("awesome-journal.mock-user", JSON.stringify(sessionUser));
  }, user);
}
