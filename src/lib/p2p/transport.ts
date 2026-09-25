import type { BlockchainAccessLog } from "@/lib/blockchain/access-log";
import { env } from "@/lib/env";
import type { P2PAccessLogMessage, P2PNoteMessage } from "@/lib/p2p/message";
import { peerAuthHeaders } from "@/lib/p2p/peer-auth";
import type { Note } from "@/lib/types/api";

export async function sendAccessLogToPeer(accessLog: BlockchainAccessLog): Promise<void> {
  const message: P2PAccessLogMessage = {
    type: "access_log",
    from: env.serverId,
    timestamp: new Date().toISOString(),
    data: accessLog,
  };

  try {
    const response = await fetch(`${env.peerUrl}/api/p2p/access-log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...peerAuthHeaders(),
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.warn(`Peer sync failed with status ${response.status}`);
    }
  } catch (error) {
    console.warn("Peer sync unavailable; access log remains stored locally.", error);
  }
}
export async function sendNoteToPeer(patientId: number, note: Note): Promise<void> {
  const message: P2PNoteMessage = {
    type: "note_created",
    from: env.serverId,
    timestamp: new Date().toISOString(),
    patientId,
    data: note,
  };

  try {
    console.log(
      `[realtime] Sending note ${note.id} from ${env.serverId} to ${env.peerUrl}/api/p2p/note`,
    );

    const response = await fetch(`${env.peerUrl}/api/p2p/note`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...peerAuthHeaders(),
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.warn(`Peer note sync failed with status ${response.status}`);
    }
  } catch (error) {
    console.warn("Peer unavailable; note was not broadcast to peer.", error);
  }
}
export interface PeerHealthInfo {
  healthy: boolean;
  serverId: string;
  lastCheckedAt: string;
}

/** Probe a peer's /api/health and return its identity + liveness in one round-trip. */
export async function fetchPeerHealth(peerUrl = env.peerUrl): Promise<PeerHealthInfo> {
  const response = await fetch(`${peerUrl}/api/health`, {
    signal: AbortSignal.timeout(3_000),
  });

  if (!response.ok) {
    throw new Error(`Peer health check failed with status ${response.status}`);
  }

  const body = (await response.json()) as { data?: { status?: string; server?: string } };

  if (body.data?.status !== "ok") {
    throw new Error("Peer reported an unhealthy status");
  }

  return {
    healthy: true,
    serverId: body.data.server ?? "",
    lastCheckedAt: new Date().toISOString(),
  };
}

export async function checkPeerHealth(peerUrl = env.peerUrl): Promise<boolean> {
  try {
    return (await fetchPeerHealth(peerUrl)).healthy;
  } catch {
    return false;
  }
}
export async function fetchAccessLogsFromPeer(
  peerUrl = env.peerUrl,
): Promise<BlockchainAccessLog[]> {
  const response = await fetch(`${peerUrl}/api/p2p/access-log`);
  if (!response.ok) {
    throw new Error(`Peer access-log sync failed with status ${response.status}`);
  }

  const body = (await response.json()) as {
    data: {
      accessLogs: BlockchainAccessLog[];
      chainValid: boolean;
    };
  };

  if (!body.data.chainValid) {
    throw new Error("Peer blockchain is invalid");
  }

  return body.data.accessLogs;
}
