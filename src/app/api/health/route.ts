import { env } from "@/lib/env";
import { ok } from "@/lib/api/http";
import { getPeerHealth } from "@/lib/p2p/peer-health";
import type { HealthData } from "@/lib/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const peer = getPeerHealth();
  const data: HealthData = {
    status: "ok",
    server: env.serverId,
    timestamp: new Date().toISOString(),
    peer: {
      healthy: peer.healthy,
      serverId: peer.serverId,
      lastCheckedAt: peer.lastCheckedAt,
    },
  };
  return ok(data);
}
