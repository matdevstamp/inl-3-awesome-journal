import { test as base, type Page } from "@playwright/test";

/**
 * Role-based login fixture. Real credentials land with the login flow in
 * task 11 — until then every test that calls loginAs must be test.skip'd.
 *
 * Usage (once auth exists):
 *   const test = base.extend({ loginAs: async ({ page }, use) => { ... } });
 */
export type TestRole = "doctor" | "nurse" | "ambulance" | "patient" | "unauthorized";

export interface LoginAs {
  loginAs: (role: TestRole) => Promise<Page>;
}

export const test = base.extend<LoginAs>({
  loginAs: async ({ page }, use) => {
    const loginAs = async (role: TestRole) => {
      await page.goto("/login");
      await page.fill('[name="username"]', `${role}_test`);
      await page.fill('[name="password"]', "test123");
      await page.click('button[type="submit"]');
      await page.waitForURL(role === "patient" ? "/my-records" : "/dashboard");
      return page;
    };
    await use(loginAs);
  },
});

export { expect } from "@playwright/test";
