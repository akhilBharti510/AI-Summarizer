# Smoke tests

These exercise the **running** server over HTTP. They don't mock anything.

## Run

```bash
# 1. Point at a scratch DB
export DATABASE_URL="postgresql://...test_db"

# 2. Migrate + seed it
npx prisma migrate deploy
npm run db:seed

# 3. Start the server
npm run dev

# 4. In another terminal:
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=ChangeMe!2025 npm test
```

## What they cover

- Health + readiness probes
- CSRF token issuance
- Register → cookies set → `/auth/me`
- Login failure path (wrong password → 401)
- Refresh rotation (new token replaces old)
- RBAC enforcement (User → 403 on admin routes)
- Dashboard / notifications shape
- Logout clears session
- Admin path: roles list + permissions catalog

If `GEMINI_API_KEY` is set, you can also POST `/summaries` with a text body —
but we keep AI out of CI by default to avoid quota burn.
