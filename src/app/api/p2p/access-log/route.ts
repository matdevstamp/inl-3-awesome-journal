import { NextResponse } from "next/server";
import { serverPeer } from "@/app/api/p2p/server-peer";
import type { P2PAccessLogMessage } from "@/lib/p2p/message";
import { isPeerAuthorized } from "@/lib/p2p/peer-auth";
import { getAccessLogBlockchain } from "@/lib/blockchain/access-log-service";

export async function POST(request: Request) {
  if (!isPeerAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        stored: false,
        error: "Unauthorized peer",
      },
      { status: 401 },
    );
  }

  let message: P2PAccessLogMessage;

  try {
    const body: unknown = await request.json();

    if (!isP2PAccessLogMessage(body)) {
      return NextResponse.json(
        {
          ok: false,
          stored: false,
          error: "Invalid P2P access-log message",
        },
        { status: 400 },
      );
    }

    message = body;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        stored: false,
        error: "Invalid JSON",
      },
      { status: 400 },
    );
  }

  const stored = serverPeer.receiveMessage(message);

  if (!stored) {
    return NextResponse.json(
      {
        ok: false,
        stored: false,
        error: "Access log was rejected",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    stored: true,
    data: message,
  });
}
function isP2PAccessLogMessage(value: unknown): value is P2PAccessLogMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const message = value as Record<string, unknown>;

  if (
    message.type !== "access_log" ||
    typeof message.from !== "string" ||
    typeof message.timestamp !== "string" ||
    typeof message.data !== "object" ||
    message.data === null
  ) {
    return false;
  }

  const data = message.data as Record<string, unknown>;

  return (
    typeof data.eventId === "string" &&
    data.eventId.trim().length > 0 &&
    typeof data.userId === "number" &&
    typeof data.patientId === "number" &&
    (typeof data.recordId === "number" || data.recordId === null) &&
    typeof data.action === "string" &&
    typeof data.serverId === "string" &&
    typeof data.timestamp === "string"
  );
}
export async function GET() {
  const blockchain = getAccessLogBlockchain();

  return NextResponse.json({
    ok: true,
    data: {
      accessLogs: blockchain.chain.map((block) => block.data),
      chainValid: blockchain.isValid(),
    },
  });
}
