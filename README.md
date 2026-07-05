# Bhavishya IAS

> **Towards a Brighter Future**

India's most comprehensive **APPSC Group-1** preparation platform — a one-stop
solution carrying an aspirant from Day 1 of preparation to the final interview.
Architected to scale to APPSC Group-2, UPSC CSE, and other competitive exams.

---

## Status

✅ **Phased build complete (Phases 1–16).** Architecture, database, design system,
a typed modular-monolith backend, authentication, the admin CMS, and the student
app (dashboard, syllabus engine, reader, PYQs, current affairs) are all
implemented, tested, and containerised. See
[`PROJECT_CHECKLIST.md`](./PROJECT_CHECKLIST.md) for the phase-by-phase record.

## What makes it different

The product is not a feature list — it is a **structured, interlinked syllabus
knowledge graph**. The official APPSC Group-1 syllabus is fragmented to
**micro-theme grain (960 nodes)** — each a "one study session" unit — and enriched
with notes, PYQs, model answers, current-affairs linkages, and revision tooling,
all cross-referenced and progress-tracked per user.

## Features (implemented)

- **Syllabus engine** — 960-node graph (paper → section → unit → theme →
  micro-theme) with per-user progress and spaced revision.
- **Student dashboard** — coverage, streaks, continue-reading, revision-due,
  focus areas.
- **Reader** — safe rich-text rendering, reading-progress tracking, bookmarks.
- **PYQs** — browse by stage/year, MCQ practice with reveal, model answers.
- **Current affairs** — daily/weekly/monthly feed with region/category filters,
  linked to the syllabus.
- **Admin CMS** — content lifecycle (draft → review → publish) with versioning &
  separation of duties; user & role management.
- **Auth** — email/password + Google + email OTP; verification & password reset.
- **Platform** — data-driven RBAC, `examId` multitenancy, audit log, typed API
  (`/api/v1`), 90-test suite, CI, and a Docker/standalone deploy.

## Quick start

```bash
pnpm install
cp .env.example .env.local           # set DATABASE_URL, AUTH_SECRET, …
pnpm prisma migrate deploy
pnpm prisma db execute --file prisma/sql/001_search.sql   --schema prisma/schema.prisma
pnpm prisma db execute --file prisma/sql/002_leaderboard.sql --schema prisma/schema.prisma
pnpm db:seed
pnpm dev                             # http://localhost:3000
```

Or run the whole stack (Postgres + Redis + migrate + app):

```bash
AUTH_SECRET=$(openssl rand -base64 32) docker compose up --build
```

See [`docs/09-deployment.md`](./docs/09-deployment.md) for Vercel & self-host details.

## Documentation

| Doc | Description |
|-----|-------------|
| [01 — PRD](./docs/01-PRD.md) | Product Requirement Document |
| [02 — Architecture](./docs/02-architecture.md) | System architecture & ADRs |
| [03 — Database](./docs/03-database.md) | Schema (45 tables) + ER diagrams |
| [04 — Wireframes](./docs/04-wireframes.md) | IA + screen wireframes |
| [05 — Design System](./docs/05-design-system.md) | Tokens, type, components |
| [06 — Folder Structure](./docs/06-folder-structure.md) | Project layout & conventions |
| [07 — API](./docs/07-api.md) | Backend API reference |
| [08 — Testing](./docs/08-testing.md) | Test strategy & CI |
| [09 — Deployment](./docs/09-deployment.md) | Deploy runbook |
| [Project Checklist](./PROJECT_CHECKLIST.md) | Phase-by-phase build tracker |

## Tech Stack

**Frontend:** Next.js (App Router) · TypeScript · TailwindCSS v4 · React 19
**Backend:** Next.js Route Handlers · Prisma · PostgreSQL · Redis-ready
**Auth:** Auth.js (Google + Email + OTP · JWT)
**Storage:** AWS S3 · **Search:** PostgreSQL FTS (Meilisearch-ready)
**Testing/DevOps:** Vitest · GitHub Actions · Docker · Vercel

## Scripts

```bash
pnpm dev · pnpm build · pnpm start
pnpm typecheck · pnpm test · pnpm test:watch
pnpm prisma:migrate · pnpm prisma:validate · pnpm db:seed
```

---

_© Bhavishya IAS. All rights reserved._
