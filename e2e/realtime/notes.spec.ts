import { expect, test, type Page } from "@playwright/test";

/**
 * Task 18 — test-first checkpoint from issue #28:
 *
 * 1. An authorized recipient (doctor on the OTHER server instance) sees a new
 *    note without refreshing — this fails if the socket code is deleted.
 * 2. A non-recipient (the patient) never receives a protected "healthcare"
 *    note — permission filtering happens per-socket at emit time.
 *
 * Both servers (3001 hospital-s, 3002 ambulance-a) are booted by the
 * Playwright webServer config and share one Postgres + JWT secret.
 */

const SERVER1 = "http://localhost:3001";
const SERVER2 = "http://localhost:3002";

/** API login so the httpOnly token cookie lands in the browser context. */
async function login(page: Page, baseURL: string, username: string): Promise<void> {
  const response = await page.request.post(`${baseURL}/api/auth/login`, {
    data: { username, password: "test123" },
  });

  expect(response.ok(), `login as ${username} on ${baseURL} failed`).toBeTruthy();
}

/** Delete the test note afterwards so other suites' seeded counts stay valid. */
async function deleteNoteBySearch(page: Page, text: string): Promise<void> {
  const response = await page.request.get("/api/notes?recordId=1");

  if (!response.ok()) {
    return;
  }

  const body = (await response.json()) as {
    ok: boolean;
    data?: { notes: Array<{ id: number; text: string }> };
  };

  for (const note of body.data?.notes ?? []) {
    if (note.text === text) {
      await page.request.delete(`/api/notes/${note.id}`);
    }
  }
}

async function openJournal(page: Page, baseURL: string, username: string): Promise<void> {
  await login(page, baseURL, username);
  await page.goto(`${baseURL}/patients/1`);
  await expect(page.getByText("Realtime connected")).toBeVisible({ timeout: 15_000 });
}

async function createNote(page: Page, text: string): Promise<void> {
  await page.getByRole("tab", { name: /Notes/ }).click();
  await page.getByLabel("Note content").fill(text);
  await page.getByRole("button", { name: "Save note" }).click();
}

test.describe("real-time notes", () => {
  test("authorized recipient on the other server receives a new note without refreshing", async ({
    browser,
  }) => {
    const uniqueText = `Realtime cross-server note ${crypto.randomUUID()}`;

    const server1Context = await browser.newContext();
    const server2Context = await browser.newContext();

    const server1Page = await server1Context.newPage();
    const server2Page = await server2Context.newPage();

    await openJournal(server1Page, SERVER1, "dr_test");
    await openJournal(server2Page, SERVER2, "dr_test");

    // Watch the Notes tab on the recipient page (inactive tabs render nothing).
    await server2Page.getByRole("tab", { name: /Notes/ }).click();

    // Doctor on server 1 creates the note.
    await createNote(server1Page, uniqueText);

    // Server 2 must show it WITHOUT a reload — via Socket.io + P2P relay.
    await expect(server2Page.getByText(uniqueText)).toBeVisible({ timeout: 15_000 });

    // The author's own page must show exactly one copy: the optimistic local
    // add and the room broadcast carry the same note id, so the client-side
    // dedup keeps the list clean (issue #28 reconnection story).
    await expect(server1Page.getByText(uniqueText)).toHaveCount(1);
    await expect(server2Page.getByText(uniqueText)).toHaveCount(1);

    await deleteNoteBySearch(server1Page, uniqueText);

    await server1Context.close();
    await server2Context.close();
  });

  test("non-recipient (patient) never receives a healthcare note", async ({ browser }) => {
    const uniqueText = `Protected staff note ${crypto.randomUUID()}`;

    const doctorContext = await browser.newContext();
    const patientContext = await browser.newContext();

    const doctorPage = await doctorContext.newPage();
    const patientPage = await patientContext.newPage();

    await openJournal(doctorPage, SERVER1, "dr_test");
    await openJournal(patientPage, SERVER2, "patient_test");

    // Doctor creates a "healthcare" (staff-only) note on server 1.
    await createNote(doctorPage, uniqueText);

    // The patient watches the same patient room on server 2 but must NOT see
    // the protected note — not immediately, and not after a grace period that
    // gives any (wrong) broadcast plenty of time to arrive.
    await patientPage.getByRole("tab", { name: /Notes/ }).click();
    await expect(patientPage.getByText(uniqueText)).toHaveCount(0, { timeout: 8_000 });

    await deleteNoteBySearch(doctorPage, uniqueText);

    await doctorContext.close();
    await patientContext.close();
  });
});
