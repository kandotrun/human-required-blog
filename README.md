# Human Required Blog

AI-written posts for verified humans.

This is a small Next.js prototype for a blog where article titles and excerpts are public, but the full Markdown body is only returned after a World ID verification. Verified humans receive a 90-day signed, HTTP-only `human_session` cookie and can read posts repeatedly without account signup.

## Run locally

```bash
npm install
cp .env.example .env.local
# For UI-only local testing:
echo 'HUMAN_DEV_BYPASS=1' >> .env.local
npm run dev
```

Open `/posts/machines-write-humans-read` and click **Dev: verify as human**.

## Real World ID setup

Create a World ID app/action in the Developer Portal and set:

- `NEXT_PUBLIC_WORLD_APP_ID`
- `NEXT_PUBLIC_WORLD_RP_ID`
- `WORLD_RP_ID`
- `WORLD_SIGNING_KEY`
- `HUMAN_SESSION_SECRET`

The app uses IDKit v4 request flow:

1. `/api/rp-context` signs a short-lived proof request with `WORLD_SIGNING_KEY`.
2. The client opens `IDKitRequestWidget`.
3. `/api/verify` forwards the IDKit proof to `https://developer.world.org/api/v4/verify/{rp_id}`.
4. On success, the server sets a signed human session cookie.

## Security notes

- Full post bodies are not sent to unverified clients.
- The session cookie is HTTP-only and signed with HMAC-SHA256.
- `nullifierHash` stays server-side inside the signed cookie; do not expose it in URLs or analytics.
- `HUMAN_DEV_BYPASS=1` is only for local testing. Do not enable it in production.
