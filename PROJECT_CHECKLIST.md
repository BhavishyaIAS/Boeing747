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
| 2 | System Architecture | ✅ Done — **awaiting approval** | `docs/02-architecture.md` |
| 3 | Database Design (schema + ERD) | ⬜ Not started | `docs/03-database.md` |
| 4 | UI/UX Wireframes | ⬜ Not started | `docs/04-wireframes.md` |
| 5 | Design System | ⬜ Not started | `docs/05-design-system.md` |
| 6 | Folder Structure | ⬜ Not started | `docs/06-folder-structure.md` |
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

## Next Up

**Phase 3 — Database Design** (starts on your approval): normalized PostgreSQL
schema for the syllabus graph, polymorphic content model, workflow/versioning,
RBAC, progress & tests — with indexes, constraints, and an ER diagram.
