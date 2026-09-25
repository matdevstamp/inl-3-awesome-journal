import { AuthError, requirePermission } from "@/lib/auth";
import { fail, ok } from "@/lib/api/http";
import { getAccessLogBlockchain } from "@/lib/blockchain/access-log-service";
import { syncServerPeer } from "@/app/api/p2p/server-peer";

export async function GET() {
  try {
    const user = await requirePermission("readAccessLogs");
    try {
      await syncServerPeer();
    } catch (error) {
      console.warn("Peer recovery unavailable; using local access logs.", error);
    }

    const blockchain = getAccessLogBlockchain();
    const allAccessLogs = blockchain.chain.map((block) => block.data);

    const accessLogs =
      user.role === "patient"
        ? allAccessLogs.filter((log) => log.patientId === user.patientId)
        : allAccessLogs;

    return ok({
      accessLogs,
      chainValid: blockchain.isValid(),
      viewerUserId: user.id,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.code, error.message, error.code === "UNAUTHENTICATED" ? 401 : 403);
    }

    return fail("ACCESS_LOG_FAILED", "Could not load access logs.", 500);
  }
}
