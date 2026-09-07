import { expect, test } from "@playwright/test";

/** On-chain access-log verification — skipped until task 15. */
test.describe.skip("blockchain", () => {
  test("verifies the access-log chain is intact", async ({ page }) => {
    await page.goto("/access-log");
    await expect(page.getByText("Chain verified")).toBeVisible();
  });
});
