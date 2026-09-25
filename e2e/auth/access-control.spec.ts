import { expect, test } from "@playwright/test";

const roleMatrix = [
  { username: "dr_test", search: 200, ownJournal: 200, otherJournal: 404, notes: 201, logs: 200 },
  {
    username: "nurse_test",
    search: 200,
    ownJournal: 200,
    otherJournal: 404,
    notes: 201,
    logs: 200,
  },
  { username: "amb_test", search: 200, ownJournal: 200, otherJournal: 404, notes: 201, logs: 200 },
  {
    username: "patient_test",
    search: 403,
    ownJournal: 200,
    otherJournal: 403,
    notes: 403,
    logs: 200,
  },
  {
    username: "unauth_test",
    search: 403,
    ownJournal: 403,
    otherJournal: 403,
    notes: 403,
    logs: 403,
  },
] as const;

test.describe("role access control", () => {
  for (const expected of roleMatrix) {
    test(`${expected.username} follows the permission matrix`, async ({ request }) => {
      const login = await request.post("/api/auth/login", {
        data: { username: expected.username, password: "test123" },
      });
      expect(login.status()).toBe(200);

      expect((await request.get("/api/patients?q=Anna")).status()).toBe(expected.search);
      expect((await request.get("/api/patients/1")).status()).toBe(expected.ownJournal);
      expect((await request.get("/api/patients/999")).status()).toBe(expected.otherJournal);

      const createNote = await request.post("/api/notes", {
        data: {
          recordId: 1,
          text: `Permission matrix test for ${expected.username}`,
          visibility: "healthcare",
        },
      });
      expect(createNote.status()).toBe(expected.notes);
      expect((await request.get("/api/access-log")).status()).toBe(expected.logs);

      if (createNote.status() === 201) {
        const { data } = await createNote.json();
        expect((await request.delete(`/api/notes/${data.note.id}`)).status()).toBe(200);
      }
    });
  }

  test("forged role headers cannot bypass access control", async ({ request }) => {
    const response = await request.get("/api/access-log", {
      headers: { "x-mock-role": "doctor", "x-mock-user-id": "1" },
    });
    expect(response.status()).toBe(401);
  });

  test("unauthorized users are sent to the access denied page", async ({ page }) => {
    const login = await page.request.post("/api/auth/login", {
      data: { username: "unauth_test", password: "test123" },
    });
    expect(login.status()).toBe(200);

    const token = login.headers()["set-cookie"]?.match(/token=([^;]+)/)?.[1];
    expect(token).toBeDefined();
    await page
      .context()
      .addCookies([{ name: "token", value: token!, domain: "localhost", path: "/" }]);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/access-denied$/);
    await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
  });

  test("patient URL tampering is stopped before journal data loads", async ({ page }) => {
    const login = await page.request.post("/api/auth/login", {
      data: { username: "patient_test", password: "test123" },
    });
    expect(login.status()).toBe(200);

    const token = login.headers()["set-cookie"]?.match(/token=([^;]+)/)?.[1];
    expect(token).toBeDefined();
    await page
      .context()
      .addCookies([{ name: "token", value: token!, domain: "localhost", path: "/" }]);

    let journalRequests = 0;
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/patients/2") journalRequests += 1;
    });

    await page.goto("/patients/2");
    await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
    await expect(page.getByText("Patients can only open their own journal.")).toBeVisible();
    expect(journalRequests).toBe(0);
  });
});
