import { expect, test } from "@playwright/test";

/** Medical records — skipped until task 14 (Medical Notes / record views). */
test.describe.skip("medical records", () => {
  test("shows a patient's journal entries", async ({ page }) => {
    await page.goto("/patients/1/records");
    await expect(page.getByText("Mild asthma")).toBeVisible();
  });

  test("lets a doctor create a new record", async ({ page }) => {
    await page.goto("/patients/1/records");
    await page.click('button:has-text("Add Record")');
    await page.fill('[name="content"]', "New diagnosis");
    await page.click('button:has-text("Save")');
    await expect(page.getByText("New diagnosis")).toBeVisible();
  });
});
