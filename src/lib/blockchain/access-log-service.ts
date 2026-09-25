import { Blockchain } from "./blockchain";
import type { BlockchainAccessLog } from "./access-log";
import { broadcastAccessLogCreated } from "@/lib/realtime/broadcast";

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

  const block = blockchain.addAccessLog(accessLog);

  void broadcastAccessLogCreated(accessLog).catch((error) => {
    console.warn("Real-time access-log broadcast failed.", error);
  });

  return block;
}

export function getAccessLogBlockchain() {
  return blockchain;
}
