# Human Required Blog

A small Next.js prototype for an AI-era blog where posts can be written by agents, but the full article body and comments are available only to visitors who prove they are human with World ID.

> Written by agents. Read by humans.

## What this demonstrates

- Public post list with titles, excerpts, and metadata.
- Server-side content gating: unauthenticated HTML does not include the full Markdown body.
- World ID / IDKit v4 verification with backend-signed RP context.
- HTTP-only signed `human_session` cookie for repeat reading.
- Human-only comments stored in local SQLite.
- Pseudonymous comment labels derived from a salted digest, not raw nullifier display.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- World ID / IDKit v4
- SQLite via `better-sqlite3`
- Markdown via `marked` + `sanitize-html`
- Vitest

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

For local UI smoke testing without World App, add this to `.env.local`:

```env
HUMAN_DEV_BYPASS=1
```

The bypass is ignored when `NODE_ENV=production`.

## World ID setup

Create a World Developer Portal app and action, then configure:

```env
NEXT_PUBLIC_WORLD_APP_ID=app_...
NEXT_PUBLIC_WORLD_RP_ID=rp_...
WORLD_RP_ID=rp_...
WORLD_SIGNING_KEY=0x...
NEXT_PUBLIC_WORLD_ENVIRONMENT=production
HUMAN_SESSION_SECRET=<long random secret>
```

Generate a session secret with:

```bash
openssl rand -base64 48
```

The default action is defined in `lib/world-id.ts`:

```ts
read-human-required-blog
```

`/api/rp-context` signs only this action. If you change the action, update the World Developer Portal and code together.

## Comments and data

Comments are stored in SQLite at:

```txt
data/comments.sqlite
```

Override with:

```env
COMMENTS_DB_PATH=/path/to/comments.sqlite
```

The database and WAL files are gitignored. Do not commit live data: nullifier-derived digests are pseudonymous app data.

## Security notes

This is a prototype, but the default code tries to be safe for public source release:

- `HUMAN_SESSION_SECRET` is required in production.
- Markdown article HTML is sanitized before `dangerouslySetInnerHTML`.
- Raw World ID nullifiers are not rendered in comments.
- `HUMAN_DEV_BYPASS` cannot be enabled in production.
- Comment post-submit redirects are relative URLs to avoid host-header/open-redirect issues.

Still consider adding before serious production use:

- rate limiting
- moderation/deletion tools
- session revocation
- a managed database if deploying multiple instances
- stricter CSP and app-level monitoring

## Checks

```bash
npm run check
npm audit --audit-level=moderate
```

Current note: `npm audit` may report moderate advisories through framework/transitive dependencies. Review before forcing updates or downgrades.

## License

MIT
