# Bhavishya IAS — Product Requirement Document (PRD)

**Document:** Phase 1 Deliverable
**Version:** 1.0
**Status:** Draft — Awaiting Approval
**Owner:** Product & Architecture
**Last Updated:** 2026-07-04

> **Tagline:** _Towards a Brighter Future_

---

## 0. How to Read This Document

This PRD is the single source of truth for **what** we are building and **why**.
It deliberately avoids implementation detail (schema, code, infra) — those belong
to Phase 2 (System Architecture), Phase 3 (Database Design) and beyond. Where a
decision constrains later phases, it is flagged with **→ Downstream**.

Traceability: every requirement carries a stable ID (e.g. `FR-SYL-03`). These IDs
are referenced by architecture docs, tickets, and test cases so we can prove
coverage end-to-end.

---

## 1. Vision & Problem Statement

### 1.1 The Problem

APPSC Group-1 aspirants in Andhra Pradesh prepare across a fragmented landscape:
scattered PDFs, WhatsApp forwards, unstructured YouTube playlists, coaching notes
of inconsistent quality, and no single place that maps the **official syllabus**
to **structured, exam-ready knowledge**. Aspirants waste preparation time on
*collection and organisation* rather than *learning and revision*. There is no
authoritative, continuously-updated, AP-specific reference platform.

### 1.2 The Vision

Build **India's most comprehensive APPSC Group-1 preparation platform** — a
one-stop solution that carries an aspirant from **Day 1 of preparation to the
final interview**. Every atom of the syllabus is fragmented, interlinked,
enriched with notes, PYQs, model answers, current affairs linkages, tests, and
revision tooling. The platform becomes the *standard reference* aspirants,
faculty, and coaching institutes cite.

### 1.3 Strategic Bet

The moat is **structured content depth + interlinking**, not features. Anyone can
build a video player; almost no one maintains a rigorously fragmented syllabus
graph where a Supreme Court judgment links to a micro-theme links to a PYQ links
to a current-affairs card links to a flashcard. That graph is the product.

### 1.4 Non-Goals (v1)

- Not a live-class streaming platform (roadmap, not launch).
- Not a marketplace or payments platform at launch (architecture must not
  preclude it — see §12).
- Not a generic multi-exam platform on Day 1. We go **deep on APPSC Group-1
  first**, but the data model and architecture are exam-agnostic so Group-2,
  UPSC CSE, and others plug in later (**→ Downstream: exam scoping in the schema**).

---

## 2. Goals & Success Metrics

### 2.1 Product Goals

| Goal ID | Goal | Rationale |
|---|---|---|
| G-1 | Complete, navigable APPSC Group-1 syllabus graph | Core differentiator |
| G-2 | Every micro-topic enriched to the defined content model | Depth = moat |
| G-3 | Reduce aspirant "time-to-first-productive-study" to < 5 min | Retention driver |
| G-4 | Trustworthy content via editorial approval workflow | Credibility |
| G-5 | Measurable preparation progress per aspirant | Stickiness |
| G-6 | Scalable to additional exams without re-architecture | Long-term value |

### 2.2 Success Metrics (North Star + Supporting)

- **North Star:** Weekly Active Learners completing ≥ 1 revision/test/note-read session.
- **Activation:** % of new users who read ≥ 3 micro-topics in week 1 (target ≥ 40%).
- **Engagement:** Median study minutes/week per active user (target ≥ 180).
- **Content:** % of syllabus micro-topics at "Published + Enriched" state
  (target ≥ 70% within 6 months of content-team ramp).
- **Retention:** D30 retention of activated users (target ≥ 25%).
- **Quality:** Content approval SLA (draft→published median ≤ 5 days);
  reported content errors per 1000 reads (target ≤ 2).
- **Performance:** p75 LCP ≤ 2.5s, p75 INP ≤ 200ms on content pages.

> Metrics are directional targets for planning, not launch gates. Instrumentation
> requirements are captured in `FR-ANL-*`.

---

## 3. Personas & Roles

### 3.1 Personas

1. **Ravi — First-time Aspirant.** Overwhelmed, needs structure and a guided path.
2. **Sushma — Repeater.** Knows the syllabus, wants targeted weak-area revision,
   PYQ mastery, and answer-writing practice.
