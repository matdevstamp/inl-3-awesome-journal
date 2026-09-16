export interface BlockchainAccessLog {
  eventId: string;
  userId: number;
  patientId: number;
  recordId: number | null;
  action: string;
  serverId: string;
  timestamp: string;
}
