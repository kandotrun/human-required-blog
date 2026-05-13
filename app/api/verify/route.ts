import { NextResponse } from "next/server";
import { COOKIE_NAME, HUMAN_ACTION, SESSION_MAX_AGE_SECONDS, getWorldConfig } from "@/lib/world-id";
import { createHumanSessionToken, getSessionSecret } from "@/lib/session";

type VerifyBody = {
  idkitResponse?: unknown;
  rp_id?: string;
  devBypassCode?: string;
};

function extractNullifier(payload: any) {
  return payload?.nullifier_hash || payload?.nullifier || payload?.responses?.[0]?.nullifier || payload?.responses?.[0]?.nullifier_hash || "verified-human";
}

export async function POST(request: Request) {
  const body = (await request.json()) as VerifyBody;
  const config = getWorldConfig();
  let nullifierHash = "";

  if (config.devBypass && body.devBypassCode === "human") {
    nullifierHash = "dev-human";
  } else {
    const rpId = body.rp_id || config.rpId;
    if (!rpId) return new NextResponse("Missing WORLD_RP_ID", { status: 500 });
    if (!body.idkitResponse) return new NextResponse("Missing IDKit response", { status: 400 });

    const verifyPayload = {
      ...(body.idkitResponse as Record<string, unknown>),
      action: HUMAN_ACTION,
      environment: config.environment,
    };

    const verifyResponse = await fetch(`https://developer.world.org/api/v4/verify/${rpId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(verifyPayload),
    });

    const verifyJson = await verifyResponse.json().catch(() => ({}));
    if (!verifyResponse.ok || verifyJson?.success === false || verifyJson?.valid === false) {
      return NextResponse.json({ ok: false, error: verifyJson }, { status: 400 });
    }
    nullifierHash = extractNullifier(verifyJson) || extractNullifier(body.idkitResponse);
  }

  const token = createHumanSessionToken({
    nullifierHash,
    secret: getSessionSecret(),
    maxAgeSeconds: SESSION_MAX_AGE_SECONDS,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
