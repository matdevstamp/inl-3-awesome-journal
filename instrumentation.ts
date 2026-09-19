import { startPeerHeartbeat } from "@/lib/p2p/peer-health";

/**
 * Runs once when each server bootstraps (dev and `next start`), so the
 * peer heartbeat pings the other instance for the process's whole lifetime
 * instead of only inside the test suite.
 */
export async function register(): Promise<void> {
  startPeerHeartbeat();
}
