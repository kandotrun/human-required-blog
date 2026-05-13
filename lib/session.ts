import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export type HumanSessionPayload = {
  human: true;
  nullifierHash: string;
  iat: number;
  exp: number;
  sid: string;
};

type CreateOptions = {
  nullifierHash: string;
  secret: string;
  now?: number;
  maxAgeSeconds?: number;
};

type VerifyOptions = {
  secret: string;
  now?: number;
};

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string, secret: string) {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createHumanSessionToken({
  nullifierHash,
  secret,
  now = Math.floor(Date.now() / 1000),
  maxAgeSeconds = 90 * 24 * 60 * 60,
}: CreateOptions) {
  const payload: HumanSessionPayload = {
    human: true,
    nullifierHash,
    iat: now,
    exp: now + maxAgeSeconds,
    sid: randomUUID(),
  };
  const body = base64url(JSON.stringify(payload));
  return `${body}.${sign(body, secret)}`;
}

export function verifyHumanSessionToken(
  token: string | undefined,
  { secret, now = Math.floor(Date.now() / 1000) }: VerifyOptions,
) {
  if (!token || !secret) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as HumanSessionPayload;
    if (payload.human !== true) return null;
    if (!payload.nullifierHash || typeof payload.nullifierHash !== "string") return null;
    if (payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionSecret() {
  const secret = process.env.HUMAN_SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("HUMAN_SESSION_SECRET is required in production");
  }
  return "dev-only-change-me-human-required-blog-secret";
}
