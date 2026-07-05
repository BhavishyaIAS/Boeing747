# Bhavishya IAS — Deployment

**Document:** Phase 16 Deliverable
**Last Updated:** 2026-07-05

How to run and deploy the platform. Two supported paths: **Vercel** (primary,
managed) and **Docker / docker-compose** (self-host & local parity).

---

## 1. Environment contract

All keys are documented in `.env.example` and parsed/validated at boot by
`src/lib/validation/env.ts`.

| Key | Required | Notes |
|-----|----------|-------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (pooled, for the runtime) |
| `DIRECT_URL` | ✅ | Direct connection for migrations; = `DATABASE_URL` on self-host/local |
| `APP_URL` | ✅ | Public base URL (e.g. `https://bhavishyaias.app`) |
| `AUTH_SECRET` | ✅ prod | `openssl rand -base64 32` |
| `REDIS_URL` | ○ | Cache / sessions / rate-limit (recommended in prod) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | ○ | Enables Google sign-in when present |
| `S3_REGION` / `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_ENDPOINT` | ○ | Media storage |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USER` / `MAIL_PASSWORD` / `MAIL_FROM` | ○ | Transactional email + OTP |
| `SEED_ADMIN_PASSWORD` | ○ | Seed-time only — sets the super-admin password |

**Never commit secrets.** `.env*` is gitignored.

---

## 2. Database bootstrap (any environment)

```bash
pnpm prisma migrate deploy          # apply schema migrations
pnpm prisma db execute --file prisma/sql/001_search.sql   --schema prisma/schema.prisma
pnpm prisma db execute --file prisma/sql/002_leaderboard.sql --schema prisma/schema.prisma
pnpm db:seed                        # RBAC, exam, super admin, syllabus, samples
```

- `migrate deploy` applies `prisma/migrations/` (no dev prompts).
- The raw-SQL files add the FTS `tsvector` columns/GIN indexes and the leaderboard
  materialized view (not modeled in Prisma).
- The seed is **idempotent** — safe to re-run; it upserts the 960-node syllabus,
  RBAC, a super admin, and sample PYQs / current affairs.

---

## 3. Local development

```bash
pnpm install
cp .env.example .env.local          # set DATABASE_URL, REDIS_URL, AUTH_SECRET…
# bootstrap the DB (section 2)
pnpm dev                            # http://localhost:3000
```

Sign in at `/app` or `/admin` with `admin@bhavishyaias.app` (set
`SEED_ADMIN_PASSWORD` before seeding to enable password login), or via Google.

---

## 4. Docker / docker-compose (self-host)

The stack is Postgres + Redis + a one-shot **migrate** job + the **app**:

```bash
AUTH_SECRET=$(openssl rand -base64 32) SEED_ADMIN_PASSWORD=change-me \
  docker compose up --build
```

- `migrate` (built from the `builder` stage — it has the Prisma CLI) runs
  `migrate deploy` → raw-SQL files → seed, then exits.
- `app` starts only after `migrate` **completes successfully**
  (`depends_on: service_completed_successfully`).
- The runtime image is the Next.js **standalone** server (`output: "standalone"`),
  running as a non-root user; the Debian base ships the OpenSSL the Prisma engine
  needs, and the traced bundle includes the `debian-openssl-3.0.x` query engine.

App: <http://localhost:3000> · Health: <http://localhost:3000/api/v1/health>.

### Image layout (`Dockerfile`)
`base` (Debian slim + pnpm + openssl) → `deps` (cached install) → `builder`
(`prisma generate` + `next build`) → `runner` (copies `.next/standalone`,
`.next/static`, `public`; `CMD node server.js`).

---

## 5. Vercel (primary)

1. Import the repo; framework auto-detected (Next.js).
2. Set env vars (§1) in the project settings for Production/Preview.
3. Provision managed **Postgres** + **Redis** (e.g. Neon/Supabase + Upstash) and
   an **S3** bucket; point the env vars at them.
4. **Migrations:** run the §2 bootstrap from CI or a one-off (`prisma migrate
   deploy` against the production `DATABASE_URL`) — do not auto-migrate on every
   build. A safe pattern is a release step in the deploy pipeline.
5. Deploy. Preview deployments get their own env; use a separate database.

> `output: "standalone"` is Docker-oriented and harmless on Vercel (Vercel uses
> its own build output). No change needed to deploy on Vercel.

---

## 6. Operations

- **Health check:** `GET /api/v1/health` → `200 {status:"ok"}` when the DB is
  reachable, `503` otherwise. Wire it to the orchestrator's liveness/readiness
  probe and uptime monitoring.
- **CI gate:** `.github/workflows/ci.yml` runs install → prisma generate/validate
  → typecheck → test → build on every push/PR.
- **Backups:** enable automated Postgres backups (managed provider) and rehearse
  restores. Media in S3 should have versioning enabled.
- **Leaderboard refresh:** `REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard;`
  on a schedule (or after batch scoring).
- **Secrets rotation:** rotate `AUTH_SECRET`, DB and S3 credentials periodically;
  they live only in the platform's secret store.

---

## 7. Scaling path (per architecture §14)

Vertical + platform autoscale first → Redis caching + CDN → Postgres read
replicas → extract hot modules to services only when data proves the need. The
modular-monolith boundaries and event seams make that extraction incremental.
