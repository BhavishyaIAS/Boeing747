# Free Hosting — Vercel + Neon ($0/month)

The cheapest way to run Bhavishya IAS in production. Redis, S3 and email are
**not** on the critical path yet, so you only need two services — both free.

| Concern | Service | Cost |
|---------|---------|------|
| App (Next.js) | **Vercel** (Hobby) | Free |
| Database | **Neon** (Postgres) | Free |
| Redis / S3 / Email | — (skip for now) | — |
| Search | Postgres FTS (built-in) | — |

> **Note:** Vercel's Hobby plan is for **non-commercial** use. When you start
> charging, move to Vercel Pro ($20/mo) or self-host (see `docs/09-deployment.md`).

---

## 1. Database — Neon

1. Create a project at [neon.tech](https://neon.tech).
2. From the dashboard, copy **two** connection strings:
   - **Pooled** — host contains `-pooler` → this is `DATABASE_URL`
   - **Direct** — host without `-pooler` → this is `DIRECT_URL`
3. Append `?sslmode=require` if not already present.

## 2. Bootstrap the database (from your laptop)

```bash
export DATABASE_URL="<neon-pooled-url>"
export DIRECT_URL="<neon-direct-url>"

pnpm prisma migrate deploy
pnpm prisma db execute --file prisma/sql/001_search.sql     --schema prisma/schema.prisma
pnpm prisma db execute --file prisma/sql/002_leaderboard.sql --schema prisma/schema.prisma
SEED_ADMIN_PASSWORD='choose-a-strong-password' pnpm db:seed
```

This creates the 960-node syllabus, RBAC, a super admin
(`admin@bhavishyaias.app`), and sample PYQs / current affairs.

## 3. App — Vercel

1. Push the repo to GitHub (done).
2. [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
   Framework auto-detects as **Next.js**; leave build settings default.
3. **Environment Variables** (Production + Preview):

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Neon **pooled** URL |
   | `DIRECT_URL` | Neon **direct** URL |
   | `AUTH_SECRET` | output of `openssl rand -base64 32` |
   | `APP_URL` | `https://<your-project>.vercel.app` |
   | `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | _(optional — enables Google login)_ |

4. **Deploy.**

## 4. Verify

- `https://<project>.vercel.app/api/v1/health` → `{"status":"ok","db":"up"}`
- Sign in at `/app` (student) or `/admin` (CMS) with `admin@bhavishyaias.app` and
  the seed password — or via Google if configured.

## 5. Google login (optional, free)

1. Google Cloud Console → **APIs & Services → Credentials → OAuth client ID**
   (Web application).
2. Authorised redirect URI:
   `https://<project>.vercel.app/api/v1/auth/callback/google`
3. Put the client id/secret into `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` on Vercel
   and redeploy.

## 6. Running migrations on future deploys

Do **not** auto-migrate on every build. When the schema changes, run
`prisma migrate deploy` (step 2) against the production `DIRECT_URL` from your
machine or a CI job, then deploy the app.

## 7. When you outgrow free

- **Media uploads** → Cloudflare **R2** (10 GB free, zero egress) via the `S3_*`
  vars (S3-compatible).
- **Email OTP** → **Resend** (3k/mo free) or Brevo; set the `MAIL_*` vars.
- **Caching / rate-limit at scale** → Upstash **Redis** (free tier); set `REDIS_URL`.
- **Commercial launch** → Vercel Pro, or the $5 VPS in `docs/09-deployment.md §4`.

Each slots in behind the existing ports/adapters with no core changes.