3. **Working Professional.** Time-poor; needs mobile-friendly micro-sessions,
   bookmarks, and "continue reading".
4. **Faculty / Evaluator.** Creates content, evaluates answer scripts, mentors.
5. **Content Team (Editor + Reviewer).** Produces and quality-gates knowledge.
6. **Admin / Super Admin.** Operates the platform, manages users, permissions,
   and content governance.

### 3.2 Roles & RBAC (authoritative role list)

| Role | Primary Capability | Trust Level |
|---|---|---|
| **Student** | Consume content, tests, answer-writing, track progress | Lowest |
| **Faculty** | Evaluate answers, run mocks, author within remit | Elevated |
| **Content Editor** | Create/edit content in Draft | Elevated |
| **Reviewer** | Approve/reject content, request changes | Elevated |
| **Admin** | Manage users, content, taxonomy, publishing | High |
| **Super Admin** | Full control, role management, audit, config | Highest |

**RBAC principles** (detailed enforcement is Phase 2/8):

- Deny-by-default; permissions are additive and role-derived.
- Every mutating action is authorized server-side (never trust the client).
- Separation of duties: an Editor **cannot** approve their own content; a
  Reviewer approves, an Admin/Super Admin publishes or delegates publishing.
- All privileged actions are **audit-logged** (`FR-SEC-06`).
- Roles are data, not hardcoded — permissions map to roles in the DB so new
  roles/exam-teams can be added without redeploys (**→ Downstream**).

---

## 4. Scope — Module Catalogue

The platform is organised into modules. Each is summarised here; detailed
functional requirements follow in §5. Modules are prioritised by launch tier:

- **Tier 0 (MVP / Launch):** Auth, Syllabus Engine, Micro-Topic Knowledge Base,
  Notes, PYQ, Search, Student Dashboard, Admin/Content CMS, Content Approval Workflow.
- **Tier 1 (Fast-follow):** Current Affairs, Test Series, Videos, Analytics.
- **Tier 2 (Post-launch):** Answer Writing (AI + Faculty eval), Interview Guidance.
- **Tier 3 (Roadmap):** Mobile/Desktop apps, Offline, AI Tutor, Community,
  Marketplace, Mentorship, Subscriptions/Payments, Live Classes.

| # | Module | Tier |
|---|---|---|
| M1 | Authentication & Profile | 0 |
| M2 | Student Dashboard | 0 |
| M3 | Syllabus Engine | 0 |
| M4 | Micro-Topic Knowledge Base | 0 |
| M5 | Notes Management System | 0 |
| M6 | PYQ Module | 0 |
| M7 | Model Answers | 0 (with M6) |
| M8 | Smart Search | 0 |
| M9 | Embedded Video Module | 1 |
| M10 | Current Affairs | 1 |
| M11 | Test Series | 1 |
| M12 | Answer Writing | 2 |
| M13 | Interview Guidance | 2 |
| M14 | Analytics | 1 |
| M15 | Admin Panel (CMS) | 0 |
| M16 | Content Management (bulk/import/export) | 0/1 |
| M17 | Notifications & Communications | 1 |

---

## 5. Functional Requirements

Notation: **[MUST]** launch-critical, **[SHOULD]** important, **[MAY]** desirable.

### 5.1 M1 — Authentication & Profile

- `FR-AUTH-01` **[MUST]** Email + password sign-up/sign-in with email verification.
- `FR-AUTH-02` **[MUST]** Google OAuth sign-in.
- `FR-AUTH-03` **[MUST]** OTP-based verification (email; phone-ready) for sensitive flows.
- `FR-AUTH-04` **[MUST]** Forgot/reset password with expiring, single-use tokens.
- `FR-AUTH-05` **[MUST]** Session management with secure JWT/session cookies; logout everywhere.
- `FR-AUTH-06` **[MUST]** Role assignment on account; default role = Student.
- `FR-AUTH-07` **[MUST]** Profile: name, avatar, target exam(s), preferences, contact.
- `FR-AUTH-08` **[SHOULD]** Bookmarks, reading history, achievements surfaced on profile.
- `FR-AUTH-09` **[SHOULD]** Account deletion / data export (privacy compliance).

