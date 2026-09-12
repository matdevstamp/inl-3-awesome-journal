import { expect, test } from "@playwright/test";

test.describe("POST /api/auth/login", () => {
    test("logs in with valid credentials and returns the user role", async ({ request }) => {
        const response = await request.post("/api/auth/login", {
            data: {
                username: "dr_test",
                password: "test123",
            },
        });

        expect(response.status()).toBe(200);

        const body = await response.json();

        expect(body.ok).toBe(true);
        expect(body.data.user).toMatchObject({
            username: "dr_test",
            role: "doctor",
        });

        const setCookie = response.headers()["set-cookie"];

        expect(setCookie).toBeDefined();
        expect(setCookie).toContain("token=");
        expect(setCookie?.toLowerCase()).toContain("httponly");
    });

    test("rejects invalid credentials", async ({ request }) => {
        const response = await request.post("/api/auth/login", {
            data: {
                username: "dr_test",
                password: "wrong-password",
            },
        });

        expect(response.status()).toBe(401);

        const body = await response.json();

        expect(body.ok).toBe(false);
        expect(body.error.code).toBe("INVALID_CREDENTIALS");
        expect(body.error.message).toBe("Invalid credentials");

        expect(JSON.stringify(body)).not.toContain("passwordHash");
    });
});