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
| 6 | Folder Structure | ✅ Done — **awaiting approval** | `docs/06-folder-structure.md` |
| 7 | Backend APIs | ⬜ Not started | code + `docs/07-api.md` |
| 8 | Authentication | ⬜ Not started | code |
| 9 | Admin Panel | ⬜ Not started | code |
| 10 | Student Dashboard | ⬜ Not started | code |
| 11 | Syllabus Engine | ⬜ Not started | code |
| 12 | Notes Module | ⬜ Not started | code |
| 13 | PYQ Module | ⬜ Not started | code |
| 14 | Current Affairs Module | ⬜ Not started | code |
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

## Next Up

**Phase 7 — Backend APIs** (starts on your approval): scaffold the Next.js
project against this structure, wire Prisma + the `lib`/`server` infrastructure
(db, redis, ports/adapters, authorize guard, error taxonomy, API helpers), and
implement the first vertical API slices under `api/v1` with OpenAPI docs.

> Note: Phase 7 is the first **code** phase — it will introduce `package.json`,
> the Prisma schema, and real source files (no placeholder code).