### 5.2 M2 — Student Dashboard

- `FR-DASH-01` **[MUST]** Personalised landing: continue-reading, upcoming tests, streak.
- `FR-DASH-02` **[MUST]** Progress overview: topics covered, completion %, study hours.
- `FR-DASH-03` **[SHOULD]** Revision tracker (spaced-revision due list).
- `FR-DASH-04` **[SHOULD]** Weak-area highlights derived from test analytics.
- `FR-DASH-05` **[SHOULD]** Performance graphs (accuracy, coverage trend, time).
- `FR-DASH-06` **[MUST]** Bookmarks quick-access.

### 5.3 M3 — Syllabus Engine _(the heart of the platform)_

The syllabus is a **directed graph of typed nodes**. The canonical hierarchy:

```
Subject → Unit → Theme → Sub-theme → Micro-theme → Concept
```

Each node may attach **facets**: Keyword, Exam Angle, Previous Questions,
Related Topics, Contemporary Linkages, Value Addition, Revision Notes,
Practice Questions, Videos, Mind Maps, Flashcards, Test.

- `FR-SYL-01` **[MUST]** Every node has a **globally unique, stable ID** and a
  human-readable slug.
- `FR-SYL-02` **[MUST]** Model the hierarchy as an adjacency/closure structure
  supporting arbitrary depth (not a fixed 6-level assumption)
  (**→ Downstream: closure table / materialized path in Phase 3**).
- `FR-SYL-03` **[MUST]** Nodes are **interlinkable** many-to-many across the graph
  (a Concept can relate to another Concept, a judgment, a PYQ, a CA card).
- `FR-SYL-04` **[MUST]** Every node is **scoped to an Exam** so the same engine
  serves Group-1, Group-2, UPSC without collision.
- `FR-SYL-05` **[MUST]** Navigable syllabus tree UI with breadcrumb, expand/collapse,
  and per-node completion state per user.
- `FR-SYL-06` **[SHOULD]** Node-level status (Not started / In progress / Revised /
  Mastered) tracked per user.
- `FR-SYL-07` **[SHOULD]** Each node aggregates its attached content model (§6).
- `FR-SYL-08` **[MUST]** Ordering of children is authorable (syllabus order matters).

### 5.4 M4 — Micro-Topic Knowledge Base

Every micro-topic supports a rich, sectioned content model (see §6 for the full
canonical list). Requirements:

- `FR-MTK-01` **[MUST]** Structured sections (Introduction, Definition, Background,
  Historical Evolution, Constitutional/Legal, Schemes, Reports, Committees,
  Judgments, Facts, Statistics, Current Affairs, Examples, Case Studies,
  International Comparison, Best Practices, FAQs, Expected Questions,
  Revision Summary, Keywords).
- `FR-MTK-02` **[MUST]** Rich media: flowcharts, mind maps, tables, infographics, images.
- `FR-MTK-03` **[MUST]** Attached PYQs, MCQs, Model Answers, Flashcards.
- `FR-MTK-04` **[SHOULD]** "Related topics" and "contemporary linkages" surfaced inline.
- `FR-MTK-05` **[MUST]** Every section renders accessibly and is deep-linkable.

### 5.5 M5 — Notes Management System

- `FR-NOTE-01` **[MUST]** Rich Markdown/WYSIWYG editor (TipTap) with images, tables,
  code blocks, flowcharts, embeds.
- `FR-NOTE-02` **[MUST]** Auto-save + explicit Draft/Publish states.
- `FR-NOTE-03` **[MUST]** **Version history** with diff and restore.
- `FR-NOTE-04` **[MUST]** Approval workflow: Draft → In Review → Approved → Published
  (→ Archived), with reviewer comments and change requests.
- `FR-NOTE-05` **[MUST]** Reader features: bookmark, highlight, reading-time estimate,
  print mode, PDF export.
- `FR-NOTE-06` **[SHOULD]** Related-topics sidebar; in-note search.
- `FR-NOTE-07` **[MUST]** Notes attach to syllabus nodes (many-to-one or many-to-many).

### 5.6 M6 — PYQ Module (Prelims / Mains / Interview)

