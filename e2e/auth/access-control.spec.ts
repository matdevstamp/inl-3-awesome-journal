import { expect, test } from "@playwright/test";

const roleMatrix = [
  { username: "dr_test", search: 200, ownJournal: 200, otherJournal: 404 },
  { username: "nurse_test", search: 200, ownJournal: 200, otherJournal: 404 },
  { username: "amb_test", search: 200, ownJournal: 200, otherJournal: 404 },
  { username: "patient_test", search: 403, ownJournal: 200, otherJournal: 403 },
  { username: "unauth_test", search: 403, ownJournal: 403, otherJournal: 403 },
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
    const { data } = await login.json();
    await page.goto("/");
    await page.evaluate((user) => {
      window.localStorage.setItem("awesome-journal.mock-user", JSON.stringify(user));
    }, data.user);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/access-denied$/);
    await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
  });
});
