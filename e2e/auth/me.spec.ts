import { expect, test } from "@playwright/test";

test.describe("GET /api/auth/me", () => {
    test("returns the authenticated user", async ({ request }) => {
        const loginResponse = await request.post("/api/auth/login", {
            data: {
                username: "dr_test",
                password: "test123",
            },
        });

        expect(loginResponse.status()).toBe(200);

        const response = await request.get("/api/auth/me");

        expect(response.status()).toBe(200);

        const body = await response.json();

        expect(body.ok).toBe(true);
        expect(body.data.user).toMatchObject({
            username: "dr_test",
            role: "doctor",
            organizationId: 1,
        });
    });

    test("rejects unauthenticated requests", async ({ playwright }) => {
        const context = await playwright.request.newContext({
            baseURL: "http://localhost:3001",
        });

        const response = await context.get("/api/auth/me");

        expect(response.status()).toBe(401);

        const body = await response.json();

        expect(body.ok).toBe(false);
        expect(body.error.code).toBe("UNAUTHENTICATED");

        await context.dispose();
    });
});