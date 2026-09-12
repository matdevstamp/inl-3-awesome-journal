import { ok } from "@/lib/api/http";

export async function POST() {
    const response = ok({
        message: "Logged out",
    });

    response.cookies.set("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });

    return response;
}