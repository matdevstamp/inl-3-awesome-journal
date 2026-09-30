import { expect, test, type Page } from "@playwright/test";

/**
 * On-chain access-log verification. The verification badge is rendered on the
 * patient journal's "Access log" tab, so the suite drives that tab and also
 * checks the chain's own validity flag through the API it reads from.
 */

async function login(page: Page, username: string): Promise<void> {
  const response = await page.request.post("/api/auth/login", {
    data: { username, password: "test123" },
  });

  expect(response.ok(), `login as ${username} failed`).toBeTruthy();
}

test.describe("blockchain verification", () => {
  test("verifies the access-log chain is intact", async ({ page }) => {
    await login(page, "dr_test");
    await page.goto("/patients/1");
    await page.getByRole("tab", { name: /Access log/ }).click();

    await expect(page.getByText("Blockchain verified").first()).toBeVisible();
  });

  test("reports chainValid from the API the badge is derived from", async ({ page }) => {
    await login(page, "nurse_test");
    const response = await page.request.get("/api/access-log");
    const body = (await response.json()) as { data: { chainValid: boolean } };

    expect(response.status()).toBe(200);
    expect(body.data.chainValid).toBe(true);
  });

  test("shows the verification badge for every logged event", async ({ page }) => {
    await login(page, "dr_test");
    await page.goto("/patients/1");
    await page.getByRole("tab", { name: /Access log/ }).click();

    const rows = page.getByTestId("access-log-row");
    await expect(rows.first()).toBeVisible();

    // Count rows and badges in a single page evaluation. Two separate locator
    // counts would race: sibling suites append to the shared chain while this
    // tab is open, so the list can grow between the two reads.
    const counts = await page.getByRole("tabpanel").evaluate((panel) => {
      const rendered = [...panel.querySelectorAll('[data-testid="access-log-row"]')];
      return {
        rows: rendered.length,
        verified: rendered.filter((row) => row.textContent?.includes("Blockchain verified")).length,
        failed: rendered.filter((row) =>
          row.textContent?.includes("Blockchain verification failed"),
        ).length,
      };
    });

    expect(counts.rows).toBeGreaterThan(0);
    expect(counts.verified).toBe(counts.rows);
    expect(counts.failed).toBe(0);
  });
});
