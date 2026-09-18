import type { BlockchainAccessLog } from "@/lib/blockchain/access-log";
import { env } from "@/lib/env";
import type { P2PAccessLogMessage } from "@/lib/p2p/message";

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
export async function checkPeerHealth(peerUrl = env.peerUrl): Promise<boolean> {
  try {
    const response = await fetch(`${peerUrl}/api/health`);

    if (!response.ok) {
      return false;
    }

    return true;
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
