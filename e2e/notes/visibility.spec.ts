import { expect, test } from "@playwright/test";

/** Note visibility — skipped until task 14 (Medical Notes with Visibility). */
test.describe.skip("note visibility", () => {
  test("private notes are only visible to their author", async ({ page }) => {
    await page.goto("/patients/1/records");
    await expect(page.getByText("Private note")).toBeVisible();
  });

  test("healthcare notes are visible to healthcare staff", async ({ page }) => {
    await page.goto("/patients/1/records");
    await expect(page.getByText("Healthcare note")).toBeVisible();
  });
});
