import { env } from "@/lib/env";
import { ok } from "@/lib/api/http";
import type { HealthData } from "@/lib/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const data: HealthData = {
    status: "ok",
    server: env.serverId,
    timestamp: new Date().toISOString(),
  };
  return ok(data);
}
