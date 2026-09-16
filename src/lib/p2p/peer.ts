import { Blockchain } from "@/lib/blockchain/blockchain";
import type { BlockchainAccessLog } from "@/lib/blockchain/access-log";
import type { P2PAccessLogMessage } from "@/lib/p2p/message";

export class Peer {
  readonly id: string;
  readonly blockchain: Blockchain;

  constructor(id: string) {
    this.id = id;
    this.blockchain = new Blockchain();
  }

  receiveAccessLog(accessLog: BlockchainAccessLog): void {
     const alreadyExists = this.blockchain.chain.some(
    (block) => block.data.eventId === accessLog.eventId,
  );
    if (!accessLog.eventId.trim()) {
    return;
  }

  if (alreadyExists) {
    return;
  }
    this.blockchain.addAccessLog(accessLog);
    
  }
  receiveMessage(message: P2PAccessLogMessage): void {
  if (message.type === "access_log") {
    this.receiveAccessLog(message.data);
  }
}
}