- `FR-PYQ-01` **[MUST]** Separate PYQ collections for Prelims, Mains, Interview.
- `FR-PYQ-02` **[MUST]** Each question carries: Year, Paper, Marks, Subject, Topic,
  Micro-topic, Difficulty, Source, Keywords, Explanation, Model Answer,
  Evaluation Points, Flowchart/Diagram, Value Addition, Expected Similar Questions.
- `FR-PYQ-03` **[MUST]** PYQs are linked to syllabus nodes (`FR-SYL-03`).
- `FR-PYQ-04` **[SHOULD]** Filter/browse by any facet (year, paper, subject, difficulty).
- `FR-PYQ-05` **[SHOULD]** "Attempted / bookmarked" state per user.

### 5.7 M7 — Model Answers

- `FR-MANS-01` **[MUST]** Structured answer template: Introduction, Body with
  subheadings, Constitutional Articles, SC Judgments, Reports, Statistics,
  Examples, Case Studies, Schemes, Diagrams/Maps/Flowcharts, Way Forward, Conclusion.
- `FR-MANS-02` **[MUST]** Model answers link to their PYQ and syllabus node.
- `FR-MANS-03` **[SHOULD]** Printable / exportable format for practice.

### 5.8 M8 — Smart Search

- `FR-SRCH-01` **[MUST]** Global search across notes, micro-topics, PYQs, model answers.
- `FR-SRCH-02` **[MUST]** Typo-tolerant, ranked, faceted results (subject, type, exam).
- `FR-SRCH-03` **[SHOULD]** Scoped/entity search (judgments, reports, current affairs,
  videos, PDFs).
- `FR-SRCH-04` **[MUST]** Only search **published** content for students; editors may
  search drafts within permission.
- `FR-SRCH-05` **[SHOULD]** Search-as-you-type with keyboard navigation.

### 5.9 M9 — Embedded Video Module

- `FR-VID-01` **[MUST]** YouTube embeds attachable to any node/topic.
- `FR-VID-02` **[SHOULD]** Timestamp deep-links, playlists, related videos.
- `FR-VID-03` **[SHOULD]** Attached lecture notes / PDFs / downloads.

### 5.10 M10 — Current Affairs

- `FR-CA-01` **[MUST]** Daily / Weekly / Monthly compilations.
- `FR-CA-02` **[MUST]** Categorisation: issue-wise, subject-wise, schemes, reports,
  bills, acts, judgments, IR, economy, science, environment, **AP-specific**, editorials.
- `FR-CA-03` **[MUST]** Current-affairs cards link to syllabus nodes (contemporary linkage).
- `FR-CA-04` **[SHOULD]** Editorial analysis format with structured takeaways.

### 5.11 M11 — Test Series

- `FR-TEST-01` **[MUST]** Prelims-style MCQ tests: topic, subject, full, previous-paper,
  custom.
- `FR-TEST-02` **[MUST]** Timer, negative marking, auto-scoring, solutions.
- `FR-TEST-03` **[SHOULD]** Leaderboard, per-test and cumulative analytics.
- `FR-TEST-04` **[MUST]** Attempt persistence & resume; anti-cheat basics (server-scored).
- `FR-TEST-05` **[SHOULD]** Question bank reuses MCQs linked to syllabus nodes.

### 5.12 M12 — Answer Writing

- `FR-AW-01` **[MUST]** Daily/weekly/topic-wise questions.
- `FR-AW-02` **[MUST]** Answer upload (PDF/typed).
- `FR-AW-03` **[MUST]** Faculty evaluation with rubric + comments.
- `FR-AW-04` **[MAY]** AI-assisted evaluation (structure, coverage, keywords) as a
  first pass, always faculty-overridable.
- `FR-AW-05` **[MUST]** Model answer reveal post-submission.

### 5.13 M13 — Interview Guidance

- `FR-INT-01` **[SHOULD]** DAF builder, mock-interview scheduling, question banks.
- `FR-INT-02` **[SHOULD]** Panel feedback capture; communication & CA prep resources.

### 5.14 M14 — Analytics

- `FR-ANL-01` **[MUST]** Per-user: topic coverage, reading time, revision frequency,
  weak areas, accuracy, completion %.
