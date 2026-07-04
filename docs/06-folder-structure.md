# Bhavishya IAS — Folder Structure & Project Conventions

**Document:** Phase 6 Deliverable
**Version:** 1.0
**Status:** Draft — Awaiting Approval
**Depends on:** `docs/01-PRD.md` … `docs/05-design-system.md`
**Last Updated:** 2026-07-04

> The physical project layout for the Next.js (App Router) modular monolith, the
> conventions that keep bounded contexts clean, and where every kind of code
> lives. Actual files are created in Phase 7+ (no placeholder code is committed in
> this phase — this is the map, not the territory).

---

## 1. Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| **F1** | **Single Next.js app** (not a Turborepo monorepo yet) | Matches the modular-monolith (ADR-1). One deploy, one type-graph. Structure is monorepo-*ready* so a future `apps/mobile` can be lifted in without rework. |
| **F2** | **`src/` directory** with strict internal layering | Keeps app code out of repo root; enforces the Phase 2 layer boundaries physically. |
| **F3** | **Feature-first `src/modules/<context>/`** | Each bounded context (Identity, Taxonomy, Content, Workflow, Learning, Tests, Search, Media, Notifications) is a self-contained folder owning its service, repository, schemas, and types. |
| **F4** | **Ports & adapters** in `src/lib` | Search/Storage/Cache/Mail/Jobs behind interfaces (ADR-6), so infra swaps never touch modules. |
| **F5** | **Path aliases** (`@/…`, `@modules/…`, `@ui/…`) + **import-boundary lint** | A module may not import another module's `repository` or internals — only its public `index.ts`. Enforced by `eslint-plugin-boundaries`. |
| **F6** | **`pnpm`** as package manager | Fast, strict, disk-efficient; good workspace story for the monorepo future. |
| **F7** | **Colocated unit tests** (`*.test.ts`) + top-level `e2e/` (Playwright) + `tests/` (integration) | Fast feedback next to code; slow suites isolated. |

---

## 2. Top-Level Layout

```
bhavishya-ias/
├─ docs/                       # Phase 1–N design docs (this folder)
├─ prisma/                     # schema, migrations, seed
│  ├─ schema.prisma
│  ├─ migrations/
│  ├─ seed.ts
│  └─ sql/                     # raw-SQL migrations (FTS triggers, matviews)
├─ public/                     # static assets, favicons, robots.txt, og images
├─ e2e/                        # Playwright end-to-end specs
├─ tests/                      # integration tests + test utils/factories
│  ├─ integration/
│  ├─ factories/
│  └─ setup.ts
├─ scripts/                    # one-off ops scripts (import, backfill)
├─ src/                        # ← all application code (see §3)
├─ .github/workflows/          # CI/CD (lint, typecheck, test, build, migrate)
├─ .env.example                # documented env contract (no secrets)
├─ docker-compose.yml          # local: app + postgres + redis
├─ Dockerfile                  # production image (self-host escape hatch)
├─ components.json             # shadcn/ui config (token names from Phase 5)
├─ tailwind.config.ts          # theme.extend reads design tokens
├─ next.config.ts
├─ eslint.config.mjs           # incl. import-boundary rules
├─ vitest.config.ts
├─ playwright.config.ts
├─ tsconfig.json               # path aliases
├─ package.json
├─ PROJECT_CHECKLIST.md
└─ README.md
```

---

## 3. `src/` Anatomy

