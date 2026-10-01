import { startPeerHeartbeat } from "@/lib/p2p/peer-health";
import { startSocketServer } from "@/lib/realtime/socket-server";

/**
 * Node-runtime-only bootstrap, loaded from `instrumentation.ts` behind a
 * `NEXT_RUNTIME` guard. Kept in its own module so bundlers statically analyse
 * `instrumentation.ts` without pulling `node:http` into the Edge bundle.
 */
export function startNodeRuntimeServices(): void {
  startSocketServer();
  startPeerHeartbeat();
}
