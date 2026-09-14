import { Block } from "./block";
import type { BlockchainAccessLog } from "./access-log";

export class Blockchain {
  chain: Block[];

  constructor() {
    this.chain = [];
  }

  addAccessLog(data: BlockchainAccessLog): Block {
    const previousBlock = this.chain[this.chain.length - 1];
    const previousHash = previousBlock?.hash ?? "0";

    const block = new Block(this.chain.length, data.timestamp, data, previousHash);

    this.chain.push(block);

    return block;
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
