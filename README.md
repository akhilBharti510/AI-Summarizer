# AI Summarizer — Production-grade SaaS

A full-stack AI summarization platform with role-based access control, multi-source ingestion (text/URL/PDF/DOCX/image), multi-language output, admin dashboards, audit logs, and analytics.

## Architecture

```
client/  →  React + Vite + Tailwind + Shadcn-style UI + TanStack Query  (deploy: Vercel)
server/  →  Node + Express + Prisma + PostgreSQL + Gemini 2.5 Flash      (deploy: Railway)
db   →  PostgreSQL (Neon)
```

| Layer | Stack |
|---|---|
| Frontend | React 18, Vite 6, TailwindCSS, Shadcn-style primitives (Radix UI), React Router 7, TanStack Query 5, React Hook Form, Zod, recharts, sonner, i18next |
| Backend | Express 4 (ESM), Prisma 5, Postgres, JWT (access 15m + refresh 90d w/ family rotation), bcrypt 12 rounds, Passport (Google OAuth), Multer, csurf, helmet, express-rate-limit, Winston, Morgan, Sentry |
| AI | Google Generative AI SDK — Gemini 2.5 Flash (text + vision) |

## Repo layout

```
ai-summarizer/
├── client/           # React frontend (Vercel)
├── server/           # Express API (Railway)
└── README.md
```

## Local development

### 1. Database (Neon or local Postgres)
Create a Postgres database and copy its connection string.

### 2. Backend
```bash
cd server
cp .env.example .env
# Edit .env — fill in:
#   DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, SESSION_SECRET,
#   GEMINI_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, (optionally) GOOGLE_*, SMTP_*
npm install
npm run check:env
npx prisma migrate dev --name init
npm run db:seed
npm run dev          # http://localhost:4000
```

### 3. Frontend
```bash
cd client
cp .env.example .env  # VITE_API_URL=http://localhost:4000/api/v1
npm install
npm run dev          # http://localhost:5173
```

### 4. Smoke tests
```bash
cd server
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=ChangeMe!2025 npm test
```

## Production deployment

### Backend → Railway
1. Push `server/` to a Git repo.
2. New Railway project → Deploy from GitHub.
3. Set environment variables (matching `.env.example`); set `COOKIE_SECURE=true`.
4. Add a Postgres plugin (or use Neon by setting `DATABASE_URL`).
5. Railway auto-detects `railway.json` and `nixpacks.toml`.
6. Health check path: `/healthz` (already configured).
7. First deploy will run `prisma migrate deploy` automatically. Then run `npm run db:seed` once via Railway shell.

### Database → Neon
1. Create a Neon project + branch.
2. Copy the pooled connection string into `DATABASE_URL` (append `?sslmode=require&pgbouncer=true&connect_timeout=10`).

### Frontend → Vercel
1. Import `client/` as a Vercel project.
2. Build command: `npm run build` (default).
3. Set `VITE_API_URL=https://your-railway-app.up.railway.app/api/v1`.
4. Add backend domain to `CORS_ORIGINS` on Railway.
5. `vercel.json` already handles SPA rewrites + security headers.

### Cookie / CORS notes
- Frontend and API live on different domains in production → set:
  - server `COOKIE_SECURE=true`
  - server `CORS_ORIGINS=https://your-vercel-domain` (comma-separated for multiple)
  - if you want the API and app on different subdomains of the **same** apex, set `COOKIE_DOMAIN=.example.com`

### Google OAuth
- Add the deployed callback URL to your Google Cloud OAuth client: `https://api.example.com/api/v1/auth/google/callback`
- Set the env vars on Railway: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `OAUTH_SUCCESS_REDIRECT`, `OAUTH_FAILURE_REDIRECT`

### Mail (forgot-password)
- Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`. Production refuses to send without these.

## Default roles & limits (seeded)

| Role | Daily limit | Notes |
|---|---|---|
| Guest | 3 / browser session | session-cookie scoped |
| User | 20 | default for new sign-ups |
| Premium | 100 | upgrade tier |
| Admin | Unlimited | seeded from `ADMIN_EMAIL/ADMIN_PASSWORD`; cannot be deleted or deactivated |

Admins can create arbitrary custom roles (Researcher, Editor…) with their own limits and permissions at runtime — no code deploy required.

## Security checklist (built-in)

- HTTP-only, SameSite=Lax cookies (no token in localStorage)
- Refresh-token rotation + family-based reuse detection
- bcrypt 12 rounds; password reset tokens hashed (sha256) + 30 min TTL + single-use
- CSRF (double-submit cookie) on all authed state-changing routes
- Helmet, strict CORS allowlist, hpp, sanitize-html
- Per-route rate limiting (auth 10/min, summarize 30/min/user, global 120/min)
- Multer memory storage + magic-byte file type validation
- URL extractor blocks loopback / private / link-local IPs (SSRF guard)
- Zod-validated env vars at boot — app refuses to start with missing secrets
- Full audit log of privileged actions

## Endpoint map (`/api/v1`)

| Group | Paths |
|---|---|
| Auth | `/auth/{register,login,logout,refresh,me,csrf,forgot-password,reset-password,change-password,google,google/callback}` |
| Users | `/users`, `/users/:id`, `/users/:id/reset-usage`, `/users/me/profile` |
| Roles | `/roles`, `/roles/:id`, `/roles/:id/activate`, `/roles/:id/deactivate`, `/roles/permissions/catalog` |
| Summaries | `/summaries`, `/summaries/:id`, `/summaries/:id/regenerate`, `/summaries/:id/bookmark`, `/summaries/:id/export` |
| Bookmarks | `/bookmarks`, `/bookmarks/:id` |
| Analytics | `/analytics/{overview,usage,growth,summary-types}` |
| Audit | `/audit-logs`, `/audit-logs/:id` |
| Notifications | `/notifications`, `/notifications/:id/read`, `/notifications/read-all` |
| Dashboard | `/dashboard/me` |
| Health | `/healthz`, `/readyz` |

## License

Proprietary. All rights reserved.

This software is proprietary and intended for internal or evaluation purposes only.
Unauthorized copying, modification, distribution, or commercial use is prohibited without permission from the owner.
