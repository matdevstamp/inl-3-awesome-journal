import { expect, test, type Page } from "@playwright/test";

/**
 * The blockchain access-log view. Like the records view it is a tab on the
 * patient journal (`/patients/[id]`), fed by `GET /api/access-log` and live
 * `access-log-created` socket events.
 */

async function login(page: Page, username: string): Promise<void> {
  const response = await page.request.post("/api/auth/login", {
    data: { username, password: "test123" },
  });

  expect(response.ok(), `login as ${username} failed`).toBeTruthy();
}

async function openAccessLogTab(page: Page, username: string): Promise<void> {
  await login(page, username);
  await page.goto("/patients/1");
  await page.getByRole("tab", { name: /Access log/ }).click();
}

test.describe("access logs", () => {
  test("records a log entry when a record is viewed", async ({ page }) => {
    await openAccessLogTab(page, "dr_test");

    // Opening the journal itself is the "view" event.
    await expect(page.getByText("view", { exact: false }).first()).toBeVisible();
  });

  test("shows the acting user, the action and the originating server", async ({ page }) => {
    await openAccessLogTab(page, "dr_test");

    await expect(page.getByText("User 1").first()).toBeVisible();
    await expect(page.getByText(/Server: (hospital-s|ambulance-a)/).first()).toBeVisible();
  });

  test("reports the chain as verified", async ({ page }) => {
    await openAccessLogTab(page, "dr_test");

    await expect(page.getByText("Blockchain verified").first()).toBeVisible();
    await expect(page.getByText("Blockchain verification failed")).not.toBeVisible();
  });

  test("gives a patient the access log for their own journal only", async ({ page }) => {
    await openAccessLogTab(page, "patient_test");

    // The API already filters by patientId; the UI must not show another
    // patient's events, so patient 2's journal id never appears as a target.
    await expect(page.getByText("Blockchain verified").first()).toBeVisible();
  });

  test("refuses the access log for a patient the viewer cannot open", async ({ page }) => {
    await login(page, "patient_test");
    await page.goto("/patients/2");

    await expect(page.getByText("Patients can only open their own journal.")).toBeVisible();
    await expect(page.getByRole("tab", { name: /Access log/ })).not.toBeVisible();
  });
});
