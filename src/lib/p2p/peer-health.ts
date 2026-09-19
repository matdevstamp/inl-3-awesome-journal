import { env } from "@/lib/env";
import { fetchPeerHealth } from "@/lib/p2p/transport";

export interface PeerHealthStatus {
  peerUrl: string;
  healthy: boolean | null;
  serverId: string | null;
  lastCheckedAt: string | null;
  lastError: string | null;
}

interface PeerHealthStore {
  status: PeerHealthStatus;
  timer: NodeJS.Timeout | null;
  running: boolean;
}

/**
 * Next bundles instrumentation separately from route handlers, so a plain
 * module singleton would exist twice (one per bundle). Hooking the store onto
 * globalThis guarantees a single heartbeat regardless of which bundle reads it.
 */
const STORE_KEY = Symbol.for("awesome-journal.peer-health.store");

function getStore(): PeerHealthStore {
  const holder = globalThis as typeof globalThis & { [STORE_KEY]?: PeerHealthStore };

  if (!holder[STORE_KEY]) {
    holder[STORE_KEY] = {
      status: {
        peerUrl: env.peerUrl,
        healthy: null,
        serverId: null,
        lastCheckedAt: null,
        lastError: null,
      },
      timer: null,
      running: false,
    };
  }

  return holder[STORE_KEY];
}

/** Run one peer check now and record the result. Never throws. */
export async function refreshPeerHealth(): Promise<PeerHealthStatus> {
  const store = getStore();

  try {
    const health = await fetchPeerHealth(store.status.peerUrl);

    store.status.healthy = health.healthy;
    store.status.serverId = health.serverId;
    store.status.lastCheckedAt = health.lastCheckedAt;
    store.status.lastError = null;
  } catch (error) {
    store.status.healthy = false;
    store.status.lastCheckedAt = new Date().toISOString();
    store.status.lastError = error instanceof Error ? error.message : String(error);
  }

  return { ...store.status };
}

/** Start the scheduled peer heartbeat. Idempotent — safe to call from boot and routes. */
export function startPeerHeartbeat(intervalMs: number = env.peerHeartbeatMs): void {
  const store = getStore();

  if (store.running) {
    return;
  }

  store.running = true;
  void refreshPeerHealth();
  store.timer = setInterval(() => void refreshPeerHealth(), intervalMs);
  store.timer.unref?.();
}

/** Stop the heartbeat (used by tests to avoid leaked timers). */
export function stopPeerHeartbeat(): void {
  const store = getStore();

  if (store.timer !== null) {
    clearInterval(store.timer);
    store.timer = null;
  }

  store.running = false;
}

export function getPeerHealth(): PeerHealthStatus {
  return { ...getStore().status };
}
