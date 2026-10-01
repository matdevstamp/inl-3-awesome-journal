import type { NextRequest } from "next/server";

/**
 * Shared-secret auth for server-to-server (P2P) calls between the two demo
 * instances. Both processes read the same PEER_SECRET from the environment;
 * peers send it as `x-peer-secret` on every POST. Requests without the
 * correct secret are rejected with 401 so an outside caller cannot inject
 * fabricated notes or access logs into a patient room.
 */
export const PEER_SECRET_HEADER = "x-peer-secret";

export function getPeerSecret(): string {
  return process.env.PEER_SECRET ?? "dev-peer-secret-change-me";
}

export function isPeerAuthorized(request: Request | NextRequest): boolean {
  const provided = request.headers.get(PEER_SECRET_HEADER);

  return provided === getPeerSecret();
}

export function peerAuthHeaders(): Record<string, string> {
  return {
    [PEER_SECRET_HEADER]: getPeerSecret(),
  };
}
