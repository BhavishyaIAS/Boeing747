# Bhavishya IAS — Project Checklist

**Tagline:** _Towards a Brighter Future_

This is the single, living tracker for the phased build. It is updated at the end
of every completed phase. Each phase requires stakeholder approval before the next
begins.

**Legend:** ✅ Done · 🟡 In progress · ⬜ Not started · ⏸️ Blocked / awaiting approval

---

## Phase Tracker

| Phase | Deliverable | Status | Artifact |
|------|-------------|--------|----------|
| 1 | Product Requirement Document (PRD) | ✅ Done — approved | `docs/01-PRD.md` |
| 2 | System Architecture | ✅ Done — approved | `docs/02-architecture.md` |
| 3 | Database Design (schema + ERD) | ✅ Done — approved | `docs/03-database.md` |
| 4 | UI/UX Wireframes | ✅ Done — approved | `docs/04-wireframes.md` |
| 5 | Design System | ✅ Done — approved | `docs/05-design-system.md` |
| 6 | Folder Structure | ✅ Done — approved | `docs/06-folder-structure.md` |
| 7 | Backend APIs | ✅ Done — approved | code + `docs/07-api.md` |
| 8 | Authentication | ✅ Done — approved | code |
| 9 | Admin Panel | ✅ Done — approved | code |
| 10 | Student Dashboard | ✅ Done — approved | code |
| 11 | Syllabus Engine | ✅ Done — approved | code |
| 12 | Notes Module | ✅ Done — approved | code |
| 13 | PYQ Module | ✅ Done — approved | code |
| 14 | Current Affairs Module | ✅ Done — **awaiting approval** | code |
| 15 | Testing | ⬜ Not started | tests |
| 16 | Deployment | ⬜ Not started | CI/CD + infra |

---

## Phase 1 — Summary of Work Done

- Authored a comprehensive PRD (`docs/01-PRD.md`) covering:
  - Vision, problem statement, strategic moat, and non-goals.
  - Goals + North Star and supporting success metrics.
  - Personas and the authoritative 6-role RBAC model.
  - Full module catalogue with **launch tiers** (Tier 0 MVP → Tier 3 roadmap).
  - Functional requirements for all 17 modules, each with a stable ID.
  - Canonical content model (18 reusable content types).
  - Non-functional requirements: security, performance, SEO, accessibility,
    reliability, maintainability.
  - Design philosophy, assumptions, constraints, risks, roadmap allowances.
  - Fixed tech stack and 6 open questions to resolve before Phase 3.
- Established requirement-ID traceability (`FR-*`, `NFR-*`, `G-*`) for downstream phases.

### Decisions locked (2026-07-04) — see PRD §15
1. OTP channel — **Email-only** at launch.
2. Search — **Postgres FTS first**, Meilisearch later (behind a port).
3. Media host — **AWS S3** primary.
4. Multi-exam — **Single DB with `examId` scoping**.
5. Answer-writing AI eval — **Deferred** (faculty eval first).
6. Localization — **Telugu not near-term** (English-only launch).

---

## Phase 2 — Summary of Work Done

- Authored the System Architecture (`docs/02-architecture.md`):
  - 8 architecture principles + high-level system diagram (Mermaid).
  - Strict 5-layer model (Presentation → API → Service → Repository → Ports).
  - **Modular monolith** with bounded contexts (Identity, Taxonomy, Content,
    Workflow, Learning, Support) and their dependency rules.
  - API strategy: versioned `/api/v1` REST, Zod validation, envelope + cursor
    pagination, OpenAPI.
  - Auth (Auth.js: email/Google/email-OTP) + data-driven RBAC enforced in a
    single service-layer `authorize()` guard with `examId` scoping.
  - Data/search/cache/storage: Postgres + Prisma, Postgres FTS behind `SearchPort`,
    Redis cache-aside, S3 with pre-signed uploads — all swappable via ports.
  - Shared content **lifecycle + versioning** state machine and background
    jobs/domain-events model.
  - Cross-cutting: security, observability, performance, SEO, accessibility.
  - Deployment topology (Vercel + managed PG/Redis + S3, Docker parity, GH Actions).
  - Roadmap-enablement matrix and **8 ADRs** with rejected alternatives.
