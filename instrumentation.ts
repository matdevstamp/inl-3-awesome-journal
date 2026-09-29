/**
 * Runs once when each server bootstraps (dev and `next start`), so the
 * Socket.io listener and the peer heartbeat live for the process's whole
 * lifetime instead of only inside the test suite.
 *
 * The Node-only work is behind a dynamic import guarded by NEXT_RUNTIME: a
 * static import would drag `node:http` (used to attach Socket.io to its own
 * listener) into the Edge instrumentation bundle, which cannot run it.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startNodeRuntimeServices } = await import("./instrumentation-node");
    startNodeRuntimeServices();
  }
}
