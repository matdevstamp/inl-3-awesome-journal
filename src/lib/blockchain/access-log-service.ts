import { Blockchain } from "./blockchain";
import type { BlockchainAccessLog } from "./access-log";

const blockchain = new Blockchain();

interface CreateAccessLogInput {
  userId: number;
  patientId: number;
  recordId?: number | null;
  action: string;
  serverId: string;
}

export function createAccessLog(input: CreateAccessLogInput) {
  const accessLog: BlockchainAccessLog = {
    eventId: crypto.randomUUID(),
    userId: input.userId,
    patientId: input.patientId,
    recordId: input.recordId ?? null,
    action: input.action,
    serverId: input.serverId,
    timestamp: new Date().toISOString(),
  };

  return blockchain.addAccessLog(accessLog);
}

export function getAccessLogBlockchain() {
  return blockchain;
}