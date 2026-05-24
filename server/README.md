# AI Summarizer — Server

Express + Prisma + PostgreSQL backend.

## Quick start

```bash
cp .env.example .env       # fill in DATABASE_URL, secrets, GEMINI_API_KEY, etc.
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Health checks:
- `GET /healthz` — liveness
- `GET /readyz` — readiness (hits DB)

API base: `http://localhost:4000/api/v1`

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | nodemon hot-reload |
| `npm start` | production node |
| `npm run prisma:migrate:dev` | create + apply migration locally |
| `npm run prisma:migrate` | apply migrations (prod) |
| `npm run db:seed` | seed default roles + admin |
| `npm run lint` / `npm run format` | code quality |
