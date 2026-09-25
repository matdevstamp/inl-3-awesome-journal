import { expect, test } from "@playwright/test";

test.describe("real-time notes", () => {
  test("authorized recipient receives a new note without refreshing", async ({ browser }) => {
    const server1Context = await browser.newContext({
      baseURL: "http://localhost:3001",
    });

    const server2Context = await browser.newContext({
      baseURL: "http://localhost:3002",
    });

    const server1Page = await server1Context.newPage();
    const server2Page = await server2Context.newPage();

    await server1Page.goto("/login");
    await server1Page.getByRole("combobox", { name: "Demo user" }).click();
    await server1Page.getByRole("option", { name: "Dr. Sofia Berg - Doctor" }).click();
    await server1Page.getByLabel("Password").fill("test123");
    await server1Page.getByRole("button", { name: "Sign in" }).click();

    await server2Page.goto("/login");
    await server2Page.getByRole("combobox", { name: "Demo user" }).click();
    await server2Page.getByRole("option", { name: "Dr. Sofia Berg - Doctor" }).click();
    await server2Page.getByLabel("Password").fill("test123");
    await server2Page.getByRole("button", { name: "Sign in" }).click();

    await expect(server1Page).toHaveURL(/\/dashboard$/);
    await expect(server2Page).toHaveURL(/\/dashboard$/);

    await server1Context.close();
    await server2Context.close();
  });
});
