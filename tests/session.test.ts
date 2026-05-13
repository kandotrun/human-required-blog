import { afterEach, describe, expect, it, vi } from "vitest";
import { createHumanSessionToken, getSessionSecret, verifyHumanSessionToken } from "../lib/session";

describe("human session tokens", () => {
  const secret = "test-secret-at-least-32-bytes-long";

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts a token signed with the configured secret", () => {
    const token = createHumanSessionToken({
      nullifierHash: "0xabc",
      secret,
      now: 1_700_000_000,
      maxAgeSeconds: 90 * 24 * 60 * 60,
    });

    const payload = verifyHumanSessionToken(token, { secret, now: 1_700_000_010 });

    expect(payload?.human).toBe(true);
    expect(payload?.nullifierHash).toBe("0xabc");
  });

  it("rejects tampered tokens", () => {
    const token = createHumanSessionToken({
      nullifierHash: "0xabc",
      secret,
      now: 1_700_000_000,
      maxAgeSeconds: 90,
    });

    const [body, signature] = token.split(".");
    const tamperedBody = `${body.slice(0, -1)}${body.endsWith("A") ? "B" : "A"}`;
    const tampered = `${tamperedBody}.${signature}`;

    expect(verifyHumanSessionToken(tampered, { secret, now: 1_700_000_010 })).toBeNull();
  });

  it("rejects expired tokens", () => {
    const token = createHumanSessionToken({
      nullifierHash: "0xabc",
      secret,
      now: 1_700_000_000,
      maxAgeSeconds: 10,
    });

    expect(verifyHumanSessionToken(token, { secret, now: 1_700_000_011 })).toBeNull();
  });

  it("fails closed when HUMAN_SESSION_SECRET is missing in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("HUMAN_SESSION_SECRET", "");

    expect(() => getSessionSecret()).toThrow(/HUMAN_SESSION_SECRET/);
  });
});
