import { AuthError } from "@/lib/auth";
import { fail, ok } from "@/lib/api/http";
import { requireRoleOrMock } from "@/lib/api/mock-auth";
import { getAccessLogBlockchain } from "@/lib/blockchain/access-log-service";
import { patientIdForUser } from "@/lib/patients/mock-patients";
import { syncServerPeer } from "@/app/api/p2p/server-peer";

export async function GET(request: Request) {
  try {
    const user = await requireRoleOrMock(request, "doctor", "nurse", "ambulance", "patient");
    try {
      await syncServerPeer();
    } catch (error) {
      console.warn("Peer recovery unavailable; using local access logs.", error);
    }

    const blockchain = getAccessLogBlockchain();
    const allAccessLogs = blockchain.chain.map((block) => block.data);

    const accessLogs =
      user.role === "patient"
        ? allAccessLogs.filter((log) => log.patientId === patientIdForUser(user))
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