```
src/
├─ app/                        # Next.js App Router (routing + rendering only)
│  ├─ (marketing)/             # public landing, legal   → W-01
│  │  ├─ page.tsx
│  │  └─ layout.tsx
│  ├─ (auth)/                  # login/register/verify   → W-02
│  │  ├─ login/page.tsx
│  │  ├─ register/page.tsx
│  │  ├─ verify/page.tsx
│  │  └─ layout.tsx
│  ├─ (app)/                   # authenticated student app (AppShell)
│  │  ├─ layout.tsx            # student shell (W-SHELL)
│  │  ├─ page.tsx              # dashboard            → W-03
│  │  ├─ syllabus/
│  │  │  ├─ page.tsx           # tree browser         → W-04
│  │  │  └─ [slug]/page.tsx    # node hub             → W-05
│  │  ├─ read/[contentSlug]/page.tsx   # reader       → W-06
│  │  ├─ pyqs/{page.tsx,[id]/page.tsx} #              → W-07/08
│  │  ├─ current-affairs/page.tsx      #              → W-10
│  │  ├─ tests/…               #                      → W-11/12
│  │  ├─ search/page.tsx       #                      → W-09
│  │  ├─ library/page.tsx      # bookmarks/history    → W-17
│  │  └─ profile/page.tsx
│  ├─ (admin)/                 # role-gated CMS (AdminShell)
│  │  ├─ layout.tsx            # authorize() gate at the layout boundary
│  │  ├─ page.tsx              # overview
│  │  ├─ content/…             #                      → W-13/14/15
│  │  ├─ syllabus/ · questions/ · tests/ · current-affairs/
│  │  ├─ media/ · users/ · audit/
│  ├─ api/
│  │  └─ v1/                   # versioned HTTP API (route handlers)
│  │     ├─ auth/[...nextauth]/route.ts
│  │     ├─ content/route.ts · content/[id]/route.ts
│  │     ├─ syllabus/… · pyqs/… · tests/… · search/…
│  │     └─ webhooks/…
│  ├─ sitemap.ts · robots.ts · manifest.ts   # SEO (NFR-SEO)
│  ├─ layout.tsx               # root layout: fonts, theme, providers
│  ├─ not-found.tsx · error.tsx · global-error.tsx
│  └─ opengraph-image.tsx
│
├─ modules/                    # ← BOUNDED CONTEXTS (business logic)
│  ├─ identity/
│  │  ├─ index.ts              # PUBLIC API (only thing other modules import)
│  │  ├─ identity.service.ts   # domain logic + authorize() usage
│  │  ├─ identity.repository.ts# Prisma access, examId scoping
│  │  ├─ rbac.ts               # permission catalogue, role→permission map
│  │  ├─ dto.ts                # Zod schemas (shared client/server)
│  │  ├─ types.ts
│  │  └─ identity.service.test.ts
│  ├─ taxonomy/                # syllabus graph (nodes, closure, links)
│  ├─ content/                 # content_item + typed details + versioning
│  ├─ workflow/                # lifecycle state machine + reviews
│  ├─ learning/                # progress, revision, bookmarks, history
│  ├─ tests/                   # test bank, attempts, scoring
│  ├─ answer-writing/          # prompts, submissions, evaluation (Tier 2)
│  ├─ current-affairs/
│  ├─ search/                  # indexing + query (uses SearchPort)
│  ├─ media/                   # S3 pre-signed uploads, asset metadata
│  ├─ analytics/               # events, rollups
│  └─ notifications/
│
├─ server/                     # cross-cutting server infrastructure
│  ├─ auth/                    # Auth.js config, session, OTP, callbacks
│  ├─ authorize.ts             # the single RBAC guard (Phase 2 §6)
│  ├─ audit.ts                 # audit-log writer
│  ├─ context.ts               # request actor + examId scope resolver
│  ├─ errors.ts                # typed error taxonomy → HTTP mapping
│  ├─ api.ts                   # route-handler helpers (parse/validate/envelope)
│  ├─ rate-limit.ts
│  └─ events/                  # domain event bus + handlers
│
├─ lib/                        # framework-agnostic utilities & adapters
│  ├─ db.ts                    # Prisma client singleton
│  ├─ redis.ts                 # Redis client
│  ├─ cache.ts                 # cache-aside helpers (tagged keys)
│  ├─ ports/                   # INTERFACES: search, storage, cache, mail, jobs
│  ├─ adapters/                # IMPLEMENTATIONS
│  │  ├─ search.postgres.ts    # v1 (FTS)   ·  search.meili.ts (later)
│  │  ├─ storage.s3.ts
│  │  ├─ mail.smtp.ts
│  │  └─ jobs.redis.ts
│  ├─ validation/              # shared Zod primitives, env schema
│  └─ utils/                   # pure helpers (dates, slugs, reading-time)
│
├─ components/                 # PRESENTATION (React)
│  ├─ ui/                      # shadcn/ui primitives (generated, tokenized)
│  ├─ shell/                   # AppShell, AdminShell, TopBar, Sidebar
│  ├─ content/                 # Reader, EditorToolbar, DiffView, StatusChip
│  ├─ syllabus/                # SyllabusTree, NodeHub, CoverageBar
│  ├─ common/                  # EmptyState, DataTable, CommandPalette, forms
│  └─ providers/               # ThemeProvider, QueryProvider, Toaster
│
├─ hooks/                      # client React hooks (TanStack Query wrappers)
├─ styles/
│  ├─ globals.css              # token CSS variables (Phase 5 §11) + Tailwind
│  └─ prose.css                # reading typography
├─ config/                     # app config, nav definitions, feature flags
│  ├─ site.ts · nav.ts · exams.ts
├─ types/                      # global/shared TS types & module augmentation
└─ instrumentation.ts          # observability bootstrap
```

---

## 4. Module Anatomy (the repeating pattern)

Every `src/modules/<context>/` follows the same shape so the codebase is
predictable:

| File | Responsibility | May import |
|------|----------------|-----------|
| `index.ts` | The module's **public API** — re-exports service + DTOs/types only | — |
| `*.service.ts` | Business rules, `authorize()`, transactions, emits events | own repo, `server/*`, `lib/*`, other modules' `index.ts` |
| `*.repository.ts` | Prisma queries, central `examId` scoping | `lib/db`, own `types` |
| `dto.ts` | Zod schemas shared by API + client forms | `lib/validation` |
| `types.ts` | Module types derived from Prisma + DTOs | — |
| `*.test.ts` | Colocated unit tests (service logic, mapped repos) | test utils |

**The golden rule (F5):** cross-module calls go **only** through
`@modules/<other>` (its `index.ts`). Reaching into another module's
`.repository.ts`/internals is an ESLint error. UI (`components/`) and routes
(`app/`) call **services**, never repositories directly.

