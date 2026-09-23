import crypto from "crypto";
import type { BlockchainAccessLog } from "./access-log";

export class Block {
  index: number;
  timestamp: string;
  data: BlockchainAccessLog;
  previousHash: string;
  hash: string;

  constructor(index: number, timestamp: string, data: BlockchainAccessLog, previousHash = "") {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash(): string {
    const blockData = JSON.stringify({
      index: this.index,
      timestamp: this.timestamp,
      data: this.data,
      previousHash: this.previousHash,
    });

    return crypto.createHash("sha256").update(blockData).digest("hex");
  }
}
