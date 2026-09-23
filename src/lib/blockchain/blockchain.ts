import { Block } from "./block";
import type { BlockchainAccessLog } from "./access-log";

export class Blockchain {
  chain: Block[];

  constructor() {
    this.chain = [];
  }

  addAccessLog(data: BlockchainAccessLog): Block {
    const accessLogs = [...this.chain.map((block) => block.data), data];

    accessLogs.sort((a, b) => {
      const timestampComparison = a.timestamp.localeCompare(b.timestamp);

      if (timestampComparison !== 0) {
        return timestampComparison;
      }

      return a.eventId.localeCompare(b.eventId);
    });

    this.chain = [];

    for (const accessLog of accessLogs) {
      const previousBlock = this.chain[this.chain.length - 1];
      const previousHash = previousBlock?.hash ?? "0";

      const block = new Block(this.chain.length, accessLog.timestamp, accessLog, previousHash);

      this.chain.push(block);
    }

    const addedBlock = this.chain.find((block) => block.data.eventId === data.eventId);

    if (!addedBlock) {
      throw new Error("Failed to add access log to blockchain");
    }

    return addedBlock;
  }

  isValid(): boolean {
    for (let i = 0; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];

      if (!currentBlock) {
        return false;
      }

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (i > 0) {
        const previousBlock = this.chain[i - 1];

        if (!previousBlock) {
          return false;
        }

        if (currentBlock.previousHash !== previousBlock.hash) {
          return false;
        }
      }
    }

    return true;
  }
}
