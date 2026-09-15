import { ok } from "@/lib/api/http";
import { getAccessLogBlockchain } from "@/lib/blockchain/access-log-service";

export async function GET() {
  const blockchain = getAccessLogBlockchain();

  return ok({
    accessLogs: blockchain.chain
      .slice(1)
      .map((block) => block.data),
    chainValid: blockchain.isValid(),
  });
}