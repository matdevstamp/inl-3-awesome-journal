import { expect, test } from "@playwright/test";

/** Access-log views — skipped until task 15 (Blockchain Access Logging). */
test.describe.skip("access logs", () => {
  test("records a log entry when a record is viewed", async ({ page }) => {
    await page.goto("/access-log");
    await expect(page.getByText("Anna Andersson")).toBeVisible();
  });
});
