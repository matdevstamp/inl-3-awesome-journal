import { Server } from "socket.io";
import { createServer } from "node:http";
import { isStaffRole } from "@/lib/patients/mock-patients";

import { verifySessionToken } from "@/lib/auth";
import type { SessionUser } from "@/lib/types/api";

/**
 * Next bundles instrumentation and route handlers separately, so a plain
 * module singleton would exist twice (one per bundle). Hooking the server
 * onto globalThis guarantees route handlers and instrumentation talk to the
 * one Socket.io instance that is actually listening (same trick as
 * peer-health.ts).
 */
const IO_KEY = Symbol.for("awesome-journal.socket.io");

type SocketIoHolder = typeof globalThis & { [IO_KEY]?: Server };

export function getSocketServer(): Server {
  const holder = globalThis as SocketIoHolder;

  if (!holder[IO_KEY]) {
    holder[IO_KEY] = buildSocketServer();
  }

  return holder[IO_KEY];
}

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

function buildSocketServer(): Server {
  const io = new Server({
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

  return io;
}

let socketPortStarted = false;

/**
 * Attach the Socket.io server to its own HTTP listener. Called from
 * `instrumentation.ts` so the listener lives for the whole process lifetime
 * on both demo instances (ports: PORT + 1000, or SOCKET_PORT).
 */
export function startSocketServer(): void {
  if (socketPortStarted) {
    return;
  }

  const io = getSocketServer();
  const httpServer = createServer();

  io.attach(httpServer);

  const nextPort = Number(process.env.PORT ?? 3000);
  const socketPort = Number(process.env.SOCKET_PORT ?? nextPort + 1000);

  httpServer.listen(socketPort, () => {
    console.log(`Socket.io listening on port ${socketPort}`);
  });

  socketPortStarted = true;
}