### Dependency direction (enforced)

```
app/  ─▶  modules/*/service  ─▶  modules/*/repository  ─▶  lib/db (Prisma)
  │              │                        │
  └─▶ components └─▶ server/* (authorize, events, api) └─▶ lib/ports ─▶ lib/adapters
```

Arrows point in the allowed import direction. Nothing points back up.

---

## 5. Path Aliases (`tsconfig.json`)

```jsonc
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*":         ["*"],
      "@modules/*":  ["modules/*"],
      "@server/*":   ["server/*"],
      "@lib/*":      ["lib/*"],
      "@ui/*":       ["components/ui/*"],
      "@components/*":["components/*"],
      "@config/*":   ["config/*"]
    }
  }
}
```

`@modules/identity` resolves to that module's `index.ts` — the public API — so the
alias itself nudges correct usage.

---

## 6. Where Things Live — quick reference

| I need to… | It goes in… |
|---|---|
| Add a route/page | `src/app/(group)/…` (thin — calls a service) |
| Add an HTTP endpoint | `src/app/api/v1/…/route.ts` (parse → validate → service) |
| Add business logic | `src/modules/<context>/*.service.ts` |
| Add a DB query | `src/modules/<context>/*.repository.ts` |
| Add a validation schema | module `dto.ts` (or `lib/validation` if shared) |
| Add a reusable UI primitive | `src/components/ui` (shadcn) |
| Add a product component | `src/components/<area>` |
| Add a design token | `src/styles/globals.css` + `tailwind.config.ts` |
| Swap search/storage engine | new file in `src/lib/adapters`, wire in `ports` |
| Add an authz rule | `src/modules/identity/rbac.ts` + `server/authorize.ts` |
| Add a background job | `src/modules/<context>` emits event → `server/events` handler |
| Add a DB table | `prisma/schema.prisma` + migration |
| Add env var | `.env.example` + `src/lib/validation/env.ts` (Zod-parsed) |

---

## 7. Naming & Style Conventions

- **Files:** `kebab-case.ts`; React components `PascalCase.tsx`; hooks
  `use-x.ts` exporting `useX`. Tests `*.test.ts` / e2e `*.spec.ts`.
- **Symbols:** `PascalCase` types/components, `camelCase` values, `SCREAMING_SNAKE`
  consts, enums mirror Prisma (`ContentStatus.PUBLISHED`).
- **Server-only** modules guard with `import "server-only"`; secrets never reach a
  client bundle. Client components marked `"use client"` explicitly; default is
  server.
- **Data fetching:** Server Components call services directly; client mutations use
  TanStack Query hooks → `api/v1`. One envelope shape everywhere (Phase 2 §5).
- **Barrel files** only at module boundaries (`index.ts`), not deep re-exports.

---

## 8. Config & Environment

- `.env.example` is the **documented contract**; a Zod schema in
  `lib/validation/env.ts` parses `process.env` at boot and fails fast on missing
  keys. Keys grouped: `DATABASE_URL`, `REDIS_URL`, `AUTH_*` (NextAuth + Google),
  `S3_*`, `MAIL_*`, `APP_URL`, `NODE_ENV`.
- **No secrets in the repo.** `.env*` is gitignored (already in `.gitignore`).
- `config/exams.ts` seeds the exam registry; `config/nav.ts` drives sidebars so
  routes and nav never drift.

---

## 9. Testing Layout

| Layer | Location | Tooling |
|---|---|---|
| Unit (services, utils, mappers) | colocated `*.test.ts` | Vitest |
| Integration (repo ↔ real Postgres, API routes) | `tests/integration/` | Vitest + testcontainers/ephemeral DB |
| E2E (critical flows: auth, read, attempt, publish) | `e2e/` | Playwright (Chromium at `/opt/pw-browsers`) |
| Component / a11y | colocated + axe checks | Vitest + Testing Library |
| Factories & fixtures | `tests/factories/` | shared builders |

CI (Phase 16) runs lint → typecheck → unit → integration → build; E2E on a preview
deploy.

---

## 10. Scalability of the Structure

- **New exam** (Group-2, UPSC): pure data (`config/exams.ts` + seeded `exam` row);
  zero structural change (examId scoping already pervasive).
- **New content type**: a typed detail table + a thin extension in
  `modules/content`; reuses envelope, workflow, search.
- **New module** (community, payments): a new `src/modules/<context>` + routes; the
  event bus is the integration seam — no edits to existing modules.
- **Mobile app**: introduce `pnpm` workspaces → `apps/web` + `apps/mobile` +
  `packages/*` (shared DTOs/types already isolated in modules). Because business
  logic sits behind `api/v1`, the mobile client consumes it unchanged.

---

## 11. Phase 6 Exit Criteria

- Approval of: the single-app layout, `src/` layering, the module anatomy and
  import-boundary rule, path aliases, testing layout, and config/env approach.
- On approval → **Phase 7: Backend APIs** — scaffold the project, wire Prisma +
  `lib`/`server` infrastructure, and implement the first vertical slices
  (`api/v1`) against this structure, with OpenAPI docs.

**Approval:** _Pending stakeholder review._
