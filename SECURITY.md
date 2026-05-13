# Security Policy

## Supported status

This repository is an experimental World ID-gated blog prototype. It is suitable as reference code and a starting point, but you should review and harden it before production use.

## Reporting vulnerabilities

Please do **not** open public issues for sensitive vulnerabilities or leaked credentials. Contact the maintainer privately, or use GitHub private vulnerability reporting if enabled on the repository.

## Secrets

Never commit these values:

- `WORLD_SIGNING_KEY`
- `HUMAN_SESSION_SECRET`
- real `.env.local` files
- SQLite databases containing live comments or nullifier-derived digests

If a World ID signing key was pasted into chat, logs, or committed history, rotate it in the World Developer Portal before production use.

## Privacy model

World ID does not identify a legal name. This app stores only a salted digest derived from the app/action nullifier for comment labels. Treat nullifier-derived values as pseudonymous personal data and avoid logging or exposing them.

## Known prototype limitations

- No moderation UI or rate limiting is included.
- SQLite is local-process friendly, but not a multi-region/serverless database strategy by itself.
- Sessions are signed cookies and are not individually revocable.