- Folded all 6 locked decisions into the design.

---

## Phase 3 — Summary of Work Done

- Authored the Database Design (`docs/03-database.md`): **45 tables + 1
  materialized view** across 5 domains, fully normalized, with keys, FKs,
  constraints, indexes, enums, and domain-grouped ER diagrams (Mermaid).
- **9 design decisions (D1–D9)** documented with rationale, incl. the polymorphic
  content model:
  - **D1** Class Table Inheritance — shared `content_item` base + typed detail
    tables (`question`, `reference_entity`, `visual`, `video`, `flashcard`,
    `current_affair`).
  - **D2** Rich bodies as validated JSONB in `content_version` (TipTap docs).
  - **D3** Syllabus graph = adjacency + `syllabus_closure` (arbitrary depth) +
    `node_link` interlinking.
  - **D4** Immutable versioning; **D5** `exam_id` scoping everywhere;
    **D6** Auth.js-native tables; **D7** Postgres FTS via `tsvector`+GIN;
    **D8** UUIDv7 + soft delete; **D9** guarded polymorphic associations.
- Covered: Identity/RBAC/audit, Syllabus graph, Content+Workflow+Media,
  Learning/Progress, Tests + Answer-Writing (schema-ready, AI eval deferred),
  Search, indexing strategy, integrity rules, and migration/seed plan.

---

## Phase 4 — Summary of Work Done

- Authored the UI/UX Wireframes (`docs/04-wireframes.md`):
  - Full **information architecture / sitemap** (public, student app, admin CMS)
    with route map and role-gating.
  - Two **app shells** (student + admin) and explicit **responsive rules** per
    breakpoint (desktop → bottom-tab mobile).
  - **17 screen wireframes** (W-01…W-17) as annotated ASCII layouts: landing,
    auth, dashboard, syllabus browser, node hub, reading view, PYQ browser,
    question+model-answer, search, current affairs, test attempt, results, and
    the admin content list / editor / review / users screens.
  - **4 primary user flows** (onboarding, daily study loop, practice loop,
    content lifecycle) + cross-cutting state & accessibility rules.
- Built a companion **interactive visual mockup** (greybox, theme-aware) covering
  7 key screens with numbered annotation pins mapping each UI region to its
  backing tables.

---

## Phase 5 — Summary of Work Done

- Authored the Design System (`docs/05-design-system.md`):
  - **Two-layer color model** (primitive ramps → semantic tokens): slate-tinted
    neutrals, a 10-step **brand indigo** (`#3B4CCA`), a **saffron** secondary
    accent, semantic status, and a separate domain palette — with AA contrast
    checks and full light + dark token tables.
  - **Typography**: Source Serif 4 (reading/display) + Geist Sans (UI) + Geist
    Mono, a 12-step type scale, and reading-measure rules.
  - **Spacing** (4px grid), **radius**, **layout metrics**, **elevation** ramp,
    **motion** tokens, and iconography.
  - **Component library** mapped to shadcn/ui (actions, forms, data display,
    overlays, and product-specific composites) with states + a11y contract.
  - WCAG 2.2 AA baseline, theming implementation, and an abridged CSS token
    reference (drops straight into Tailwind/shadcn).
- Built a companion **living style-guide** artifact — every token and component
  rendered, with a working light/dark toggle.

---

## Phase 6 — Summary of Work Done

