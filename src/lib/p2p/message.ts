import type { BlockchainAccessLog } from "@/lib/blockchain/access-log";

export interface P2PAccessLogMessage {
  type: "access_log";
  from: string;
  timestamp: string;
  data: BlockchainAccessLog;
}