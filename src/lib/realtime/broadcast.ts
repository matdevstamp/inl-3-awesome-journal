import type { BlockchainAccessLog } from "@/lib/blockchain/access-log";
import { isStaffRole, patientIdForUser } from "@/lib/patients/mock-patients";
import { getSocketServer } from "@/lib/realtime/socket-server";
import type { Note, SessionUser } from "@/lib/types/api";

function canReceiveNote(
  socket: { data: Record<string, unknown> },
  patientId: number,
  note: Note,
): boolean {
  const user = socket.data.user as SessionUser | undefined;

  if (!user) {
    return false;
  }

  if (note.visibility === "private") {
    return user.id === note.authorUserId;
  }

  if (note.visibility === "healthcare") {
    return isStaffRole(user.role);
  }

  if (note.visibility === "all") {
    return isStaffRole(user.role) || patientIdForUser(user) === patientId;
  }

  return false;
}

export async function broadcastNoteCreated(patientId: number, note: Note): Promise<void> {
  const io = getSocketServer();
  const sockets = await io.in(`patient:${patientId}`).fetchSockets();

  for (const socket of sockets) {
    if (canReceiveNote(socket, patientId, note)) {
      socket.emit("note-created", {
        patientId,
        note,
      });
    }
  }
}

export async function broadcastAccessLogCreated(accessLog: BlockchainAccessLog): Promise<void> {
  const io = getSocketServer();
  const sockets = await io.in(`patient:${accessLog.patientId}`).fetchSockets();

  for (const socket of sockets) {
    const user = socket.data.user as SessionUser | undefined;

    if (!user) {
      continue;
    }

    const canReceive = isStaffRole(user.role) || patientIdForUser(user) === accessLog.patientId;

    if (canReceive) {
      socket.emit("access-log-created", {
        accessLog,
      });
    }
  }
}
