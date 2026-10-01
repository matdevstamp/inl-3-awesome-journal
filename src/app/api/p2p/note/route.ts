import { NextResponse } from "next/server";

import { isPeerAuthorized } from "@/lib/p2p/peer-auth";
import type { P2PNoteMessage } from "@/lib/p2p/message";
import { broadcastNoteCreated } from "@/lib/realtime/broadcast";

export async function POST(request: Request) {
  if (!isPeerAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized peer",
      },
      { status: 401 },
    );
  }

  let message: P2PNoteMessage;

  try {
    const body: unknown = await request.json();

    if (!isP2PNoteMessage(body)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid P2P note message",
        },
        { status: 400 },
      );
    }

    message = body;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid JSON",
      },
      { status: 400 },
    );
  }

  await broadcastNoteCreated(message.patientId, message.data);

  return NextResponse.json({
    ok: true,
    data: message,
  });
}

function isP2PNoteMessage(value: unknown): value is P2PNoteMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const message = value as Record<string, unknown>;

  return (
    message.type === "note_created" &&
    typeof message.from === "string" &&
    typeof message.timestamp === "string" &&
    typeof message.patientId === "number" &&
    typeof message.data === "object" &&
    message.data !== null
  );
}
