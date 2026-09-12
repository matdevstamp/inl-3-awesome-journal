import { expect, test } from "@playwright/test";

test.describe("POST /api/auth/logout", () => {
    test("logs out an authenticated user", async ({ request }) => {
        const loginResponse = await request.post("/api/auth/login", {
            data: {
                username: "dr_test",
                password: "test123",
            },
        });

        expect(loginResponse.status()).toBe(200);

        const beforeLogout = await request.get("/api/auth/me");
        expect(beforeLogout.status()).toBe(200);

        const logoutResponse = await request.post("/api/auth/logout");

        expect(logoutResponse.status()).toBe(200);

        const afterLogout = await request.get("/api/auth/me");
        expect(afterLogout.status()).toBe(401);
    });
});