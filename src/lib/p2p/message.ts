import type { BlockchainAccessLog } from "@/lib/blockchain/access-log";
import type { Note } from "@/lib/types/api";

export interface P2PAccessLogMessage {
  type: "access_log";
  from: string;
  timestamp: string;
  data: BlockchainAccessLog;
}

export interface P2PNoteMessage {
  type: "note_created";
  from: string;
  timestamp: string;
  patientId: number;
  data: Note;
}
