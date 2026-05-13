# Contributing

Thanks for taking a look at Human Required Blog.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

For local UI smoke tests without opening World App, you may set `HUMAN_DEV_BYPASS=1` in `.env.local`. The app ignores this bypass in production.

## Quality checks

Run the full check before opening a PR:

```bash
npm run check
npm audit --audit-level=moderate
```

## Security and privacy expectations

- Do not commit `.env.local`, signing keys, session secrets, or SQLite databases.
- Do not log raw World ID nullifiers or proof payloads.
- Render user content as text unless it is explicitly sanitized.
- Add or update tests for behavior changes.
