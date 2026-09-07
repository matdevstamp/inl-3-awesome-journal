import { expect, test } from "@playwright/test";

/**
 * Login flows — skipped until task 11 (Backend API & Authentication)
 * delivers the /login page and the JWT cookie round-trip.
 */
test.describe.skip("auth", () => {
  test("logs a doctor in and lands on the dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="username"]', "dr_test");
    await page.fill('[name="password"]', "test123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard");
  });

  test("shows an error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="username"]', "dr_test");
    await page.fill('[name="password"]', "wrong-password");
    await page.click('button[type="submit"]');
    await expect(page.getByText("Invalid credentials")).toBeVisible();
  });
});
