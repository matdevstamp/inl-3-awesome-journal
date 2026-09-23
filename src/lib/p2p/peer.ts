import { Blockchain } from "@/lib/blockchain/blockchain";
import type { BlockchainAccessLog } from "@/lib/blockchain/access-log";
import type { P2PAccessLogMessage } from "@/lib/p2p/message";

export class Peer {
  readonly id: string;
  readonly blockchain: Blockchain;
  readonly peers: Peer[] = [];

  constructor(id: string, blockchain = new Blockchain()) {
    this.id = id;
    this.blockchain = blockchain;
  }

  receiveAccessLog(accessLog: BlockchainAccessLog): boolean {
    const alreadyExists = this.blockchain.chain.some(
      (block) => block.data.eventId === accessLog.eventId,
    );

    if (!accessLog.eventId.trim()) {
      return false;
    }

    if (alreadyExists) {
      return false;
    }

    this.blockchain.addAccessLog(accessLog);
    return true;
  }

  addPeer(peer: Peer): void {
    const alreadyExists = this.peers.some((existingPeer) => existingPeer.id === peer.id);

    if (alreadyExists) {
      return;
    }
    this.peers.push(peer);
  }
  receiveMessage(message: P2PAccessLogMessage): boolean {
    if (message.type !== "access_log") {
      return false;
    }

    if (message.from !== message.data.serverId) {
      return false;
    }

    return this.receiveAccessLog(message.data);
  }
  broadcastAccessLog(accessLog: BlockchainAccessLog): void {
    this.peers.forEach((peer) => {
      peer.receiveAccessLog(accessLog);
    });
  }
}
