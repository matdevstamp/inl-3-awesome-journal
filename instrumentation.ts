import { startPeerHeartbeat } from "@/lib/p2p/peer-health";
import { startSocketServer } from "@/lib/realtime/socket-server";

/**
 * Runs once when each server bootstraps (dev and `next start`), so the
 * Socket.io listener and the peer heartbeat live for the process's whole
 * lifetime instead of only inside the test suite.
 */
export async function register(): Promise<void> {
  startSocketServer();
  startPeerHeartbeat();
}
