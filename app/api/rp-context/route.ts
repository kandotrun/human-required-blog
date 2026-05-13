import { signRequest } from "@worldcoin/idkit-core";
import { NextResponse } from "next/server";
import { getWorldConfig, HUMAN_ACTION } from "@/lib/world-id";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || HUMAN_ACTION;
  const config = getWorldConfig();

  if (action !== HUMAN_ACTION) {
    return new NextResponse("Unsupported action", { status: 400 });
  }

  if (!config.rpId || !config.signingKey) {
    return new NextResponse("Missing WORLD_RP_ID or WORLD_SIGNING_KEY", { status: 500 });
  }

  const signed = signRequest({ signingKeyHex: config.signingKey, action, ttl: 5 * 60 });
  return NextResponse.json({
    rp_id: config.rpId,
    nonce: signed.nonce,
    created_at: signed.createdAt,
    expires_at: signed.expiresAt,
    signature: signed.sig,
  });
}
