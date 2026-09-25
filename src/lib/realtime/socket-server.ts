import { Server } from "socket.io";
import { createServer } from "node:http";
import { isStaffRole } from "@/lib/patients/mock-patients";

import { verifySessionToken } from "@/lib/auth";
import type { SessionUser } from "@/lib/types/api";

let io: Server | null = null;

function getTokenFromCookie(cookieHeader?: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const tokenCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("token="));

  return tokenCookie ? tokenCookie.slice("token=".length) : null;
}

export function getSocketServer(): Server {
  if (!io) {
    io = new Server({
      cors: {
        origin: true,
        credentials: true,
      },
    });

    io.use((socket, next) => {
      const token = getTokenFromCookie(socket.handshake.headers.cookie);
      const user = token ? verifySessionToken(token) : null;

      if (!user) {
        next(new Error("UNAUTHENTICATED"));
        return;
      }

      socket.data.user = user satisfies SessionUser;
      next();
    });

    io.on("connection", (socket) => {
      socket.on("join-patient", (patientId: number) => {
        console.log("[socket] joining patient room:", patientId);

        const user = socket.data.user as SessionUser;
        const canJoinPatientRoom = isStaffRole(user.role) || user.patientId === patientId;
        if (!canJoinPatientRoom) {
          socket.emit("socket-error", {
            code: "UNAUTHORIZED",
            message: "You are not allowed to receive updates for this patient.",
          });
          return;
        }

        void socket.join(`patient:${patientId}`);
      });

      socket.on("leave-patient", (patientId: number) => {
        socket.leave(`patient:${patientId}`);
      });
    });
  }

  return io;
}
let socketPortStarted = false;

export function startSocketServer(): void {
  if (socketPortStarted) {
    return;
  }

  const httpServer = createServer();
  const socketServer = getSocketServer();

  socketServer.attach(httpServer);

  const nextPort = Number(process.env.PORT ?? 3000);
  const socketPort = Number(process.env.SOCKET_PORT ?? nextPort + 1000);

  httpServer.listen(socketPort, () => {
    console.log(`Socket.io listening on port ${socketPort}`);
  });

  socketPortStarted = true;
}
