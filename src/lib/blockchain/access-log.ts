export interface BlockchainAccessLog {
  userId: number;
  patientId: number;
  recordId: number | null;
  action: string;
  serverId: string;
  timestamp: string;
}