- `FR-ANL-02` **[SHOULD]** Visualisations: graphs, heatmaps (revision/activity).
- `FR-ANL-03` **[SHOULD]** Admin analytics: content coverage, engagement, funnel.
- `FR-ANL-04` **[MUST]** Event instrumentation backing §2.2 metrics.

### 5.15 M15 — Admin Panel (CMS)

- `FR-ADM-01` **[MUST]** Manage users & roles; manage content (notes, PYQs, subjects,
  videos, PDFs, tests, current affairs); manage taxonomy/syllabus.
- `FR-ADM-02` **[MUST]** Manage faculty and permissions.
- `FR-ADM-03` **[MUST]** Publishing controls and content lifecycle dashboard.
- `FR-ADM-04` **[SHOULD]** Audit-log viewer.

### 5.16 M16 — Content Management (Ingestion)

- `FR-CM-01` **[SHOULD]** Bulk upload/import: Markdown, Word, PDF, Excel/CSV.
- `FR-CM-02` **[MAY]** OCR for scanned material; image upload pipeline.
- `FR-CM-03` **[MUST]** Import/export and revision history for imported content.
- `FR-CM-04` **[MUST]** Imported content enters the same approval workflow (`FR-NOTE-04`).

### 5.17 M17 — Notifications & Communications

- `FR-NTF-01` **[SHOULD]** Transactional email (verification, reset, evaluation-ready).
- `FR-NTF-02` **[MAY]** In-app notifications (new CA, test published, revision due).

---

## 6. Canonical Content Model

Every **topic node** can carry the following attachable content types. This is the
authoritative list that the schema (Phase 3) must represent as first-class,
independently-permissioned, versionable entities linked to nodes:

`Notes` · `MCQs` · `PYQs` · `Model Answers` · `Flowcharts` · `Mind Maps` ·
`Diagrams` · `Infographics` · `Statistics` · `Reports` · `Acts` · `Articles` ·
`Judgments` · `Schemes` · `Editorials` · `Videos` · `FAQs` · `Flashcards`.

**Design rule:** these are **shared, reusable entities** referenced by nodes via
join relations — a single Supreme Court judgment is authored once and linked to
many micro-themes. This prevents duplication and powers interlinking
(**→ Downstream: polymorphic-content association strategy in Phase 3**).

---

## 7. Non-Functional Requirements

### 7.1 Security (`NFR-SEC`)

- `FR-SEC-01` **[MUST]** RBAC enforced server-side on every mutation and protected read.
- `FR-SEC-02` **[MUST]** JWT/session security; short-lived access, rotating refresh.
- `FR-SEC-03` **[MUST]** Encryption in transit (TLS) and at rest for sensitive data.
- `FR-SEC-04` **[MUST]** Input validation (Zod) on all boundaries; output encoding.
- `FR-SEC-05` **[MUST]** Rate limiting on auth and expensive endpoints.
- `FR-SEC-06` **[MUST]** Audit logs for privileged/mutating actions.
- `FR-SEC-07` **[MUST]** Secure headers, CSRF protection, XSS/SQLi protection
  (parameterized queries via Prisma).
- `FR-SEC-08` **[SHOULD]** Secrets in a vault/manager, never in source.

### 7.2 Performance (`NFR-PERF`)

- Lazy loading, code splitting, image optimization, pagination/infinite scroll.
- Caching (Redis) for hot reads; CDN for static/media.
- SSR/ISR for content pages (SEO + speed).
- Targets per §2.2 (LCP/INP).

### 7.3 SEO (`NFR-SEO`)

- Per-page metadata, canonical URLs, OpenGraph, Schema.org structured data,
  sitemap.xml, robots.txt. Content pages must be crawlable (SSR/ISR).

### 7.4 Accessibility (`NFR-A11Y`)

- WCAG 2.2 AA target: keyboard navigation, screen-reader semantics, focus
  management, high-contrast support, sufficient color contrast.

### 7.5 Reliability & Ops (`NFR-OPS`)

- Health checks, structured logging, error tracking, backups & restore drills,
  graceful degradation when search/cache is down.

### 7.6 Maintainability (`NFR-MNT`)

- Modular architecture, SOLID, typed end-to-end (TypeScript + Zod + Prisma),
  documented APIs, unit + integration tests, CI gates.

---

## 8. Design Philosophy & UX Principles