- Authored the Folder Structure & Conventions (`docs/06-folder-structure.md`):
  - **7 layout decisions (F1–F7)**: single Next.js app (monorepo-ready), `src/`
    layering, feature-first `modules/<context>`, ports/adapters in `lib`, path
    aliases + import-boundary lint, pnpm, colocated/isolated test split.
  - Full **top-level** and **`src/` trees** with every route group mapped to its
    wireframe ID and every folder's responsibility.
  - The repeating **module anatomy** (index/service/repository/dto/types/test)
    and the enforced dependency direction + golden import rule.
  - Path-alias config, a "where things live" quick reference, naming/style
    conventions, env/config contract, testing layout, and how the structure
    scales to new exams / content types / modules / a mobile app.

---

## Phase 7 — Summary of Work Done

**Scope:** foundation + 2 vertical slices; schema + migrations, mocked repos in tests.

- **Project scaffold:** `package.json` (Next 15 / React 19 / Prisma 6 / Zod / Vitest),
  `tsconfig` with path aliases, `next.config`, `vitest.config`, `.env.example`.
- **Prisma schema realized** (`prisma/schema.prisma`): 45 models + 21 enums,
  `prisma validate` ✓; generated initial migration (`migrations/0000_init`,
  1016 lines) via `migrate diff` (no DB needed); raw-SQL `sql/001_search.sql`
  (tsvector + GIN) and `sql/002_leaderboard.sql` (matview); `seed.ts` (RBAC,
  exam, super admin, sample syllabus).
- **Infrastructure (`lib`/`server`):** Prisma singleton, Zod env loader, text
  utils, typed error taxonomy, response envelope + Zod parse helpers, the single
  `authorize()` RBAC guard, audit sink, and the exam-scope/actor resolver
  (dev-actor shim until Phase 8).
- **Slice 1 — Syllabus (read):** `taxonomy` module (dto/repository/service) +
  `GET /api/v1/syllabus` and `/syllabus/:slug` (tree, breadcrumb via closure).
- **Slice 2 — Content (CRUD + workflow):** `content` module + `workflow` state
  machine; `GET/POST /api/v1/content`, `GET /content/:id`,
  `POST /content/:id/transition` — with versioning, separation of duties, and audit.
- **Verified:** `prisma validate` ✓ · `tsc --noEmit` ✓ · **27 unit tests pass**
  (state machine, authorization, taxonomy + content services with mocked repos).
- **API reference:** `docs/07-api.md`.

---

## Phase 8 — Summary of Work Done

- **Auth.js (NextAuth v5)** wired in `src/server/auth`: JWT sessions, three
  providers — **Google OAuth** (env-gated), **email + password**, and
  **email OTP** — with `signIn`/`jwt`/`session` callbacks that provision OAuth
  users and embed the user id + roles in the token.
- **Real sessions back `resolveActor()`** — the dev-actor shim now only applies
  in non-production as a fallback; production requires a real session (401 otherwise).
- **Identity module auth building blocks:**
  - `password.ts` (bcrypt cost 12), `tokens.ts` (OTP/URL tokens, SHA-256 hashing
    salted by identifier, TTLs + expiry) — both pure.
  - `identity.repository.ts` (users, roles, single-use verification tokens).
  - `auth.service.ts`: register, email verification, email-OTP login, password
    reset (request + reset), credential verification, OAuth provisioning — with
    no-account-enumeration on forgot/OTP and unverified-login blocking.
  - `session.ts` (build/load Actor), `dto.ts` (Zod: register/login/verify/otp/reset).
- **Mail port + console adapter** (`lib/ports/mail.ts`, `lib/adapters/mail.console.ts`).
- **Endpoints:** `auth/[...nextauth]`, `register`, `verify`, `otp`,
  `forgot-password`, `reset-password`.
- **Verified:** `tsc --noEmit` ✓ · **40 unit tests pass** (13 new: tokens + full
  auth-service behaviour with mocked repo/mail). Fixed a real bug where
  `ensureOAuthUser` returned a stale pre-verification record.

---

## Phase 9 — Summary of Work Done

**First UI phase.** Styling foundation + the CMS surface, backed by real services.

- **Styling foundation:** Tailwind v4 + `@tailwindcss/postcss`; `globals.css`
  encodes the Phase 5 design tokens as CSS variables (light + dark, class-driven);
  `cn()` helper.
