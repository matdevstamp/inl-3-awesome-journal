import { expect, test } from "@playwright/test";

test.describe("POST /api/auth/login validation", () => {
    test("rejects missing username", async ({ request }) => {
        const response = await request.post("/api/auth/login", {
            data: {
                password: "test123",
            },
        });

        expect(response.status()).toBe(400);

        const body = await response.json();

        expect(body.ok).toBe(false);
        expect(body.error.code).toBe("INVALID_REQUEST");
    });

    test("rejects missing password", async ({ request }) => {
        const response = await request.post("/api/auth/login", {
            data: {
                username: "dr_test",
            },
        });

        expect(response.status()).toBe(400);

        const body = await response.json();

        expect(body.ok).toBe(false);
        expect(body.error.code).toBe("INVALID_REQUEST");
    });

    test("rejects empty credentials", async ({ request }) => {
        const response = await request.post("/api/auth/login", {
            data: {
                username: "",
                password: "",
            },
        });

        expect(response.status()).toBe(400);

        const body = await response.json();

        expect(body.ok).toBe(false);
        expect(body.error.code).toBe("INVALID_REQUEST");
    });

    test("rejects invalid field types", async ({ request }) => {
        const response = await request.post("/api/auth/login", {
            data: {
                username: 123,
                password: true,
            },
        });

        expect(response.status()).toBe(400);

        const body = await response.json();

        expect(body.ok).toBe(false);
        expect(body.error.code).toBe("INVALID_REQUEST");
    });
});