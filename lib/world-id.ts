export const HUMAN_ACTION = "read-human-required-blog";
export const COOKIE_NAME = "human_session";
export const SESSION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

export type WorldIdEnvironment = "production" | "staging";

function getWorldEnvironment(): WorldIdEnvironment {
  const environment = process.env.NEXT_PUBLIC_WORLD_ENVIRONMENT || "production";
  if (environment === "production" || environment === "staging") return environment;
  throw new Error("NEXT_PUBLIC_WORLD_ENVIRONMENT must be production or staging");
}

export function getWorldConfig() {
  return {
    appId: process.env.NEXT_PUBLIC_WORLD_APP_ID,
    rpId: process.env.WORLD_RP_ID || process.env.NEXT_PUBLIC_WORLD_RP_ID,
    signingKey: process.env.WORLD_SIGNING_KEY,
    environment: getWorldEnvironment(),
    devBypass: process.env.HUMAN_DEV_BYPASS === "1" && process.env.NODE_ENV !== "production",
  };
}
