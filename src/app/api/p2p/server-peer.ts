import { getAccessLogBlockchain } from "@/lib/blockchain/access-log-service";
import { env } from "@/lib/env";
import { Peer } from "@/lib/p2p/peer";
import { fetchAccessLogsFromPeer } from "@/lib/p2p/transport";

export const serverPeer = new Peer(env.serverId, getAccessLogBlockchain());

export async function syncServerPeer(): Promise<void> {
  const accessLogs = await fetchAccessLogsFromPeer();

  accessLogs.forEach((accessLog) => {
    serverPeer.receiveAccessLog(accessLog);
  });
}