- **UI primitives** (shadcn-style, tokenized): Button (cva variants), Badge +
  `StatusBadge`, Card, Input/Textarea/Select/Label, Table — plus AppShell
  (`AdminShell`), `NavLink`, and a client `ThemeToggle`.
- **Admin console** (`/admin`, dynamic + access-gated in the layout via `can()`):
  - Overview, **Content list** (status filters), **New content**, **Content
    editor** (title + body edit that saves a new version; workflow action
    buttons; reviewer approve/request-changes/reject with comment + separation-
    of-duties notice), and **Users & Roles** (assign/revoke, Super-Admin guard).
  - Mutations via **Server Actions** calling the domain services directly.
- **Backend additions** (all unit-tested): content `listManaged` /
  `getForEditing` / `updateDraft` (edit = new immutable version, drafts only);
  identity `listUsers` / `removeRole` + `AdminIdentityService` (user:manage;
  Super-Admin grant needs role:manage).
- **Verified:** `tsc --noEmit` ✓ · **47 unit tests** ✓ · **`next build` ✓**
  (all 17 routes compile; admin routes dynamic; Tailwind + RSC/client boundaries
  validated).

---

## Phase 10 — Summary of Work Done

- **Learning module** (`src/modules/learning`): a progress read model
  (`ProgressRepository`) + `ProgressService.getDashboard()` aggregating
  continue-reading, weekly study minutes, topics-read, revision-due, per-subject
  coverage (via the closure table: mastered ÷ descendants), a pure
  `computeStreak()`, and coverage-derived focus areas.
- **Student shell** (`StudentShell`) + student nav; generalized `NavLink` with an
  `exact` flag; a `Progress` primitive.
- **Dashboard** (`/app`, gated + dynamic): greeting + streak, continue-reading,
  this-week tiles, syllabus-coverage bars, revision-due list, and focus areas —
  each with a real empty state for new users.
- **Seed convenience:** optional `SEED_ADMIN_PASSWORD` sets the super-admin's
  password so email/password login works out of the box.
- **Verified:** `tsc --noEmit` ✓ · **54 unit tests** ✓ (7 new: streak + dashboard
  aggregation + empty state + authorization) · **`next build` ✓** (`/app` dynamic).

---

## Phase 11 — Summary of Work Done

- **Per-user node progress** (`learning/node-progress.*`): `NodeProgressService`
  (`markStatus`, `getStatuses`) + repository, with a pure spaced-revision
  scheduler (`nextRevisionDate`: 3→7→14→30→60-day intervals). Marking MASTERED
  schedules a revision; REVISED increments and reschedules.
- **Content-by-node** (`content.listByNode` + `listPublishedByNode`): published
  material attached to a syllabus node.
- **Syllabus browser** (`/app/syllabus`): subjects list with per-user status dots.
- **Node hub** (`/app/syllabus/[slug]`): closure-based breadcrumb, node summary +
  exam angle, progress controls (mark in-progress/mastered/revised via Server
  Actions), sub-topics grid with status dots, and attached study material grouped
  by content type — with empty states throughout.
- **UI:** `NodeStatusBadge` / `NodeStatusDot` reusing the status scale.
- **Real syllabus data (micro-theme grain):** encoded the **official APPSC
  Group-1 syllabus** at full micro-theme depth from the provided dataset. The
  seed builds the graph from `prisma/syllabus/appsc-microthemes.json` (458
  micro-themes) via `microthemes.ts` → **960 nodes** across the full 5-level
  hierarchy: 9 papers (SUBJECT) → 39 sections (UNIT) → 97 units (THEME) → 357
  themes (SUB_THEME) → 458 micro-themes (MICRO_THEME). Leaf slugs use the stable
  micro-theme ids; each leaf carries cognitive-level + geographic-scope +
  Prelims/Mains exam-angle metadata. Idempotent seeder with closure rows;
  validated 0 slug collisions.
