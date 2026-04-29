# Server README

Quick notes for running the server locally and environment variables used by the OTP/email features.

Required environment variables
- `JWT_SECRET` - secret used to sign JWT tokens
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` - SMTP credentials to send OTP emails (optional in dev; email send will noop if missing)

Optional
- `REDIS_URL` - if set, Redis will be used to store OTPs with TTL; otherwise a MongoDB `Otp` collection is used as fallback
- `OTP_EXPIRY_SECONDS` - default 300 (5 minutes)
- `OTP_MAX_VERIFY_ATTEMPTS` - default 5

Run locally
1. Install dependencies:

```pwsh
npm install --prefix "$(pwd)\server"
```

2. Start dev server:

```pwsh
npm run dev --prefix "$(pwd)\server"
```

3. Run tests (unit tests for OTP utils):

```pwsh
npm test --prefix "$(pwd)\server"
```

Notes
- The API base used by the frontend defaults to `http://localhost:3000/api` (see `src/services/api.ts` Vite env override).
- If you enable Redis, ensure `REDIS_URL` is set to a reachable Redis instance.
