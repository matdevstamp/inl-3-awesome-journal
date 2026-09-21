import { createAccessLog } from "@/lib/blockchain/access-log-service";
import { env } from "@/lib/env";
import { sendAccessLogToPeer } from "@/lib/p2p/transport";

/** Write a note access event to the access-log chain and sync it to the peer. */
export async function logNoteAccess(
  userId: number,
  patientId: number,
  recordId: number,
  action: string,
) {
  const block = createAccessLog({
    userId,
    patientId,
    recordId,
    action,
    serverId: env.serverId,
  });

  await sendAccessLogToPeer(block.data);
}
