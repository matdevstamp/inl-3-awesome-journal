import { expect, test } from "@playwright/test";

/** Patient search — skipped until task 13 (Patient View & Search). */
test.describe.skip("patient search", () => {
  test("finds a patient by name", async ({ page }) => {
    await page.goto("/patients");
    await page.fill('[placeholder="Search patients..."]', "Anna");
    await page.click('button:has-text("Search")');
    await expect(page.getByText("Anna Andersson")).toBeVisible();
  });

  test("shows an empty state for no results", async ({ page }) => {
    await page.goto("/patients");
    await page.fill('[placeholder="Search patients..."]', "ZZZZZ");
    await page.click('button:has-text("Search")');
    await expect(page.getByText("No patients found")).toBeVisible();
  });
});
