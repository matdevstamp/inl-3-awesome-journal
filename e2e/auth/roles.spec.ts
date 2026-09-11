import { expect, test } from "@playwright/test";

const users = [
    { username: "dr_test", role: "doctor" },
    { username: "nurse_test", role: "nurse" },
    { username: "amb_test", role: "ambulance" },
    { username: "patient_test", role: "patient" },
    { username: "unauth_test", role: "unauthorized" },
] as const;

test.describe("Authentication roles", () => {
    for (const user of users) {
        test(`logs in ${user.role} with the correct role`, async ({ request }) => {
            const response = await request.post("/api/auth/login", {
                data: {
                    username: user.username,
                    password: "test123",
                },
            });

            expect(response.status()).toBe(200);

            const body = await response.json();

            expect(body.ok).toBe(true);
            expect(body.data.user).toMatchObject({
                username: user.username,
                role: user.role,
            });
        });
    }
});