- **Aesthetic:** simple, minimal, fast, clean, professional, academic, modern.
- **Visual:** white theme, black typography, generous spacing, premium feel.
- **Responsive & accessible** by default.
- **Reading-first:** content pages optimise for long-form focus (typography scale,
  measure, distraction-free reading, sticky ToC).
- **Progressive disclosure:** the syllabus graph is deep — reveal depth on demand,
  never overwhelm.
- Detailed design system is **Phase 5**; wireframes are **Phase 4**.

---

## 9. Assumptions

- Official APPSC Group-1 syllabus is available and can be encoded by the content team.
- Content team can be staffed to populate the knowledge base progressively.
- YouTube is the primary video host at launch (embeds, not self-hosting).
- English is the launch language; internationalization is architecturally allowed
  but not a launch requirement (Telugu is a strong roadmap candidate).

## 10. Constraints

- Tech stack is fixed (see §13) and must be honoured.
- Launch on Vercel + managed Postgres + Redis; Docker for portability.
- Budget favours managed services over self-hosted at launch.

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Content production is the true bottleneck | High | Ship a first-class CMS + import pipeline early; approval workflow from Day 1 |
| Over-scoping v1 | High | Strict launch tiers (§4); Tier 0 is the MVP |
| Syllabus model too rigid | High | Graph model with typed nodes + facets, exam-scoped (`FR-SYL-*`) |
| Search cost/complexity | Med | Start with Postgres FTS fallback; Meilisearch as the target |
| Content accuracy/liability | High | Reviewer approval gate; audit trail; error-reporting |
| Vendor lock-in | Med | Dockerized, S3-compatible storage, ORM abstraction |

## 12. Future Roadmap (architectural allowances)

Architecture in later phases **must not preclude**: Android/iOS/Desktop apps,
offline mode, AI Tutor, community forum, marketplace, mentorship, subscriptions &
payment gateway, live classes. Implication: **API-first**, clean separation of
content/service layers, stable public content IDs, and a billing-ready user model.

## 13. Tech Stack (authoritative)

**Frontend:** Next.js (App Router), TypeScript, React, TailwindCSS, shadcn/ui,
Framer Motion, TanStack Query, React Hook Form, Zod.
**Backend:** Next.js API/Route Handlers, Node.js, Prisma ORM, PostgreSQL, Redis.
**Auth:** Auth.js (NextAuth) — Google + Email + OTP, JWT/session.
**Storage:** AWS S3 (or compatible), Cloudinary for images.
**Search:** Meilisearch (target) / Elasticsearch (alt); Postgres FTS as fallback.
**Editor:** TipTap (Markdown-capable rich text).
**Charts:** Recharts.
**Deploy/DevOps:** Vercel, Docker, GitHub Actions.

## 14. Release Plan (maps to development phases)

Tier 0 (MVP) → Tier 1 → Tier 2 → Tier 3, delivered through the phased build
process (Architecture → DB → Wireframes → Design System → Folder Structure →
Backend → Auth → Admin → Dashboard → Syllabus → Notes → PYQ → Current Affairs →
Testing → Deployment). See `PROJECT_CHECKLIST.md` for live status.

## 15. Open Questions (to resolve before/within Phase 2)

1. **OTP channel at launch:** email-only, or SMS provider too? (affects Auth design)
2. **Search engine:** commit to Meilisearch for v1, or ship Postgres FTS first?
3. **Media hosting:** AWS S3 vs Cloudinary as primary; who owns which asset types?
4. **Multi-tenancy for exams:** single DB with `examId` scoping (recommended) vs
   separate schemas — confirm before Phase 3.
5. **Answer-writing AI eval:** in-scope for first Answer-Writing release or defer?
6. **Localization:** is Telugu a near-term requirement affecting the content model?

---

## 16. Traceability & Sign-off

- Requirement IDs (`FR-*`, `NFR-*`, `G-*`) are stable and referenced downstream.
- **Phase 1 exit criteria:** stakeholder approval of vision, scope, tiers,
  roles, functional/non-functional requirements, and resolution owner for §15.

**Approval:** _Pending stakeholder review._

---

_This document is Phase 1 of the Bhavishya IAS build. On approval, work proceeds
to Phase 2 — System Architecture._
