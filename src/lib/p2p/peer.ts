import { Blockchain } from "@/lib/blockchain/blockchain";
import type { BlockchainAccessLog } from "@/lib/blockchain/access-log";
import type { P2PAccessLogMessage } from "@/lib/p2p/message";

/**
 * Outcome of handing a log to a peer.
 *
 * `duplicate` is deliberately not an error: `syncServerPeer` is a two-way sync,
 * so the same eventId legitimately arrives again after the peer's own push
 * round-trips. Only `rejected` is a real failure and should surface as one.
 */
export type ReceiveResult = "stored" | "duplicate" | "rejected";

export class Peer {
  readonly id: string;
  readonly blockchain: Blockchain;
  readonly peers: Peer[] = [];

  constructor(id: string, blockchain = new Blockchain()) {
    this.id = id;
    this.blockchain = blockchain;
  }

  receiveAccessLog(accessLog: BlockchainAccessLog): ReceiveResult {
    if (!accessLog.eventId.trim()) {
      return "rejected";
    }

    const alreadyExists = this.blockchain.chain.some(
      (block) => block.data.eventId === accessLog.eventId,
    );

    if (alreadyExists) {
      return "duplicate";
    }

    this.blockchain.addAccessLog(accessLog);
    return "stored";
  }

  addPeer(peer: Peer): void {
    const alreadyExists = this.peers.some((existingPeer) => existingPeer.id === peer.id);

    if (alreadyExists) {
      return;
    }
    this.peers.push(peer);
  }
  receiveMessage(message: P2PAccessLogMessage): ReceiveResult {
    if (message.type !== "access_log") {
      return "rejected";
    }

    if (message.from !== message.data.serverId) {
      return "rejected";
    }

    return this.receiveAccessLog(message.data);
  }
  broadcastAccessLog(accessLog: BlockchainAccessLog): void {
    this.peers.forEach((peer) => {
      peer.receiveAccessLog(accessLog);
    });
  }
}