- **Verified:** `tsc --noEmit` ✓ · **59 unit tests** ✓ (5 new: revision scheduler
  + markStatus behaviour + authorization) · syllabus tree validated (0 slug
  collisions) · **`next build` ✓**.

---

## Phase 12 — Summary of Work Done

- **Content reader** (`/app/read/[slug]`, gated + dynamic): renders published
  content with reading-first serif typography, reading-time, back-to-syllabus,
  and a bookmark toggle. Closes the loop — dashboard "continue reading" and
  node-hub study-material links now open a real reader.
- **Safe rich-text renderer** (`components/content/rich-text.tsx`): a
  TipTap/ProseMirror JSON → React renderer built from typed elements only (no
  `dangerouslySetInnerHTML`) — XSS-safe; supports paragraphs, headings, lists,
  blockquotes, code, marks (bold/italic/code/strike/link), images & rules.
- **Reading-progress tracking:** a client top-bar tracks scroll depth and
  persists position + time (throttled, flush on tab-hide/unmount); progress is
  monotonic (`ReadingService`, one row per user+item) and feeds the dashboard.
- **Bookmarks:** `BookmarkService` (toggle/isBookmarked) on the polymorphic
  bookmark table; optimistic client toggle via a Server Action.
- **Reading typography** added to `globals.css` (`.reader-prose`, 68ch measure).
- **Verified:** `tsc --noEmit` ✓ · **64 unit tests** ✓ (5 new: reading clamp/
  monotonic + bookmark toggle + authorization) · **`next build` ✓**.

---

## Phase 13 — Summary of Work Done

- **PYQ module** (`src/modules/pyq`): `PyqService` + repository over the
  `question`/`question_option` tables — `list` (stage/year filters, cursor
  pagination), `availableYears`, and `getBySlug` (question + options + explanation
  + linked model-answer body + topic tags). Requires `pyq:read`.
- **Browse** (`/app/pyqs`): stage tabs (Prelims/Mains/Interview) + year filter;
  question cards with stage/year/paper/marks/difficulty, kind, and topic chips.
- **Detail** (`/app/pyqs/[slug]`): question prompt (RichText); **MCQs** get an
  interactive pick-then-reveal component (correct/incorrect highlighting +
  explanation); **descriptive** questions get a collapsible model answer +
  evaluation points; linked topics deep-link into the syllabus.
- **Sample data:** seed now creates 3 real PYQs (2 Prelims MCQs + 1 Mains
  descriptive with a model answer), linked to syllabus nodes, so the module is
  demonstrable end-to-end.
- **Verified:** `tsc --noEmit` ✓ · **68 unit tests** ✓ (4 new: PYQ pagination +
  authorization + not-found) · **`next build` ✓**.

---

## Phase 14 — Summary of Work Done

- **Current Affairs module** (`src/modules/current-affairs`): `CurrentAffairsService`
  + repository over the `current_affair` content type — `list` (cadence/region/
  category filters, cursor pagination), `categories` (dynamic facet), and
  `getBySlug` (article body + syllabus linkage). Requires `ca:read`.
- **Feed** (`/app/current-affairs`): cadence tabs (Daily/Weekly/Monthly) + region
  and category filters; dated cards with region badge, category, and topic chips.
- **Detail** (`/app/current-affairs/[slug]`): article (RichText) with cadence/
  region/category/date meta and syllabus-linkage chips.
- **Sample data:** seed now creates 3 current-affairs items (National / AP /
  International, across daily/weekly/monthly), linked to syllabus nodes.
- **Verified:** `tsc --noEmit` ✓ · **71 unit tests** ✓ (3 new: CA filters +
  pagination + authorization + not-found) · **`next build` ✓**.

---

## Next Up

**Phase 15 — Testing** (starts on your approval): broaden automated coverage —
integration tests for the API route handlers / services, component & a11y checks,
and wiring the test suite into a CI workflow (GitHub Actions).
