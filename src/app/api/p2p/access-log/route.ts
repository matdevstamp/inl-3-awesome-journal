import { NextResponse } from "next/server";
import { serverPeer } from "@/app/api/p2p/server-peer";
import type { P2PAccessLogMessage } from "@/lib/p2p/message";
import { getAccessLogBlockchain } from "@/lib/blockchain/access-log-service";

export async function POST(request: Request) {
  const message = (await request.json()) as P2PAccessLogMessage;

  serverPeer.receiveMessage(message);

  return NextResponse.json({
    ok: true,
    stored: true,
    data: message,
  });
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
