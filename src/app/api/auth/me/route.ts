import { getSession } from "@/lib/auth";
import { fail, ok } from "@/lib/api/http";
import type { LoginResponse } from "@/lib/types/api";

export async function GET() {
    const session = await getSession();

    if (!session) {
        return fail("UNAUTHENTICATED", "Authentication required", 401);
    }

    return ok<LoginResponse>({
        user: session,
    });
}