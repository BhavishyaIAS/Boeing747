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
| 1 | Product Requirement Document (PRD) | ✅ Done — **awaiting approval** | `docs/01-PRD.md` |
| 2 | System Architecture | ⬜ Not started | `docs/02-architecture.md` |
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

### Decisions that need your input (from PRD §15)
1. OTP channel at launch — email-only vs SMS too?
2. Search — Meilisearch for v1 vs Postgres FTS first?
3. Primary media host — S3 vs Cloudinary ownership split?
4. Multi-exam strategy — single DB with `examId` scoping (recommended)?
5. Answer-writing AI eval — in first release or deferred?
6. Localization — is Telugu near-term?

> These do not block Phase 1 sign-off, but answers (especially #4) shape Phase 2/3.

---

## Next Up

**Phase 2 — System Architecture** (starts on your approval): high-level system
diagram, service/layer boundaries, API strategy, auth/RBAC enforcement design,
caching/search topology, storage, deployment topology, and how the architecture
keeps the roadmap (mobile/offline/AI/payments) open.
